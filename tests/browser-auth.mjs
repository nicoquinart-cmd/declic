import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4179','--strictPort'],{stdio:'ignore'});
let browser;
try{
 for(let i=0;i<200;i++){try{if((await fetch('http://127.0.0.1:4179/tests/fixtures/account.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4179/tests/fixtures/account.html');await page.waitForFunction(()=>window.authFixture?.ready);
 await page.locator('#google-login').click();await page.waitForFunction(()=>document.querySelector('#auth-feedback-text').textContent.includes('auth/configuration-not-found'));
 assert.equal(await page.locator('#auth-feedback').isVisible(),true);assert.match(await page.locator('#auth-feedback-text').textContent(),/Authentication/);assert.equal(await page.locator('#google-login').isEnabled(),true);assert.equal(await page.evaluate(()=>window.authFixture.calls),1);
 await page.evaluate(()=>{window.authFixture.behavior='blocked';});await page.locator('#google-login').click();await page.waitForFunction(()=>document.querySelector('#auth-feedback-text').textContent.includes('Chrome ou Safari'));
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 if(process.env.AUTH_SCREENSHOT)await page.screenshot({path:process.env.AUTH_SCREENSHOT,fullPage:true});
 await page.evaluate(()=>{window.authFixture.behavior='pending';});await page.locator('#google-login').click();assert.equal(await page.locator('#google-login').getAttribute('aria-busy'),'true');assert.match(await page.locator('#google-login').textContent(),/en cours/);await page.evaluate(()=>window.authFixture.resolveLogin());await page.getByText('Élève test',{exact:true}).waitFor();
 await page.locator('#google-logout').click();await page.waitForFunction(()=>window.authFixture.getClears()===1);assert.equal(await page.evaluate(()=>window.authFixture.getSource()),'');
 await page.goto('http://127.0.0.1:4179/tests/fixtures/account.html?fail=1');await page.waitForFunction(()=>window.authFixture?.ready);assert.equal(await page.locator('#auth-feedback').isVisible(),true);assert.match(await page.locator('#google-login').textContent(),/Réessayer/);assert.equal(await page.locator('#google-login').isEnabled(),true);await page.locator('#google-login').click();await page.waitForFunction(()=>document.querySelector('#google-login').textContent==='Connexion Google');assert.equal(await page.locator('#google-login').isEnabled(),true);
 assert.deepEqual(errors,[]);console.log('OK : erreurs visibles, progression du bouton, fenêtres bloquées, reprise après échec de chargement, mobile et effacement à la déconnexion (authentification simulée).');
}catch(error){console.error(`::error::${error.message.replaceAll('\n',' ')}`);process.exitCode=1;}finally{await browser?.close();server.kill();}
