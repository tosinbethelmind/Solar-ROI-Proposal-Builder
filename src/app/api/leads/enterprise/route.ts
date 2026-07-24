import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdmin } from '@/utils/adminAuth'
import { isE2EBypassed } from '@/utils/e2eBypass'
import fs from 'fs'
import path from 'path'

const stateFilePath = path.join(process.cwd(), '.next', 'e2e-leads-mock-state.json')

function getMockStatus() {
  try {
    if (fs.existsSync(stateFilePath)) {
      const data = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'))
      return data.status || 'new'
    }
  } catch (e) {
    console.error('Failed to read mock status file', e)
  }
  return 'new'
}

function setMockStatus(status: string) {
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify({ status }), 'utf8')
  } catch (e) {
    console.error('Failed to write mock status file', e)
  }
}

// GET all enterprise leads (Restricted to platform admins)
export async function GET() {
  if (await isE2EBypassed()) {
    return NextResponse.json({
      data: [
        {
          id: 'e2e-mock-enterprise-id-1',
          company_name: 'Acme Corp Ltd',
          contact_person: 'Chinedu Eze',
          email: 'chinedu@acmecorp.com',
          phone: '08099991111',
          project_scope: '100kW rooftop installation for warehouse',
          status: getMockStatus(),
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
    .from('enterprise_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: leads })
}

// POST public B2B enterprise lead submission (Anonymous)
export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const body = await request.json()
    const {
      company_name,
      contact_person,
      email,
      phone,
      project_scope
    } = body

    if (!company_name || !contact_person || !email) {
      return NextResponse.json({ error: 'Company Name, Contact Person, and Email are required' }, { status: 400 })
    }

    if (await isE2EBypassed()) {
      return NextResponse.json({
        data: {
          id: 'e2e-mock-enterprise-id-2',
          company_name,
          contact_person,
          email,
          phone: phone || null,
          project_scope: project_scope || null,
          status: 'new',
          created_at: new Date().toISOString()
        }
      })
    }

    const { data: lead, error: insertError } = await supabase
      .from('enterprise_leads')
      .insert({
        company_name,
        contact_person,
        email,
        phone: phone || null,
        project_scope: project_scope || null
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[API enterprise leads POST] Insert failed:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: lead })
  } catch (err) {
    console.error('[API enterprise leads POST] Parse failed:', err)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

// PATCH to update enterprise lead status (Restricted to platform admins)
export async function PATCH(request: Request) {
  if (await isE2EBypassed()) {
    try {
      const body = await request.json()
      const { id, status } = body
      setMockStatus(status)
      return NextResponse.json({
        data: {
          id,
          company_name: 'Acme Corp Ltd',
          contact_person: 'Chinedu Eze',
          email: 'chinedu@acmecorp.com',
          phone: '08099991111',
          project_scope: '100kW rooftop installation for warehouse',
          status,
          created_at: new Date().toISOString()
        }
      })
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
  }

  const auth = await verifyAdmin()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Forbidden' }, { status: auth.errorStatus || 403 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Lead ID and Status are required' }, { status: 400 })
    }

    const { data: lead, error } = await auth.adminClient
      .from('enterprise_leads')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[API enterprise leads PATCH] Update failed:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: lead })
  } catch (err: any) {
    console.error('[API enterprise leads PATCH] Parse failed:', err)
    return NextResponse.json({ error: err.message || 'Invalid payload' }, { status: 400 })
  }
}

