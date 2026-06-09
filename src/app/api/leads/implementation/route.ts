import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/utils/adminAuth'

export async function GET() {
  const auth = await verifyAdmin()
  if (!auth.isAdmin && !auth.user) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 })
  }

  if (auth.isAdmin) {
    // Admin gets all implementation leads with company info
    const { data: leads, error } = await auth.adminClient
      .from('implementation_leads')
      .select('*, companies(name)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: leads })
  }

  // Non-admin company members get only their company's leads
  const { data: member } = await auth.userClient
    .from('company_members')
    .select('company_id')
    .eq('user_id', auth.user?.id || '')
    .single()

  if (!member) {
    return NextResponse.json({ error: 'No company found' }, { status: 404 })
  }

  const { data: leads, error } = await auth.userClient
    .from('implementation_leads')
    .select('*')
    .eq('company_id', member.company_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: leads })
}

export async function POST(request: Request) {
  const auth = await verifyAdmin()
  if (!auth.isAdmin && !auth.user) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 })
  }

  const userId = auth.user?.id || 'dev-admin-id'
  let companyId: string | null = null

  const { data: member } = await auth.userClient
    .from('company_members')
    .select('company_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (member) {
    companyId = member.company_id
  } else if (auth.isBypassed) {
    // Fallback to the first available company during dev auth bypass testing
    const { data: firstCompany } = await auth.adminClient
      .from('companies')
      .select('id')
      .limit(1)
      .maybeSingle()
    if (firstCompany) {
      companyId = firstCompany.id
    }
  }

  if (!companyId) {
    return NextResponse.json({ error: 'No company found for user' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { contact_name, phone, email, team_size, current_workflow, desired_package } = body

    if (!contact_name) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 })
    }

    const { data: lead, error: insertError } = await auth.adminClient
      .from('implementation_leads')
      .insert({
        company_id: companyId,
        contact_name,
        phone: phone || null,
        email: email || null,
        team_size: team_size ? parseInt(team_size, 10) : null,
        current_workflow: current_workflow || null,
        desired_package: desired_package || 'basic',
        status: 'new'
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[API implementation leads POST] Insert failed:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: lead })
  } catch (err) {
    console.error('[API implementation leads POST] Parse failed:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const auth = await verifyAdmin()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Forbidden' }, { status: auth.errorStatus || 403 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing lead ID or status' }, { status: 400 })
    }

    const { data: lead, error: updateError } = await auth.adminClient
      .from('implementation_leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ data: lead })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
