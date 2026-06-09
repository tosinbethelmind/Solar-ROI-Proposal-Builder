import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/utils/adminAuth'

export async function GET() {
  const auth = await verifyAdmin()
  if (!auth.isAdmin && !auth.user) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 })
  }

  if (auth.isAdmin) {
    // Admin gets all supplier partners including inactive ones and full commission rates
    const { data: partners, error } = await auth.adminClient
      .from('supplier_partners')
      .select('*')
      .order('company_name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: partners })
  }

  // Regular users only see active supplier partners (for dropdown filters in referral requests)
  const { data: partners, error } = await auth.userClient
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
  const auth = await verifyAdmin()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Forbidden' }, { status: auth.errorStatus || 403 })
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

    const { data: partner, error: insertError } = await auth.adminClient
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
  const auth = await verifyAdmin()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Forbidden' }, { status: auth.errorStatus || 403 })
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

    const { data: partner, error: updateError } = await auth.adminClient
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
