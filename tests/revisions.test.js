import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRevisions, revisionMessages} from '../src/ai/revisions.js';
const response='1. Chlorophylle : Elle capte la lumière dans les chloroplastes.\n2. Glucose : Il est produit à partir du carbone et de l’eau.';
test('organise les notions rédigées par le modèle dans les quatre formats',()=>{
  const result=parseRevisions(response);
  assert.equal(result.topics.length,2);
  assert.equal(result.topics[0].title,'Chlorophylle');
  assert.match(result.summary,/capte la lumière/);
  assert.match(result.cards[0].question,/Chlorophylle/);
  assert.equal(result.cards[0].answer,result.topics[0].details);
  assert.match(result.audio,/carbone et de l’eau/);
});
test('accepte les listes Markdown et leurs explications sur plusieurs lignes',()=>{
  const result=parseRevisions('Introduction\n- **Chlorophylle** : Elle capte la lumière.\n  Elle se trouve dans les chloroplastes.\n- Glucose : Il est produit par les plantes.');
  assert.match(result.topics[0].details,/chloroplastes/);
  assert.equal(result.topics[0].title,'Chlorophylle');
});
test('refuse les réponses vides ou insuffisantes',()=>{
  for(const raw of ['', 'Une simple introduction', '1. Une seule notion : Explication de cette notion.', '1. Vide :\n2. Vide aussi :']) assert.throws(()=>parseRevisions(raw));
});
test('conserve intégralement le cours dans le message utilisateur',()=>{
  const course='Cours à réviser. '.repeat(200);
  const messages=revisionMessages(course);
  assert.equal(messages[0].role,'system');
  assert.equal(messages[1].role,'user');
  assert.ok(messages[1].content.includes(course));
});
