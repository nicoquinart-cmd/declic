import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRevisions, revisionMessages} from '../src/ai/revisions.js';
const valid={summary:'Résumé du cours',cards:[{question:'Pourquoi ?',answer:'Parce que…'}],topics:[{title:'Notion',details:'Explication'}],audio:'Script du cours'};
test('accepte le JSON du modèle entouré de Markdown',()=>{
  assert.deepEqual(parseRevisions('```json\n'+JSON.stringify(valid)+'\n```'),valid);
});
test('refuse les réponses malformées et les formats incomplets',()=>{
  for(const raw of ['pas de JSON','{"summary":',JSON.stringify({...valid,audio:''}),JSON.stringify({...valid,cards:[]}),JSON.stringify({...valid,topics:[{title:'Notion'}]})])
    assert.throws(()=>parseRevisions(raw));
});
test('conserve intégralement le cours dans le message utilisateur',()=>{
  const course='Cours à réviser. '.repeat(200);
  const messages=revisionMessages(course);
  assert.equal(messages[0].role,'system');
  assert.equal(messages[1].role,'user');
  assert.ok(messages[1].content.includes(course));
});
