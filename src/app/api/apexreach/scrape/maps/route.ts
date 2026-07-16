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

    const supabase = await createClient();

    // Insert job into the scrape_jobs queue
    const { data: job, error: jobErr } = await supabase
      .from('scrape_jobs')
      .insert({
        type: 'google_maps',
        status: 'queued',
        payload: { query, limit, onlyWithPhone, verifyWebsite }
      })
      .select('id')
      .single();

    if (jobErr || !job) {
      throw new Error(`Failed to queue job: ${jobErr?.message || 'Unknown database error'}`);
    }

    await writeScraperLog(`Queued Google Places API Scrape: "${query}" (limit: ${limit}) as Job ID: ${job.id}`, 'info');

    // Return 202 Accepted status for background tasks
    return NextResponse.json(
      { jobId: job.id, message: 'Google Places scraper job successfully queued in background.' },
      { status: 202 }
    );
  } catch (err: any) {
    await writeScraperLog(`Google Places API queue error: ${err.message}`, 'error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
