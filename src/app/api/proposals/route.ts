import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rely strictly on RLS for tenant-scoped database isolation
  const { data: proposals, error: fetchError } = await supabase
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('[API proposals GET] Fetch failed:', fetchError.message)
    return NextResponse.json({ error: 'Failed to retrieve workspace proposals.' }, { status: 500 })
  }

  return NextResponse.json({ data: proposals })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch company member role/id for creation payload
  const { data: member, error: memberError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (memberError || !member) {
    console.error('[API proposals POST] Member association failed:', memberError?.message)
    return NextResponse.json({ error: 'Failed to resolve company workspace.' }, { status: 404 })
  }

  // Query company subscription tier and status for server-side gating
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('subscription_tier, subscription_status')
    .eq('id', member.company_id)
    .single()

  if (companyError || !company) {
    console.error('[API proposals POST] Company subscription lookup failed:', companyError?.message)
    return NextResponse.json({ error: 'Failed to verify subscription details.' }, { status: 500 })
  }

  // Enforce billing status blocks (past due or cancelled cannot create proposals)
  if (company.subscription_status === 'past_due' || company.subscription_status === 'cancelled') {
    return NextResponse.json({
      error: 'Your workspace subscription is past due or cancelled. Please update your payment to resume creating proposals.'
    }, { status: 403 })
  }

  // Enforce Starter tier quota restriction (maximum 3 proposals)
  if (company.subscription_tier === 'starter') {
    const { count, error: countError } = await supabase
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', member.company_id)

    if (countError) {
      console.error('[API proposals POST] Quota count lookup failed:', countError.message)
      return NextResponse.json({ error: 'Failed to verify workspace quota.' }, { status: 500 })
    }

    if (count !== null && count >= 3) {
      return NextResponse.json({
        error: 'Proposal quota reached. Starter tier is limited to 3 proposals. Please upgrade to Pro for unlimited generation.'
      }, { status: 403 })
    }
  }

  try {
    const body = await request.json()
    const { proposal, calculations, id } = body

    // 1. Check or Create client in database
    let clientId = null
    if (proposal.customer_name) {
      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .insert({
          company_id: member.company_id,
          name: proposal.customer_name,
          email: proposal.customer_email || null,
          phone: proposal.customer_phone || null
        })
        .select('id')
        .single()
      
      if (!clientErr && client) {
        clientId = client.id
      }
    }

    // 2. Insert proposal mapped to company
    const currentFXRate = calculations?.fxRate || 1600;
    const currentDieselPrice = calculations?.dieselPrice || 1400;

    const payload = {
      id: id || undefined,
      company_id: member.company_id,
      client_id: clientId,
      customer_name: proposal.customer_name || 'Unnamed Client',
      customer_email: proposal.customer_email || null,
      customer_phone: proposal.customer_phone || null,
      backup_hours: proposal.backup_hours || 0,
      peak_sun_hours: proposal.peak_sun_hours || 4.2,
      selected_tier: proposal.selected_tier || 'standard',
      final_quoted_price_ngn: proposal.final_quoted_price_ngn || 0,
      status: 'draft',
      
      // Hardened Snapshots: Lock parameters to guarantee calculation reproducibility
      calculations_snapshot: calculations ? {
        ...calculations,
        locked_at: new Date().toISOString(),
        financial_parameters: {
          fx_rate_usd_ngn: currentFXRate,
          diesel_cost_per_liter: currentDieselPrice,
          grid_tariff_kwh: proposal.nepa_tariff_per_kwh || 209.5,
          battery_replacement_reserve: calculations.batteryReplacementReserve || 0.15
        },
        regulatory: {
          nerc_tariff_class: proposal.nerc_tariff_class || 'R2A',
          disco_region: proposal.disco_region || 'Eko_DISCO',
          grid_availability_assumption: proposal.grid_availability_assumption !== undefined ? proposal.grid_availability_assumption : 0.35
        },
        equipment_sourcing: {
          import_duty_rate: proposal.import_duty_rate !== undefined ? proposal.import_duty_rate : 0.05,
          vat_rate: proposal.vat_rate !== undefined ? proposal.vat_rate : 0.075,
          customs_clearing_assumptions: proposal.customs_clearing_assumptions || 'Lagos_Apapa_Port'
        }
      } : null
    }

    const { data: newProposal, error: insertError } = await supabase
      .from('proposals')
      .insert(payload)
      .select('*')
      .single()


    if (insertError) {
      console.error('[API proposals POST] Insert query failed:', insertError.message)
      return NextResponse.json({ error: 'Failed to create proposal.' }, { status: 500 })
    }

    return NextResponse.json({ data: newProposal })
  } catch (err) {
    console.error('[API proposals POST] Exception caught:', err)
    return NextResponse.json({ error: 'An unexpected error occurred while saving the proposal.' }, { status: 400 })
  }
}
