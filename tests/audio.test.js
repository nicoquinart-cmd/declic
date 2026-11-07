import test from 'node:test';
import assert from 'node:assert/strict';
import {encodeWav,splitSpeech} from '../src/audio/wav.js';
test('découpe les phrases sans perdre les mots ni la ponctuation',()=>{
 const text='Bonjour ! La photosynthèse capte la lumière. '+ 'Les plantes produisent du glucose avec de l’eau. '.repeat(12);
 const chunks=splitSpeech(text,80);
 assert.ok(chunks.every(chunk=>chunk.length<=80));
 assert.equal(chunks.join(' '),text.trim());
});
test('encode un WAV PCM16 mono avec pauses et saturation contrôlée',()=>{
 const buffer=encodeWav([Float32Array.of(-2,0,2),Float32Array.of(0.5)],1000);
 const view=new DataView(buffer);
 assert.equal(new TextDecoder().decode(buffer.slice(0,4)),'RIFF');
 assert.equal(view.getUint32(24,true),1000);
 assert.equal(view.getUint16(22,true),1);
 assert.equal(view.getUint16(34,true),16);
 assert.equal(buffer.byteLength,44+(4+120)*2);
 assert.equal(view.getInt16(44,true),-32768);
 assert.equal(view.getInt16(48,true),32767);
 assert.equal(view.getInt16(50,true),0);
 assert.equal(view.getInt16(buffer.byteLength-2,true),16384);
});
