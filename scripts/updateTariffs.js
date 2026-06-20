// scripts/updateTariffs.js
// This script downloads Nigerian utility tariff PDFs/CSVs, parses them, and upserts into Supabase.

import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse'; // npm i pdf-parse
import csvParser from 'csv-parser'; // npm i csv-parser
import { createAdminClient, upsertTariffData } from '../src/utils/supabaseAdmin';

// Define utility URLs (example placeholders)
const TARIFF_SOURCES = [
  {
    name: 'Ikeja Electricity Distribution Company',
    url: 'https://example.com/ikeja-tariff.pdf',
    type: 'pdf'
  },
  {
    name: 'Kano Electricity Distribution Company',
    url: 'https://example.com/kano-tariff.csv',
    type: 'csv'
  }
];

// Helper to download a file
async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`);
  const fileStream = fs.createWriteStream(dest);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
  return dest;
}

// Parse PDF and extract rate rows (simplified)
async function parsePdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l);
  const rates = [];
  for (const line of lines) {
    const match = line.match(/(\d+\.\d+)\s+NGN\/kWh/);
    if (match) {
      rates.push({ rate: parseFloat(match[1]) });
    }
  }
  return rates;
}

// Parse CSV file
function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Main function
export async function updateTariffs() {
  const supabase = createAdminClient();
  for (const source of TARIFF_SOURCES) {
    try {
      const fileName = path.basename(source.url);
      const destPath = path.join('tmp', fileName);
      await downloadFile(source.url, destPath);
      let parsed;
      if (source.type === 'pdf') {
        parsed = await parsePdf(destPath);
      } else if (source.type === 'csv') {
        parsed = await parseCsv(destPath);
      }
      const upsertData = parsed.map(r => ({
        utility_name: source.name,
        rate_ngn_per_kwh: r.rate || r['Rate NGN/kWh'] || null,
        source_file: fileName,
        retrieved_at: new Date().toISOString()
      }));
      await upsertTariffData('tariffs', upsertData);
      console.log(`Upserted ${upsertData.length} records for ${source.name}`);
    } catch (e) {
      console.error('Error processing', source.name, e);
    }
  }
}

// Run when executed directly
if (require.main === module) {
  updateTariffs()
    .then(() => console.log('Tariff update completed'))
    .catch(err => console.error('Fatal error:', err));
}
