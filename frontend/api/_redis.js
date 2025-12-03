// Redis helper supporting both Redis Labs (redis://) and Upstash REST API
let redisClientPromise = null;

async function getRedis() {
  if (redisClientPromise) return redisClientPromise;
  
  // Support Redis Labs format (redis://)
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl && redisUrl.startsWith('redis://')) {
    redisClientPromise = (async () => {
      const { Redis } = await import('@upstash/redis');
      return Redis.fromEnv(); // Will use REDIS_URL automatically
    })();
    return redisClientPromise;
  }
  
  // Support Upstash REST API format
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redisClientPromise = (async () => {
      const { Redis } = await import('@upstash/redis');
      return new Redis({ url, token });
    })();
    return redisClientPromise;
  }
  
  return null; // No credentials => fallback to file storage
}

module.exports = { getRedis };
