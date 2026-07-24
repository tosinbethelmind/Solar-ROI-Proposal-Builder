import { NextResponse } from 'next/server';

interface AutosendRequest {
  provider: 'twilio' | 'custom';
  to: string;
  body: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioSender?: string;
}

export async function POST(request: Request) {
  try {
    const data: AutosendRequest = await request.json();

    if (!data.to || !data.body) {
      return NextResponse.json({ success: false, error: 'Recipient phone number and body copy are required.' }, { status: 400 });
    }

    // Clean recipient phone number (must start with + and country code, e.g. +234)
    let cleanedTo = data.to.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (!cleanedTo.startsWith('+')) {
      if (cleanedTo.startsWith('0')) {
        cleanedTo = '+234' + cleanedTo.slice(1);
      } else if (cleanedTo.startsWith('234')) {
        cleanedTo = '+' + cleanedTo;
      } else {
        cleanedTo = '+234' + cleanedTo; // Fallback to Nigeria
      }
    }

    if (data.provider === 'twilio') {
      const { twilioSid, twilioToken, twilioSender } = data;
      if (!twilioSid || !twilioToken || !twilioSender) {
        return NextResponse.json({ success: false, error: 'Missing Twilio configurations.' }, { status: 400 });
      }

      // Format sender phone
      let cleanedSender = twilioSender.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
      if (!cleanedSender.startsWith('+')) {
        cleanedSender = '+' + cleanedSender;
      }

      const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      
      const params = new URLSearchParams();
      params.append('From', `whatsapp:${cleanedSender}`);
      params.append('To', `whatsapp:${cleanedTo}`);
      params.append('Body', data.body);

      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        }
      );

      const respJson = await resp.json();
      if (!resp.ok) {
        return NextResponse.json({
          success: false,
          error: respJson.message || `Twilio returned status ${resp.status}`
        }, { status: resp.status });
      }

      return NextResponse.json({ success: true, sid: respJson.sid });
    }

    return NextResponse.json({ success: false, error: 'Unsupported provider.' }, { status: 400 });
  } catch (err: any) {
    console.error('[WHATSAPP AUTOSEND ERROR]', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
