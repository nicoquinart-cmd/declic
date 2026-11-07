const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const STOP = new Set(('alors ainsi apres assez aussi autre autres avec avoir avant beaucoup bien cette celles celui ceux chaque comme comment dans depuis donc elle elles encore entre etre fait faire faut leur leurs mais meme moins notre nous parce parmi plus pour pourquoi quand quelle quelles quels sans selon sera sont sous tout tous toute toutes tres une vers voici votre vous cours notion notions information informations essentiel essentielles permet permettent utilise utilisent produit constitue exemple notamment important importante cela ces des est les par pas que qui ses son sur aux du et au un il on ce se sa le la en de ne ou a y').split(' '));
function words(text) {
  return normalize(text).split(/\s+/).filter(word=>word.length>2&&!STOP.has(word)).map(word=>word.length>4?word.replace(/s$/,''):word);
}
function placeholder(title) {
  return /^(?:(?:premier|deuxieme|second|autre|meme|nom du) theme|theme(?: \d+)?|thematique(?: \d+)?|notions fondamentales|notions essentielles|sous titre)$/.test(normalize(title));
}
function vectors(topics) {
  const counts=topics.map(topic=>{
    const result=new Map();
    for(const word of words(topic.title))result.set(word,(result.get(word)||0)+3);
    for(const word of words(topic.details))result.set(word,(result.get(word)||0)+1);
    return result;
  });
  const frequencies=new Map();
  for(const count of counts)for(const key of count.keys())frequencies.set(key,(frequencies.get(key)||0)+1);
  return counts.map(count=>new Map([...count].map(([key,weight])=>[key,Math.log1p(weight)*Math.log(1+topics.length/(frequencies.get(key)||1))])));
}
function similarity(a,b) {
  let dot=0,aa=0,bb=0;
  for(const [key,value] of a){dot+=value*(b.get(key)||0);aa+=value*value;}
  for(const value of b.values())bb+=value*value;
  return aa&&bb?dot/Math.sqrt(aa*bb):0;
}
function inferredGroups(topics) {
  if(!topics.length)return [];
  const embeddings=vectors(topics),clusters=topics.map((_,index)=>[index]);
  // Merge only when every pair shares meaningful vocabulary. A chain of weak
  // similarities must not pull an entire course into a generic catch-all group.
  while(clusters.length>1){
    let best=0.2,pair;
    for(let a=0;a<clusters.length;a++)for(let b=a+1;b<clusters.length;b++){
      const scores=clusters[a].flatMap(i=>clusters[b].map(j=>similarity(embeddings[i],embeddings[j])));
      const score=Math.min(...scores);
      if(score>best){best=score;pair=[a,b];}
    }
    if(!pair)break;
    const [a,b]=pair;clusters[a].push(...clusters[b]);clusters.splice(b,1);
  }
  return clusters.sort((a,b)=>Math.min(...a)-Math.min(...b)).map(indices=>{
    const members=indices.sort((a,b)=>a-b).map(index=>topics[index]);
    if(members.length===1)return{title:members[0].title,topics:members};
    // Labels come from this course, rather than a predefined subject taxonomy.
    const titles=members.map(topic=>topic.title.replace(/[.!?]+$/,'').trim());
    const title=titles.slice(0,2).join(' · ')+(titles.length>2?'…':'');
    return{title,topics:members};
  });
}
export function groupTopics(topics) {
  const explicit=new Map(),unlabelled=[];
  topics.forEach((topic,index)=>{
    if(typeof topic.theme==='string'&&topic.theme.trim()&&(topic.themeSource==='manual'||!placeholder(topic.theme))){
      const title=topic.theme.trim(),key=normalize(title);
      if(!explicit.has(key))explicit.set(key,{title,topics:[],order:index});
      explicit.get(key).topics.push(topic);
    }else unlabelled.push(topic);
  });
  const groups=[...explicit.values(),...inferredGroups(unlabelled).map(group=>({...group,order:topics.indexOf(group.topics[0])}))];
  if(groups.length===1&&groups[0].topics.length>=4&&!groups[0].topics.some(topic=>topic.themeSource==='manual')){const alternatives=inferredGroups(groups[0].topics);if(alternatives.length>1)return alternatives;}
  return groups.sort((a,b)=>a.order-b.order).map(({title,topics})=>({title,topics}));
}
export function thematicMarkdown(topics) {
  return groupTopics(topics).map(group=>`## ${group.title}\n\n${group.topics.map(topic=>`### ${topic.title}\n${topic.details}`).join('\n\n')}`).join('\n\n');
}
