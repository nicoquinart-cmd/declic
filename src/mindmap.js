import { groupTopics } from './themes.js';
const NS = 'http://www.w3.org/2000/svg';
const COLORS = [
  {line:'#819955',fill:'#edf3e2'}, {line:'#539994',fill:'#e5f4f1'},
  {line:'#aa82b7',fill:'#f3eaf7'}, {line:'#ca9452',fill:'#fff2df'},
  {line:'#7395c1',fill:'#e9f0fb'}, {line:'#c08289',fill:'#fbecef'},
];
let centralTitle = 'Mon cours';
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
function drawMap(topics,title) {
  const entries=groupTopics(topics).map((group,index)=>({
    title:wrap(group.title,150,17,true),name:group.title,color:COLORS[index%COLORS.length],side:index%2?'right':'left',
    topics:group.topics.map(topic=>({title:wrap(topic.title,236,15,true),details:wrap(topic.details,236,14)})),
  }));
  for(const entry of entries) {
    for(const topic of entry.topics)topic.height=topic.title.length*20+topic.details.length*19+44;
    entry.themeHeight=Math.max(72,entry.title.length*22+30);
    entry.height=Math.max(entry.themeHeight,entry.topics.reduce((sum,topic)=>sum+topic.height+24,0)-24);
  }
  const groups={left:entries.filter(entry=>entry.side==='left'),right:entries.filter(entry=>entry.side==='right')};
  const total=side=>Math.max(0,groups[side].reduce((sum,entry)=>sum+entry.height+60,0)-60);
  const rootLines=wrap(title,160,19,true),rootHeight=Math.max(84,rootLines.length*24+30);
  const width=1460,height=Math.max(460,total('left')+80,total('right')+80,rootHeight+80);
  const svg=element('svg',{xmlns:NS,viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':`Carte mentale : ${title}`,class:'mindmap-svg'});
  svg.append(element('title',{},`Carte mentale : ${title}`));
  svg.append(element('desc',{},'Sujet central : '+title+'. '+groupTopics(topics).map(group=>'Thématique : '+group.title+'. '+group.topics.map(topic=>topic.title+' : '+topic.details).join(' ')).join(' ')));
  svg.append(element('rect',{width,height,fill:'#fcfdf9'}));
  const links=element('g',{'aria-hidden':'true'}),nodes=element('g');svg.append(links,nodes);
  const box=(x,y,w,h,lines,color,size=16,bold=false,kind='')=>{
    const group=element('g',{class:kind});
    group.append(element('rect',{x,y,width:w,height:h,rx:16,fill:color.fill,stroke:color.line,'stroke-width':1.5}));
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
    const group=element('g',{class:'mindmap-topic'});
    group.append(element('rect',{x,y,width:270,height:topic.height,rx:16,fill:'#fff',stroke:color.line,'stroke-width':1.5}));
    const heading=element('text',{'font-family':'Arial, sans-serif','font-size':15,'font-weight':600,fill:'#344238','text-anchor':'middle',class:'mindmap-subtitle'});
    topic.title.forEach((line,index)=>heading.append(element('tspan',{x:x+135,y:y+24+index*20},line.trim())));
    group.append(heading,element('line',{x1:x+16,x2:x+254,y1:y+topic.title.length*20+15,y2:y+topic.title.length*20+15,stroke:color.line,'stroke-opacity':0.3}));
    const detail=element('text',{'font-family':'Arial, sans-serif','font-size':14,fill:'#4d5b4e','text-anchor':'middle',class:'mindmap-detail'});
    topic.details.forEach((line,index)=>detail.append(element('tspan',{x:x+135,y:y+topic.title.length*20+38+index*19},line.trim())));
    group.append(detail);nodes.append(group);
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
  container.innerHTML=`<div class="mindmap-toolbar"><label>Sujet central<input id="mindmap-title" maxlength="80" aria-label="Sujet central de la carte mentale"></label><button class="button secondary" data-action="expand">⤢ Agrandir</button><button class="button secondary" data-action="download">↓ SVG</button></div><p class="hint">Sujet → Thématiques → Sous-titres → Explications. Les notions sont regroupées automatiquement ; vérifie le classement avec ton cours. Agrandis la carte pour lire les branches.</p><div class="mindmap-view"></div><dialog class="mindmap-dialog"><div class="mindmap-dialog-header"><h3>Ta carte mentale</h3><button class="button secondary" data-action="close">Fermer</button></div><div class="mindmap-large"></div></dialog>`;
  const input=container.querySelector('#mindmap-title');input.value=centralTitle;
  const dialog=container.querySelector('dialog');
  function viewer(host,large=false) {
    host.replaceChildren();
    const toolbar=document.createElement('div');toolbar.className='mindmap-zoom';
    const viewport=document.createElement('div');viewport.className=large?'mindmap-canvas large':'mindmap-canvas';
    const {svg,width,height}=drawMap(topics,centralTitle);viewport.append(svg);
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
      if(event.button!==0)return;
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
  const refresh=()=>{viewer(container.querySelector('.mindmap-view'));if(dialog.open)viewer(container.querySelector('.mindmap-large'),true);};
  input.onchange=()=>{centralTitle=input.value.trim()||'Mon cours';input.value=centralTitle;refresh();};
  container.querySelector('[data-action="expand"]').onclick=()=>{viewer(container.querySelector('.mindmap-large'),true);dialog.showModal();};
  container.querySelector('[data-action="close"]').onclick=()=>dialog.close();
  dialog.onclick=event=>{if(event.target===dialog)dialog.close();};
  container.querySelector('[data-action="download"]').onclick=()=>{
    const blob=new Blob([new XMLSerializer().serializeToString(drawMap(topics,centralTitle).svg)],{type:'image/svg+xml;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='declic-carte-mentale.svg';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  refresh();
}
