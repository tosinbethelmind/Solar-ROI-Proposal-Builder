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

    const supabase = await createClient();

    // Insert job into the scrape_jobs queue
    const { data: job, error: jobErr } = await supabase
      .from('scrape_jobs')
      .insert({
        type: 'apify',
        status: 'queued',
        payload: { token: apifyToken, datasetId: apifyDatasetId }
      })
      .select('id')
      .single();

    if (jobErr || !job) {
      throw new Error(`Failed to queue job: ${jobErr?.message || 'Unknown database error'}`);
    }

    await writeScraperLog(`Queued Apify backend ingestion: ${apifyDatasetId} as Job ID: ${job.id}`, 'info');

    // Return 202 Accepted status for background tasks
    return NextResponse.json(
      { jobId: job.id, message: 'Apify dataset ingestion job successfully queued in background.' },
      { status: 202 }
    );
  } catch (err: any) {
    await writeScraperLog(`Apify backend queue error: ${err.message}`, 'error');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
