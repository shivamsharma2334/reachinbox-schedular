import {Client} from '@elastic/elasticsearch';
import {env} from '../config/env';
export const elasticClient=env.ELASTICSEARCH_NODE?new Client({node:env.ELASTICSEARCH_NODE,auth:env.ELASTICSEARCH_USERNAME?{username:env.ELASTICSEARCH_USERNAME,password:env.ELASTICSEARCH_PASSWORD||''}:undefined}):null;
export async function indexEmail(doc:{id:string;userId:string;recipient:string;subject:string;body:string;status:string}){if(!elasticClient)return;await elasticClient.index({index:'reachinbox-emails',id:doc.id,document:doc,refresh:'wait_for'});}
export async function searchEmails(userId:string,q:string){if(!elasticClient)return [];const r=await elasticClient.search({index:'reachinbox-emails',query:{bool:{filter:[{term:{userId}}],must:[{multi_match:{query:q,fields:['recipient','subject','body']}}]}}});return r.hits.hits.map(h=>h._source);}
