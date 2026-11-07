import {quizBank,createQuiz} from './model.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountQuiz(container,revisions){
 const bank=quizBank(revisions),themes=[...new Set(bank.map(q=>q.theme))];
 const changed=()=>document.dispatchEvent(new Event('declic-contentchange'));
 function setup(){
  container.innerHTML=`<p class="hint">Entraîne-toi sur tes fiches de révision, y compris tes modifications. Les réponses viennent de ton cours : vérifie tes fiches avant de commencer.</p>${bank.length?`<form class="quiz-setup"><fieldset><legend>Thèmes à réviser</legend>${themes.map((theme,i)=>`<label><input type="checkbox" name="theme" value="${i}" checked> ${esc(theme)}</label>`).join('')}</fieldset><label>Nombre de questions<input name="count" type="number" min="1" max="20" value="5" required></label><label>Type de quiz<select name="type"><option value="choice">QCM — reconnaître la bonne explication</option><option value="recall">Réponse libre — retrouver sans indice</option></select></label><p class="hint">Jusqu’à ${bank.length} notion(s) disponible(s), sans répétition. Le QCM propose d’autres explications du cours comme choix.</p><button class="button primary">Commencer le quiz</button><p role="status" class="quiz-message"></p></form>`:'<p>Complète tes fiches avec des notions et leurs explications pour créer un quiz.</p>'}`;
  container.querySelector('form')?.addEventListener('submit',event=>{event.preventDefault();const form=new FormData(event.target);try{revisions.quiz=createQuiz(bank,{themes:form.getAll('theme').map(i=>themes[Number(i)]),count:form.get('count'),type:form.get('type')});changed();play();}catch(error){container.querySelector('.quiz-message').textContent=error.message;}});
 }
 function play(){
  const quiz=revisions.quiz,done=quiz.questions.filter(q=>q.graded!==null).length,score=quiz.questions.filter(q=>q.graded===true).length;
  container.innerHTML=`<div class="quiz-progress" role="status">${quiz.finished?`Résultat : ${score} / ${quiz.questions.length}${quiz.type==='recall'?' · autoévaluation':''}`:`${done} / ${quiz.questions.length} questions corrigées`}</div><p class="hint">${quiz.type==='recall'?'Écris ta réponse, puis compare-la au corrigé. Tu évalues toi-même ce que tu as retenu.':'Choisis l’explication qui correspond à la notion, puis valide pour afficher le corrigé.'}</p><div class="quiz-questions">${quiz.questions.map((q,i)=>`<section class="quiz-question" data-question="${i}"><span class="eyebrow">${esc(q.theme)}</span><h4>${i+1}. ${esc(q.prompt)}</h4>${quiz.type==='choice'?`<fieldset ${q.graded!==null?'disabled':''}><legend class="sr-only">Réponses à la question ${i+1}</legend>${q.options.map((option,j)=>`<label><input type="radio" name="answer-${i}" value="${j}" ${q.response===option?'checked':''}> <span>${esc(option)}</span></label>`).join('')}</fieldset>`:`<label>Ta réponse<textarea ${q.graded!==null?'readonly':''}>${esc(q.response)}</textarea></label>`}${q.graded===null?`<button class="button secondary" data-check="${i}">${quiz.type==='choice'?'Valider ma réponse':'Voir le corrigé'}</button>`:`<div class="quiz-feedback"><strong>${q.graded?'Bien retenu !':'À revoir'}</strong><p>${esc(q.answer)}</p></div>`}<p class="quiz-message" role="status"></p></section>`).join('')}</div>${quiz.finished?'<button class="button primary" data-retry>Revoir mes erreurs</button>':''}<button class="button secondary" data-new>Nouveau quiz</button><p class="hint">Clique sur « Enregistrer » dans le cours pour conserver ton quiz et ta progression.</p>`;
  container.querySelectorAll('[data-question]').forEach(section=>{
   const q=quiz.questions[Number(section.dataset.question)];
   section.querySelector('textarea')?.addEventListener('input',e=>{q.response=e.target.value;changed();});
   section.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{q.response=q.options[Number(input.value)];changed();}));
   section.querySelector('[data-check]')?.addEventListener('click',()=>{
    if(quiz.type==='choice'){if(!q.response){section.querySelector('.quiz-message').textContent='Choisis une réponse avant de valider.';return;}q.graded=q.response===q.answer;finish();}
    else{const area=section.querySelector('.quiz-message');area.innerHTML=`<div class="quiz-feedback"><strong>Corrigé du cours</strong><p>${esc(q.answer)}</p></div><button class="button secondary" data-grade="yes">J’avais retenu</button> <button class="button secondary" data-grade="no">À revoir</button>`;area.querySelectorAll('[data-grade]').forEach(button=>button.onclick=()=>{q.graded=button.dataset.grade==='yes';finish();});}
   });
  });
  function finish(){quiz.finished=quiz.questions.every(q=>q.graded!==null);changed();play();}
  container.querySelector('[data-new]').onclick=()=>{if(!quiz.finished&&!confirm('Remplacer le quiz en cours ?'))return;delete revisions.quiz;changed();setup();};
  container.querySelector('[data-retry]')?.addEventListener('click',()=>{const missed=quiz.questions.filter(q=>!q.graded);if(!missed.length){container.querySelector('.quiz-progress').textContent='Bravo, toutes les notions sont retenues ! Tu peux créer un nouveau quiz.';return;}quiz.questions=missed.map(q=>({...q,response:'',graded:null}));quiz.finished=false;changed();play();});
 }
 if(revisions.quiz)play();else setup();
}
