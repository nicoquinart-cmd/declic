import {mkdir,copyFile,readdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const dest=new URL('public/ocr/',root);
await mkdir(dest,{recursive:true});
const files=[['tesseract.js/dist/worker.min.js','worker.min.js'],['tesseract.js-core/tesseract-core-lstm.wasm.js','tesseract-core-lstm.wasm.js']];
for(const lang of ['fra','eng'])files.push([`@tesseract.js-data/${lang}/4.0.0/${lang}.traineddata.gz`,`${lang}.traineddata.gz`]);
for(const [source,target] of files)await copyFile(fileURLToPath(new URL(`node_modules/${source}`,root)),fileURLToPath(new URL(target,dest)));

// Keep the inference runtime local; no CDN script is needed in the browser.
const aiDest=new URL('public/ai/',root);
await mkdir(aiDest,{recursive:true});
const runtime=new URL('node_modules/onnxruntime-web/dist/',root);
for(const name of await readdir(runtime)) {
  if(name.startsWith('ort-wasm') && (name.endsWith('.wasm') || name.endsWith('.mjs')))
    await copyFile(new URL(name,runtime),new URL(name,aiDest));
}

const speechDest=new URL('public/speech/',root);
await mkdir(speechDest,{recursive:true});
const piperRoot=new URL('node_modules/@diffusionstudio/piper-wasm/build/',root);
for(const name of ['piper_phonemize.wasm','piper_phonemize.data'])
  await copyFile(new URL(name,piperRoot),new URL(name,speechDest));
const factory=await readFile(new URL('piper_phonemize.js',piperRoot),'utf8');
await writeFile(new URL('piper.js',speechDest),factory+'\nexport { createPiperPhonemize };\n');
