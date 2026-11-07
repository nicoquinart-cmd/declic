// Read-only project checks. This never creates accounts, writes courses, or logs OAuth URLs/tokens.
import {selectFirebaseConfig} from '../src/account/public-config.js';
import {databaseProbeStatus} from '../src/account/database-status.js';
const config=selectFirebaseConfig({apiKey:process.env.VITE_FIREBASE_API_KEY,authDomain:process.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:process.env.VITE_FIREBASE_PROJECT_ID,appId:process.env.VITE_FIREBASE_APP_ID});
const origin='https://nicoquinart-cmd.github.io',site=origin+'/declic/';
const report=(name,ok,message)=>{console.log(`${ok?'OK':'À CONFIGURER'} : ${name} — ${message}`);if(!ok)console.log(`::warning::Firebase ${name} : ${message}`);};
async function request(url,options={}){
 const response=await fetch(url,{...options,headers:{Referer:site,Origin:origin,...options.headers},signal:AbortSignal.timeout(20000)});
 let data={};try{data=await response.json();}catch{}
 return {status:response.status,data};
}
if(!Object.values(config).every(value=>typeof value==='string'&&value.trim())){report('configuration',false,'variables GitHub incomplètes : supprimer les surcharges ou renseigner les quatre champs ensemble.');process.exit(0);}
try{
 const project=await request(`https://identitytoolkit.googleapis.com/v1/projects?key=${encodeURIComponent(config.apiKey)}`);
 if(project.status===200){
  const domains=project.data.authorizedDomains||[];
  report('domaine GitHub Pages',domains.includes('nicoquinart-cmd.github.io'),domains.includes('nicoquinart-cmd.github.io')?'adresse du site autorisée.':'ajouter nicoquinart-cmd.github.io dans Authentication → Paramètres → Domaines autorisés.');
 }else report('Authentication',false,`réponse ${project.status}, ${project.data.error?.message||'configuration inaccessible'}`);
 const google=await request(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(config.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({providerId:'google.com',continueUri:site})});
 report('fournisseur Google',google.status===200&&google.data.providerId==='google.com',google.status===200?'initialisation OAuth Google disponible.':`activer Google dans Authentication → Méthode de connexion (${google.data.error?.message||google.status}).`);
 const probe=crypto.randomUUID();
 const database=await request(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/users/setup-probe-${probe}/courses/probe?key=${encodeURIComponent(config.apiKey)}`);
 const databaseState=databaseProbeStatus(database.status,database.data);
 if(databaseState==='denied')report('Firestore',true,'accès invité refusé. Les règles complètes restent à publier et vérifier sur le projet réel.');
 else if(databaseState==='open')report('Firestore',false,'la base laisse lire les invités. Publier firestore.rules ; les enregistrements restent bloqués tant que la base est ouverte.');
 else report('Firestore',false,`créer/configurer la base et publier firestore.rules (${database.data.error?.status||database.status}).`);
}catch(error){report('vérification distante',false,`${error.name}. Les paramètres réels doivent encore être vérifiés dans la console Firebase.`);}
