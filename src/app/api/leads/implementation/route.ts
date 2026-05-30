import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if admin
  const { data: admin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (admin) {
    // Admin gets all implementation leads with company info
    const { data: leads, error } = await supabase
      .from('implementation_leads')
      .select('*, companies(name)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: leads })
  }

  // Non-admin company members get only their company's leads
  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'No company found' }, { status: 404 })
  }

  const { data: leads, error } = await supabase
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
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: member } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    return NextResponse.json({ error: 'No company found for user' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { contact_name, phone, email, team_size, current_workflow, desired_package } = body

    if (!contact_name) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 })
    }

    const { data: lead, error: insertError } = await supabase
      .from('implementation_leads')
      .insert({
        company_id: member.company_id,
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
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only platform admins can edit lead status
  const { data: admin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing lead ID or status' }, { status: 400 })
    }

    const { data: lead, error: updateError } = await supabase
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
