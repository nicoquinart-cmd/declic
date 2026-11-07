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

import {selectFirebaseConfig,publicFirebaseConfig} from '../src/account/public-config.js';
test('utilise le projet fourni quand les variables de compilation sont vides',()=>{
 assert.equal(selectFirebaseConfig({apiKey:'',projectId:undefined}).projectId,'declic-revision');
});
test('garde les configurations de projets séparées lors d’une surcharge',()=>{
 const override={apiKey:'public-test-key',authDomain:'test.firebaseapp.com',projectId:'test-project',appId:'test-app'};
 assert.deepEqual(selectFirebaseConfig(override),override);
 assert.deepEqual(selectFirebaseConfig({apiKey:'public-test-key'}),{apiKey:'public-test-key'});
 assert.equal(publicFirebaseConfig.projectId,'declic-revision');
});

import {databaseProbeStatus} from '../src/account/database-status.js';
test('bloque une base publique ou absente et reconnaît un refus invité',()=>{
 assert.equal(databaseProbeStatus(403,{error:{status:'PERMISSION_DENIED',message:'Missing or insufficient permissions.'}}),'denied');
 assert.equal(databaseProbeStatus(404,{error:{status:'NOT_FOUND',message:'Document not found.'}}),'open');
 assert.equal(databaseProbeStatus(200,{}),'open');
 assert.equal(databaseProbeStatus(404,{error:{status:'NOT_FOUND',message:'Document projects/demo/databases/(default)/documents/users/probe not found.'}}),'open');
 assert.equal(databaseProbeStatus(404,{error:{status:'NOT_FOUND',message:'The database (default) does not exist for project.'}}),'missing');
 assert.equal(databaseProbeStatus(403,{error:{status:'PERMISSION_DENIED',message:'Cloud Firestore API has not been used or is disabled.'}}),'missing');
 assert.equal(databaseProbeStatus(503,{}),'unavailable');
});
