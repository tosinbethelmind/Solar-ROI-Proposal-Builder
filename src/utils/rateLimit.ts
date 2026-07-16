const ipCache = new Map<string, { count: number; resetTime: number }>();

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Helper to run Redis command via zero-dependency REST API
async function runRedisCommand(command: string[]): Promise<any> {
  if (!redisUrl || !redisToken) return null;
  
  const resp = await fetch(redisUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!resp.ok) {
    throw new Error(`Upstash Redis REST failed: ${resp.statusText}`);
  }

  const data = await resp.json();
  return data.result;
}

/**
 * Hybrid rate limiter helper for serverless/Next.js routes.
 * Uses Upstash Redis REST API when available, falling back to local in-memory Map.
 * 
 * @param ip Client IP address
 * @param limit Max allowed requests within window
 * @param windowMs Window duration in milliseconds (default: 1 minute)
 * @returns Promise<boolean> true if the request is allowed, false if rate limit exceeded
 */
export async function rateLimit(ip: string, limit = 5, windowMs = 60000): Promise<boolean> {
  // If e2e bypass is active (e.g. during playwright tests), bypass rate limits
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  // 1. Try Upstash Redis if configured
  if (redisUrl && redisToken) {
    try {
      const key = `ratelimit:${ip}`;
      const current = await runRedisCommand(['INCR', key]);
      
      if (current === 1) {
        const seconds = Math.max(1, Math.floor(windowMs / 1000));
        await runRedisCommand(['EXPIRE', key, String(seconds)]);
      }
      
      return current <= limit;
    } catch (err) {
      console.warn('Upstash Redis rate limiter failed, falling back to in-memory:', err);
    }
  }

  // 2. Local In-Memory Fallback
  const now = Date.now();
  const record = ipCache.get(ip);

  // Periodic cleanup of expired entries in the cache to prevent memory bloat
  if (ipCache.size > 2000) {
    for (const [key, val] of ipCache.entries()) {
      if (now > val.resetTime) {
        ipCache.delete(key);
      }
    }
  }

  if (!record) {
    ipCache.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > record.resetTime) {
    ipCache.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}
