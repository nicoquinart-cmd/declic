import {validateCourse} from './course.js';
let database;
function openDatabase() {
  database ||= new Promise((resolve,reject)=>{
    const request=indexedDB.open('declic-personal-library',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('courses',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(new Error('La sauvegarde sur cet appareil est indisponible. Vérifie les autorisations de stockage du navigateur.'));
    request.onblocked=()=>reject(new Error('Ferme les autres onglets Déclic et réessaie.'));
  }).catch(error=>{database=undefined;throw error;});
  return database;
}
async function transaction(mode,operation) {
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('courses',mode),request=operation(tx.objectStore('courses'));
    let value;request.onsuccess=()=>{value=request.result;};
    tx.oncomplete=()=>resolve(value);
    tx.onerror=tx.onabort=()=>reject(new Error('La sauvegarde n’a pas abouti. Le stockage du navigateur est peut-être plein.'));
  });
}
export const localLibrary={
  async list(){return(await transaction('readonly',store=>store.getAll())).sort((a,b)=>b.updatedAt-a.updatedAt);},
  async get(id){const value=await transaction('readonly',store=>store.get(id));if(!value)throw Error('Ce cours n’existe plus sur cet appareil.');return value;},
  async save(input,id){const value=validateCourse(input),previous=id?await this.get(id):null;const record={...value,id:id||crypto.randomUUID(),createdAt:previous?.createdAt||Date.now(),updatedAt:Date.now()};await transaction('readwrite',store=>store.put(record));return record;},
  async remove(id){await transaction('readwrite',store=>store.delete(id));},
};
