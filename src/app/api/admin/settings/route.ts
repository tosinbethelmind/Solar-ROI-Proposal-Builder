import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const settingsFilePath = path.join(process.cwd(), 'src', 'utils', 'platformSettings.json');

function readPlatformSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const fileContent = fs.readFileSync(settingsFilePath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (err) {
    console.error('Failed to read platformSettings.json:', err);
  }
  
  return {
    dieselPrice: 1400,
    petrolPrice: 1100,
    gridTariff: 209.5,
    vatTaxRate: 7.5,
    lastUpdatedBy: 'admin@solarpro.com',
    lastUpdatedAt: new Date().toISOString()
  };
}

function writePlatformSettings(settings: any) {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to write platformSettings.json:', err);
    return false;
  }
}

export async function GET() {
  const settings = readPlatformSettings();
  return NextResponse.json({ data: settings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dieselPrice, petrolPrice, gridTariff, vatTaxRate, updatedBy } = body;

    const settings = readPlatformSettings();

    settings.dieselPrice = dieselPrice !== undefined ? parseFloat(dieselPrice) : settings.dieselPrice;
    settings.petrolPrice = petrolPrice !== undefined ? parseFloat(petrolPrice) : settings.petrolPrice;
    settings.gridTariff = gridTariff !== undefined ? parseFloat(gridTariff) : settings.gridTariff;
    settings.vatTaxRate = vatTaxRate !== undefined ? parseFloat(vatTaxRate) : settings.vatTaxRate;
    settings.lastUpdatedBy = updatedBy || 'admin@solarpro.com';
    settings.lastUpdatedAt = new Date().toISOString();

    const success = writePlatformSettings(settings);
    if (!success) {
      return NextResponse.json({ error: 'Failed to write settings updates to disk.' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Global platform settings updated successfully.',
      data: settings
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Settings modification failed.' }, { status: 500 });
  }
}
