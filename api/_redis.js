// Lightweight Upstash Redis helper with lazy ESM import and caching
let redisClientPromise = null;

async function getRedis() {
  if (redisClientPromise) return redisClientPromise;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // credentials missing => fallback

  redisClientPromise = (async () => {
    const { Redis } = await import('@upstash/redis');
    return new Redis({ url, token });
  })();

  return redisClientPromise;
}

module.exports = { getRedis };
