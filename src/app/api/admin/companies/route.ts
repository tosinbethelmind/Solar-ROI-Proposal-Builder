import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabaseAdmin';

export async function GET(request: Request) {
  const adminClient = createAdminClient();
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const plan = searchParams.get('plan') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    // 1. Fetch companies
    let query = adminClient
      .from('companies')
      .select('*, proposals:proposals(count)', { count: 'exact' });

    if (plan) {
      query = query.eq('subscription_tier', plan);
    }
    if (status) {
      query = query.eq('subscription_status', status);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: companies, count, error: companiesError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (companiesError) {
      console.error('[Admin Companies GET] Companies lookup failed:', companiesError.message);
      return NextResponse.json({ error: 'Failed to retrieve companies list.' }, { status: 500 });
    }

    // 2. Fetch all members and resolve auth users emails
    const { data: members, error: membersError } = await adminClient
      .from('company_members')
      .select('*');

    if (membersError) {
      console.error('[Admin Companies GET] Members lookup failed:', membersError.message);
    }

    // Fetch auth users to map emails
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers();
    const userEmailMap: Record<string, string> = {};
    if (!usersError && users) {
      users.forEach(u => {
        userEmailMap[u.id] = u.email || 'N/A';
      });
    }

    // 3. Map company details, owner emails, and members count
    const resolvedCompanies = companies?.map(c => {
      const companyMembers = members?.filter(m => m.company_id === c.id) || [];
      const ownerMember = companyMembers.find(m => m.role === 'owner');
      const ownerEmail = ownerMember ? userEmailMap[ownerMember.user_id] : 'N/A';

      return {
        ...c,
        owner_email: ownerEmail,
        proposals_count: (c.proposals as any)?.[0]?.count || 0,
        members_count: companyMembers.length,
        members: companyMembers.map(m => ({
          ...m,
          email: userEmailMap[m.user_id] || m.invited_email || 'N/A'
        }))
      };
    }) || [];

    // Filter by owner email on the resolved list if search query is provided and company name didn't match
    let finalCompanies = resolvedCompanies;
    if (search) {
      const lowerSearch = search.toLowerCase();
      finalCompanies = resolvedCompanies.filter(c => 
        c.name.toLowerCase().includes(lowerSearch) || 
        c.owner_email.toLowerCase().includes(lowerSearch)
      );
    }

    return NextResponse.json({
      data: finalCompanies,
      meta: {
        total: count || finalCompanies.length,
        page,
        limit
      }
    });

  } catch (error: any) {
    console.error('[Admin Companies GET] Unexpected Exception:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const adminClient = createAdminClient();

  try {
    const body = await request.json();
    const { companyId, action, plan_tier, subscription_status } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required.' }, { status: 400 });
    }

    if (action === 'suspend') {
      const { data, error } = await adminClient
        .from('companies')
        .update({ suspended: true })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ message: 'Company suspended successfully.', data });

    } else if (action === 'unsuspend') {
      const { data, error } = await adminClient
        .from('companies')
        .update({ suspended: false })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ message: 'Company reinstated successfully.', data });

    } else if (action === 'change_plan') {
      if (!plan_tier || !subscription_status) {
        return NextResponse.json({ error: 'Plan tier and subscription status are required for plan override.' }, { status: 452 });
      }

      const { data, error } = await adminClient
        .from('companies')
        .update({ 
          subscription_tier: plan_tier.toLowerCase(),
          subscription_status: subscription_status.toLowerCase()
        })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ message: 'Subscription tier and status overridden successfully.', data });

    } else {
      return NextResponse.json({ error: 'Invalid administrative action.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Admin Companies PUT] Exception caught:', error);
    return NextResponse.json({ error: error.message || 'Failed to update company settings.' }, { status: 500 });
  }
}
