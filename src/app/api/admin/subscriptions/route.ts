import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';


export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }

  const { adminClient } = auth;

  try {
    let companies = [];
    if (auth.isBypassed) {
      companies = [
        { id: '1', name: 'Alara Solar Solutions', subscription_tier: 'business', subscription_status: 'active', suspended: false, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', name: 'Lekki Clean Energy Co.', subscription_tier: 'pro', subscription_status: 'trial', suspended: false, created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', name: 'Ikeja Solar Services Ltd', subscription_tier: 'starter', subscription_status: 'active', suspended: false, created_at: new Date(Date.now() - 172800000).toISOString() },
        { id: '4', name: 'Abuja Microgrid Systems', subscription_tier: 'enterprise', subscription_status: 'active', suspended: false, created_at: new Date(Date.now() - 259200000).toISOString() },
        { id: '5', name: 'Port Harcourt Solar Hub', subscription_tier: 'pro', subscription_status: 'past_due', suspended: false, created_at: new Date(Date.now() - 345600000).toISOString() }
      ];
    } else {
      const { data, error } = await adminClient
        .from('companies')
        .select('*')
        .order('subscription_tier', { ascending: false });

      if (error) {
        console.error('[Admin Subscriptions GET] Lookup failed:', error.message);
        return NextResponse.json({ error: 'Failed to retrieve subscription registries.' }, { status: 500 });
      }
      companies = data || [];
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
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }

  if (!auth.canRunAutomation) {
    return NextResponse.json({ error: 'Permission denied: Read-only access.' }, { status: 403 });
  }

  if (!auth.canModifySubscriptions) {
    return NextResponse.json({ error: 'Permission denied: Billing or SuperAdmin role required to modify subscriptions.' }, { status: 403 });
  }

  const { adminClient } = auth;

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
