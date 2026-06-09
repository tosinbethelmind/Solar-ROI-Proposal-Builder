import { createClient } from '@/lib/supabase/server';
import * as fs from 'fs';
import * as path from 'path';

const logsFilePath = path.join(process.cwd(), 'src', 'utils', 'scraperLogs.json');

export async function writeScraperLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  
  // 1. Try writing to Supabase Database
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('scraper_logs')
      .insert({ message, type });

    if (!error) return;
  } catch (err) {
    console.warn('Database log write failed, trying disk:', err);
  }

  // 2. Try writing to disk
  try {
    let logs: any[] = [];
    if (fs.existsSync(logsFilePath)) {
      try {
        logs = JSON.parse(fs.readFileSync(logsFilePath, 'utf8'));
      } catch {}
    }
    logs.push({
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      message,
      type
    });
    if (logs.length > 50) logs.shift();
    const dir = path.dirname(logsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(logsFilePath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write logs to disk:', err);
  }
}
