import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';
import { createClient } from '@/lib/supabase/server';
import * as fs from 'fs';
import * as path from 'path';

const logsFilePath = path.join(process.cwd(), 'src', 'utils', 'scraperLogs.json');

async function readScraperLogs() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('scraper_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      return data.map((log: any) => ({
        id: log.id,
        timestamp: log.created_at,
        message: log.message,
        type: log.type
      }));
    }
  } catch (err) {
    console.warn('Database logs query failed, trying disk:', err);
  }

  try {
    if (fs.existsSync(logsFilePath)) {
      const fileContent = fs.readFileSync(logsFilePath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (err) {
    console.error('Failed to read logs from disk:', err);
  }
  return [];
}

export async function GET() {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }
  const logs = await readScraperLogs();
  return NextResponse.json(logs);
}
