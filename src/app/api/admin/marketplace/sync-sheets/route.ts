import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 });
  }

  if (!auth.canRunAutomation) {
    return NextResponse.json({ error: 'Permission denied: Read-only access.' }, { status: 403 });
  }

  const startTime = Date.now();
  let status: 'success' | 'failed' = 'success';
  let responseDetails = 'Synchronized successfully';
  let recordsCount = 0;

  try {
    const body = await request.json().catch(() => ({}));
    const { spreadsheetId, installers, subscriptions, serviceAreas } = body;
    
    let token = body.token || request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Spreadsheet ID is required.' }, { status: 400 });
    }

    if (!installers || !Array.isArray(installers)) {
      return NextResponse.json({ error: 'Installers list is required.' }, { status: 400 });
    }

    recordsCount = installers.length;

    // If bypassed or in development fallback without a token, perform simulated sync
    if (auth.isBypassed && !token) {
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Log to telemetry
      if (auth.adminClient && !auth.isBypassed) {
        await auth.adminClient.from('operations_audit_log').insert({
          action_type: 'sheets_sync',
          status: 'success',
          initiated_by: auth.user?.id || null,
          payload: { spreadsheetId, range: 'Installers!A1:K500', recordsCount, mode: 'simulated' },
          response_details: 'Simulated sync successful (bypassed)',
          duration_ms: Date.now() - startTime
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully synchronized B2B directory listings (Simulated Fallback).',
        syncedCount: recordsCount
      });
    }

    if (!token) {
      return NextResponse.json({ error: 'Google authorization token is required.' }, { status: 400 });
    }

    // Format headers and rows
    const headers = [
      'Installer ID',
      'Business Name',
      'CAC Number',
      'Verified Status',
      'Active Tier',
      'Average Rating',
      'Total Reviews',
      'Response Speed',
      'Brands Handled',
      'Coverage Areas',
      'Date Registered'
    ];

    const rows = installers.map((inst: any) => {
      const sub = (subscriptions || []).find((s: any) => s.installer_id === inst.id);
      const coverages = (serviceAreas || [])
        .filter((sa: any) => sa.installer_id === inst.id)
        .map((sa: any) => `${sa.city} (${sa.state})`)
        .join(', ');
      
      return [
        inst.id,
        inst.business_name,
        inst.cac_number || 'N/A',
        inst.is_verified ? 'Verified' : 'Unverified',
        sub?.tier?.replace(/_/g, ' ').toUpperCase() || 'BASIC',
        inst.rating_average?.toString() || '0',
        inst.rating_count?.toString() || '0',
        inst.response_speed || 'N/A',
        inst.brands_handled?.join(', ') || 'N/A',
        coverages || 'N/A',
        inst.created_at ? new Date(inst.created_at).toLocaleDateString() : 'N/A'
      ];
    });

    const values = [headers, ...rows];
    const range = `Installers!A1:K${values.length}`;

    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ values })
      }
    );

    if (!updateResponse.ok) {
      const errJson = await updateResponse.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Google Sheets API returned status ${updateResponse.status}`);
    }

    // Log success in database if not bypassed
    if (!auth.isBypassed) {
      await auth.adminClient.from('operations_audit_log').insert({
        action_type: 'sheets_sync',
        status: 'success',
        initiated_by: auth.user?.id || null,
        payload: { spreadsheetId, range, recordsCount, mode: 'live' },
        response_details: 'Synchronized successfully to Google Sheets API',
        duration_ms: Date.now() - startTime
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully synchronized B2B directory listings to Google Sheet!',
      syncedCount: recordsCount
    });

  } catch (error: any) {
    status = 'failed';
    responseDetails = error.message || 'Unknown sync error';
    
    // Log failure in database if not bypassed
    if (!auth.isBypassed) {
      try {
        await auth.adminClient.from('operations_audit_log').insert({
          action_type: 'sheets_sync',
          status: 'failed',
          initiated_by: auth.user?.id || null,
          payload: { mode: 'live', recordsCount },
          response_details: responseDetails,
          duration_ms: Date.now() - startTime
        });
      } catch (logErr) {
        console.error('Failed to log sync failure to audit table:', logErr);
      }
    }

    return NextResponse.json({ error: `Sync failed: ${responseDetails}` }, { status: 500 });
  }
}
