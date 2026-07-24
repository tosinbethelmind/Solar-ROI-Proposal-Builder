import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('*')
      .or(`client_token.eq.${id},id.eq.${id}`)
      .single();

    if (fetchErr || !proposal) {
      console.error('[Public Proposal API] Fetch failed:', fetchErr);
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    let subscriptionTier = 'starter';
    if (proposal.company_id) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('subscription_tier')
        .eq('id', proposal.company_id)
        .single();
      
      if (company?.subscription_tier) {
        subscriptionTier = company.subscription_tier;
      }
    }

    return NextResponse.json({
      data: proposal,
      subscription_tier: subscriptionTier,
    });
  } catch (err: any) {
    console.error('[Public Proposal API] Global exception:', err);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
