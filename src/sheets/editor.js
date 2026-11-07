import {ensureRevisionSheets} from './model.js';
export function mountRevisionSheets(container,revisions){
  const sheets=ensureRevisionSheets(revisions);
  let exporting=false;
  const notify=()=>{const link=container.querySelector('.sheets-ready');if(link)link.hidden=true;document.dispatchEvent(new Event('declic-contentchange'));container.querySelector('.sheets-status').textContent='Modifications appliquées. Enregistre le cours pour les retrouver plus tard.';};
  const element=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
  const button=(text,handler,className='button secondary')=>{const el=element('button',className,text);el.type='button';el.onclick=handler;return el;};
  const field=(label,value,onChange,multiline=false)=>{
    const wrapper=element('label','sheet-field'),caption=element('span','',label),input=element(multiline?'textarea':'input');input.value=value;input.setAttribute('aria-label',label);if(!multiline)input.type='text';else input.rows=4;input.oninput=()=>{onChange(input.value);notify();};wrapper.append(caption,input);return wrapper;
  };
  async function exportPdf(selected){
    if(exporting)return;exporting=true;const status=container.querySelector('.sheets-status');status.textContent='Préparation du PDF…';container.querySelectorAll('[data-pdf]').forEach(node=>node.disabled=true);
    try{const snapshot=JSON.parse(JSON.stringify(selected));const {downloadSheetsPdf}=await import('./pdf.js');const url=await downloadSheetsPdf(snapshot,document.querySelector('#course-title')?.value.trim()||'Mes fiches de révision');const link=container.querySelector('.sheets-ready');link.href=url;link.hidden=false;status.textContent='PDF prêt. Utilise le lien ci-dessous si le téléchargement ne démarre pas.';}
    catch(error){status.textContent=error.message||'Le PDF n’a pas pu être créé.';}
    finally{exporting=false;container.querySelectorAll('[data-pdf]').forEach(node=>node.disabled=false);}
  }
  function render(){
    container.replaceChildren();
    const toolbar=element('div','sheets-toolbar'),all=button('↓ Toutes les fiches en PDF',()=>exportPdf(sheets),'button primary');all.dataset.pdf='all';
    toolbar.append(all,button('＋ Nouvelle fiche',()=>{sheets.push({title:'Nouvelle fiche',sections:[{title:'À retenir',content:''}],notes:'',edited:true});render();notify();}));
    const hint=element('p','hint','Modifie librement les titres, les explications et tes notes. Le PDF reprend le contenu affiché. Pense à enregistrer ton cours après tes modifications.');
    const status=element('p','sheets-status hint');status.setAttribute('role','status');status.setAttribute('aria-live','polite');const ready=element('a','sheets-ready link','↓ Télécharger le PDF préparé');ready.download='declic-fiches-revision.pdf';ready.hidden=true;container.append(toolbar,hint,status,ready);
    sheets.forEach((sheet,index)=>{
      const article=element('article','revision-sheet');
      const header=element('div','sheet-header');header.append(element('span','sheet-number',`FICHE ${String(index+1).padStart(2,'0')}`));
      const individual=button('↓ PDF',()=>exportPdf([sheet]));individual.dataset.pdf='single';
      header.append(individual,button('Supprimer',()=>{if(confirm('Supprimer cette fiche de révision ?')){sheets.splice(index,1);render();notify();}},'link'));
      article.append(header,field('Titre de la fiche',sheet.title,value=>{sheet.title=value;sheet.edited=true;}));
      sheet.sections.forEach((section,sectionIndex)=>{
        const group=element('section','sheet-section');
        group.append(field('Sous-titre',section.title,value=>{section.title=value;sheet.edited=true;}),field('À retenir',section.content,value=>{section.content=value;sheet.edited=true;},true),button('Retirer cette partie',()=>{sheet.sections.splice(sectionIndex,1);sheet.edited=true;render();notify();},'link'));
        article.append(group);
      });
      article.append(button('＋ Ajouter une partie',()=>{sheet.sections.push({title:'Nouvelle notion',content:''});sheet.edited=true;render();notify();}),field('Mes notes et exemples',sheet.notes,value=>{sheet.notes=value;sheet.edited=true;},true));
      container.append(article);
    });
    if(!sheets.length)container.append(element('p','hint','Aucune fiche. Ajoute une nouvelle fiche pour commencer.'));
  }
  render();
}
