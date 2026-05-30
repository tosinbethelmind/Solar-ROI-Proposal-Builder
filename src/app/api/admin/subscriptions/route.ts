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


export async function GET() {
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

  try {
    const { data: companies, error } = await adminClient
      .from('companies')
      .select('*')
      .order('subscription_tier', { ascending: false });

    if (error) {
      console.error('[Admin Subscriptions GET] Lookup failed:', error.message);
      return NextResponse.json({ error: 'Failed to retrieve subscription registries.' }, { status: 500 });
    }

    const tierPrices: Record<string, number> = {
      starter: 0,
      pro: 9900,
      business: 24900,
      enterprise: 59900
    };

    let totalMRR = 0;
    let paidCount = 0;

    companies?.forEach(c => {
      if (c.subscription_status === 'active' && !c.suspended) {
        const price = tierPrices[c.subscription_tier?.toLowerCase()] || 0;
        if (price > 0) {
          totalMRR += price;
          paidCount += 1;
        }
      }
    });

    const arpu = paidCount > 0 ? Math.round(totalMRR / paidCount) : 0;

    return NextResponse.json({
      data: {
        kpis: {
          totalMRR,
          paidCount,
          arpu,
          totalCompanies: companies?.length || 0
        },
        companies: companies || []
      }
    });

  } catch (error: any) {
    console.error('[Admin Subscriptions GET] Unexpected Exception:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  try {
    const body = await request.json();
    const { companyId, action, days, amount } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required.' }, { status: 400 });
    }

    const { data: company, error: fetchError } = await adminClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (fetchError || !company) {
      return NextResponse.json({ error: 'Company workspace not found.' }, { status: 404 });
    }

    if (action === 'extend_trial') {
      if (!days || days <= 0) {
        return NextResponse.json({ error: 'Valid number of extension days required.' }, { status: 400 });
      }

      const currentTrialEnds = company.trial_ends_at ? new Date(company.trial_ends_at) : new Date();
      const newTrialEnds = new Date(currentTrialEnds.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await adminClient
        .from('companies')
        .update({ 
          trial_ends_at: newTrialEnds,
          subscription_status: 'trial' // Ensure status is set to trialing
        })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ message: `Trial extended by ${days} days.`, data });

    } else if (action === 'record_payment') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Valid payment override amount is required.' }, { status: 400 });
      }

      // In a real system, we log a ledger entry. Here we update status to active
      const { data, error } = await adminClient
        .from('companies')
        .update({ 
          subscription_status: 'active'
        })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ message: `Manual payment of ₦${amount.toLocaleString()} logged and account set to active status.`, data });

    } else {
      return NextResponse.json({ error: 'Invalid billing administrative action.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Admin Subscriptions POST] Exception caught:', error);
    return NextResponse.json({ error: error.message || 'Billing configuration updates failed.' }, { status: 500 });
  }
}
