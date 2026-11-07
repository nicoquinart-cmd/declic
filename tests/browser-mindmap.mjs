import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4177','--strictPort'],{env:{...process.env,DEPLOY_BASE:'/declic/'},stdio:'ignore'});
let browser;
try{
 for(let i=0;i<200;i++){try{if((await fetch('http://127.0.0.1:4177/declic/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4177/declic/');await page.locator('#engine').selectOption('simple');
 await page.locator('#source').fill('La photosynthèse transforme la lumière en énergie chimique pour les plantes. La chlorophylle absorbe la lumière du soleil dans les chloroplastes. Les plantes absorbent le carbone et utilisent de l’eau pour produire du glucose. Le glucose constitue une source d’énergie importante. Les chloroplastes sont des organites présents dans les cellules végétales.');
 await page.locator('#generate').click();await page.getByRole('tab',{name:'Carte mentale'}).click();
 const svg=page.locator('.mindmap-view svg');
 const branches=await svg.locator('.mindmap-topic').count();assert.ok(branches>=2);
 const themes=await svg.locator('.mindmap-theme').count();assert.ok(themes>=2);assert.ok(themes<branches,'Les notions proches doivent partager des thématiques.');assert.equal(await svg.locator('.mindmap-link').count(),branches+themes);assert.equal(await svg.locator('.mindmap-detail').count(),branches);
 const overflow=await svg.evaluate(svg=>[...svg.querySelectorAll('.mindmap-theme,.mindmap-topic,.mindmap-root')].some(g=>{const r=g.querySelector('rect').getBBox();return [...g.querySelectorAll('text')].some(text=>{const t=text.getBBox();return t.x<r.x-1||t.y<r.y-1||t.x+t.width>r.x+r.width+1||t.y+t.height>r.y+r.height+1;});}));assert.equal(overflow,false,'Le texte doit rester dans les nœuds.');
 await page.locator('#mindmap-title').fill('Biologie végétale');await page.locator('#mindmap-title').press('Tab');assert.match((await svg.locator('.mindmap-root tspan').allTextContents()).join(' '),/Biologie végétale/);
 const initial=await svg.getAttribute('viewBox');await page.locator('.mindmap-view').getByRole('button',{name:'Zoomer',exact:true}).click();assert.notEqual(await svg.getAttribute('viewBox'),initial);
 const canvas=page.locator('.mindmap-view .mindmap-canvas');await canvas.scrollIntoViewIfNeeded();const bounds=await canvas.boundingBox();const zoomed=await svg.getAttribute('viewBox');await page.mouse.move(bounds.x+100,bounds.y+100);await page.mouse.down();await page.mouse.move(bounds.x+160,bounds.y+125);await page.mouse.up();assert.notEqual(await svg.getAttribute('viewBox'),zoomed);
 await page.locator('.mindmap-view').getByRole('button',{name:'Recentrer'}).click();assert.equal(await svg.getAttribute('viewBox'),initial);
 await page.getByRole('button',{name:'Agrandir'}).click();await page.locator('dialog').waitFor({state:'visible'});assert.equal(await page.locator('dialog .mindmap-topic').count(),branches);
 if(process.env.MINDMAP_SCREENSHOT)await page.screenshot({path:process.env.MINDMAP_SCREENSHOT,fullPage:true});
 await page.getByRole('button',{name:'Fermer',exact:true}).click();assert.equal(await page.locator('dialog').isVisible(),false);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'SVG'}).click();const file=await download;assert.equal(file.suggestedFilename(),'declic-carte-mentale.svg');const path=await file.path();const contents=await readFile(path,'utf8');
 assert.match(contents,/Biologie végétale/);assert.ok(!contents.includes('<script'));
 const parsed=await page.evaluate(xml=>{const doc=new DOMParser().parseFromString(xml,'image/svg+xml');return {errors:doc.querySelectorAll('parsererror').length,branches:doc.querySelectorAll('.mindmap-topic').length};},contents);assert.equal(parsed.errors,0);assert.equal(parsed.branches,branches);
 await page.locator('#mindmap-title').fill('<img src=x onerror=alert(1)>');await page.locator('#mindmap-title').press('Tab');assert.equal(await page.locator('#mindmap img').count(),0);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.getByRole('button',{name:'Agrandir'}).click();assert.ok(await page.locator('dialog').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').isVisible(),false);assert.deepEqual(errors,[]);
 console.log('OK : branches reliées, textes contenus dans les nœuds, sujet modifiable, zoom, déplacement, vue agrandie, SVG et mobile.');
}catch(error){console.error(`::error::${String(error.message).replaceAll('\n',' ')}`);process.exitCode=1;}
finally{await browser?.close();server.kill();}
