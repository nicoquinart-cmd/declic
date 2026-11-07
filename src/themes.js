const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
// Used when the source has no theme labels (notably the non-AI mode).
const CATEGORIES = [
  ['Ressources et conditions', /lumiere|energie|eau|carbone|ressource|condition|besoin|facteur|temperature|climat|milieu/g],
  ['Acteurs et structures', /chlorophylle|chloroplaste|cellule|organe|structure|plante|acteur|institution|personnage|population|systeme/g],
  ['Fonctionnement et mécanismes', /photosynthese|processus|mecanisme|fonctionnement|transformation|reaction|cycle|etape|evolution|revolution/g],
  ['Résultats et conséquences', /glucose|produit|resultat|consequence|effet|impact|bilan|dioxygene/g],
  ['Repères et contexte', /date|siecle|periode|chronologie|guerre|regne|contexte|epoque/g],
  ['Méthodes et applications', /formule|calcul|equation|methode|theoreme|propriete|demonstration|application|exercice/g],
  ['Définitions et principes', /definition|concept|notion|signifie|designe|principe|caracteristique/g],
].map(([name,pattern])=>[name,new RegExp('\\b(?:'+pattern.source+')\\w*\\b','g')]);
function inferTheme(topic) {
  const title=normalize(topic.title),details=normalize(topic.details);
  let best='Notions fondamentales',score=0;
  for(const [name,pattern] of CATEGORIES) {
    const candidate=(title.match(pattern)?.length||0)*20+(details.match(pattern)?.length||0);
    if(candidate>score){best=name;score=candidate;}
  }
  return best;
}
export function groupTopics(topics) {
  const groups=new Map();
  for(const topic of topics) {
    const title=typeof topic.theme==='string' && topic.theme.trim()?topic.theme.trim():inferTheme(topic);
    const key=normalize(title) || 'notions fondamentales';
    if(!groups.has(key))groups.set(key,{title,topics:[]});
    groups.get(key).topics.push(topic);
  }
  return [...groups.values()];
}
export function thematicMarkdown(topics) {
  return groupTopics(topics).map(group=>`## ${group.title}\n\n${group.topics.map(topic=>`### ${topic.title}\n${topic.details}`).join('\n\n')}`).join('\n\n');
}
