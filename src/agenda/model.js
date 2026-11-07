export function validateEvent(input){
 const title=typeof input?.title==='string'?input.title.trim():'',subject=typeof input?.subject==='string'?input.subject.trim():'',themes=typeof input?.themes==='string'?input.themes.trim():'';
 if(!title||title.length>120)throw Error('Indique un titre de 120 caractères maximum.');
 if(!subject||subject.length>120)throw Error('Indique une matière de 120 caractères maximum.');
 if(themes.length>3000)throw Error('Limite les thèmes à 3 000 caractères.');
 const date=input?.date;
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'2000-01-01'||date>'2100-12-31'||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Choisis une date valide entre 2000 et 2100.');
 return {title,subject,themes,date};
}
export function localDay(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
export function nextEvent(events,today=localDay()){return [...events].filter(event=>event.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title,'fr'))[0]||null;}
export function daysUntil(date,today=localDay()){return Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);}
export function readEvents(storage,key){const raw=storage.getItem(key);if(!raw)return [];const data=JSON.parse(raw);if(!Array.isArray(data)||data.length>500)throw Error('Agenda illisible.');return data.map(event=>{if(typeof event.id!=='string'||!event.id)throw Error('Agenda illisible.');return {...validateEvent(event),id:event.id};});}
