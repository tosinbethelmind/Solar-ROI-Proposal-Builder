export async function fetchUSDNGNRate(): Promise<number> {
  const CACHE_KEY = 'solarpro_last_fx_rate';
  const TIME_KEY = 'solarpro_fx_rate_timestamp';
  const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours
  const FALLBACK_RATE = 1600;

  try {
    if (typeof window !== 'undefined') {
      const lastFetch = localStorage.getItem(TIME_KEY);
      const cachedRate = localStorage.getItem(CACHE_KEY);

      if (lastFetch && cachedRate) {
        if (Date.now() - parseInt(lastFetch, 10) < CACHE_DURATION) {
          return parseFloat(cachedRate);
        }
      }
    }

    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    if (data && data.rates && data.rates.NGN) {
      const rate = data.rates.NGN;
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, rate.toString());
        localStorage.setItem(TIME_KEY, Date.now().toString());
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
  return `₦${rate.toLocaleString(undefined, { maximumFractionDigits: 0 })}/$1`;
}
