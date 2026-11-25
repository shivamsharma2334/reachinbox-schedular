const BASE=import.meta.env.VITE_API_URL||'http://localhost:5000/api';
export function getToken(){return localStorage.getItem('reachinbox_token')||'';}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{const response=await fetch(`${BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(getToken()?{Authorization:`Bearer ${getToken()}`}:{ } ),...options.headers}});const data=await response.json();if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);return data as T;}
export function googleLogin(){window.location.href=`${BASE}/auth/google`;}
