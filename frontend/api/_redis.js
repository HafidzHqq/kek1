// Redis helper with proper error handling
let redisClientPromise = null;

async function getRedis() {
  // TEMPORARY: Force disable Redis due to compatibility issues with Upstash xrange format
  // Chat will use file storage in /tmp (data lost on redeploy, but functional)
  console.log('[Redis] DISABLED - using file storage fallback');
  return null;
  
  /* ORIGINAL CODE - Uncomment when Redis issues are resolved
  if (redisClientPromise) return redisClientPromise;
  
  // Support Upstash REST API format (recommended)
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redisClientPromise = (async () => {
      try {
        const { Redis } = await import('@upstash/redis');
        return new Redis({ url, token });
      } catch (e) {
        console.error('Failed to connect Upstash Redis:', e);
        return null;
      }
    })();
    return redisClientPromise;
  }
  
  // Redis Labs (redis://) not supported by @upstash/redis
  // Will use file storage fallback instead
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    console.log('REDIS_URL detected but @upstash/redis does not support redis:// format. Using file storage fallback.');
  }
  
  return null; // Use file storage fallback
  */
}

module.exports = { getRedis };
