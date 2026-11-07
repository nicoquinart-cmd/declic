import regularUrl from '../assets/fonts/DejaVuSans.ttf?url';
import boldUrl from '../assets/fonts/DejaVuSans-Bold.ttf?url';
let fonts,preparedUrl;
async function loadFonts(){
  fonts ||= Promise.all([regularUrl,boldUrl].map(async url=>{
    const response=await fetch(url);if(!response.ok)throw Error('La police du PDF n’a pas pu être chargée. Vérifie ta connexion puis réessaie.');
    const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(binary);
  })).catch(error=>{fonts=undefined;throw error;});
  return fonts;
}
export async function createSheetsPdf(sheets,courseTitle='Mes révisions'){
  if(!sheets.length||!sheets.some(sheet=>sheet.notes.trim()||sheet.sections.some(section=>section.content.trim())))throw Error('Ajoute du contenu à une fiche avant de télécharger le PDF.');
  const [{jsPDF},[regular,bold]]=await Promise.all([import('jspdf'),loadFonts()]);
  const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});
  pdf.addFileToVFS('DejaVuSans.ttf',regular);pdf.addFont('DejaVuSans.ttf','Declic','normal');pdf.addFileToVFS('DejaVuSans-Bold.ttf',bold);pdf.addFont('DejaVuSans-Bold.ttf','Declic','bold');
  pdf.setProperties({title:courseTitle,author:'Déclic',subject:'Fiches de révision'});
  let y=30;
  const header=()=>{
    pdf.setFont('Declic','bold');pdf.setFontSize(9);pdf.setTextColor(67,94,48);pdf.text('DÉCLIC · FICHES DE RÉVISION',20,15);pdf.setDrawColor(212,224,199);pdf.line(20,19,190,19);y=30;
  };
  const nextPage=()=>{pdf.addPage();header();};
  const write=(text,size=10.5,bold=false,color=[56,68,50])=>{
    pdf.setFont('Declic',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...color);
    const lines=pdf.splitTextToSize(String(text).replace(/\r\n/g,'\n'),168);
    const leading=size*.3528*1.5;
    for(const line of lines){if(y+leading>276){nextPage();pdf.setFont('Declic',bold?'bold':'normal');pdf.setFontSize(size);pdf.setTextColor(...color);}pdf.text(line,20,y);y+=leading;}
  };
  header();
  sheets.forEach((sheet,index)=>{
    if(index)nextPage();
    write(`FICHE ${String(index+1).padStart(2,'0')}`,9,true,[117,140,91]);y+=3;
    write(sheet.title||'Fiche sans titre',20,true);y+=7;
    for(const section of sheet.sections){
      if(!section.title.trim()&&!section.content.trim())continue;
      if(y>248)nextPage();write(section.title||'À retenir',12,true);y+=2;write(section.content);y+=7;
    }
    if(sheet.notes.trim()){if(y>246)nextPage();write('Mes notes et exemples',12,true);y+=2;write(sheet.notes);}
  });
  const pages=pdf.getNumberOfPages();
  for(let page=1;page<=pages;page++){pdf.setPage(page);pdf.setFont('Declic','normal');pdf.setFontSize(8);pdf.setTextColor(124,137,112);pdf.text('Révisions personnelles · Déclic',20,287);pdf.text(`${page} / ${pages}`,190,287,{align:'right'});}
  return pdf.output('blob');
}
export async function downloadSheetsPdf(sheets,title){
  const blob=await createSheetsPdf(sheets,title);if(preparedUrl)URL.revokeObjectURL(preparedUrl);preparedUrl=URL.createObjectURL(blob);const link=document.createElement('a');link.href=preparedUrl;link.download='declic-fiches-revision.pdf';link.click();return preparedUrl;
}
