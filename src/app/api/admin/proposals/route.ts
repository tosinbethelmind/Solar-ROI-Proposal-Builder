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
  const companyId = searchParams.get('companyId') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    if (auth.isBypassed) {
      const mockProposals = [
        { id: 'p-1', customer_name: 'Obasanjo Farms Complex', system_name: '100kWp Agricultural Hybrid', final_quoted_price_ngn: 8500000, created_at: new Date().toISOString(), company_id: '4', company_name: 'Abuja Microgrid Systems' },
        { id: 'p-2', customer_name: 'Banana Island Villa P2', system_name: '15kVA Residential Offgrid', final_quoted_price_ngn: 4200000, created_at: new Date(Date.now() - 3600000).toISOString(), company_id: '2', company_name: 'Lekki Clean Energy Co.' },
        { id: 'p-3', customer_name: 'Ikeja Plaza Solar Backup', system_name: '30kWp Commercial Grid-Tied', final_quoted_price_ngn: 3100000, created_at: new Date(Date.now() - 7200000).toISOString(), company_id: '3', company_name: 'Ikeja Solar Services Ltd' }
      ];

      let filtered = mockProposals;
      if (companyId) {
        filtered = filtered.filter(p => p.company_id === companyId);
      }
      if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(p => 
          p.customer_name.toLowerCase().includes(lowerSearch) || 
          p.system_name.toLowerCase().includes(lowerSearch)
        );
      }

      return NextResponse.json({
        data: filtered,
        meta: {
          total: filtered.length,
          page,
          limit
        }
      });
    }

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
