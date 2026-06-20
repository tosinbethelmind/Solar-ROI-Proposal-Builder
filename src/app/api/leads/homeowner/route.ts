import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/utils/adminAuth'
import { isE2EBypassed } from '@/utils/e2eBypass'

// GET all homeowner leads (Restricted to platform admins)
export async function GET() {
  if (await isE2EBypassed()) {
    return NextResponse.json({
      data: [
        {
          id: 'e2e-mock-lead-id-1',
          name: 'Anthony Demo',
          phone: '08012345678',
          email: 'anthony_demo@gmail.com',
          location: 'Lagos',
          running_load_w: 1500,
          kva_recommended: '3.5 kVA',
          monthly_savings_ngn: 45000,
          monthly_fuel_spend: 150000,
          created_at: new Date().toISOString()
        }
      ]
    })
  }

  const auth = await verifyAdmin()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Forbidden' }, { status: auth.errorStatus || 403 })
  }

  const { data: leads, error } = await auth.adminClient
    .from('homeowner_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: leads })
}

// POST public B2C homeowner lead submission (Anonymous)
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { name, phone, email, location, running_load_w, kva_recommended, monthly_savings_ngn, monthly_fuel_spend } = body

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and Phone number are required' }, { status: 400 })
    }

    if (await isE2EBypassed()) {
      return NextResponse.json({
        data: {
          id: 'e2e-mock-lead-id-2',
          name,
          phone,
          email: email || null,
          location: location || null,
          running_load_w: running_load_w ? parseInt(running_load_w, 10) : null,
          kva_recommended: kva_recommended || null,
          monthly_savings_ngn: monthly_savings_ngn ? parseFloat(monthly_savings_ngn) : null,
          monthly_fuel_spend: monthly_fuel_spend ? parseFloat(monthly_fuel_spend) : null,
          created_at: new Date().toISOString()
        }
      })
    }

    const { data: lead, error: insertError } = await supabase
      .from('homeowner_leads')
      .insert({
        name,
        phone,
        email: email || null,
        location: location || null,
        running_load_w: running_load_w ? parseInt(running_load_w, 10) : null,
        kva_recommended: kva_recommended || null,
        monthly_savings_ngn: monthly_savings_ngn ? parseFloat(monthly_savings_ngn) : null,
        monthly_fuel_spend: monthly_fuel_spend ? parseFloat(monthly_fuel_spend) : null
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[API homeowner leads POST] Insert failed:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: lead })
  } catch (err) {
    console.error('[API homeowner leads POST] Parse failed:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
