import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';
import { createClient } from '@/lib/supabase/server';
import * as fs from 'fs';
import * as path from 'path';

const configFilePath = path.join(process.cwd(), 'src', 'utils', 'scraperSettings.json');

const defaultConfig = {
  googlePlacesApiKey: '',
  apifyToken: '',
  apifyDatasetId: '',
  googleSpreadsheetId: ''
};

async function readScraperConfig() {
  // 1. Try Supabase Database first
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('scraper_settings')
      .select('config')
      .eq('id', 'default')
      .maybeSingle();

    if (data && data.config) {
      return data.config;
    }
  } catch (err) {
    console.warn('Database settings query failed, falling back to disk:', err);
  }

  // 2. Fallback to Local Disk
  try {
    if (fs.existsSync(configFilePath)) {
      const fileContent = fs.readFileSync(configFilePath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (err) {
    console.error('Failed to read platform settings from disk:', err);
  }

  return defaultConfig;
}

async function writeScraperConfig(config: any) {
  // 1. Try writing to Supabase Database
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('scraper_settings')
      .upsert({ id: 'default', config }, { onConflict: 'id' });

    if (!error) {
      return true;
    }
  } catch (err) {
    console.warn('Database settings write failed, trying disk:', err);
  }

  // 2. Try writing to disk
  try {
    const dir = path.dirname(configFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to write platform settings to disk:', err);
    return false;
  }
}

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }
  const config = await readScraperConfig();
  return NextResponse.json(config);
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }
  try {
    const body = await request.json();
    await writeScraperConfig(body);
    return NextResponse.json(body);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
