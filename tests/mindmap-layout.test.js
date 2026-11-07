import test from 'node:test';
import assert from 'node:assert/strict';
import {balanceBranches} from '../src/mindmap-layout.js';
test('répartit une seule grande classe sur les deux côtés sans perdre une notion',()=>{
 const topics=Array.from({length:7},(_,id)=>({id,height:70+id*15}));const entries=[{name:'Classe unique',themeHeight:72,topics}];const result=balanceBranches(entries);
 assert.equal(new Set(result.map(entry=>entry.side)).size,2);assert.equal(result.filter(entry=>entry.continuation).length,1);assert.deepEqual(result.flatMap(entry=>entry.topics).map(topic=>topic.id).sort(),topics.map(topic=>topic.id));assert.equal(entries[0].side,undefined);
});
test('équilibre le volume du contenu plutôt que le nombre de thèmes',()=>{
 const entries=[{name:'Important',themeHeight:72,topics:[{height:400},{height:300},{height:200},{height:100}]},{name:'Court',themeHeight:72,topics:[{height:80}]}];const result=balanceBranches(entries);
 const height=side=>result.filter(entry=>entry.side===side).reduce((n,entry)=>n+entry.height+60,0);
 assert.ok(Math.abs(height('left')-height('right'))<300);assert.equal(result.flatMap(entry=>entry.topics).length,5);
});

test('équilibre trois thèmes de deux notions sans changer leur classe',()=>{
 const entries=Array.from({length:3},(_,index)=>({name:'Thème '+index,themeHeight:72,topics:[{id:index*2,height:72},{id:index*2+1,height:72}]}));
 const result=balanceBranches(entries),sum=side=>result.filter(entry=>entry.side===side).reduce((n,entry)=>n+entry.height+60,0);
 assert.equal(sum('left'),sum('right'));assert.equal(new Set(result.flatMap(entry=>entry.topics.map(topic=>topic.id))).size,6);
});
