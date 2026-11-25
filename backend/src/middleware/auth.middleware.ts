import { Request,Response,NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
declare global { namespace Express { interface Request { userId?:string } } }
export function requireAuth(req:Request,res:Response,next:NextFunction){ const token=req.headers.authorization?.replace(/^Bearer\s+/i,''); if(!token) return res.status(401).json({error:'Missing bearer token'}); try{ const payload=jwt.verify(token,env.JWT_SECRET) as {sub:string}; req.userId=payload.sub; next(); }catch{return res.status(401).json({error:'Invalid or expired token'});} }
export function signToken(userId:string){ return jwt.sign({},env.JWT_SECRET,{subject:userId,expiresIn:'7d'}); }
