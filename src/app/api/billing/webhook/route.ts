import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-paystack-signature');
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    // Signature verification (optional if PAYSTACK_SECRET_KEY is missing for easy local debugging)
    if (secretKey && secretKey !== 'mock') {
      const hash = crypto
        .createHmac('sha512', secretKey)
        .update(bodyText)
        .digest('hex');

      if (signature !== hash) {
        console.warn('[Paystack Webhook] Signature verification failed.');
        return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
      }
    }

    const payload = JSON.parse(bodyText);
    const event = payload.event;
    console.log(`[Paystack Webhook] Received event: ${event}`);

    if (event === 'charge.success') {
      const data = payload.data;
      const metadata = data.metadata;
      
      if (!metadata || !metadata.company_id || !metadata.tier) {
        console.error('[Paystack Webhook] Missing essential metadata columns:', metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const { company_id, tier } = metadata;
      const paystackCustomerId = data.customer?.customer_code || null;
      const paystackSubscriptionCode = data.subscription?.subscription_code || null;

      // Initialize Supabase Admin Bypass client
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-role'
      );

      // Perform atomic update on company subscription columns
      const { error: updateErr } = await supabaseAdmin
        .from('companies')
        .update({
          subscription_tier: tier.toLowerCase(),
          subscription_status: 'active',
          trial_ends_at: null,
          paystack_customer_id: paystackCustomerId,
          paystack_subscription_code: paystackSubscriptionCode,
        })
        .eq('id', company_id);

      if (updateErr) {
        console.error('[Paystack Webhook] Failed to update company table:', updateErr.message);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`[Paystack Webhook] Successfully upgraded company ${company_id} to ${tier} tier.`);
    }

    return NextResponse.json({ status: 'success' });
  } catch (err) {
    console.error('[Paystack Webhook] Execution failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
