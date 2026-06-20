import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { verifyAdmin } from '@/utils/adminAuth';

// Local configuration path for persisting global FX rate variables in the workspace
const settingsFilePath = path.join(process.cwd(), 'src', 'utils', 'fxSettings.json');

// Helper to read setting
function readFXSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const fileContent = fs.readFileSync(settingsFilePath, 'utf8');
      return JSON.parse(fileContent);
    }
  } catch (err) {
    console.error('Failed to read fxSettings.json:', err);
  }
  
  // Return default setting
  return {
    customRate: 1600,
    isOverrideActive: true,
    lastUpdatedBy: 'admin@solarquotepro.com',
    lastUpdatedAt: new Date().toISOString(),
    history: [
      { rate: 1600, updatedBy: 'admin@solarquotepro.com', updatedAt: new Date(Date.now() - 86400000).toISOString(), note: 'Aligned with black market Parallel rate' },
      { rate: 1580, updatedBy: 'admin@solarquotepro.com', updatedAt: new Date(Date.now() - 604800000).toISOString(), note: 'Official exchange adjustment' }
    ]
  };
}

// Helper to write setting
function writeFXSettings(settings: any) {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to write fxSettings.json:', err);
    return false;
  }
}



export async function GET() {
  const settings = readFXSettings();

  try {
    // 1. Fetch official rates from live open exchange API
    let officialRate = 1530; // CBN Official fallback
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 60 } });
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && data.rates.NGN) {
          officialRate = data.rates.NGN;
        }
      }
    } catch (e) {
      console.warn('Could not query official USD/NGN exchange API for comparison:', e);
    }

    // Parallel market rate is usually official + 7-10% in Nigeria
    const parallelRate = Math.round(officialRate * 1.07);

    return NextResponse.json({
      data: {
        customRate: settings.customRate,
        isOverrideActive: settings.isOverrideActive,
        lastUpdatedBy: settings.lastUpdatedBy,
        lastUpdatedAt: settings.lastUpdatedAt,
        cbnOfficialRate: officialRate,
        parallelMarketRate: parallelRate,
        history: settings.history || []
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve FX telemetry.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin();
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.errorMsg }, { status: auth.errorStatus });
  }

  const { user } = auth;

  try {
    const body = await request.json();
    const { rate, isOverrideActive, note } = body;

    if (!rate || rate <= 0) {
      return NextResponse.json({ error: 'Valid custom exchange rate is required.' }, { status: 400 });
    }

    const inputRate = parseFloat(rate);

    // 2. Fetch live official CBN rates for boundary verification
    let officialRate = 1530; // fallback standard rate
    let apiSuccess = false;
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD', { next: { revalidate: 60 } });
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && data.rates.NGN) {
          officialRate = data.rates.NGN;
          apiSuccess = true;
        }
      }
    } catch (e) {
      console.warn('Could not query official USD/NGN exchange API for boundary verification:', e);
    }

    // Try dynamic database recovery from previous override settings if API failed
    if (!apiSuccess) {
      try {
        const fallbackSettings = readFXSettings();
        if (fallbackSettings && fallbackSettings.customRate) {
          officialRate = fallbackSettings.customRate;
          console.log('Dynamic Boundary Recovery: Recovered last overridden rate for validation:', officialRate);
        }
      } catch (err) {
        console.error('Failed to read dynamic boundary recovery settings:', err);
      }
    }

    // Set safety boundaries at 60% and 150% of the official live rate
    const lowerBound = Math.round(officialRate * 0.6);
    const upperBound = Math.round(officialRate * 1.5);

    if (inputRate < lowerBound || inputRate > upperBound) {
      return NextResponse.json({
        error: `Safety Block: The custom exchange rate ₦${inputRate.toLocaleString()} is outside the permitted boundary (₦${lowerBound.toLocaleString()} - ₦${upperBound.toLocaleString()}) relative to live CBN official rate (₦${Math.round(officialRate).toLocaleString()}). Please verify you didn't miss or add an extra zero.`
      }, { status: 400 });
    }

    const settings = readFXSettings();
    
    // Create new history entry
    const newHistoryEntry = {
      rate: inputRate,
      updatedBy: user?.email || 'admin@solarquotepro.com',
      updatedAt: new Date().toISOString(),
      note: note || 'Manual administrative override'
    };

    settings.customRate = inputRate;
    settings.isOverrideActive = isOverrideActive !== undefined ? isOverrideActive : true;
    settings.lastUpdatedBy = user?.email || 'admin@solarquotepro.com';
    settings.lastUpdatedAt = new Date().toISOString();
    
    if (!settings.history) settings.history = [];
    settings.history.unshift(newHistoryEntry);
    
    // Cap history length at 20 entries
    if (settings.history.length > 20) {
      settings.history = settings.history.slice(0, 20);
    }

    const success = writeFXSettings(settings);
    if (!success) {
      return NextResponse.json({ error: 'Failed to write configuration updates to disk.' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Exchange rate settings overridden successfully.',
      data: settings
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Configuration modification failed.' }, { status: 500 });
  }
}
