import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';
export const emailQueue=new Queue('scheduled-emails',{connection:createRedisConnection(),defaultJobOptions:{attempts:3,backoff:{type:'exponential',delay:5000},removeOnComplete:1000,removeOnFail:5000}});
export async function enqueueEmail(emailId:string,runAt:Date){ const delay=Math.max(0,runAt.getTime()-Date.now()); return emailQueue.add('deliver',{emailId},{jobId:emailId,delay}); }
