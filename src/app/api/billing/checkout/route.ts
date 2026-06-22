import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, cycle } = await request.json();
    if (!planId || !cycle) {
      return NextResponse.json({ error: 'Missing planId or cycle' }, { status: 400 });
    }

    // Resolve user's company membership
    const { data: member, error: memberErr } = await supabase
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: 'User is not associated with any company workspace.' }, { status: 404 });
    }

    // NGN prices in Kobo
    const priceMap: Record<string, { monthly: number; annual: number }> = {
      starter: { monthly: 990000, annual: 9900000 },
      pro: { monthly: 2490000, annual: 24900000 },
      business: { monthly: 5990000, annual: 59900000 },
    };

    const planPrices = priceMap[planId.toLowerCase()];
    if (!planPrices) {
      return NextResponse.json({ error: `Invalid subscription plan: ${planId}` }, { status: 400 });
    }

    const amountKobo = cycle === 'annual' ? planPrices.annual : planPrices.monthly;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://solar-roi-proposal-builder-betelmindrecruit-9250s-projects.vercel.app';

    // Verify Paystack Secret Key exists, otherwise perform clean mock checkout
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey || secretKey === 'mock') {
      console.warn('[Paystack Checkout] PAYSTACK_SECRET_KEY is missing or in mock mode. Returning mock checkout URL.');
      const mockCheckoutUrl = `${appUrl}/pricing?payment=success&mock=true&tier=${planId}&cycle=${cycle}`;
      return NextResponse.json({ authorization_url: mockCheckoutUrl });
    }

    // Initialize Paystack Checkout Transaction via official REST API
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountKobo,
        callback_url: `${appUrl}/pricing?payment=success`,
        metadata: {
          company_id: member.company_id,
          tier: planId,
          billing_cycle: cycle,
          user_id: user.id,
        },
      }),
    });

    const paystackData = await response.json();
    if (!response.ok || !paystackData.status) {
      console.error('[Paystack Checkout Init] Error response:', paystackData);
      return NextResponse.json({ error: paystackData.message || 'Failed to initialize Paystack checkout.' }, { status: 502 });
    }

    return NextResponse.json({ authorization_url: paystackData.data.authorization_url });
  } catch (err) {
    console.error('[Paystack Checkout GET] Global exception:', err);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
