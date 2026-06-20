import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isE2EBypassed } from '@/utils/e2eBypass'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (await isE2EBypassed()) {
    return NextResponse.json({
      data: {
        id: id || 'e2e-mock-proposal-id',
        customer_name: 'Lagos Heights Apartments',
        customer_email: 'manager@lagosheights.com',
        customer_phone: '08011122233',
        backup_hours: 6,
        peak_sun_hours: 4.2,
        selected_tier: 'standard',
        final_quoted_price_ngn: 4500000,
        calculations_snapshot: {
          inverterKva: 5,
          batteryConfigString: '4x 200Ah Lithium',
          panelCount: 8,
          panelUnitWp: 450,
          essentialDailyWh: 2400,
          totalDailyWh: 4500,
          systemVoltage: 48,
          batteryTotalUnits: 4,
          peakSurgeWatts: 4200,
          branding: {
            primaryColor: '#01696f',
            secondaryColor: '#01414a',
            logoUrl: '',
            tagline: 'Reliable Clean Power for Nigeria'
          },
          paymentPlan: { selectedPlan: 'outright', downPaymentPercent: 20, includeInProposal: true }
        },
        created_at: new Date().toISOString()
      }
    })
  }

  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rely strictly on RLS for tenant-scoped database isolation
  const { data: proposal, error: fetchError } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !proposal) {
    console.error('[API proposal GET] Fetch failed or not found:', fetchError?.message)
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }

  return NextResponse.json({ data: proposal })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (await isE2EBypassed()) {
    try {
      const body = await request.json()
      const { proposal, calculations, status } = body
      const mockUpdated: Record<string, any> = {
        id,
        customer_name: proposal?.customer_name || 'Lagos Heights Apartments',
        customer_email: proposal?.customer_email || 'manager@lagosheights.com',
        customer_phone: proposal?.customer_phone || '08011122233',
        backup_hours: proposal?.backup_hours || 6,
        peak_sun_hours: proposal?.peak_sun_hours || 4.2,
        selected_tier: proposal?.selected_tier || 'standard',
        final_quoted_price_ngn: proposal?.final_quoted_price_ngn || 4500000,
        status: status || 'draft',
        calculations_snapshot: calculations || null,
        created_at: new Date().toISOString()
      }
      return NextResponse.json({ data: mockUpdated })
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
  }

  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Retrieve user company and subscription info to enforce read-only gating
  const { data: member, error: memberError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (memberError || !member) {
    console.error('[API proposal PATCH] Member lookup failed:', memberError?.message)
    return NextResponse.json({ error: 'Failed to resolve company workspace.' }, { status: 404 })
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('subscription_status')
    .eq('id', member.company_id)
    .single()

  if (companyError || !company) {
    console.error('[API proposal PATCH] Company subscription lookup failed:', companyError?.message)
    return NextResponse.json({ error: 'Failed to verify subscription details.' }, { status: 500 })
  }

  if (
    company.subscription_status === 'past_due' ||
    company.subscription_status === 'cancelled' ||
    company.subscription_status === 'expired'
  ) {
    return NextResponse.json({
      error: 'Your workspace subscription is inactive, past due, or expired. Please update your billing plan to modify proposals.'
    }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { proposal, calculations, status } = body

    const updatePayload: Record<string, unknown> = {}
    if (proposal) {
      if (proposal.customer_name) updatePayload.customer_name = proposal.customer_name
      if (proposal.customer_email !== undefined) updatePayload.customer_email = proposal.customer_email
      if (proposal.customer_phone !== undefined) updatePayload.customer_phone = proposal.customer_phone
      if (proposal.backup_hours !== undefined) updatePayload.backup_hours = proposal.backup_hours
      if (proposal.peak_sun_hours !== undefined) updatePayload.peak_sun_hours = proposal.peak_sun_hours
      if (proposal.selected_tier !== undefined) updatePayload.selected_tier = proposal.selected_tier
      if (proposal.final_quoted_price_ngn !== undefined) updatePayload.final_quoted_price_ngn = proposal.final_quoted_price_ngn
    }
    if (calculations !== undefined) updatePayload.calculations_snapshot = calculations
    if (status !== undefined) updatePayload.status = status

    const { data: updatedProposal, error: updateError } = await supabase
      .from('proposals')
      .update(updatePayload)
      .eq('id', id)
      .eq('company_id', member.company_id)
      .select('*')
      .single()

    if (updateError) {
      console.error('[API proposal PATCH] Update query failed:', updateError.message)
      return NextResponse.json({ error: 'Failed to update proposal.' }, { status: 500 })
    }

    return NextResponse.json({ data: updatedProposal })
  } catch (err) {
    console.error('[API proposal PATCH] Exception caught:', err)
    return NextResponse.json({ error: 'An unexpected error occurred while modifying the proposal.' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (await isE2EBypassed()) {
    return NextResponse.json({ success: true })
  }

  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Retrieve user company and subscription info to enforce read-only gating
  const { data: member, error: memberError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (memberError || !member) {
    console.error('[API proposal DELETE] Member lookup failed:', memberError?.message)
    return NextResponse.json({ error: 'Failed to resolve company workspace.' }, { status: 404 })
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('subscription_status')
    .eq('id', member.company_id)
    .single()

  if (companyError || !company) {
    console.error('[API proposal DELETE] Company subscription lookup failed:', companyError?.message)
    return NextResponse.json({ error: 'Failed to verify subscription details.' }, { status: 500 })
  }

  if (
    company.subscription_status === 'past_due' ||
    company.subscription_status === 'cancelled' ||
    company.subscription_status === 'expired'
  ) {
    return NextResponse.json({
      error: 'Your workspace subscription is inactive, past due, or expired. Please update your billing plan to delete proposals.'
    }, { status: 403 })
  }

  const { error: deleteError } = await supabase
    .from('proposals')
    .delete()
    .eq('id', id)
    .eq('company_id', member.company_id)

  if (deleteError) {
    console.error('[API proposal DELETE] Query failed:', deleteError.message)
    return NextResponse.json({ error: 'Failed to delete proposal.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
