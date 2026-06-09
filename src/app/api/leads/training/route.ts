import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/utils/adminAuth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const auth = await verifyAdmin()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Forbidden' }, { status: auth.errorStatus || 403 })
  }

  const { data: leads, error } = await auth.adminClient
    .from('training_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: leads })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { name, phone, email, company, role, experience_level } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: lead, error: insertError } = await supabase
      .from('training_leads')
      .insert({
        name,
        phone: phone || null,
        email: email || null,
        company: company || null,
        role: role || null,
        experience_level: experience_level || null,
        status: 'new'
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[API training leads POST] Insert failed:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: lead })
  } catch (err) {
    console.error('[API training leads POST] Exception caught:', err)
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
      return NextResponse.json({ error: 'Missing ID or status' }, { status: 400 })
    }

    const { data: lead, error: updateError } = await auth.adminClient
      .from('training_leads')
      .update({ status })
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
