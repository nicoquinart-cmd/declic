import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,updateDoc,deleteDoc,serverTimestamp} from 'firebase/firestore';
const env=await initializeTestEnvironment({projectId:'demo-declic',firestore:{rules:await readFile('firestore.rules','utf8')}});
const course={version:1,title:'Biologie',source:'Les cellules composent les êtres vivants.',revisions:null,engine:'simple',mapTitle:'Le vivant',createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
try{
 const alice=env.authenticatedContext('alice').firestore(),bob=env.authenticatedContext('bob').firestore(),guest=env.unauthenticatedContext().firestore();
 await assertSucceeds(setDoc(doc(alice,'users/alice/courses/biology'),course));
 await assertSucceeds(getDoc(doc(alice,'users/alice/courses/biology')));
 await assertSucceeds(getDocs(collection(alice,'users/alice/courses')));
 await assertFails(getDoc(doc(bob,'users/alice/courses/biology')));
 await assertFails(getDocs(collection(bob,'users/alice/courses')));
 await assertFails(getDoc(doc(guest,'users/alice/courses/biology')));
 await assertFails(setDoc(doc(bob,'users/alice/courses/injected'),course));
 await assertFails(setDoc(doc(guest,'users/alice/courses/injected'),course));
 await assertFails(updateDoc(doc(bob,'users/alice/courses/biology'),{title:'Pirate',updatedAt:serverTimestamp()}));
 await assertFails(deleteDoc(doc(bob,'users/alice/courses/biology')));
 await assertFails(setDoc(doc(alice,'users/alice/courses/invalid'),{...course,title:''}));
 await assertFails(setDoc(doc(alice,'users/alice/courses/extra'),{...course,public:true}));
 await assertFails(setDoc(doc(alice,'users/alice/courses/malformed'),{...course,revisions:{summary:'Incomplet'}}));
 await assertSucceeds(updateDoc(doc(alice,'users/alice/courses/biology'),{title:'Biologie révisée',updatedAt:serverTimestamp()}));
 await assertSucceeds(deleteDoc(doc(alice,'users/alice/courses/biology')));
 console.log('OK : cours privés, lectures/listes/écritures d’autrui et invités refusées, validation du schéma et modifications par le propriétaire vérifiées.');
}catch(error){console.error(`::error::${error.message}`);process.exitCode=1;}finally{await env.cleanup();}
