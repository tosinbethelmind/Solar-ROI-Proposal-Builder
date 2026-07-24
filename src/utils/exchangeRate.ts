export async function fetchUSDNGNRate(): Promise<number> {
  const CACHE_KEY = 'solarquotepro_last_fx_rate';
  const TIME_KEY = 'solarquotepro_fx_rate_timestamp';
  const SOURCE_KEY = 'solarquotepro_fx_source';
  const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
  const FALLBACK_RATE = 1600;

  try {
    // 1. Try to fetch from administrative custom override API endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const response = await fetch('/api/admin/fx-rates', { 
        next: { revalidate: 60 },
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const result = await response.json();
        if (result && result.data && result.data.isOverrideActive && result.data.customRate) {
          const rate = Math.round(result.data.customRate * 100) / 100;
          if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_KEY, rate.toString());
            localStorage.setItem(TIME_KEY, Date.now().toString());
            localStorage.setItem(SOURCE_KEY, 'Admin Override');
          }
          return rate;
        }
      }
    } catch (e) {
      console.log('Admin FX override not reachable, checking local cache or public API.', e);
    }

    // 2. If override is not active/available, check local cache
    if (typeof window !== 'undefined') {
      const lastFetch = localStorage.getItem(TIME_KEY);
      const cachedRate = localStorage.getItem(CACHE_KEY);

      if (lastFetch && cachedRate) {
        if (Date.now() - parseInt(lastFetch, 10) < CACHE_DURATION) {
          return parseFloat(cachedRate);
        }
      }
    }

    // 3. Fetch from public API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const response = await fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    if (data && data.rates && data.rates.NGN) {
      const rate = Math.round(data.rates.NGN * 100) / 100;
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, rate.toString());
        localStorage.setItem(TIME_KEY, Date.now().toString());
        localStorage.setItem(SOURCE_KEY, 'Live Interbank Rate • open.er-api.com');
      }
      return rate;
    }
    
    throw new Error('Invalid data format');
  } catch (error) {
    console.warn('Failed to fetch live FX rate, using fallback.', error);
    if (typeof window !== 'undefined') {
      const cachedRate = localStorage.getItem(CACHE_KEY);
      return cachedRate ? parseFloat(cachedRate) : FALLBACK_RATE;
    }
    return FALLBACK_RATE;
  }
}

export function formatFXDisplay(rate: number): string {
  return `₦${rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/$1`;
}
