const height=entry=>Math.max(entry.themeHeight||0,entry.topics.reduce((n,topic)=>n+topic.height,0)+24*Math.max(0,entry.topics.length-1));
export function balanceBranches(entries) {
  let branches=entries.map((entry,index)=>({...entry,topics:[...entry.topics],order:index,continuation:false}));
  const total=branches.reduce((n,entry)=>n+height(entry),0);
  const largest=branches.reduce((best,entry)=>!best||height(entry)>height(best)?entry:best,null);
  // Keep semantic classes intact. A disproportionately large class gets two
  // display branches with the same colour, explicitly marked as a continuation.
  if(largest&&largest.topics.length>1&&(branches.length===1||height(largest)>total*.58)){
    const halves=[[],[]],weights=[0,0];
    [...largest.topics].sort((a,b)=>b.height-a.height).forEach(topic=>{const side=weights[0]<=weights[1]?0:1;halves[side].push(topic);weights[side]+=topic.height+24;});
    branches=branches.filter(entry=>entry!==largest);
    halves.forEach((topics,index)=>branches.push({...largest,topics:largest.topics.filter(topic=>topics.includes(topic)),continuation:index===1,order:largest.order+index*.01}));
  }
  const weights={left:0,right:0};
  branches.sort((a,b)=>height(b)-height(a)||a.order-b.order);
  for(const entry of branches){entry.side=weights.left<=weights.right?'left':'right';entry.height=height(entry);weights[entry.side]+=entry.height+60;}
  const heavy=weights.left>weights.right?'left':'right',light=heavy==='left'?'right':'left';
  let improvement=Math.abs(weights.left-weights.right),candidate;
  for(const entry of branches.filter(entry=>entry.side===heavy&&entry.topics.length>1)){
    for(let cut=1;cut<entry.topics.length;cut++){
      const a={...entry,topics:entry.topics.slice(0,cut)},b={...entry,topics:entry.topics.slice(cut),side:light,continuation:true,order:entry.order+.01};
      a.height=height(a);b.height=height(b);
      const difference=Math.abs(weights[heavy]-entry.height+a.height-(weights[light]+b.height+60));
      if(difference+5<improvement){improvement=difference;candidate={entry,a,b};}
    }
  }
  if(candidate){branches=branches.filter(entry=>entry!==candidate.entry);branches.push(candidate.a,candidate.b);}
  return branches.sort((a,b)=>a.order-b.order);
}
