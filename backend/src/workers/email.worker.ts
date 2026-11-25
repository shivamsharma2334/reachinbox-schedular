import { Worker } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { sendScheduledEmail } from '../services/email.service';
import { notifySlack } from '../services/slack.service';
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export const emailWorker=new Worker('scheduled-emails',async job=>{
 const {emailId}=job.data as {emailId:string};
 const email=await prisma.scheduledEmail.findUnique({where:{id:emailId},include:{sender:true}}); if(!email||['CANCELLED','SENT'].includes(email.status)) return;
 const now=new Date(); const hourAgo=new Date(now.getTime()-60*60*1000);
 const sent=await prisma.scheduledEmail.count({where:{senderId:email.senderId,status:'SENT',sentAt:{gte:hourAgo}}});
 const limit=Math.min(email.sender.hourlyLimit,env.MAX_EMAILS_PER_HOUR_PER_SENDER);
 if(sent>=limit){ const next=new Date(now.getTime()+60*60*1000); await prisma.scheduledEmail.update({where:{id:emailId},data:{status:'QUEUED'}}); await job.moveToDelayed(next.getTime(),job.token); throw new Error('Sender hourly limit reached; job delayed'); }
 await sleep(Math.max(email.sender.minDelayMs,env.MIN_EMAIL_DELAY_MS));
 const locked=await prisma.scheduledEmail.updateMany({where:{id:emailId,status:{in:['SCHEDULED','QUEUED','FAILED']}},data:{status:'PROCESSING',attemptCount:{increment:1}}}); if(!locked.count) return;
 const attemptNumber=email.attemptCount+1; const attempt=await prisma.emailDeliveryAttempt.create({data:{emailId,attemptNumber,status:'STARTED'}});
 try{ const result=await sendScheduledEmail(emailId); await prisma.$transaction([prisma.emailDeliveryAttempt.update({where:{id:attempt.id},data:{status:'SUCCEEDED',finishedAt:new Date(),providerMessageId:result?.messageId}}),prisma.scheduledEmail.update({where:{id:emailId},data:{status:'SENT',sentAt:new Date(),providerMessageId:result?.messageId,lastError:null}})]); await notifySlack(email.userId,`Email sent to ${email.recipient}: ${email.subject}`).catch(()=>undefined); }
 catch(error){ const message=error instanceof Error?error.message:'Unknown delivery error'; await prisma.$transaction([prisma.emailDeliveryAttempt.update({where:{id:attempt.id},data:{status:'FAILED',finishedAt:new Date(),error:message}}),prisma.scheduledEmail.update({where:{id:emailId},data:{status:'FAILED',lastError:message}})]); throw error; }
},{connection:createRedisConnection(),concurrency:env.WORKER_CONCURRENCY});
emailWorker.on('failed',(job,err)=>console.error('Email job failed',job?.id,err.message));
