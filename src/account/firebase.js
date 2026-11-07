import {validateCourse} from './course.js';
const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
export const googleConfigured=Object.values(config).every(value=>typeof value==='string'&&value.trim());
let client;
export async function accountClient() {
  if(!googleConfigured)return null;
  client ||= (async()=>{
    const [{initializeApp},{getAuth,setPersistence,browserLocalPersistence,browserSessionPersistence,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signOut},{getFirestore,collection,doc,query,orderBy,limit,startAfter,getDocsFromServer,getDocFromServer,setDoc,deleteDoc,serverTimestamp}]=await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/firestore')]);
    const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
    try{await setPersistence(auth,browserLocalPersistence);}catch{await setPersistence(auth,browserSessionPersistence);}
    const path=uid=>collection(db,'users',uid,'courses');
    return {
      listen:callback=>onAuthStateChanged(auth,callback),
      async login(){const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});return signInWithPopup(auth,provider);},
      logout:()=>signOut(auth),
      async list(uid,cursor){const request=query(path(uid),orderBy('updatedAt','desc'),...(cursor?[startAfter(cursor)]:[]),limit(30));const result=await getDocsFromServer(request);return{courses:result.docs.map(snapshot=>({...snapshot.data(),id:snapshot.id})),cursor:result.docs.at(-1),more:result.docs.length===30};},
      async get(uid,id){const result=await getDocFromServer(doc(path(uid),id));if(!result.exists())throw Error('Ce cours n’existe plus dans ton compte.');return{...validateCourse(result.data()),id:result.id,createdAt:result.data().createdAt,updatedAt:result.data().updatedAt};},
      async save(uid,input,id){const value=validateCourse(input),reference=id?doc(path(uid),id):doc(path(uid));if(id){await setDoc(reference,{...value,updatedAt:serverTimestamp()},{merge:true});}else await setDoc(reference,{...value,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return{...value,id:reference.id};},
      remove:(uid,id)=>deleteDoc(doc(path(uid),id)),
    };
  })().catch(error=>{client=undefined;throw error;});
  return client;
}
export function accountError(error) {
  const messages={
    'auth/popup-closed-by-user':'Connexion annulée. Tes cours sur cet appareil restent disponibles.',
    'auth/cancelled-popup-request':'Une fenêtre de connexion est déjà ouverte.',
    'auth/popup-blocked':'Le navigateur bloque la fenêtre Google. Autorise les fenêtres de connexion pour Déclic puis réessaie.',
    'auth/unauthorized-domain':'La connexion Google n’est pas encore activée pour cette adresse du site.',
    'auth/operation-not-allowed':'La connexion Google n’est pas encore activée sur Déclic.',
    'auth/network-request-failed':'La connexion a échoué. Vérifie ton accès Internet puis réessaie.',
    'permission-denied':'L’accès à ce cours est refusé. Reconnecte-toi ; si le problème persiste, les règles de sauvegarde doivent être vérifiées.',
    'unavailable':'La sauvegarde en ligne est indisponible. Réessaie lorsque la connexion est rétablie.',
  };
  return messages[error?.code]||error?.message||'Cette opération n’a pas abouti. Réessaie.';
}
