import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isE2EBypassed } from '@/utils/e2eBypass'

// POST public B2C homeowner lead submission (Email-only capture)
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const { email, location, running_load_w, kva_recommended, monthly_savings_ngn, monthly_fuel_spend } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const normalisedEmail = email.trim().toLowerCase()

    if (await isE2EBypassed()) {
      return NextResponse.json({
        data: {
          id: 'e2e-mock-lead-id',
          name: 'Anonymous Email Lead',
          phone: '08000000000',
          email: normalisedEmail,
          location: location || 'Lagos',
          running_load_w: running_load_w ? parseInt(running_load_w, 10) : 1500,
          kva_recommended: kva_recommended || '3.5 kVA',
          monthly_savings_ngn: monthly_savings_ngn ? parseFloat(monthly_savings_ngn) : 45000,
          monthly_fuel_spend: monthly_fuel_spend ? parseFloat(monthly_fuel_spend) : 150000,
          created_at: new Date().toISOString()
        }
      })
    }

    // Insert into homeowner_leads table using placeholders for NOT NULL name and phone columns
    const { data: lead, error: insertError } = await supabase
      .from('homeowner_leads')
      .insert({
        name: 'Anonymous Email Lead',
        phone: '08000000000',
        email: normalisedEmail,
        location: location || null,
        running_load_w: running_load_w ? parseInt(running_load_w, 10) : null,
        kva_recommended: kva_recommended || null,
        monthly_savings_ngn: monthly_savings_ngn ? parseFloat(monthly_savings_ngn) : null,
        monthly_fuel_spend: monthly_fuel_spend ? parseFloat(monthly_fuel_spend) : null
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[API leads POST] Insert failed:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: lead })
  } catch (err) {
    console.error('[API leads POST] Parse failed:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
