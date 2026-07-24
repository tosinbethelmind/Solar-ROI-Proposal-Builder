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

  try {
    const body = await request.json().catch(() => ({}));
    const { receiptText, fileData, mimeType, installers } = body;
    let token = body.token || request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!receiptText && !fileData) {
      return NextResponse.json({ error: 'Please provide either receipt text transcript or file upload data.' }, { status: 400 });
    }

    const parseReceiptDataRegex = (text: string) => {
      const amountMatch = text.match(/(?:Amount|Total|NGN|N)\s*:?\s*(?:NGN\s*|₦\s*)?([0-9,]+(?:\.[0-9]{2})?)/i);
      const parsedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
      
      let depositor = 'Unknown';
      const senderMatch = text.match(/(?:Sender|From|Account Name)\s*:?\s*([A-Za-z0-9\s]+)/i);
      if (senderMatch) {
        depositor = senderMatch[1].trim();
      }

      let reference = 'N/A';
      const refMatch = text.match(/(?:Reference|Ref|Code|Session ID)\s*:?\s*([A-Za-z0-9/_-]+)/i);
      if (refMatch) {
        reference = refMatch[1].trim();
      }

      const suggestedTier = parsedAmount > 50000 ? 'verified_partner_plus' : 'verified_partner';

      return { depositorName: depositor, amount: parsedAmount, reference, suggestedTier };
    };

    let result: any = null;

    // Simulated / Bypassed Offline Mode
    if (auth.isBypassed && !token) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      if (receiptText) {
        result = parseReceiptDataRegex(receiptText);
      } else {
        result = {
          depositorName: 'Lekki Clean Energy Ltd',
          amount: 99000,
          reference: 'TXN/2026/894028591',
          suggestedTier: 'verified_partner_plus'
        };
      }
    } else {
      if (!token) {
        return NextResponse.json({ error: 'Google authorization token is required.' }, { status: 400 });
      }

      // Live Google Gemini Call
      const promptText = `Analyze this bank transfer transaction receipt. Extract the following details as structured JSON:
- depositorName (The company or sender name)
- amount (Numeric transaction amount in NGN)
- reference (The transaction reference code or session ID)
- suggestedTier (Either "verified_partner" if amount is around 45000, or "verified_partner_plus" if around 99000)

Return ONLY a valid JSON object matching this structure:
{
  "depositorName": "extracted name",
  "amount": 99000,
  "reference": "extracted reference code",
  "suggestedTier": "verified_partner_plus"
}`;

      let parts: any[] = [{ text: promptText }];

      if (fileData && mimeType) {
        parts.push({
          inlineData: {
            mimeType,
            data: fileData // Base64 string
          }
        });
      } else if (receiptText) {
        parts.push({ text: `Receipt text:\n${receiptText}` });
      }

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        }
      );

      if (response.ok) {
        const json = await response.json();
        const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
        try {
          result = JSON.parse(responseText.trim());
        } catch (e) {
          console.error('Failed to parse Gemini JSON output, falling back to regex.', e);
        }
      }

      // Regex fallback if Gemini fails
      if (!result && receiptText) {
        result = parseReceiptDataRegex(receiptText);
      }
    }

    if (!result) {
      throw new Error('Could not analyze the transaction receipt.');
    }

    // Attempt to fuzzy match installer profile
    let matchedInstallerId: string | null = null;
    if (result.depositorName && installers && Array.isArray(installers)) {
      const query = result.depositorName.toLowerCase();
      const bestMatch = installers.find(
        (inst: any) =>
          inst.business_name.toLowerCase().includes(query) ||
          query.includes(inst.business_name.toLowerCase())
      );
      if (bestMatch) {
        matchedInstallerId = bestMatch.id;
      }
    }

    const finalResponse = {
      success: true,
      analysis: {
        depositorName: result.depositorName || 'Unknown',
        amount: result.amount || 0,
        reference: result.reference || 'N/A',
        suggestedTier: result.suggestedTier || 'verified_partner',
        matchedInstallerId
      }
    };

    // Log success in database if not bypassed
    if (!auth.isBypassed) {
      await auth.adminClient.from('operations_audit_log').insert({
        action_type: 'receipt_reconcile',
        status: 'success',
        initiated_by: auth.user?.id || null,
        payload: {
          depositorName: result.depositorName,
          amount: result.amount,
          reference: result.reference,
          mode: token ? 'live' : 'simulated'
        },
        response_details: JSON.stringify(finalResponse.analysis),
        duration_ms: Date.now() - startTime
      });
    }

    return NextResponse.json(finalResponse);

  } catch (error: any) {
    const errorDetails = error.message || 'Unknown payment reconciliation error';

    // Log failure in database if not bypassed
    if (!auth.isBypassed) {
      try {
        await auth.adminClient.from('operations_audit_log').insert({
          action_type: 'receipt_reconcile',
          status: 'failed',
          initiated_by: auth.user?.id || null,
          payload: { error: errorDetails },
          response_details: `Reconciliation task failed: ${errorDetails}`,
          duration_ms: Date.now() - startTime
        });
      } catch (logErr) {
        console.error('Failed to log payment reconciliation failure to audit table:', logErr);
      }
    }

    return NextResponse.json({ error: `Analysis failed: ${errorDetails}` }, { status: 500 });
  }
}
