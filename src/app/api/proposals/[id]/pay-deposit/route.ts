import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, paymentType } = body; // 'deposit' | 'full' | 'installment_deposit'

    const supabase = await createClient();
    
    // Fetch the proposal details
    const { data: proposal, error: fetchErr } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const finalPrice = proposal.final_quoted_price_ngn || 0;
    const calcs = proposal.calculations_snapshot || {};
    const plan = calcs.paymentPlan || { selectedPlan: 'outright', downPaymentPercent: 20 };

    let totalAmount = 0;
    if (paymentType === 'installment_deposit') {
      const downPaymentPercent = plan.downPaymentPercent || 20;
      totalAmount = finalPrice * (downPaymentPercent / 100);
    } else if (paymentType === 'deposit') {
      // 50% deposit for outright purchases
      totalAmount = finalPrice * 0.5;
    } else {
      // Full outright purchase amount
      totalAmount = finalPrice;
    }

    if (totalAmount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than zero' }, { status: 400 });
    }

    const amountKobo = Math.round(totalAmount * 100);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solar-roi-proposal-builder-betelmindrecruit-9250s-projects.vercel.app';
    const clientToken = proposal.client_token || id;

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey || secretKey === 'mock') {
      console.warn('[Paystack Deposit Init] PAYSTACK_SECRET_KEY is missing or in mock mode. Returning mock url.');
      const mockRef = `ref_dep_${Math.random().toString(36).substring(2, 11)}`;
      const mockCheckoutUrl = `${appUrl}/proposal/${clientToken}?payment=deposit_success&reference=${mockRef}&paymentType=${paymentType}`;
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
        callback_url: `${appUrl}/proposal/${clientToken}?payment=deposit_success&paymentType=${paymentType}`,
        metadata: {
          proposal_id: id,
          payment_type: paymentType,
          amount_naira: totalAmount,
        },
      }),
    });

    const paystackData = await response.json();
    if (!response.ok || !paystackData.status) {
      console.error('[Paystack Deposit Init] Error:', paystackData);
      return NextResponse.json({ error: paystackData.message || 'Failed to initialize Paystack checkout.' }, { status: 502 });
    }

    return NextResponse.json({ authorization_url: paystackData.data.authorization_url });
  } catch (err: any) {
    console.error('[Paystack Deposit POST] Exception:', err);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
