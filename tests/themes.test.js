import test from 'node:test';
import assert from 'node:assert/strict';
import {groupTopics,thematicMarkdown} from '../src/themes.js';
import {parseRevisions} from '../src/ai/revisions.js';
const mixed=[{title:'Budget',details:'Le budget de l’État décrit les recettes fiscales et les dépenses publiques.'},{title:'Impôts',details:'Les impôts financent les recettes fiscales de l’État et son budget.'},{title:'Métaphore',details:'La métaphore est une figure de style qui rapproche deux images dans un poème.'},{title:'Comparaison',details:'La comparaison est une figure de style qui rapproche des images avec un outil comparatif.'}];
test('conserve des thèmes explicites utiles et leurs sous-titres',()=>{
 const result=parseRevisions('1. Causes > Crise financière : Le royaume est fortement endetté.\n2. Causes > Inégalités sociales : Les privilèges provoquent des tensions.\n3. Conséquences > Nouveaux droits : La déclaration affirme de nouveaux droits.\n4. Conséquences > Institutions : Le système politique est transformé.');
 const groups=groupTopics(result.topics);assert.deepEqual(groups.map(group=>group.title),['Causes','Conséquences']);assert.equal(groups[0].topics.length,2);assert.match(thematicMarkdown(result.topics),/## Causes\n\n### Crise financière/);
});
test('rapproche les informations apparentées sans catégories prédéfinies',()=>{
 const groups=groupTopics(mixed);assert.deepEqual(groups.map(group=>group.topics.map(topic=>topic.title)),[['Budget','Impôts'],['Métaphore','Comparaison']]);
 assert.equal(groups.flatMap(group=>group.topics).length,mixed.length);assert.ok(mixed.every(topic=>!('theme' in topic)));
});
test('ne transforme pas les notions inconnues en un sac générique',()=>{
 const groups=groupTopics([{title:'Orbitales',details:'Les électrons occupent des orbitales autour du noyau atomique.'},{title:'Sonnet',details:'Un sonnet contient quatorze vers organisés en strophes.'}]);assert.equal(groups.length,2);assert.ok(groups.every(group=>group.title!=='Notions fondamentales'));
});
test('ignore les titres fictifs du modèle et respecte les corrections manuelles',()=>{
 assert.equal(groupTopics(mixed.map(topic=>({...topic,theme:'Premier thème'}))).length,2);
 assert.equal(groupTopics(mixed.map(topic=>({...topic,theme:'Mon thème',themeSource:'manual'}))).length,1);
});
test('réunit une même classe malgré les accents et la casse',()=>{
 const groups=groupTopics([{theme:'Économie',title:'Budget',details:'Budget du royaume.'},{theme:'economie',title:'Dette',details:'Dette du royaume.'}]);assert.equal(groups.length,1);assert.equal(groups[0].topics.length,2);
});
