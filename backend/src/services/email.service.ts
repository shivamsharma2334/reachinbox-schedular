import nodemailer from 'nodemailer';
import { prisma } from '../config/database';
import { decrypt } from './crypto.service';
export async function sendScheduledEmail(emailId:string){
 const email=await prisma.scheduledEmail.findUnique({where:{id:emailId},include:{sender:true}}); if(!email) throw new Error('Email not found');
 if(email.status==='CANCELLED'||email.status==='SENT') return;
 const sender=email.sender; const transporter=nodemailer.createTransport({host:sender.smtpHost,port:sender.smtpPort,secure:sender.smtpSecure,auth:{user:decrypt(sender.smtpUsernameEncrypted),pass:decrypt(sender.smtpPasswordEncrypted)}});
 const info=await transporter.sendMail({from:`${sender.name} <${sender.email}>`,to:email.recipient,subject:email.subject,text:email.body});
 return {messageId:info.messageId};
}
