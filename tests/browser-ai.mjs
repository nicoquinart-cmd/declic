import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const offline=process.argv.includes('--offline');
const simulated=process.argv.includes('--simulate');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4175','--strictPort'],{env:{...process.env,DEPLOY_BASE:'/declic/'},stdio:'ignore'});
let browser;
const course='La photosynthèse permet aux plantes de transformer la lumière en énergie chimique. La chlorophylle, présente dans les chloroplastes, capte la lumière. Les plantes utilisent de l’eau et du dioxyde de carbone pour produire du glucose et libèrent du dioxygène.';
try{
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Le serveur ne démarre pas.')),20000);
    const poll=async()=>{try{if((await fetch('http://127.0.0.1:4175/declic/')).ok){clearTimeout(timer);resolve();return;}}catch{}setTimeout(poll,100);};poll();
  });
  browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
  const page=await browser.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  if(offline) await page.route('https://huggingface.co/**',route=>route.abort('internetdisconnected'));
  if(simulated) await page.addInitScript(()=>{
    window.Worker=class {
      postMessage(){this.timer=setTimeout(()=>this.onmessage({data:{type:'result',revisions:{summary:'La photosynthèse utilise la lumière.',cards:[{question:'Que capte la chlorophylle ?',answer:'La lumière.'}],topics:[{title:'Chlorophylle',details:'Elle capte la lumière.'}],audio:'Les plantes utilisent la lumière.'}}}),200);}
      terminate(){clearTimeout(this.timer);}
    };
  });
  await page.goto('http://127.0.0.1:4175/declic/');
  assert.equal(await page.locator('#engine').inputValue(),'browser');
  assert.equal(await page.locator('option[value=ollama]').count(),0);
  await page.locator('#source').fill('a'.repeat(12001));
  await page.locator('#generate').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('12'));
  assert.equal(await page.locator('#generate').isEnabled(),true);
  await page.locator('#source').fill(course);
  await page.locator('#generate').click();
  if(!simulated){
    await page.waitForFunction(()=>!document.querySelector('#generate').disabled,null,{timeout:720000});
  }else await page.getByText('L’essentiel de ton cours').waitFor();
  const status=await page.locator('#status').innerText();
  if(offline){
    assert.match(status,/IA indisponible|Impossible de démarrer/);
    assert.equal(await page.locator('.mode').count(),0);
  }else{
    assert.match(status,/révisions sont prêtes/,status);
    assert.match(await page.locator('.mode').innerText(),/IA sur cet appareil/);
    assert.match(await page.locator('.prose').innerText(),/photosynth|chloroph|glucose/i);
    await page.getByRole('tab',{name:'Fiches'}).click();assert.ok(await page.locator('details').count()>0);
    await page.getByRole('tab',{name:'Carte'}).click();assert.ok(await page.locator('.mindmap-topic').count()>0);
    await page.getByRole('tab',{name:'Audio'}).click();assert.ok(await page.locator('.prose').innerText());
  }
  assert.equal(await page.locator('#cancel-ai').isHidden(),true);
  assert.equal(await page.locator('#engine').isEnabled(),true);
  if(simulated){
    await page.locator('#generate').click();await page.locator('#cancel-ai').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('annulée'));
    assert.equal(await page.locator('#generate').isEnabled(),true);
  }
  await page.locator('#engine').selectOption('simple');await page.locator('#generate').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('révisions sont prêtes'));
  assert.match(await page.locator('.mode').innerText(),/sans IA/);
  assert.deepEqual(pageErrors,[]);
  console.log(offline?'OK : panne de téléchargement signalée, sans faux résultat IA ; mode Essentiel utilisable.':simulated?'OK : interface IA avec worker simulé, résultat, annulation, limite et mode Essentiel.':'OK : véritable modèle chargé dans Chrome, résumé, fiches, carte et script audio générés.');
}catch(error){
  console.error(`::error::${String(error.message).replaceAll('\n',' ')}`);
  process.exitCode=1;
}finally{await browser?.close();server.kill();}
