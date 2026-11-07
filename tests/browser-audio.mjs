import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const simulated=process.argv.includes('--simulate'),offline=process.argv.includes('--offline');
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4176','--strictPort'],{env:{...process.env,DEPLOY_BASE:'/declic/'},stdio:'ignore'});
let browser,page;
try{
 for(let i=0;i<200;i++){try{if((await fetch('http://127.0.0.1:4176/declic/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(offline)await page.route('https://huggingface.co/**',route=>route.abort('internetdisconnected'));
 if(simulated)await page.addInitScript(()=>{window.Worker=class{
   postMessage(){this.timer=setTimeout(()=>{const buffer=new ArrayBuffer(44+16000);const v=new DataView(buffer);const str=(i,s)=>[...s].forEach((c,j)=>v.setUint8(i+j,c.charCodeAt(0)));str(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,16000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,16000,true);for(let i=0;i<8000;i++)v.setInt16(44+i*2,Math.sin(i*.35)*10000,true);this.onmessage({data:{type:'result',wav:buffer}});},300);}
   terminate(){clearTimeout(this.timer);}
 };});
 await page.goto('http://127.0.0.1:4176/declic/');await page.locator('#engine').selectOption('simple');await page.locator('#source').fill('La photosynthèse permet aux plantes de capter la lumière du soleil pour produire leur énergie.');await page.locator('#generate').click();await page.getByRole('tab',{name:'Audio'}).click();
 assert.equal(await page.locator('#audio-engine').inputValue(),'natural');assert.equal(await page.locator('#audio-speed').inputValue(),'1.08');
 await page.locator('#play').click();
 if(simulated){await page.locator('#stop').click();await page.waitForFunction(()=>!document.querySelector('#play').disabled);await page.locator('#play').click();}
 await page.waitForFunction(()=>!document.querySelector('#play').disabled,null,{timeout:360000});
 const status=await page.locator('#audio-status').innerText();
 if(offline){assert.match(status,/refusé|fetch|voix naturelle ne peut|réseau|network/i);assert.equal(await page.locator('#podcast-player').isHidden(),true);}
 else{
  assert.equal(await page.locator('#podcast-player').isVisible(),true,status);
  const result=await page.evaluate(async()=>{const response=await fetch(document.querySelector('#podcast-player').src);const buffer=await response.arrayBuffer();const context=new AudioContext();const audio=await context.decodeAudioData(buffer);const signal=audio.getChannelData(0);let peak=0;for(const sample of signal)peak=Math.max(peak,Math.abs(sample));const result={duration:audio.duration,peak};await context.close();return result;});
  assert.ok(result.duration>.5,JSON.stringify(result));assert.ok(result.peak>.01,JSON.stringify(result));
  const download=page.waitForEvent('download');await page.locator('#audio-download').click();assert.equal((await download).suggestedFilename(),'declic-podcast.wav');
  await page.locator('#audio-speed').selectOption('0.94');assert.equal(await page.locator('#podcast-player').isHidden(),true);
 }
 await page.locator('#audio-engine').selectOption('system');assert.equal(await page.locator('#system-voice').isVisible(),true);
 await page.getByRole('tab',{name:'Résumé'}).click();assert.deepEqual(errors,[]);
 console.log(offline?'OK : erreur réseau audio et accès aux voix système.':simulated?'OK : contrôles audio, annulation, WAV, vitesse et voix système avec worker simulé.':'OK : vraie voix neuronale française, WAV décodable, signal audible et téléchargement.');
}catch(error){console.error(`::error::${String(error.message).replaceAll('\n',' ')} ${await page?.locator('#audio-status').innerText().catch(()=> '')||''}`);process.exitCode=1;}
finally{await browser?.close();server.kill();}
