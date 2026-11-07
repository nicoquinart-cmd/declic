import test from 'node:test';
import assert from 'node:assert/strict';
import {groupTopics,thematicMarkdown} from '../src/themes.js';
import {parseRevisions} from '../src/ai/revisions.js';
test('regroupe les sous-titres sous les thèmes proposés par le modèle',()=>{
 const result=parseRevisions('1. Causes > Crise financière : Le royaume est fortement endetté.\n2. Causes > Inégalités sociales : Les privilèges provoquent des tensions.\n3. Conséquences > Nouveaux droits : La déclaration affirme de nouveaux droits.\n4. Conséquences > Institutions : Le système politique est transformé.');
 const groups=groupTopics(result.topics);
 assert.deepEqual(groups.map(group=>group.title),['Causes','Conséquences']);
 assert.deepEqual(groups[0].topics.map(topic=>topic.title),['Crise financière','Inégalités sociales']);
 assert.equal(groups[1].topics.length,2);
 assert.match(thematicMarkdown(result.topics),/## Causes\n\n### Crise financière/);
});
test('classe les notions sans thème en conservant chaque information',()=>{
 const topics=[{title:'Lumière',details:'Elle est absorbée par les plantes.'},{title:'Eau',details:'Elle constitue une ressource.'},{title:'Glucose',details:'Il est produit par les plantes.'},{title:'Chloroplastes',details:'Ils contiennent la chlorophylle.'}];
 const groups=groupTopics(topics);
 assert.deepEqual(groups.find(group=>group.title==='Ressources et conditions').topics.map(topic=>topic.title),['Lumière','Eau']);
 assert.equal(groups.flatMap(group=>group.topics).length,topics.length);
 assert.ok(groups.flatMap(group=>group.topics).every(topic=>topics.includes(topic)));
 assert.ok(topics.every(topic=>!('theme' in topic)));
});
test('réunit les mêmes classes sans tenir compte des accents ou de la casse',()=>{
 const groups=groupTopics([{theme:'Économie',title:'Budget',details:'Budget du royaume.'},{theme:'economie',title:'Dette',details:'Dette du royaume.'}]);
 assert.equal(groups.length,1);assert.equal(groups[0].topics.length,2);
});

test('ne confond pas les mots du cours avec un fragment de mot-clé',()=>{
 const groups=groupTopics([{title:'Nouveaux droits',details:'Ces droits nouveaux sont inscrits dans un texte.'}]);
 assert.equal(groups[0].title,'Notions fondamentales');
});
