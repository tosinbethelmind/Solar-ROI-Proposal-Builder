import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin check
  const { data: admin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (admin) {
    // Admin gets all supplier partners including inactive ones and full commission rates
    const { data: partners, error } = await supabase
      .from('supplier_partners')
      .select('*')
      .order('company_name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: partners })
  }

  // Regular users only see active supplier partners (for dropdown filters in referral requests)
  const { data: partners, error } = await supabase
    .from('supplier_partners')
    .select('id, company_name, categories, regions')
    .eq('active', true)
    .order('company_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: partners })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin check
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
    const {
      company_name,
      contact_person,
      phone,
      email,
      whatsapp_number,
      categories,
      regions,
      commission_model,
      commission_rate,
      active,
      notes
    } = body

    if (!company_name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const { data: partner, error: insertError } = await supabase
      .from('supplier_partners')
      .insert({
        company_name,
        contact_person: contact_person || null,
        phone: phone || null,
        email: email || null,
        whatsapp_number: whatsapp_number || null,
        categories: categories || [],
        regions: regions || [],
        commission_model: commission_model || 'percentage_of_sale',
        commission_rate: commission_rate ? parseFloat(commission_rate) : 0,
        active: active !== undefined ? active : true,
        notes: notes || null
      })
      .select('*')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: partner })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Admin check
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
    const {
      id,
      company_name,
      contact_person,
      phone,
      email,
      whatsapp_number,
      categories,
      regions,
      commission_model,
      commission_rate,
      active,
      notes
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }

    const { data: partner, error: updateError } = await supabase
      .from('supplier_partners')
      .update({
        company_name,
        contact_person,
        phone,
        email,
        whatsapp_number,
        categories,
        regions,
        commission_model,
        commission_rate: commission_rate ? parseFloat(commission_rate) : 0,
        active,
        notes
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ data: partner })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
