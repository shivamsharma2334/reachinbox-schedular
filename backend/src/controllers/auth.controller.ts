import { Request,Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { signToken } from '../middleware/auth.middleware';
const client=new OAuth2Client(env.GOOGLE_CLIENT_ID,env.GOOGLE_CLIENT_SECRET,env.GOOGLE_REDIRECT_URI);
export function googleStart(_req:Request,res:Response){ if(!env.GOOGLE_CLIENT_ID) return res.status(503).json({error:'Google OAuth is not configured'}); res.redirect(client.generateAuthUrl({access_type:'offline',scope:['openid','email','profile'],prompt:'consent'})); }
export async function googleCallback(req:Request,res:Response){ try{ const code=String(req.query.code||''); const {tokens}=await client.getToken(code); if(!tokens.id_token) throw new Error('Google did not return an ID token'); const ticket=await client.verifyIdToken({idToken:tokens.id_token,audience:env.GOOGLE_CLIENT_ID}); const p=ticket.getPayload(); if(!p?.email) throw new Error('Google account has no email'); const user=await prisma.user.upsert({where:{email:p.email},update:{googleId:p.sub,name:p.name||p.email,avatarUrl:p.picture},create:{googleId:p.sub,email:p.email,name:p.name||p.email,avatarUrl:p.picture}}); const token=signToken(user.id); res.redirect(`${env.FRONTEND_URL}/?token=${encodeURIComponent(token)}`); }catch(e){res.status(400).json({error:e instanceof Error?e.message:'Google sign-in failed'});} }
export async function me(req:Request,res:Response){ const user=await prisma.user.findUnique({where:{id:req.userId},select:{id:true,name:true,email:true,avatarUrl:true}}); res.json({user}); }
