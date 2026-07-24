import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { reference, paymentType } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    // Fetch the proposal details
    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    let paymentVerified = false;
    let actualPaidAmountNaira = 0;

    const finalPrice = proposal.final_quoted_price_ngn || 0;
    const calcs = proposal.calculations_snapshot || {};
    const plan = calcs.paymentPlan || { selectedPlan: 'outright', downPaymentPercent: 20 };

    let expectedAmountNaira = finalPrice;
    if (paymentType === 'installment_deposit') {
      const downPaymentPercent = plan.downPaymentPercent || 20;
      expectedAmountNaira = finalPrice * (downPaymentPercent / 100);
    } else if (paymentType === 'deposit') {
      expectedAmountNaira = finalPrice * 0.5;
    }

    if (!secretKey || secretKey === 'mock') {
      console.warn('[Paystack Deposit Verify] Mock verification mode.');
      paymentVerified = true;
      actualPaidAmountNaira = expectedAmountNaira;
    } else {
      // Verify transaction via Paystack API
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      const paystackData = await response.json();
      if (!response.ok || !paystackData.status || paystackData.data.status !== 'success') {
        console.error('[Paystack Deposit Verify] Paystack API error:', paystackData);
        return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
      }

      // Check metadata or amount
      const metadata = paystackData.data.metadata || {};
      if (metadata.proposal_id && metadata.proposal_id !== id) {
        return NextResponse.json({ error: 'Transaction proposal mismatch' }, { status: 400 });
      }

      paymentVerified = true;
      actualPaidAmountNaira = paystackData.data.amount / 100; // Convert kobo to Naira
    }

    if (!paymentVerified) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Update calculations snapshot with deposit state
    const currentCalcs = proposal.calculations_snapshot || {};
    const updatedCalcs = {
      ...currentCalcs,
      depositPaid: true,
      depositRef: reference,
      depositAmount: actualPaidAmountNaira,
      depositPaymentType: paymentType || 'deposit',
    };

    const updates = {
      status: 'accepted',
      tracking_status: 'Approved',
      accepted_at: proposal.accepted_at || new Date().toISOString(),
      calculations_snapshot: updatedCalcs,
    };

    const { data: updatedProposal, error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[Paystack Deposit Verify] Update proposals error:', updateErr);
      return NextResponse.json({ error: 'Failed to update proposal state' }, { status: 500 });
    }

    // --- Automated Procurement & Commission Routing ---
    try {
      // Find active supplier partner
      const { data: partners } = await supabaseAdmin
        .from('supplier_partners')
        .select('*')
        .eq('active', true)
        .limit(1);

      const partner = partners && partners.length > 0 ? partners[0] : null;

      let expectedCommission = 0;
      let preferredSupplierId = null;

      if (partner) {
        preferredSupplierId = partner.id;
        if (partner.commission_model === 'percentage_of_sale') {
          expectedCommission = finalPrice * ((partner.commission_rate || 1.5) / 100);
        } else {
          expectedCommission = partner.commission_rate || 50000;
        }
      } else {
        // Fallback mock commission of 1.5% finder's fee if no partner exists in database yet
        expectedCommission = finalPrice * 0.015;
      }

      const inverterKva = calcs.inverterKva || 5;
      const batteryConfig = calcs.batteryConfigString || '2.4kWh Lithium';
      const panelCount = calcs.panelCount || 4;
      const equipmentSummary = `${inverterKva}kVA inverter, ${batteryConfig}, ${panelCount} panels`;

      // Log B2B Referral
      const { error: referralErr } = await supabaseAdmin
        .from('supplier_referrals')
        .insert({
          proposal_id: id,
          company_id: proposal.company_id || '00000000-0000-0000-0000-000000000000',
          user_id: proposal.installer_id || null,
          customer_name: proposal.customer_name || 'Unnamed Project',
          equipment_summary: equipmentSummary,
          system_size: `${inverterKva}kVA`,
          preferred_supplier_id: preferredSupplierId,
          preferred_contact_method: 'whatsapp',
          location: 'Lagos',
          status: 'new',
          expected_commission: expectedCommission,
          actual_commission: 0,
          commission_status: 'pending',
        });

      if (referralErr) {
        console.error('[Paystack Deposit Verify] Failed to log supplier referral:', referralErr);
      }
    } catch (routingErr) {
      console.error('[Paystack Deposit Verify] Exception during commission routing:', routingErr);
    }

    return NextResponse.json({ success: true, proposal: updatedProposal });
  } catch (err: any) {
    console.error('[Paystack Deposit Verify] Global Exception:', err);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
