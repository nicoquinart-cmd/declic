import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureRevisionSheets,revisionSheetsMarkdown} from '../src/sheets/model.js';
import {validateCourse} from '../src/account/course.js';
test('crée des fiches structurées puis conserve les modifications',()=>{
 const data={summary:'Résumé',audio:'Audio',mode:'sans IA',cards:[],topics:[{theme:'Mécanismes',title:'Énergie',details:'La lumière est convertie en énergie chimique.'}]};const sheets=ensureRevisionSheets(data);assert.equal(sheets[0].sections[0].title,'Énergie');sheets[0].title='Ma fiche';sheets[0].notes='Mon exemple';assert.equal(ensureRevisionSheets(data)[0].title,'Ma fiche');assert.match(revisionSheetsMarkdown(data),/Mon exemple/);
 const saved=validateCourse({title:'Cours',source:'Notes du cours',revisions:data,engine:'simple',mapTitle:'Cours'});assert.equal(saved.revisions.revisionSheets[0].notes,'Mon exemple');
});
