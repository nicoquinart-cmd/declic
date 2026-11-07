import {mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const dest=new URL('public/ocr/',root);
await mkdir(dest,{recursive:true});
const files=[['tesseract.js/dist/worker.min.js','worker.min.js'],['tesseract.js-core/tesseract-core-lstm.wasm.js','tesseract-core-lstm.wasm.js']];
for(const lang of ['fra','eng'])files.push([`@tesseract.js-data/${lang}/4.0.0/${lang}.traineddata.gz`,`${lang}.traineddata.gz`]);
for(const [source,target] of files)await copyFile(fileURLToPath(new URL(`node_modules/${source}`,root)),fileURLToPath(new URL(target,dest)));
