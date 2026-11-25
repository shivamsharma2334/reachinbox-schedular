import { WebClient } from '@slack/web-api';
import { prisma } from '../config/database';
import { decrypt } from './crypto.service';
export async function notifySlack(userId:string,text:string){ const row=await prisma.slackIntegration.findUnique({where:{userId}}); if(!row) return; const client=new WebClient(decrypt(row.botTokenEncrypted)); await client.chat.postMessage({channel:row.teamId,text}); }
