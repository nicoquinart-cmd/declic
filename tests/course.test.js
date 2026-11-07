import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCourse} from '../src/account/course.js';
const draft={title:'Biologie',source:'Cours complet à conserver.',revisions:null,engine:'simple',mapTitle:'Le vivant'};
test('conserve les notes et toutes les révisions sans partager les références',()=>{
 const revisions={summary:'Résumé',cards:[{question:'Question',answer:'Réponse'}],topics:[{theme:'Structure',title:'Cellule',details:'Explication'}],audio:'Texte audio',mode:'sans IA'};
 const saved=validateCourse({...draft,revisions});assert.deepEqual(saved.revisions,revisions);revisions.topics[0].title='Modifié';assert.equal(saved.revisions.topics[0].title,'Cellule');assert.equal(saved.source,draft.source);
});
test('autorise les brouillons et refuse les cours illisibles ou trop gros',()=>{
 assert.equal(validateCourse(draft).revisions,null);
 for(const invalid of [{...draft,title:''},{...draft,source:''},{...draft,revisions:{summary:42}},{...draft,source:'x'.repeat(250001)}])assert.throws(()=>validateCourse(invalid));
});
