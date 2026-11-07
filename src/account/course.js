import {validQuiz} from '../quiz/model.js';
import {validRevisionSheets} from '../sheets/model.js';
export function validateCourse(input) {
  if (!input || typeof input.title!=='string' || !input.title.trim() || input.title.trim().length>120) throw Error('Donne un titre au cours (120 caractères maximum).');
  if (typeof input.source!=='string' || !input.source.trim()) throw Error('Ajoute du texte à ton cours avant de l’enregistrer.');
  if (input.source.length>250000) throw Error('Ce cours est trop volumineux. Divise-le en plusieurs cours pour l’enregistrer.');
  const revisions=input.revisions??null;
  const string=value=>typeof value==='string';
  if (revisions && (!string(revisions.summary)||!string(revisions.audio)||!string(revisions.mode)||!Array.isArray(revisions.cards)||!Array.isArray(revisions.topics)||!revisions.cards.every(card=>card&&string(card.question)&&string(card.answer))||!revisions.topics.every(topic=>topic&&string(topic.title)&&string(topic.details)&&(topic.theme===undefined||string(topic.theme))))) throw Error('Les révisions de ce cours sont illisibles.');
  if(revisions?.revisionSheets!==undefined&&!validRevisionSheets(revisions.revisionSheets))throw Error('Les fiches modifiées de ce cours sont illisibles.');
  if(revisions?.quiz!==undefined&&!validQuiz(revisions.quiz))throw Error('Le quiz de ce cours est illisible.');
  const course={version:1,title:input.title.trim(),source:input.source,revisions:revisions?JSON.parse(JSON.stringify(revisions)):null,engine:['browser','simple','ollama'].includes(input.engine)?input.engine:'browser',mapTitle:typeof input.mapTitle==='string'?input.mapTitle.slice(0,80):'Mon cours'};
  if(new TextEncoder().encode(JSON.stringify(course)).byteLength>750000)throw Error('Ce cours est trop volumineux. Divise-le en plusieurs cours pour l’enregistrer.');
  return course;
}
export function courseDate(value) {
  const date=value?.toDate?value.toDate():new Date(value);
  return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Paris'}).format(date);
}
