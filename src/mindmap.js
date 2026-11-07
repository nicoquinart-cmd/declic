import { groupTopics } from './themes.js';
import { balanceBranches } from './mindmap-layout.js';
const NS = 'http://www.w3.org/2000/svg';
const COLORS = [
  {line:'#819955',fill:'#edf3e2'}, {line:'#539994',fill:'#e5f4f1'},
  {line:'#aa82b7',fill:'#f3eaf7'}, {line:'#ca9452',fill:'#fff2df'},
  {line:'#7395c1',fill:'#e9f0fb'}, {line:'#c08289',fill:'#fbecef'},
];
let centralTitle = 'Mon cours';
export const getMindMapTitle=()=>centralTitle;
export function setMindMapTitle(value){centralTitle=typeof value==='string'&&value.trim()?value.trim().slice(0,80):'Mon cours';}
function element(tag, attributes={}, text) {
  const node=document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attributes)) node.setAttribute(key,String(value));
  if(text!==undefined)node.textContent=text;
  return node;
}
function wrap(text,width,size,bold=false) {
  const context=document.createElement('canvas').getContext('2d');
  context.font=`${bold?'600 ':''}${size}px Arial`;
  const lines=[];let line='';
  for(const word of String(text).trim().split(/\s+/)) {
    if(line && context.measureText(line+' '+word).width>width){lines.push(line);line='';}
    // Also wrap filenames, URLs or other long words, without losing characters.
    for(const letter of word) {
      if(context.measureText(line+letter).width>width){lines.push(line);line='';}
      line+=letter;
    }
    line+=' ';
  }
  if(line.trim())lines.push(line.trim());
  return lines.length?lines:[''];
}
function drawMap(topics,title,{details=false,onSelect}={}) {
  let entries=groupTopics(topics).map((group,index)=>({
    title:wrap(group.title,150,17,true),name:group.title,color:COLORS[index%COLORS.length],
    topics:group.topics.map(topic=>({original:topic,title:wrap(topic.title,236,16,true),details:wrap(topic.details,236,14)})),
  }));
  for(const entry of entries) {
    for(const topic of entry.topics)topic.height=details?topic.title.length*21+topic.details.length*19+44:Math.max(72,topic.title.length*21+36);
    entry.themeHeight=Math.max(72,entry.title.length*22+30);
    entry.height=Math.max(entry.themeHeight,entry.topics.reduce((sum,topic)=>sum+topic.height+24,0)-24);
  }
  entries=balanceBranches(entries);
  for(const entry of entries){entry.title=wrap(entry.name+(entry.continuation?' (suite)':''),150,17,true);entry.themeHeight=Math.max(72,entry.title.length*22+30);entry.height=Math.max(entry.height,entry.themeHeight);}
  const groups={left:entries.filter(entry=>entry.side==='left'),right:entries.filter(entry=>entry.side==='right')};
  const total=side=>Math.max(0,groups[side].reduce((sum,entry)=>sum+entry.height+60,0)-60);
  const rootLines=wrap(title,160,19,true),rootHeight=Math.max(84,rootLines.length*24+30);
  const width=1460,height=Math.max(460,total('left')+80,total('right')+80,rootHeight+80);
  const svg=element('svg',{xmlns:NS,viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':`Carte mentale : ${title}`,class:'mindmap-svg'});
  svg.append(element('title',{},`Carte mentale : ${title}`));
  svg.append(element('desc',{},'Sujet central : '+title+'. '+groupTopics(topics).map(group=>'Thématique : '+group.title+'. '+group.topics.map(topic=>topic.title+' : '+topic.details).join(' ')).join(' ')));
  svg.append(element('rect',{width,height,fill:'#fafcf8'}));
  const links=element('g',{'aria-hidden':'true'}),nodes=element('g');svg.append(links,nodes);
  const box=(x,y,w,h,lines,color,size=16,bold=false,kind='')=>{
    const group=element('g',{class:kind});
    group.append(element('rect',{x,y,width:w,height:h,rx:kind==='mindmap-root'?26:18,fill:color.fill,stroke:color.line,'stroke-width':kind==='mindmap-root'?0:1}));
    const label=element('text',{'font-family':'Arial, sans-serif','font-size':size,'font-weight':bold?600:400,fill:kind==='mindmap-root'?'#fff':'#344238','text-anchor':'middle'});
    const startY=y+h/2-(lines.length-1)*(size+5)/2+size*.34;
    lines.forEach((line,index)=>label.append(element('tspan',{x:x+w/2,y:startY+index*(size+5)},line.trim())));
    group.append(label);nodes.append(group);
  };
  const connect=(x1,y1,x2,y2,color,width=3)=>{
    const mid=(x1+x2)/2;
    links.append(element('path',{d:`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`,fill:'none',stroke:color,'stroke-width':width,'stroke-linecap':'round',class:'mindmap-link'}));
  };
  const subtitleBox=(x,y,topic,color)=>{
    const group=element('g',{class:'mindmap-topic',...(onSelect?{role:'button',tabindex:0,'aria-label':`Voir l’explication : ${topic.original.title}`}:{})});
    group.append(element('rect',{x,y,width:270,height:topic.height,rx:16,fill:'#fff',stroke:color.line,'stroke-opacity':.5,'stroke-width':1.2}));
    group.append(element('rect',{x:x+12,y:y+14,width:4,height:topic.height-28,rx:2,fill:color.line}));
    const heading=element('text',{'font-family':'Arial, sans-serif','font-size':16,'font-weight':600,fill:'#344238','text-anchor':'middle',class:'mindmap-subtitle'});
    const titleY=details?y+25:y+topic.height/2-(topic.title.length-1)*21/2+5;
    topic.title.forEach((line,index)=>heading.append(element('tspan',{x:x+140,y:titleY+index*21},line.trim())));
    group.append(heading);
    if(details){
      const detail=element('text',{'font-family':'Arial, sans-serif','font-size':14,fill:'#4d5b4e','text-anchor':'middle',class:'mindmap-detail'});
      topic.details.forEach((line,index)=>detail.append(element('tspan',{x:x+135,y:y+topic.title.length*21+38+index*19},line.trim())));
      group.append(detail);
    }
    if(onSelect){
      const select=()=>{svg.querySelectorAll('.mindmap-topic').forEach(node=>node.classList.remove('selected'));group.classList.add('selected');onSelect(topic.original);};
      group.onclick=select;group.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select();}};
    }
    nodes.append(group);
  };
  for(const side of ['left','right']) {
    let top=(height-total(side))/2;
    for(const entry of groups[side]) {
      const left=side==='left',themeY=top+entry.height/2,themeX=left?360:920;
      connect(left?635:825,height/2,left?540:920,themeY,entry.color.line,4);
      box(themeX,themeY-entry.themeHeight/2,180,entry.themeHeight,entry.title,entry.color,17,true,'mindmap-theme');
      const contentHeight=entry.topics.reduce((sum,topic)=>sum+topic.height+24,0)-24;
      let row=top+(entry.height-contentHeight)/2;
      for(const topic of entry.topics) {
        const cy=row+topic.height/2,topicX=left?30:1160;
        connect(left?360:1100,themeY,left?300:1160,cy,entry.color.line,2.5);
        subtitleBox(topicX,row,topic,entry.color);
        row+=topic.height+24;
      }
      top+=entry.height+60;
    }
  }
  box(635,(height-rootHeight)/2,190,rootHeight,rootLines,{line:'#354f36',fill:'#354f36'},19,true,'mindmap-root');
  return {svg,width,height};
}
export function mountMindMap(container,topics) {
  if(centralTitle==='Mon cours'){const courseTitle=document.querySelector('#course-title')?.value.trim();if(courseTitle)centralTitle=courseTitle.slice(0,80);}
  container.innerHTML=`<div class="mindmap-toolbar"><label>Sujet central<input id="mindmap-title" maxlength="80" aria-label="Sujet central de la carte mentale"></label><button class="button secondary" data-action="expand">⤢ Agrandir</button><button class="button secondary" data-action="download">↓ SVG</button></div><div class="mindmap-options"><label><input type="checkbox" id="mindmap-details"> Afficher les explications</label><span class="mindmap-count"></span></div><p class="hint">Clique sur une notion pour lire son explication. Les branches sont équilibrées des deux côtés ; une grande thématique peut se poursuivre sur deux branches de même couleur.</p><details class="mindmap-editor"><summary>Modifier le classement des thèmes</summary><p class="hint">Donne le même thème aux notions à regrouper. Tu peux renommer les thèmes ou laisser un champ vide pour revenir au classement automatique.</p><form><div class="mindmap-assignments"></div><datalist id="mindmap-theme-names"></datalist><button class="button secondary" type="submit">Appliquer le classement</button></form></details><div class="mindmap-view"></div><section class="mindmap-selection" hidden aria-live="polite"></section><dialog class="mindmap-dialog"><div class="mindmap-dialog-header"><h3>Ta carte mentale</h3><button class="button secondary" data-action="close">Fermer</button></div><div class="mindmap-large"></div><section class="mindmap-selection" hidden aria-live="polite"></section></dialog>`;
  const input=container.querySelector('#mindmap-title');input.value=centralTitle;
  const dialog=container.querySelector('dialog');
  const options=()=>({details:container.querySelector('#mindmap-details').checked,onSelect:selectTopic});
  function selectTopic(topic){
    const host=(dialog.open?dialog:container).querySelector('.mindmap-selection');host.replaceChildren();host.hidden=false;
    const heading=document.createElement('h4'),body=document.createElement('p');heading.textContent=topic.title;body.textContent=topic.details;host.append(heading,body);host.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function viewer(host,large=false) {
    host.replaceChildren();
    const toolbar=document.createElement('div');toolbar.className='mindmap-zoom';
    const viewport=document.createElement('div');viewport.className=large?'mindmap-canvas large':'mindmap-canvas';
    const {svg,width,height}=drawMap(topics,centralTitle,options());viewport.append(svg);
    const view={x:0,y:0,w:width,h:height};
    const apply=()=>svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);
    const reset=()=>{Object.assign(view,{x:0,y:0,w:width,h:height});apply();};
    const zoom=factor=>{
      const w=Math.min(width*2,Math.max(280,view.w*factor)),ratio=w/view.w;
      view.x+=(view.w-w)/2;view.y+=(view.h-view.h*ratio)/2;view.w=w;view.h*=ratio;apply();
    };
    for(const [label,name,action] of [['−','Réduire',()=>zoom(1.3)],['+','Zoomer',()=>zoom(1/1.3)],['↺','Recentrer',reset]]) {
      const button=document.createElement('button');button.type='button';button.className='button secondary';button.textContent=label;button.setAttribute('aria-label',name);button.onclick=action;toolbar.append(button);
    }
    let drag;
    viewport.onpointerdown=event=>{
      if(event.button!==0||event.target.closest('.mindmap-topic'))return;
      const rect=svg.getBoundingClientRect();
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,vx:view.x,vy:view.y,scale:Math.max(view.w/rect.width,view.h/rect.height)};
      viewport.setPointerCapture(event.pointerId);viewport.classList.add('dragging');
    };
    viewport.onpointermove=event=>{if(!drag||event.pointerId!==drag.id)return;view.x=drag.vx-(event.clientX-drag.x)*drag.scale;view.y=drag.vy-(event.clientY-drag.y)*drag.scale;apply();};
    const release=()=>{drag=undefined;viewport.classList.remove('dragging');};
    viewport.onpointerup=release;viewport.onpointercancel=release;viewport.onlostpointercapture=release;
    viewport.addEventListener('wheel',event=>{if(event.ctrlKey){event.preventDefault();zoom(event.deltaY>0?1.12:1/1.12);}},{passive:false});
    host.append(toolbar,viewport);return svg;
  }
  const refresh=()=>{container.querySelectorAll('.mindmap-selection').forEach(node=>{node.hidden=true;});container.querySelector('.mindmap-count').textContent=`${groupTopics(topics).length} thème${groupTopics(topics).length>1?'s':''} · ${topics.length} notion${topics.length>1?'s':''}`;viewer(container.querySelector('.mindmap-view'));if(dialog.open)viewer(container.querySelector('.mindmap-large'),true);};
  container.querySelector('#mindmap-details').onchange=refresh;
  const assignments=container.querySelector('.mindmap-assignments'),names=container.querySelector('#mindmap-theme-names');
  const initialGroups=groupTopics(topics);
  initialGroups.forEach(group=>{const option=document.createElement('option');option.value=group.title;names.append(option);});
  topics.forEach((topic,index)=>{const label=document.createElement('label'),name=document.createElement('span'),field=document.createElement('input');name.textContent=topic.title;field.value=initialGroups.find(group=>group.topics.includes(topic))?.title||'';field.maxLength=80;field.setAttribute('list','mindmap-theme-names');field.setAttribute('aria-label',`Thème de ${topic.title}`);field.dataset.index=index;label.append(name,field);assignments.append(label);});
  container.querySelector('form').onsubmit=event=>{event.preventDefault();assignments.querySelectorAll('input').forEach(field=>{const topic=topics[Number(field.dataset.index)];if(field.value.trim()){topic.theme=field.value.trim();topic.themeSource='manual';}else{delete topic.theme;delete topic.themeSource;}});refresh();document.dispatchEvent(new Event('declic-contentchange'));};
  input.onchange=()=>{centralTitle=input.value.trim()||'Mon cours';input.value=centralTitle;refresh();};
  container.querySelector('[data-action="expand"]').onclick=()=>{viewer(container.querySelector('.mindmap-large'),true);dialog.showModal();};
  container.querySelector('[data-action="close"]').onclick=()=>dialog.close();
  dialog.onclick=event=>{if(event.target===dialog)dialog.close();};
  container.querySelector('[data-action="download"]').onclick=()=>{
    const blob=new Blob([new XMLSerializer().serializeToString(drawMap(topics,centralTitle,{details:true}).svg)],{type:'image/svg+xml;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='declic-carte-mentale.svg';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  refresh();
}
