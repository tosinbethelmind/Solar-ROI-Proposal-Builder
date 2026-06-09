import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';

export async function GET(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }

  const { adminClient } = auth;
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || '';
  const companyFilter = searchParams.get('companyId') || '';
  const statusFilter = searchParams.get('status') || ''; // 'active' | 'deactivated'
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    if (auth.isBypassed) {
      const mockMembers = [
        { id: 'm1', user_id: 'u1', company_id: '1', role: 'owner', active: true, email: 'owner@alarasolar.com', company_name: 'Alara Solar Solutions', status: 'active', created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'm2', user_id: 'u2', company_id: '1', role: 'admin', active: true, email: 'admin@alarasolar.com', company_name: 'Alara Solar Solutions', status: 'active', created_at: new Date(Date.now() - 3000000).toISOString() },
        { id: 'm3', user_id: 'u3', company_id: '1', role: 'member', active: true, email: 'sales@alarasolar.com', company_name: 'Alara Solar Solutions', status: 'active', created_at: new Date(Date.now() - 2000000).toISOString() },
        { id: 'm4', user_id: 'u4', company_id: '2', role: 'owner', active: true, email: 'admin@lekkiclean.com', company_name: 'Lekki Clean Energy Co.', status: 'active', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 'm5', user_id: 'u5', company_id: '3', role: 'owner', active: true, email: 'quotes@ikejasolar.com.ng', company_name: 'Ikeja Solar Services Ltd', status: 'active', created_at: new Date(Date.now() - 172800000).toISOString() },
        { id: 'm6', user_id: 'u6', company_id: '3', role: 'member', active: true, email: 'tech@ikejasolar.com.ng', company_name: 'Ikeja Solar Services Ltd', status: 'active', created_at: new Date(Date.now() - 160000000).toISOString() }
      ];

      let filtered = mockMembers;
      if (companyFilter) {
        filtered = filtered.filter(m => m.company_id === companyFilter);
      }
      if (statusFilter === 'active') {
        filtered = filtered.filter(m => m.active === true);
      } else if (statusFilter === 'deactivated') {
        filtered = filtered.filter(m => m.active === false);
      }
      if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(m => 
          m.email.toLowerCase().includes(lowerSearch) || 
          m.company_name.toLowerCase().includes(lowerSearch) ||
          (m.role || '').toLowerCase().includes(lowerSearch)
        );
      }

      const paginated = filtered.slice(offset, offset + limit);
      return NextResponse.json({
        data: paginated,
        meta: {
          total: filtered.length,
          page,
          limit
        }
      });
    }

    // 2. Fetch company members
    let query = adminClient.from('company_members').select('*');

    if (companyFilter) {
      query = query.eq('company_id', companyFilter);
    }
    if (statusFilter === 'active') {
      query = query.eq('active', true);
    } else if (statusFilter === 'deactivated') {
      query = query.eq('active', false);
    }

    const { data: members, error: membersError } = await query
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('[Admin Users GET] Members lookup failed:', membersError.message);
      return NextResponse.json({ error: 'Failed to retrieve company members.' }, { status: 500 });
    }

    // 3. Fetch companies to resolve company names
    const { data: companies, error: companiesError } = await adminClient
      .from('companies')
      .select('id, name');

    if (companiesError) {
      console.error('[Admin Users GET] Companies lookup failed:', companiesError.message);
    }

    const companyMap: Record<string, string> = {};
    companies?.forEach(c => {
      companyMap[c.id] = c.name;
    });

    // 4. Fetch auth users to resolve emails
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers();
    const userEmailMap: Record<string, string> = {};
    if (!usersError && users) {
      users.forEach(u => {
        userEmailMap[u.id] = u.email || 'N/A';
      });
    }

    // 5. Map resolved records
    const resolvedMembers = members?.map(m => {
      const email = userEmailMap[m.user_id] || m.invited_email || 'N/A';
      const companyName = companyMap[m.company_id] || 'Unknown Company';
      
      return {
        ...m,
        email,
        company_name: companyName,
        status: m.active !== false ? 'active' : 'deactivated'
      };
    }) || [];

    // Filter by search query (email or company name) in memory
    let finalMembers = resolvedMembers;
    if (search) {
      const lowerSearch = search.toLowerCase();
      finalMembers = resolvedMembers.filter(m => 
        m.email.toLowerCase().includes(lowerSearch) || 
        m.company_name.toLowerCase().includes(lowerSearch) ||
        (m.role || '').toLowerCase().includes(lowerSearch)
      );
    }

    // Paginate in memory after resolution
    const paginatedMembers = finalMembers.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedMembers,
      meta: {
        total: finalMembers.length,
        page,
        limit
      }
    });

  } catch (error: any) {
    console.error('[Admin Users GET] Unexpected Exception:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}

async function checkPlatformAdmin(userId: string, adminClient: any) {
  const { data, error } = await adminClient
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return !error && !!data;
}

export async function PUT(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }

  const { adminClient, user } = auth;

  try {

    const body = await request.json();
    const { memberId, action } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required.' }, { status: 400 });
    }

    if (action === 'deactivate') {
      // Lookup the target user_id to prevent self-deactivation
      const { data: targetMember, error: lookupError } = await adminClient
        .from('company_members')
        .select('user_id, email, role')
        .eq('id', memberId)
        .single();

      if (lookupError || !targetMember) {
        return NextResponse.json({ error: 'Failed to verify member identity.' }, { status: 404 });
      }

      // Check Self-Deactivation Block
      if (user && targetMember.user_id === user.id) {
        return NextResponse.json({ 
          error: 'Safety Block: You are currently logged in as this user. To prevent accidental platform lockout, deactivating your active administrative session is strictly prohibited.' 
        }, { status: 400 });
      }

      // Check if target is a Platform Admin to enforce Last-Admin Guard
      const isTargetAdmin = await checkPlatformAdmin(targetMember.user_id, adminClient);
      if (isTargetAdmin) {
        // Fetch all platform admins to count active ones
        const { data: allAdmins, error: adminFetchError } = await adminClient
          .from('platform_admins')
          .select('user_id');

        if (!adminFetchError && allAdmins) {
          // Resolve which of these are currently active members
          const adminUserIds = allAdmins.map((a: any) => a.user_id);
          const { data: activeAdminMembers, error: activeAdminError } = await adminClient
            .from('company_members')
            .select('user_id')
            .in('user_id', adminUserIds)
            .eq('active', true);

          if (!activeAdminError && activeAdminMembers && activeAdminMembers.length <= 1) {
            return NextResponse.json({
              error: 'Safety Block: This administrator is the final active platform administrator. Accidental deactivation would orphan platform governance.'
            }, { status: 400 });
          }
        }
      }

      const { data, error } = await adminClient
        .from('company_members')
        .update({ active: false })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ message: 'User deactivated successfully.', data });

    } else if (action === 'activate') {
      const { data, error } = await adminClient
        .from('company_members')
        .update({ active: true })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ message: 'User activated successfully.', data });

    } else {
      return NextResponse.json({ error: 'Invalid user administrative action.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Admin Users PUT] Exception caught:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user parameters.' }, { status: 500 });
  }
}
