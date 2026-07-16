import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/utils/rateLimit';

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || '127.0.0.1';

    if (!await rateLimit(ip, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const normalised = email.trim().toLowerCase();

    const supabase = await createClient();

    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        { email: normalised, subscribed_at: new Date().toISOString() },
        { onConflict: 'email', ignoreDuplicates: true }
      );

    if (error) {
      // Table may not exist yet — don't crash the UI
      console.error('[subscribe] Supabase error:', error.message);
      return NextResponse.json({ error: 'Could not save subscription.' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[subscribe] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
