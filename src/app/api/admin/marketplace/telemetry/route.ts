import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';

const MOCK_TELEMETRY_LOGS = [
  {
    id: 'mock-log-1',
    action_type: 'sheets_sync',
    status: 'success',
    initiated_by: 'dev-admin-id',
    payload: { spreadsheetId: '1234567890abcdef', range: 'Installers!A1:K500', recordsCount: 15, mode: 'simulated' },
    response_details: 'Successfully synchronized B2B directory listings (Simulated Fallback).',
    duration_ms: 850,
    created_at: new Date(Date.now() - 5 * 60000).toISOString() // 5 mins ago
  },
  {
    id: 'mock-log-2',
    action_type: 'cac_verify',
    status: 'success',
    initiated_by: 'dev-admin-id',
    payload: { installerId: 'inst-1', businessName: 'Lekki Clean Energy', cacNum: 'RC-1485901', mode: 'simulated' },
    response_details: 'Verdict: APPROVED. The registration number matches the format requirements for Corporate Affairs Commission (Private Limited Liability Company).',
    duration_ms: 1200,
    created_at: new Date(Date.now() - 15 * 60000).toISOString() // 15 mins ago
  },
  {
    id: 'mock-log-3',
    action_type: 'receipt_reconcile',
    status: 'success',
    initiated_by: 'dev-admin-id',
    payload: { depositorName: 'Lekki Clean Energy Ltd', amount: 99000, reference: 'TXN/2026/894028591', mode: 'simulated' },
    response_details: JSON.stringify({ depositorName: 'Lekki Clean Energy Ltd', amount: 99000, reference: 'TXN/2026/894028591', suggestedTier: 'verified_partner_plus', matchedInstallerId: 'inst-1' }),
    duration_ms: 1500,
    created_at: new Date(Date.now() - 30 * 60000).toISOString() // 30 mins ago
  },
  {
    id: 'mock-log-4',
    action_type: 'cac_verify',
    status: 'failed',
    initiated_by: 'dev-admin-id',
    payload: { installerId: 'inst-2', businessName: 'Ikeja Solar Services', cacNum: 'RC-NONE', mode: 'simulated' },
    response_details: 'Verdict: REJECTED. No valid Corporate Affairs Commission (CAC) registration number was found on the profile.',
    duration_ms: 980,
    created_at: new Date(Date.now() - 60 * 60000).toISOString() // 1 hour ago
  }
];

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 });
  }

  // Simulated fallback log data if bypassed
  if (auth.isBypassed) {
    return NextResponse.json(MOCK_TELEMETRY_LOGS);
  }

  try {
    const { data, error } = await auth.adminClient
      .from('operations_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Failed to retrieve telemetry audit logs, falling back to mock logs:', error);
    return NextResponse.json(MOCK_TELEMETRY_LOGS);
  }
}
