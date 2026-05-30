import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';

// Helper to verify if user is platform administrator
async function checkPlatformAdmin(userId: string, adminClient: any): Promise<boolean> {
  const { data, error } = await adminClient
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return !error && !!data;
}


export async function GET(request: Request) {
  const adminClient = createAdminClient();
  const userClient = await createClient();

  // 1. Enforce Authentication & Admin Authorization
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized administrative operation.' }, { status: 401 });
  }

  const isAdmin = await checkPlatformAdmin(user.id, adminClient);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden: Platform administrative authorization required.' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const companyId = searchParams.get('companyId') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    let query = adminClient
      .from('proposals')
      .select('*, company:companies(name)', { count: 'exact' });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,system_name.ilike.%${search}%`);
    }

    const { data: proposals, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Admin Proposals GET] Lookup failed:', error.message);
      return NextResponse.json({ error: 'Failed to retrieve proposals.' }, { status: 500 });
    }

    const resolvedProposals = proposals?.map(p => ({
      ...p,
      company_name: (p.company as any)?.name || 'Unknown Company'
    })) || [];

    return NextResponse.json({
      data: resolvedProposals,
      meta: {
        total: count || resolvedProposals.length,
        page,
        limit
      }
    });

  } catch (error: any) {
    console.error('[Admin Proposals GET] Unexpected Exception:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
