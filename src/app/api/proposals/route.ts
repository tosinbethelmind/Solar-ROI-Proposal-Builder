// src/app/api/proposals/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Helper to parse JSON body safely
async function getJsonBody(req: NextRequest) {
  try {
    return await req.json();
  } catch (e) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const data = await getJsonBody(req);
  if (!data) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { proposal, calculations } = data;
  if (!proposal) {
    return NextResponse.json({ error: 'Missing proposal payload' }, { status: 400 });
  }

  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();

  if (user) {
    const { data: member } = await client
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (member?.company_id) {
      const { data: company } = await client
        .from('companies')
        .select('subscription_tier, subscription_status, proposal_usage_count')
        .eq('id', member.company_id)
        .single();

      if (company) {
        if (company.subscription_status === 'past_due' || company.subscription_status === 'cancelled') {
          return NextResponse.json({ error: 'Your workspace subscription is past due or cancelled' }, { status: 403 });
        }
        if (company.subscription_tier === 'starter' && (company.proposal_usage_count || 0) >= 10) {
          return NextResponse.json({ error: 'Proposal limit reached' }, { status: 403 });
        }
      }
    }
  }

  const { data: insert, error } = await client.from('proposals').insert({
    ...proposal,
    calculations_snapshot: calculations || null,
    created_at: new Date().toISOString()
  }).select('id').single();

  if (error) {
    console.error('Insert proposal error', error);
    // If the error indicates quota limit exceeded, respond with 403 Forbidden
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('quota') || msg.includes('limit')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: insert.id }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const client = await createClient();
  const { data, error } = await client.from('proposals').select('*').eq('id', id).single();
  if (error) {
    console.error('Fetch proposal error', error);
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const updates = await getJsonBody(req);
  const client = await createClient();
  const { data, error } = await client.from('proposals').update(updates).eq('id', id).select('*').single();
  if (error) {
    console.error('Update proposal error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const client = await createClient();
  const { error } = await client.from('proposals').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) {
    console.error('Delete proposal error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
