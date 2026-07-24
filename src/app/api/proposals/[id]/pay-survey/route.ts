import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email, insuranceTier } = await request.json(); // 'none' | 'lite' | 'pro' | 'enterprise'

    const supabase = await createClient();
    
    // Fetch the proposal to get the configured surveyFee and final price
    const { data: proposal, error: fetchErr } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const calcs = proposal.calculations_snapshot || {};
    const surveyFee = calcs.surveyFee !== undefined ? Number(calcs.surveyFee) : 15000;
    const finalPrice = proposal.final_quoted_price_ngn || 0;

    let insurancePremium = 0;
    if (insuranceTier === 'lite') {
      insurancePremium = Math.round(finalPrice * 0.015);
    } else if (insuranceTier === 'pro') {
      insurancePremium = Math.round(finalPrice * 0.025);
    } else if (insuranceTier === 'enterprise') {
      insurancePremium = Math.round(finalPrice * 0.035);
    }

    let totalAmount = surveyFee + insurancePremium;

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Checkout amount must be greater than zero' }, { status: 400 });
    }

    const amountKobo = Math.round(totalAmount * 100);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solar-roi-proposal-builder-betelmindrecruit-9250s-projects.vercel.app';
    const clientToken = proposal.client_token || id;

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey || secretKey === 'mock') {
      console.warn('[Paystack Survey Booking] PAYSTACK_SECRET_KEY is missing or in mock mode. Returning mock url.');
      const mockRef = `ref_${Math.random().toString(36).substring(2, 11)}`;
      const mockCheckoutUrl = `${appUrl}/proposal/${clientToken}?payment=success&reference=${mockRef}&insuranceTier=${insuranceTier || 'none'}`;
      return NextResponse.json({ authorization_url: mockCheckoutUrl });
    }

    // Call real Paystack API
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email || proposal.customer_email || 'client@example.com',
        amount: amountKobo,
        callback_url: `${appUrl}/proposal/${clientToken}?payment=success&insuranceTier=${insuranceTier || 'none'}`,
        metadata: {
          proposal_id: id,
          survey_fee: surveyFee,
          insurance_tier: insuranceTier || 'none',
          insurance_premium: insurancePremium,
        },
      }),
    });

    const paystackData = await response.json();
    if (!response.ok || !paystackData.status) {
      console.error('[Paystack Survey Init] Error:', paystackData);
      return NextResponse.json({ error: paystackData.message || 'Failed to initialize Paystack checkout.' }, { status: 502 });
    }

    return NextResponse.json({ authorization_url: paystackData.data.authorization_url });
  } catch (err: any) {
    console.error('[Paystack Survey POST] Exception:', err);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
