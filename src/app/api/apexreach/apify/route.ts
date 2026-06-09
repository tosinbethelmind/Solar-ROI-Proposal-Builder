import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';
import { createClient } from '@/lib/supabase/server';
import { writeScraperLog } from '../logs/helper';
import * as fs from 'fs';
import * as path from 'path';

const configFilePath = path.join(process.cwd(), 'src', 'utils', 'scraperSettings.json');

function getApifyConfig() {
  try {
    if (fs.existsSync(configFilePath)) {
      const fileContent = fs.readFileSync(configFilePath, 'utf8');
      const parsed = JSON.parse(fileContent);
      return {
        token: parsed.apifyToken || '',
        datasetId: parsed.apifyDatasetId || ''
      };
    }
  } catch {}
  return { token: '', datasetId: '' };
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }

  try {
    const { token, datasetId } = getApifyConfig();
    const apifyToken = token || process.env.APIFY_TOKEN;
    const apifyDatasetId = datasetId || process.env.APIFY_DATASET_ID;

    if (!apifyToken || !apifyDatasetId) {
      return NextResponse.json({ error: 'Apify Token and Dataset ID are not configured.' }, { status: 400 });
    }

    writeScraperLog(`Starting Apify backend ingestion: ${apifyDatasetId}`, 'info');

    const itemsUrl = `https://api.apify.com/v2/datasets/${apifyDatasetId}/items?token=${apifyToken}&clean=true`;
    const itemsResp = await fetch(itemsUrl);
    
    if (!itemsResp.ok) {
      throw new Error(`Apify Dataset fetch failed with status ${itemsResp.status}`);
    }

    const items = await itemsResp.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ added: 0, message: 'Dataset was empty.' });
    }

    const supabase = await createClient();
    let added = 0;

    for (const item of items) {
      const name = item.fullName || item.name || item.title || item.username || item.companyName || item.bizName || item.ownerName || 'Unknown Contact';
      
      let phone = item.phone || item.phoneNumber || item.telephone || item.mobile || item.contactPhone || '';
      if (!phone && Array.isArray(item.phoneNumbers) && item.phoneNumbers.length > 0) {
        phone = item.phoneNumbers[0];
      } else if (!phone && Array.isArray(item.phones) && item.phones.length > 0) {
        phone = item.phones[0];
      }
      
      let email = item.email || item.emailAddress || item.contactEmail || '';
      if (!email && Array.isArray(item.emails) && item.emails.length > 0) {
        email = item.emails[0];
      }
      
      const location = item.location || item.city || item.address || item.country || 'Nigeria';

      // Check duplicate
      const { data: existing } = await supabase
        .from('homeowner_leads')
        .select('id')
        .eq('phone', phone || '08000000000')
        .maybeSingle();

      if (existing) continue;

      const { error: insertErr } = await supabase
        .from('homeowner_leads')
        .insert({
          name: name,
          phone: phone || '08000000000',
          email: email || null,
          location: location,
          running_load_w: 3000,
          kva_recommended: '5 kVA',
          monthly_fuel_spend: 180000,
          monthly_savings_ngn: 150000
        });

      if (!insertErr) added++;
    }

    writeScraperLog(`Finished Apify backend ingestion. Imported ${added} leads.`, 'success');
    return NextResponse.json({ added });
  } catch (err: any) {
    writeScraperLog(`Apify backend ingestion error: ${err.message}`, 'error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
