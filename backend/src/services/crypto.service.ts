import crypto from 'node:crypto';
const algorithm='aes-256-gcm';
function key(){ const raw=process.env.ENCRYPTION_KEY; if(!raw) throw new Error('Set ENCRYPTION_KEY (64 hex characters)'); const b=Buffer.from(raw,'hex'); if(b.length!==32) throw new Error('ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters'); return b; }
export function encrypt(value:string){ const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv(algorithm,key(),iv); const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]); return [iv.toString('hex'),cipher.getAuthTag().toString('hex'),data.toString('hex')].join(':'); }
export function decrypt(value:string){ const [iv,tag,data]=value.split(':'); const decipher=crypto.createDecipheriv(algorithm,key(),Buffer.from(iv,'hex')); decipher.setAuthTag(Buffer.from(tag,'hex')); return Buffer.concat([decipher.update(Buffer.from(data,'hex')),decipher.final()]).toString('utf8'); }
