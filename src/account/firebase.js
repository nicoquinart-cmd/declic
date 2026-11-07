import {validateCourse} from './course.js';
import {databaseProbeStatus} from './database-status.js';
import {selectFirebaseConfig} from './public-config.js';
const config=selectFirebaseConfig({apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID});
export const googleConfigured=Object.values(config).every(value=>typeof value==='string'&&value.trim());
let client;
export async function accountClient() {
  if(!googleConfigured)return null;
  client ||= (async()=>{
    const [{initializeApp},{getAuth,setPersistence,indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence,inMemoryPersistence,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signOut},{getFirestore,collection,doc,query,orderBy,limit,startAfter,getDocsFromServer,getDocFromServer,setDoc,deleteDoc,serverTimestamp}]=await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/firestore')]);
    const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
    let temporarySession=false,lastPersistenceError;
    for(const [index,persistence] of [indexedDBLocalPersistence,browserLocalPersistence,browserSessionPersistence,inMemoryPersistence].entries()){
      try{await setPersistence(auth,persistence);temporarySession=index>=2;lastPersistenceError=null;break;}catch(error){lastPersistenceError=error;}
    }
    if(lastPersistenceError)throw lastPersistenceError;
    const path=uid=>collection(db,'users',uid,'courses');
    let databaseCheck;
    const requirePrivateDatabase=async()=>{
      databaseCheck ||= (async()=>{
        const probe=crypto.randomUUID();
        const url=`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/users/setup-probe-${probe}/courses/probe?key=${encodeURIComponent(config.apiKey)}`;
        let response,body;
        try { response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(15000)});body=await response.json(); }
        catch { throw Error('Impossible de vérifier la sauvegarde privée. Vérifie ta connexion puis réessaie.'); }
        const status=databaseProbeStatus(response.status,body);
        if(status==='open')throw Error('La sauvegarde privée n’est pas encore activée. Le propriétaire doit publier les règles Firestore de Déclic avant d’enregistrer des cours.');
        if(status==='missing')throw Error('La base de cours n’est pas encore activée. Le propriétaire doit créer la base Firestore puis publier les règles de Déclic.');
        if(status!=='denied')throw Error('La sauvegarde privée ne peut pas encore être vérifiée. Réessaie plus tard.');
      })().catch(error=>{databaseCheck=undefined;throw error;});
      await databaseCheck;
    };
    return {
      temporarySession,
      listen:(callback,onError)=>onAuthStateChanged(auth,callback,onError),
      async login(){const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});return signInWithPopup(auth,provider);},
      logout:()=>signOut(auth),
      async list(uid,cursor){await requirePrivateDatabase();const request=query(path(uid),orderBy('updatedAt','desc'),...(cursor?[startAfter(cursor)]:[]),limit(30));const result=await getDocsFromServer(request);return{courses:result.docs.map(snapshot=>({...snapshot.data(),id:snapshot.id})),cursor:result.docs.at(-1),more:result.docs.length===30};},
      async get(uid,id){await requirePrivateDatabase();const result=await getDocFromServer(doc(path(uid),id));if(!result.exists())throw Error('Ce cours n’existe plus dans ton compte.');return{...validateCourse(result.data()),id:result.id,createdAt:result.data().createdAt,updatedAt:result.data().updatedAt};},
      async save(uid,input,id){await requirePrivateDatabase();const value=validateCourse(input),reference=id?doc(path(uid),id):doc(path(uid));if(id){await setDoc(reference,{...value,updatedAt:serverTimestamp()},{merge:true});}else await setDoc(reference,{...value,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return{...value,id:reference.id};},
      remove:(uid,id)=>deleteDoc(doc(path(uid),id)),
    };
  })().catch(error=>{client=undefined;throw error;});
  return client;
}
export {accountError} from './auth-errors.js';
