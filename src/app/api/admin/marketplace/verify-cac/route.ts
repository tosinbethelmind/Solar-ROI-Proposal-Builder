import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg || 'Unauthorized' }, { status: auth.errorStatus || 401 });
  }

  if (!auth.canModifyProfiles) {
    return NextResponse.json({ error: 'Permission denied: Operations or SuperAdmin role required to verify profiles.' }, { status: 403 });
  }

  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const { installerId, businessName, cacNumber, description } = body;
    let token = body.token || request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!installerId || !businessName) {
      return NextResponse.json({ error: 'Installer ID and Business Name are required.' }, { status: 400 });
    }

    const cacNum = cacNumber || 'RC-NONE';
    const hasCac = cacNum !== 'RC-NONE' && cacNum.trim().length > 3 && !cacNum.toLowerCase().includes('unverified');

    // Simulated offline/bypassed fallback
    if (auth.isBypassed && !token) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      let reportText = '';
      let verdict: 'APPROVED' | 'REJECTED' = 'REJECTED';

      if (hasCac) {
        verdict = 'APPROVED';
        reportText = `**CAC AI REGISTRY VERIFICATION SUMMARY (SIMULATED)**
- **Company Name**: ${businessName}
- **CAC Number**: ${cacNum}
- **Verdict**: APPROVED (Confidence: 94%)
- **Analysis**: The business name aligns with registered renewable energy structures in Nigeria. The registration number matches the format requirements for Corporate Affairs Commission (Private Limited Liability Company). We have automatically enabled the verified badge for this listing.`;
      } else {
        verdict = 'REJECTED';
        reportText = `**CAC AI REGISTRY VERIFICATION SUMMARY (SIMULATED)**
- **Company Name**: ${businessName}
- **CAC Number**: ${cacNum || 'Not Provided'}
- **Verdict**: REJECTED (Confidence: 98%)
- **Analysis**: No valid Corporate Affairs Commission (CAC) registration number was found on the profile or the number format is incorrect. Solar contractors in Nigeria must specify a valid RC number to unlock the verified marketplace badge.`;
      }

      return NextResponse.json({
        success: true,
        verdict,
        report: reportText
      });
    }

    if (!token) {
      return NextResponse.json({ error: 'Google authorization token is required.' }, { status: 400 });
    }

    const promptText = `You are a legal registry analyst for the Corporate Affairs Commission (CAC) of Nigeria.
Analyze this solar installer's registration credentials:
- Business Name: ${businessName}
- CAC Registration Number: ${cacNum}
- Description: ${description || ''}

Determine if this registration details look valid. Under Nigerian registry rules, commercial companies must be registered with a Private Limited Liability company registration number starting with "RC" followed by 5 to 7 digits (e.g. RC-1485901).
Provide a structured assessment report. 
Your report must end with one of the following exact lines:
VERDICT: APPROVED
or
VERDICT: REJECTED

If the CAC number matches the format and the business name aligns, select APPROVED. If it's missing, is dummy like '12345', or is invalid, select REJECTED.`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API call failed with status ${response.status}`);
    }

    const json = await response.json();
    const reportText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const isApproved = reportText.toUpperCase().includes('VERDICT: APPROVED');
    const verdict = isApproved ? 'APPROVED' : 'REJECTED';

    // Log success in database if not bypassed
    if (!auth.isBypassed) {
      await auth.adminClient.from('operations_audit_log').insert({
        action_type: 'cac_verify',
        status: isApproved ? 'success' : 'failed',
        initiated_by: auth.user?.id || null,
        payload: { installerId, businessName, cacNum, mode: 'live' },
        response_details: reportText.trim(),
        duration_ms: Date.now() - startTime
      });
    }

    return NextResponse.json({
      success: true,
      verdict,
      report: reportText.trim()
    });

  } catch (error: any) {
    const errorDetails = error.message || 'Unknown AI verification error';

    // Log failure in database if not bypassed
    if (!auth.isBypassed) {
      try {
        await auth.adminClient.from('operations_audit_log').insert({
          action_type: 'cac_verify',
          status: 'failed',
          initiated_by: auth.user?.id || null,
          payload: { error: errorDetails, mode: 'live' },
          response_details: `Verification system failed: ${errorDetails}`,
          duration_ms: Date.now() - startTime
        });
      } catch (logErr) {
        console.error('Failed to log CAC verification failure to audit table:', logErr);
      }
    }

    return NextResponse.json({ error: `Verification failed: ${errorDetails}` }, { status: 500 });
  }
}
