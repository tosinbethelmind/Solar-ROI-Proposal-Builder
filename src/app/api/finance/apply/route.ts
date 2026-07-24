import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      proposalId,
      monthlyIncome,
      employmentStatus,
      preferredLender,
      termMonths,
      downPayment,
      financedAmount,
    } = body;

    if (!proposalId || !monthlyIncome || !financedAmount || !termMonths) {
      return NextResponse.json({ error: 'Missing required financing parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch the proposal
    const { data: proposal, error: fetchErr } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchErr || !proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Financing calculation details (Standard 28% APR for Nigerian consumer loan)
    const apr = 0.28;
    const monthlyRate = apr / 12;
    const monthlyRepayment = financedAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    // Debt-To-Income (DTI) check
    const dti = monthlyRepayment / monthlyIncome;
    let status = 'Approved';
    let conditions = '';

    if (dti > 0.55) {
      status = 'Pending_Review';
      conditions = 'Lender review required due to high monthly repayment compared to income.';
    } else if (dti > 0.40) {
      status = 'Approved_With_Conditions';
      conditions = 'Lender recommends increasing your down-payment by 10% to lower monthly commitment.';
    }

    const preApprovalLetterUrl = `https://solarquotepro-finance-docs.s3.amazonaws.com/pre_approvals/letter_${proposalId.substring(0, 8)}.pdf`;

    // Update proposal database record
    const currentCalcs = proposal.calculations_snapshot || {};
    const updatedCalcs = {
      ...currentCalcs,
      financeApplication: {
        status,
        conditions,
        lender: preferredLender || 'Sterling Bank (L.A.S.E.R.)',
        monthlyIncome,
        employmentStatus,
        dti: Math.round(dti * 100),
        preApprovalLetterUrl,
        terms: {
          apr: 28,
          termMonths,
          downPayment,
          financedAmount,
          monthlyRepayment: Math.round(monthlyRepayment),
          totalPayable: Math.round(monthlyRepayment * termMonths + downPayment)
        },
        appliedAt: new Date().toISOString()
      }
    };

    const updates: Record<string, any> = {
      calculations_snapshot: updatedCalcs,
    };

    // If approved, automatically set tracking_status to Approved
    if (status === 'Approved' || status === 'Approved_With_Conditions') {
      updates.tracking_status = 'Approved';
      updates.accepted_at = proposal.accepted_at || new Date().toISOString();
    }

    const { data: updatedProposal, error: updateErr } = await supabase
      .from('proposals')
      .update(updates)
      .eq('id', proposalId)
      .select('*')
      .single();

    if (updateErr) {
      console.error('[Finance Apply API] Update DB error:', updateErr);
      return NextResponse.json({ error: 'Failed to save finance application state' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status,
      conditions,
      lender: preferredLender,
      terms: {
        apr: 28,
        termMonths,
        downPayment,
        financedAmount,
        monthlyRepayment: Math.round(monthlyRepayment),
        totalPayable: Math.round(monthlyRepayment * termMonths + downPayment)
      },
      preApprovalLetterUrl,
      proposal: updatedProposal
    });
  } catch (err: any) {
    console.error('[Finance Apply API] Exception:', err);
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
