import {ensureRevisionSheets} from '../sheets/model.js';
const normalized=text=>text.trim().toLocaleLowerCase('fr').replace(/\s+/g,' ');
export function quizBank(revisions){
  const seen=new Set(),bank=[];
  for(const sheet of ensureRevisionSheets(revisions))for(const section of sheet.sections){
    const title=section.title.trim(),answer=section.content.trim(),key=normalized(answer);
    if(!title||answer.length<15||seen.has(key))continue;
    seen.add(key);bank.push({theme:sheet.title.trim()||'Mon cours',title,answer});
  }
  return bank;
}
export function shuffle(items,random=Math.random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
export function createQuiz(bank,{themes,count=5,type='choice'},random=Math.random){
  const pool=bank.filter(item=>themes.includes(item.theme));
  if(!pool.length)throw Error('Sélectionne au moins un thème contenant des notions.');
  if(type==='choice'&&pool.length<2)throw Error('Le QCM nécessite deux notions différentes. Ajoute un thème ou choisis « Réponse libre ».');
  return {type,questions:shuffle(pool,random).slice(0,Math.max(1,Math.min(20,Number(count)||5))).map(item=>({prompt:`Que faut-il retenir sur « ${item.title} » ?`,answer:item.answer,theme:item.theme,options:type==='choice'?shuffle([item.answer,...shuffle(pool.filter(other=>other.answer!==item.answer),random).slice(0,3).map(other=>other.answer)],random):[],response:'',graded:null})),finished:false};
}
export function validQuiz(quiz){return quiz&&['choice','recall'].includes(quiz.type)&&typeof quiz.finished==='boolean'&&Array.isArray(quiz.questions)&&quiz.questions.length>0&&quiz.questions.length<=20&&quiz.questions.every(q=>q&&['prompt','answer','theme','response'].every(k=>typeof q[k]==='string')&&Array.isArray(q.options)&&q.options.every(x=>typeof x==='string')&&(q.graded===null||typeof q.graded==='boolean')&&(quiz.type!=='choice'||q.options.length>=2&&new Set(q.options).size===q.options.length&&q.options.includes(q.answer)));}
