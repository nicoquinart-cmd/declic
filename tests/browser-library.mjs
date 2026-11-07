import {chromium} from 'playwright-core';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4178','--strictPort'],{env:{...process.env,DEPLOY_BASE:'/declic/'},stdio:'ignore'});
let browser;
try{
 for(let i=0;i<200;i++){try{if((await fetch('http://127.0.0.1:4178/declic/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),headless:true,args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4178/declic/');await page.locator('#course-title').waitFor();
 await page.locator('#engine').selectOption('simple');const source='La photosynthèse permet aux plantes de capter la lumière du soleil. Les chloroplastes contiennent de la chlorophylle. Les plantes produisent du glucose et libèrent du dioxygène.';await page.locator('#source').fill(source);await page.locator('#course-title').fill('Biologie');await page.locator('#generate').click();await page.getByText('L’essentiel de ton cours').waitFor();
 await page.locator('#save-course').click();await page.waitForFunction(()=>document.querySelector('#account-status').textContent.includes('Cours enregistré'));
 await page.reload();await page.locator('#show-library').click();await page.getByRole('heading',{name:'Biologie',exact:true}).waitFor();await page.getByRole('button',{name:'Ouvrir',exact:true}).click();await page.locator('.library-dialog').waitFor({state:'hidden'});assert.equal(await page.locator('#source').inputValue(),source);await page.getByText('L’essentiel de ton cours').waitFor();
 await page.locator('#course-title').fill('Biologie — édition 2');await page.locator('#save-course').click();await page.waitForFunction(()=>document.querySelector('#account-status').textContent.includes('Cours enregistré'));
 await page.locator('#show-library').click();await page.getByRole('heading',{name:'Biologie — édition 2'}).waitFor();assert.equal(await page.locator('.saved-course').count(),1);
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Supprimer',exact:true}).click();await page.getByText('Aucun cours enregistré pour le moment.').waitFor();assert.equal(await page.locator('.saved-course').count(),0);
 assert.deepEqual(errors,[]);console.log('OK : sauvegarde locale, persistance après rechargement, restauration des notes et révisions, mise à jour sans doublon et suppression.');
}catch(error){console.error(`::error::${error.message.replaceAll('\n',' ')}`);process.exitCode=1;}finally{await browser?.close();server.kill();}
