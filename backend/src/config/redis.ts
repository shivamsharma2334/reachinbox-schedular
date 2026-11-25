import IORedis from 'ioredis';
const url=process.env.REDIS_URL;
if(!url) throw new Error('REDIS_URL is missing');
const parsed=new URL(url);
export function createRedisConnection(){ return new IORedis(url,{maxRetriesPerRequest:null,enableReadyCheck:true,connectTimeout:10000,tls:parsed.protocol==='rediss:'?{servername:parsed.hostname}:undefined,retryStrategy:(n)=>Math.min(n*500,5000)}); }
