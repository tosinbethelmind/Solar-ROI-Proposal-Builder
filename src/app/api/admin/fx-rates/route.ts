import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

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
    lastUpdatedBy: 'admin@solarpro.com',
    lastUpdatedAt: new Date().toISOString(),
    history: [
      { rate: 1600, updatedBy: 'admin@solarpro.com', updatedAt: new Date(Date.now() - 86400000).toISOString(), note: 'Aligned with black market Parallel rate' },
      { rate: 1580, updatedBy: 'admin@solarpro.com', updatedAt: new Date(Date.now() - 604800000).toISOString(), note: 'Official exchange adjustment' }
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
  try {
    const body = await request.json();
    const { rate, isOverrideActive, updatedBy, note } = body;

    if (!rate || rate <= 0) {
      return NextResponse.json({ error: 'Valid custom exchange rate is required.' }, { status: 400 });
    }

    const settings = readFXSettings();
    
    // Create new history entry
    const newHistoryEntry = {
      rate: parseFloat(rate),
      updatedBy: updatedBy || 'admin@solarpro.com',
      updatedAt: new Date().toISOString(),
      note: note || 'Manual administrative override'
    };

    settings.customRate = parseFloat(rate);
    settings.isOverrideActive = isOverrideActive !== undefined ? isOverrideActive : true;
    settings.lastUpdatedBy = updatedBy || 'admin@solarpro.com';
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
