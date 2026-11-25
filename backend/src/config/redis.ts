import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL is missing');
}

const parsed = new URL(redisUrl);

export function createRedisConnection(): IORedis {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 10_000,
    tls:
      parsed.protocol === 'rediss:'
        ? { servername: parsed.hostname }
        : undefined,
  });
}
