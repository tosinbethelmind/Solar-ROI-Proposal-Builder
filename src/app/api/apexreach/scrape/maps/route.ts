import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';
import { createClient } from '@/lib/supabase/server';
import { writeScraperLog } from '../../logs/helper';
import * as fs from 'fs';
import * as path from 'path';

const configFilePath = path.join(process.cwd(), 'src', 'utils', 'scraperSettings.json');

function getApiKey() {
  try {
    if (fs.existsSync(configFilePath)) {
      const fileContent = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(fileContent).googlePlacesApiKey || '';
    }
  } catch {}
  return '';
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }

  try {
    const { query, limit, onlyWithPhone, verifyWebsite } = await request.json();
    const apiKey = getApiKey() || process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key is not configured.' }, { status: 400 });
    }

    writeScraperLog(`Starting Google Places API Scrape: "${query}" (limit: ${limit})`, 'info');

    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const searchResp = await fetch(searchUrl);
    
    if (!searchResp.ok) {
      throw new Error(`Google Places Search API failed: ${searchResp.statusText}`);
    }

    const searchData = await searchResp.json();
    const places = (searchData.results || []).slice(0, limit || 10);
    
    const supabase = await createClient();
    let added = 0;
    let skipped = 0;

    for (const place of places) {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,formatted_address&key=${apiKey}`;
      const detailsResp = await fetch(detailsUrl);
      let phone = '';
      let website = '';
      let address = place.formatted_address || '';

      if (detailsResp.ok) {
        const detailsData = await detailsResp.json();
        const details = detailsData.result || {};
        phone = details.formatted_phone_number || '';
        website = details.website || '';
        if (details.formatted_address) {
          address = details.formatted_address;
        }
      }

      if (onlyWithPhone && !phone) {
        skipped++;
        continue;
      }

      if (verifyWebsite && !website) {
        skipped++;
        continue;
      }

      const { data: existing } = await supabase
        .from('homeowner_leads')
        .select('id')
        .eq('phone', phone || '08000000000')
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error: insertErr } = await supabase
        .from('homeowner_leads')
        .insert({
          name: place.name || 'Unknown Business',
          phone: phone || '08000000000',
          email: null,
          location: address || 'Nigeria',
          running_load_w: 5000,
          kva_recommended: '7.5 kVA',
          monthly_fuel_spend: 250000,
          monthly_savings_ngn: 200000
        });

      if (insertErr) {
        console.error('Error inserting lead:', insertErr);
        skipped++;
      } else {
        added++;
      }
    }

    writeScraperLog(`Finished Google Places API Scrape. Imported ${added} leads. Skipped ${skipped} items.`, 'success');
    return NextResponse.json({ added, skipped });
  } catch (err: any) {
    writeScraperLog(`Google Places API Scrape error: ${err.message}`, 'error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
