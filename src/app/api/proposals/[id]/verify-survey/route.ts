import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reference, includeInsurance } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch original proposal
    const { data: proposal, error: fetchErr } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    let paymentVerified = false;
    let actualInsuranceTier = 'none';
    let actualSurveyFee = proposal.calculations_snapshot?.surveyFee || 15000;
    let actualInsurancePremium = 0;

    if (!secretKey || secretKey === 'mock') {
      console.warn('[Paystack Survey Verify] Mock verification mode.');
      paymentVerified = true;
      actualInsuranceTier = includeInsurance || 'none';
      const finalPrice = proposal.final_quoted_price_ngn || 0;
      if (actualInsuranceTier === 'lite') {
        actualInsurancePremium = Math.round(finalPrice * 0.015);
      } else if (actualInsuranceTier === 'pro') {
        actualInsurancePremium = Math.round(finalPrice * 0.025);
      } else if (actualInsuranceTier === 'enterprise') {
        actualInsurancePremium = Math.round(finalPrice * 0.035);
      }
    } else {
      // Fetch transaction from Paystack
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      const paystackData = await response.json();
      if (!response.ok || !paystackData.status || paystackData.data.status !== 'success') {
        console.error('[Paystack Survey Verify] Failed to verify Paystack transaction:', paystackData);
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }

      // Confirm proposal ID matches
      const metadata = paystackData.data.metadata || {};
      if (metadata.proposal_id !== id) {
        return NextResponse.json({ error: 'Transaction proposal mismatch' }, { status: 400 });
      }

      paymentVerified = true;
      actualInsuranceTier = metadata.insurance_tier || 'none';
      actualSurveyFee = metadata.survey_fee ?? actualSurveyFee;
      actualInsurancePremium = metadata.insurance_premium ?? 0;
    }

    if (!paymentVerified) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Update proposal database record
    const currentCalcs = proposal.calculations_snapshot || {};
    const updatedCalcs = {
      ...currentCalcs,
      surveyPaid: true,
      paystackRef: reference,
      surveyFee: actualSurveyFee,
    };

    if (actualInsuranceTier !== 'none') {
      updatedCalcs.insurancePaid = true;
      updatedCalcs.insuranceTier = actualInsuranceTier;
      updatedCalcs.insurancePremium = actualInsurancePremium;
      updatedCalcs.warrantyCert = `SQP-SHIELD-${reference.substring(0, 12).toUpperCase()}`;
    }

    const updates = {
      tracking_status: 'Approved',
      accepted_at: proposal.accepted_at || new Date().toISOString(),
      calculations_snapshot: updatedCalcs,
    };

    const { data: updatedProposal, error: updateErr } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[Paystack Survey Verify] Update DB error:', updateErr);
      return NextResponse.json({ error: 'Failed to update proposal state' }, { status: 500 });
    }

    return NextResponse.json({ success: true, proposal: updatedProposal });
  } catch (err: any) {
    console.error('[Paystack Survey Verify] Exception:', err);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
