import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/utils/adminAuth'

export async function GET(request: Request) {
  const auth = await verifyAdmin()
  if (!auth.isAdmin && !auth.user) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 })
  }

  if (auth.isAdmin) {
    // Admin gets all referrals with partner and company names
    const { data: referrals, error } = await auth.adminClient
      .from('supplier_referrals')
      .select('*, companies(name), supplier_partners(company_name)')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: referrals })
  }

  // Normal users get only their own company's referrals
  const { data: member } = await auth.userClient
    .from('company_members')
    .select('company_id')
    .eq('user_id', auth.user?.id || '')
    .single()

  if (!member) {
    return NextResponse.json({ error: 'No company found' }, { status: 404 })
  }

  const { data: referrals, error } = await auth.userClient
    .from('supplier_referrals')
    .select('*, supplier_partners(company_name)')
    .eq('company_id', member.company_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: referrals })
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
    return NextResponse.json({ error: 'No company found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const {
      proposal_id,
      customer_name,
      equipment_summary,
      system_size,
      preferred_supplier_id,
      preferred_contact_method,
      location
    } = body

    if (!proposal_id) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 })
    }

    // Auto-calculate expected commission
    let expectedCommission = 0
    if (preferred_supplier_id) {
      const { data: partner } = await auth.adminClient
        .from('supplier_partners')
        .select('commission_model, commission_rate')
        .eq('id', preferred_supplier_id)
        .single()

      if (partner) {
        if (partner.commission_model === 'flat_fee_per_won_referral') {
          expectedCommission = partner.commission_rate || 0
        } else if (partner.commission_model === 'percentage_of_sale') {
          // Fetch proposal price
          const { data: proposal } = await auth.adminClient
            .from('proposals')
            .select('final_quoted_price_ngn')
            .eq('id', proposal_id)
            .single()

          if (proposal && proposal.final_quoted_price_ngn) {
            expectedCommission = proposal.final_quoted_price_ngn * ((partner.commission_rate || 0) / 100)
          }
        }
      }
    }

    const { data: referral, error: insertError } = await auth.adminClient
      .from('supplier_referrals')
      .insert({
        proposal_id,
        company_id: companyId,
        user_id: userId,
        customer_name: customer_name || 'Unnamed Project',
        equipment_summary: equipment_summary || null,
        system_size: system_size || null,
        preferred_supplier_id: preferred_supplier_id || null,
        preferred_contact_method: preferred_contact_method || 'whatsapp',
        location: location || null,
        status: 'new',
        expected_commission: expectedCommission,
        actual_commission: 0,
        commission_status: 'pending'
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('[API supplier referrals POST] Insert failed:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ data: referral })
  } catch (err) {
    console.error('[API supplier referrals POST] Exception:', err)
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
    const {
      id,
      status,
      preferred_supplier_id,
      expected_commission,
      actual_commission,
      commission_status,
      payout_date,
      latest_note
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Referral ID is required' }, { status: 400 })
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (status !== undefined) updatePayload.status = status
    if (preferred_supplier_id !== undefined) updatePayload.preferred_supplier_id = preferred_supplier_id
    if (expected_commission !== undefined) updatePayload.expected_commission = parseFloat(expected_commission)
    if (actual_commission !== undefined) updatePayload.actual_commission = parseFloat(actual_commission)
    if (commission_status !== undefined) updatePayload.commission_status = commission_status
    if (payout_date !== undefined) updatePayload.payout_date = payout_date || null
    if (latest_note !== undefined) updatePayload.latest_note = latest_note

    const { data: referral, error: updateError } = await auth.adminClient
      .from('supplier_referrals')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ data: referral })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
