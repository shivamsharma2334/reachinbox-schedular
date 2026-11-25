import 'dotenv/config';import {app} from './app';import {env} from './config/env';import {prisma} from './config/database';import {createRedisConnection} from './config/redis';import './workers/email.worker';
async function main(){await prisma.$connect();const redis=createRedisConnection();await redis.ping();await redis.quit();app.listen(env.PORT,()=>console.log(`ReachInbox API listening on ${env.PORT}`));}
main().catch(async e=>{console.error('Startup failed',e);await prisma.$disconnect();process.exit(1);});
