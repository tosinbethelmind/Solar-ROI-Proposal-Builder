import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';

const DEFAULT_MOCK_INSTALLERS = [
  {
    id: 'inst-1',
    user_id: 'user-inst-1',
    business_name: 'Lekki Clean Energy Ltd',
    logo_url: '',
    description: 'Premier residential and commercial solar installations specializing in hybrid inverter setups, Lithium-ion high-capacity storage, and structural wind permitting in coastal Lagos.',
    specialty_tags: ['Lithium Storage', 'Residential Hybrid', 'LSEB Certified'],
    brands_handled: ['Sunsynk', 'Victron Energy', 'Must Inverters', 'Felicity Solar'],
    is_verified: true,
    rating_count: 24,
    rating_average: 4.8,
    response_speed: 'Usually under 2 hours',
    contact_preference: 'WhatsApp',
    cac_number: 'RC-1485901',
    is_claimed: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-2',
    user_id: 'user-inst-2',
    business_name: 'Gbagada Solar Systems Ltd',
    logo_url: '',
    description: 'Expert solar services focused on reducing monthly generator diesel expenditures. Offering customized grid-tie and net-metering arrays for residential estates in Gbagada, Ikeja, and Surulere.',
    specialty_tags: ['Diesel Offsets', 'Net Metering', 'Residential Hybrid'],
    brands_handled: ['Growatt', 'Must Inverters', 'Deye', 'Jinko Solar'],
    is_verified: true,
    rating_count: 15,
    rating_average: 4.6,
    response_speed: 'Usually under 4 hours',
    contact_preference: 'Phone Call',
    cac_number: 'RC-1294850',
    is_claimed: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-3',
    user_id: 'user-inst-3',
    business_name: 'Eko Solar Tech Solutions',
    logo_url: '',
    description: 'Nigeria-focused solar integration agency specializing in premium corporate grid-tied systems and advanced roof weight deflection permitting in Lagos Island & Victoria Island.',
    specialty_tags: ['Commercial Grid-Tie', 'Premium Inverters', 'Wind Deflection'],
    brands_handled: ['Victron Energy', 'SMA Inverters', 'Fronius', 'Canadian Solar'],
    is_verified: true,
    rating_count: 32,
    rating_average: 4.9,
    response_speed: 'Usually under 1 hour',
    contact_preference: 'WhatsApp',
    cac_number: 'RC-1104859',
    is_claimed: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'inst-4',
    user_id: 'user-inst-4',
    business_name: 'Ajao Estate Energy Partners',
    logo_url: '',
    description: 'Affordable, premium-grade household battery backups and solar panel retrofits. Committed to making stable clean power accessible in Lagos mainland.',
    specialty_tags: ['Battery Upgrades', 'Affordable Home Solar', 'Gel Batteries'],
    brands_handled: ['Felicity Solar', 'Luminous', 'Must Inverters'],
    is_verified: false,
    rating_count: 5,
    rating_average: 4.2,
    response_speed: 'Usually within 24 hours',
    contact_preference: 'Email',
    is_claimed: false,
    created_at: new Date().toISOString()
  }
];

const DEFAULT_MOCK_SERVICE_AREAS = [
  { id: 'sa-1', installer_id: 'inst-1', state: 'Lagos', city: 'Lekki' },
  { id: 'sa-2', installer_id: 'inst-1', state: 'Lagos', city: 'Victoria Island' },
  { id: 'sa-3', installer_id: 'inst-1', state: 'Lagos', city: 'Ikoyi' },
  { id: 'sa-4', installer_id: 'inst-2', state: 'Lagos', city: 'Gbagada' },
  { id: 'sa-5', installer_id: 'inst-2', state: 'Lagos', city: 'Ikeja' },
  { id: 'sa-6', installer_id: 'inst-2', state: 'Lagos', city: 'Surulere' }
];

const DEFAULT_MOCK_SUBSCRIPTIONS = [
  { id: 'sub-1', installer_id: 'inst-1', tier: 'verified_partner_plus', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-2', installer_id: 'inst-2', tier: 'verified_partner', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-3', installer_id: 'inst-3', tier: 'verified_partner_plus', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() },
  { id: 'sub-4', installer_id: 'inst-4', tier: 'basic', status: 'active', expires_at: '2027-01-01T00:00:00Z', created_at: new Date().toISOString() }
];

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 });
  }

  if (auth.isBypassed) {
    return NextResponse.json({
      role: auth.role,
      installers: DEFAULT_MOCK_INSTALLERS,
      serviceAreas: DEFAULT_MOCK_SERVICE_AREAS,
      subscriptions: DEFAULT_MOCK_SUBSCRIPTIONS
    });
  }

  try {
    const [installersRes, areasRes, subsRes] = await Promise.all([
      auth.adminClient.from('marketplace_installers').select('*'),
      auth.adminClient.from('installer_service_areas').select('*'),
      auth.adminClient.from('installer_subscriptions').select('*')
    ]);

    if (installersRes.error) throw installersRes.error;
    if (areasRes.error) throw areasRes.error;
    if (subsRes.error) throw subsRes.error;

    // If tables are completely empty, pre-populate with default mocks (developer convenience)
    if ((installersRes.data || []).length === 0) {
      await auth.adminClient.from('marketplace_installers').insert(DEFAULT_MOCK_INSTALLERS);
      await auth.adminClient.from('installer_service_areas').insert(DEFAULT_MOCK_SERVICE_AREAS);
      await auth.adminClient.from('installer_subscriptions').insert(DEFAULT_MOCK_SUBSCRIPTIONS);

      const [retryInst, retryAreas, retrySubs] = await Promise.all([
        auth.adminClient.from('marketplace_installers').select('*'),
        auth.adminClient.from('installer_service_areas').select('*'),
        auth.adminClient.from('installer_subscriptions').select('*')
      ]);

      return NextResponse.json({
        role: auth.role,
        installers: retryInst.data || [],
        serviceAreas: retryAreas.data || [],
        subscriptions: retrySubs.data || []
      });
    }

    return NextResponse.json({
      role: auth.role,
      installers: installersRes.data || [],
      serviceAreas: areasRes.data || [],
      subscriptions: subsRes.data || []
    });

  } catch (error: any) {
    console.error('Failed to retrieve installers directory, falling back to mock data:', error);
    return NextResponse.json({
      role: auth.role,
      installers: DEFAULT_MOCK_INSTALLERS,
      serviceAreas: DEFAULT_MOCK_SERVICE_AREAS,
      subscriptions: DEFAULT_MOCK_SUBSCRIPTIONS
    });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 });
  }

  // Prevent read-only admins from executing mutations
  if (!auth.canRunAutomation) {
    return NextResponse.json({ error: 'Permission denied: Read-only access.' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action, installerId, ...payload } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action parameter is required.' }, { status: 400 });
    }

    // Role-based write constraints check
    if (action === 'update_tier' && !auth.canModifySubscriptions) {
      return NextResponse.json({ error: 'Permission denied: Billing or SuperAdmin role required to modify subscriptions.' }, { status: 403 });
    }
    if ((action === 'update_verified' || action === 'update_profile' || action === 'delete') && !auth.canModifyProfiles) {
      return NextResponse.json({ error: 'Permission denied: Operations or SuperAdmin role required to modify profiles.' }, { status: 403 });
    }

    if (auth.isBypassed) {
      // Simulating mutations successfully
      return NextResponse.json({ success: true, message: `Action ${action} executed successfully (Simulated).` });
    }

    let queryRes: any = null;

    switch (action) {
      case 'add': {
        const newId = 'inst-' + Math.random().toString(36).substr(2, 9);
        const { businessName, logoUrl, description, specialtyTags, brandsHandled, contactPreference, cacNumber } = payload;
        
        const insertProfile = await auth.adminClient.from('marketplace_installers').insert({
          id: newId,
          business_name: businessName,
          logo_url: logoUrl || '',
          description: description || '',
          specialty_tags: specialtyTags || [],
          brands_handled: brandsHandled || [],
          contact_preference: contactPreference || 'WhatsApp',
          cac_number: cacNumber || '',
          is_verified: false,
          is_claimed: false,
          rating_count: 0,
          rating_average: 0.0
        });

        if (insertProfile.error) throw insertProfile.error;

        const insertSub = await auth.adminClient.from('installer_subscriptions').insert({
          id: 'sub-' + Math.random().toString(36).substr(2, 9),
          installer_id: newId,
          tier: 'basic',
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        if (insertSub.error) throw insertSub.error;

        queryRes = { id: newId };
        break;
      }

      case 'update_profile': {
        if (!installerId) return NextResponse.json({ error: 'installerId is required.' }, { status: 400 });
        const { businessName, description, specialtyTags, brandsHandled, contactPreference, cacNumber } = payload;
        
        queryRes = await auth.adminClient.from('marketplace_installers').update({
          business_name: businessName,
          description,
          specialty_tags: specialtyTags,
          brands_handled: brandsHandled,
          contact_preference: contactPreference,
          cac_number: cacNumber
        }).eq('id', installerId);

        if (queryRes.error) throw queryRes.error;
        break;
      }

      case 'delete': {
        if (!installerId) return NextResponse.json({ error: 'installerId is required.' }, { status: 400 });
        queryRes = await auth.adminClient.from('marketplace_installers').delete().eq('id', installerId);
        if (queryRes.error) throw queryRes.error;
        break;
      }

      case 'update_verified': {
        if (!installerId) return NextResponse.json({ error: 'installerId is required.' }, { status: 400 });
        const { isVerified } = payload;
        queryRes = await auth.adminClient.from('marketplace_installers').update({
          is_verified: isVerified
        }).eq('id', installerId);

        if (queryRes.error) throw queryRes.error;
        break;
      }

      case 'update_tier': {
        if (!installerId) return NextResponse.json({ error: 'installerId is required.' }, { status: 400 });
        const { tier } = payload;
        queryRes = await auth.adminClient.from('installer_subscriptions').update({
          tier
        }).eq('installer_id', installerId);

        if (queryRes.error) throw queryRes.error;
        break;
      }

      case 'add_service_area': {
        if (!installerId) return NextResponse.json({ error: 'installerId is required.' }, { status: 400 });
        const { state, city } = payload;
        const newSaId = 'sa-' + Math.random().toString(36).substr(2, 9);
        queryRes = await auth.adminClient.from('installer_service_areas').insert({
          id: newSaId,
          installer_id: installerId,
          state,
          city
        });

        if (queryRes.error) throw queryRes.error;
        break;
      }

      case 'remove_service_area': {
        const { serviceAreaId } = payload;
        if (!serviceAreaId) return NextResponse.json({ error: 'serviceAreaId is required.' }, { status: 400 });
        queryRes = await auth.adminClient.from('installer_service_areas').delete().eq('id', serviceAreaId);
        if (queryRes.error) throw queryRes.error;
        break;
      }

      case 'set_service_areas': {
        if (!installerId) return NextResponse.json({ error: 'installerId is required.' }, { status: 400 });
        const { areas } = payload; // Array of { state, city }
        
        // Remove existing first
        const deleteAreas = await auth.adminClient.from('installer_service_areas').delete().eq('installer_id', installerId);
        if (deleteAreas.error) throw deleteAreas.error;

        if (areas && Array.isArray(areas) && areas.length > 0) {
          const insertPayload = areas.map((a: any) => ({
            id: 'sa-' + Math.random().toString(36).substr(2, 9),
            installer_id: installerId,
            state: a.state,
            city: a.city
          }));
          queryRes = await auth.adminClient.from('installer_service_areas').insert(insertPayload);
          if (queryRes.error) throw queryRes.error;
        }
        break;
      }

      case 'claim_listing': {
        if (!installerId) return NextResponse.json({ error: 'installerId is required.' }, { status: 400 });
        const { email, phone } = payload;
        queryRes = await auth.adminClient.from('marketplace_installers').update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          claimed_by_email: email,
          claimed_by_phone: phone
        }).eq('id', installerId);

        if (queryRes.error) throw queryRes.error;
        break;
      }

      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: queryRes });

  } catch (error: any) {
    console.error('Failed to complete installer profile mutation:', error);
    return NextResponse.json({ error: `Mutation failed: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
}
