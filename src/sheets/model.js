import {groupTopics} from '../themes.js';
export function ensureRevisionSheets(revisions) {
  if(!Array.isArray(revisions.revisionSheets)){
    const topics=revisions.topics.length?revisions.topics:revisions.cards.map(card=>({title:card.question,details:card.answer}));
    revisions.revisionSheets=groupTopics(topics).map(group=>({title:group.title,sections:group.topics.map(topic=>({title:topic.title,content:topic.details})),notes:'',edited:false}));
  }
  return revisions.revisionSheets;
}
export function revisionSheetsMarkdown(revisions){
  return ensureRevisionSheets(revisions).map(sheet=>`## ${sheet.title}\n\n${sheet.sections.map(section=>`### ${section.title}\n${section.content}`).join('\n\n')}${sheet.notes?`\n\n### Mes notes\n${sheet.notes}`:''}`).join('\n\n');
}
export function validRevisionSheets(sheets){
  return Array.isArray(sheets)&&sheets.every(sheet=>sheet&&typeof sheet.title==='string'&&typeof sheet.notes==='string'&&Array.isArray(sheet.sections)&&sheet.sections.every(section=>section&&typeof section.title==='string'&&typeof section.content==='string'));
}
