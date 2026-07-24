import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';

const DEFAULT_MOCK_LEADS = [
  {
    id: 'lead-1',
    first_name: 'Femi',
    last_name: 'Adeleke',
    email: 'femi.adeleke@example.com',
    phone: '+2348031112222',
    state: 'Lagos',
    city: 'Lekki',
    average_monthly_bill_ngn: 120000,
    generator_hours_daily: 4,
    notes: 'Homeowner wants 10kVA solar hybrid system with 15kWh storage to offset generator usage.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: 'lead-2',
    first_name: 'Chinedu',
    last_name: 'Okonkwo',
    email: 'chinedu.o@example.com',
    phone: '+2348123334444',
    state: 'Lagos',
    city: 'Ikeja',
    average_monthly_bill_ngn: 85000,
    generator_hours_daily: 6,
    notes: 'SME office needs solar panel installation to offset daytime AC load.',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  }
];

const DEFAULT_MOCK_ASSIGNMENTS = [
  {
    id: 'la-1',
    lead_id: 'lead-1',
    installer_id: 'inst-1',
    status: 'pending',
    is_exclusive: true,
    assigned_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'la-2',
    lead_id: 'lead-2',
    installer_id: 'inst-2',
    status: 'accepted',
    is_exclusive: false,
    assigned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 });
  }

  if (auth.isBypassed) {
    return NextResponse.json({
      leads: DEFAULT_MOCK_LEADS,
      leadAssignments: DEFAULT_MOCK_ASSIGNMENTS
    });
  }

  try {
    const [leadsRes, assignmentsRes] = await Promise.all([
      auth.adminClient.from('marketplace_leads').select('*'),
      auth.adminClient.from('lead_assignments').select('*')
    ]);

    if (leadsRes.error) throw leadsRes.error;
    if (assignmentsRes.error) throw assignmentsRes.error;

    // Helper to map DB lead object to UI expected format
    const mapLeadToUI = (lead: any) => {
      const nameParts = (lead.name || '').trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      return {
        ...lead,
        first_name,
        last_name,
        average_monthly_bill_ngn: lead.monthly_spend || 0,
        generator_hours_daily: lead.power_source === 'generator' || lead.power_source === 'mixed' ? 6 : 0,
        notes: lead.note || ''
      };
    };

    // If tables are empty, pre-populate with default mocks
    if ((leadsRes.data || []).length === 0) {
      const dbMockLeads = DEFAULT_MOCK_LEADS.map(lead => ({
        id: lead.id,
        name: `${lead.first_name} ${lead.last_name}`.trim(),
        phone: lead.phone,
        email: lead.email,
        state: lead.state,
        city: lead.city,
        property_type: 'commercial',
        monthly_spend: lead.average_monthly_bill_ngn,
        power_source: lead.generator_hours_daily > 0 ? 'mixed' : 'grid',
        interest_type: 'bill_savings',
        budget_range: 'Flexible',
        preferred_contact: 'WhatsApp',
        timeline: 'Researching',
        note: lead.notes,
        request_source: 'general',
        created_at: lead.created_at
      }));

      await auth.adminClient.from('marketplace_leads').insert(dbMockLeads);
      await auth.adminClient.from('lead_assignments').insert(DEFAULT_MOCK_ASSIGNMENTS);

      const [retryLeads, retryAssignments] = await Promise.all([
        auth.adminClient.from('marketplace_leads').select('*'),
        auth.adminClient.from('lead_assignments').select('*')
      ]);

      return NextResponse.json({
        leads: (retryLeads.data || []).map(mapLeadToUI),
        leadAssignments: retryAssignments.data || []
      });
    }

    return NextResponse.json({
      leads: (leadsRes.data || []).map(mapLeadToUI),
      leadAssignments: assignmentsRes.data || []
    });

  } catch (error: any) {
    console.error('Failed to retrieve leads list, falling back to mock data:', error);
    return NextResponse.json({
      leads: DEFAULT_MOCK_LEADS,
      leadAssignments: DEFAULT_MOCK_ASSIGNMENTS
    });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 });
  }

  if (!auth.canRunAutomation) {
    return NextResponse.json({ error: 'Permission denied: Read-only access.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action, assignmentId, ...payload } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required.' }, { status: 400 });
    }

    if (auth.isBypassed) {
      return NextResponse.json({ success: true, message: `Action ${action} executed successfully (Simulated).` });
    }

    let queryRes: any = null;

    switch (action) {
      case 'submit_lead': {
        const { lead, targetInstallerId } = payload;
        if (!lead || !lead.first_name || !lead.last_name || !lead.email || !lead.phone) {
          return NextResponse.json({ error: 'Incomplete lead details.' }, { status: 400 });
        }

        const newLeadId = 'lead-' + Math.random().toString(36).substr(2, 9);
        const insertLead = await auth.adminClient.from('marketplace_leads').insert({
          id: newLeadId,
          name: `${lead.first_name} ${lead.last_name}`.trim(),
          phone: lead.phone,
          email: lead.email,
          state: lead.state || 'Lagos',
          city: lead.city || '',
          property_type: lead.property_type || 'commercial',
          monthly_spend: lead.average_monthly_bill_ngn || 0,
          power_source: (lead.generator_hours_daily || 0) > 0 ? 'mixed' : 'grid',
          interest_type: 'bill_savings',
          budget_range: 'Flexible',
          preferred_contact: 'WhatsApp',
          timeline: 'Researching',
          note: lead.notes || '',
          request_source: 'general',
          created_at: new Date().toISOString()
        });

        if (insertLead.error) throw insertLead.error;

        const currentAssignments: any[] = [];

        if (targetInstallerId) {
          // Direct routing
          currentAssignments.push({
            id: 'la-' + Math.random().toString(36).substr(2, 9),
            lead_id: newLeadId,
            installer_id: targetInstallerId,
            status: 'pending',
            is_exclusive: true
          });
        } else {
          // Matching algorithm
          // 1. Fetch installer service areas and subscriptions
          const [areasRes, subsRes] = await Promise.all([
            auth.adminClient.from('installer_service_areas').select('*'),
            auth.adminClient.from('installer_subscriptions').select('*')
          ]);

          const serviceAreas = areasRes.data || [];
          const subscriptions = subsRes.data || [];

          const leadStateNormalized = (lead.state || 'Lagos').toLowerCase().trim() === 'fct' ? 'abuja' : (lead.state || 'Lagos').toLowerCase().trim();
          const leadCityNormalized = lead.city ? lead.city.toLowerCase().trim() : '';

          // Find state & city matches
          let matchingInstallerIds = Array.from(
            new Set(
              serviceAreas
                .filter(
                  (sa: any) =>
                    sa.state.toLowerCase().trim() === leadStateNormalized &&
                    sa.city.toLowerCase().trim() === leadCityNormalized
                )
                .map((sa: any) => sa.installer_id)
            )
          );

          // Fallback to State only
          if (matchingInstallerIds.length === 0) {
            matchingInstallerIds = Array.from(
              new Set(
                serviceAreas
                  .filter((sa: any) => sa.state.toLowerCase().trim() === leadStateNormalized)
                  .map((sa: any) => sa.installer_id)
              )
            );
          }

          // Fallback to Nationwide/Regional installers
          if (matchingInstallerIds.length === 0) {
            matchingInstallerIds = ['inst-5', 'inst-8', 'inst-9', 'inst-12', 'inst-13', 'inst-20', 'inst-22'];
          }

          if (matchingInstallerIds.length > 0) {
            const getPriority = (instId: string) => {
              const sub = subscriptions.find((s: any) => s.installer_id === instId);
              if (!sub) return 0;
              if (sub.tier === 'verified_partner_plus') return 1000;
              if (sub.tier === 'verified_partner') return 500;
              return 0;
            };

            const sortedByTier = matchingInstallerIds.sort((a, b) => getPriority(b) - getPriority(a));
            const topMatch = sortedByTier[0];
            const topSub = subscriptions.find((s: any) => s.installer_id === topMatch);
            const isExclusive = topSub?.tier === 'verified_partner_plus';

            if (isExclusive) {
              currentAssignments.push({
                id: 'la-' + Math.random().toString(36).substr(2, 9),
                lead_id: newLeadId,
                installer_id: topMatch,
                status: 'pending',
                is_exclusive: true
              });
            } else {
              // Share with top 3
              sortedByTier.slice(0, 3).forEach((instId) => {
                currentAssignments.push({
                  id: 'la-' + Math.random().toString(36).substr(2, 9),
                  lead_id: newLeadId,
                  installer_id: instId,
                  status: 'pending',
                  is_exclusive: false
                });
              });
            }
          }
        }

        if (currentAssignments.length > 0) {
          const insertAss = await auth.adminClient.from('lead_assignments').insert(currentAssignments);
          if (insertAss.error) throw insertAss.error;
        }

        queryRes = { leadId: newLeadId, assignmentsCount: currentAssignments.length };
        break;
      }

      case 'update_status': {
        if (!assignmentId) return NextResponse.json({ error: 'assignmentId is required.' }, { status: 400 });
        const { status } = payload;
        queryRes = await auth.adminClient.from('lead_assignments').update({
          status,
          updated_at: new Date().toISOString()
        }).eq('id', assignmentId);

        if (queryRes.error) throw queryRes.error;
        break;
      }

      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: queryRes });

  } catch (error: any) {
    console.error('Failed to complete lead operation:', error);
    return NextResponse.json({ error: `Operation failed: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
