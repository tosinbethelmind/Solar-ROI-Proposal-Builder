import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/utils/adminAuth';
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
    lastUpdatedBy: 'admin@solarquotepro.com',
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
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }

  const settings = readPlatformSettings();
  return NextResponse.json({ data: settings });
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }

  const { user } = auth;

  try {
    const body = await request.json();
    const { dieselPrice, petrolPrice, gridTariff, vatTaxRate, updatedBy } = body;

    const settings = readPlatformSettings();

    // Enforce safety boundary checks to block extreme/erroneous values
    if (dieselPrice !== undefined) {
      const parsedDiesel = parseFloat(dieselPrice);
      if (isNaN(parsedDiesel) || parsedDiesel < 100 || parsedDiesel > 10000) {
        return NextResponse.json({
          error: 'Validation failed: Diesel price must be a valid number between ₦100 and ₦10,000.'
        }, { status: 400 });
      }
      settings.dieselPrice = parsedDiesel;
    }

    if (petrolPrice !== undefined) {
      const parsedPetrol = parseFloat(petrolPrice);
      if (isNaN(parsedPetrol) || parsedPetrol < 100 || parsedPetrol > 10000) {
        return NextResponse.json({
          error: 'Validation failed: Petrol price must be a valid number between ₦100 and ₦10,000.'
        }, { status: 400 });
      }
      settings.petrolPrice = parsedPetrol;
    }

    if (gridTariff !== undefined) {
      const parsedTariff = parseFloat(gridTariff);
      if (isNaN(parsedTariff) || parsedTariff < 10 || parsedTariff > 1000) {
        return NextResponse.json({
          error: 'Validation failed: Grid utility tariff must be a valid number between ₦10 and ₦1,000 per kWh.'
        }, { status: 400 });
      }
      settings.gridTariff = parsedTariff;
    }

    if (vatTaxRate !== undefined) {
      const parsedVat = parseFloat(vatTaxRate);
      if (isNaN(parsedVat) || parsedVat < 0 || parsedVat > 50) {
        return NextResponse.json({
          error: 'Validation failed: VAT tax rate must be a valid percentage between 0% and 50%.'
        }, { status: 400 });
      }
      settings.vatTaxRate = parsedVat;
    }

    settings.lastUpdatedBy = updatedBy || user?.email || 'admin@solarquotepro.com';
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
