import {env, InferenceSession, Tensor} from 'onnxruntime-web';
import {encodeWav, splitSpeech} from './wav.js';

// Piper's documented ONNX inputs, also used by diffusion-studio/vits-web (MIT).
const MODEL_URL = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/siwis/medium/fr_FR-siwis-medium.onnx';
let session, config;
async function cachedFile(url) {
  let cache;
  try { cache = await caches.open('declic-french-voice-v1'); const hit = await cache.match(url); if (hit) return hit; } catch { /* Storage can be unavailable in private browsing. */ }
  const response = await fetch(url);
  if (!response.ok) throw Error(`Téléchargement de la voix refusé (${response.status}).`);
  try { await cache?.put(url, response.clone()); } catch { /* Inference still works without a persistent cache. */ }
  return response;
}
self.onmessage = async ({data: {text, speed, baseUrl}}) => {
  const progress = message => self.postMessage({type:'progress', message});
  try {
    if (!text?.trim()) throw Error('Le texte à lire est vide.');
    if (text.length > 16000) throw Error('Le texte audio dépasse 16 000 caractères. Révise ton cours en plusieurs parties.');
    if (!Number.isFinite(speed) || speed < 0.8 || speed > 1.3) throw Error('Vitesse de lecture invalide.');
    env.wasm.numThreads = 1;
    env.wasm.wasmPaths = new URL('ai/', baseUrl).href;
    const {createPiperPhonemize} = await import(/* @vite-ignore */ new URL('speech/piper.js', baseUrl).href);
    if (!session) {
      progress('Téléchargement de la voix française… Environ 65 Mo au premier usage, puis mise en cache si possible.');
      config = await (await cachedFile(MODEL_URL + '.json')).json();
      const model = await (await cachedFile(MODEL_URL)).arrayBuffer();
      progress('Préparation de la voix naturelle sur cet appareil…');
      session = await InferenceSession.create(model, {executionProviders:['wasm']});
    }
    const chunks = splitSpeech(text);
    const segments = [];
    for (const [index, chunk] of chunks.entries()) {
      progress(`Création de l’audio : passage ${index + 1}/${chunks.length}…`);
      const ids = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('La préparation de la prononciation prend trop de temps.')), 60000);
        const fail = () => { clearTimeout(timer); reject(new Error('La prononciation française n’a pas pu être préparée.')); };
        createPiperPhonemize({
          print: line => { try { const ids=JSON.parse(line).phoneme_ids; clearTimeout(timer); resolve(ids); } catch { fail(); } },
          printErr: () => {},
          locateFile: name => new URL(`speech/${name}`, baseUrl).href,
        }).then(module => {
          try { module.callMain(['-l', 'fr', '--input', JSON.stringify([{text:chunk}]), '--espeak_data', '/espeak-ng-data']); }
          catch { fail(); }
        }, fail);
      });
      if (!Array.isArray(ids) || !ids.length) throw Error('La prononciation française n’a pas pu être préparée.');
      const input = {
        input: new Tensor('int64', BigInt64Array.from(ids, BigInt), [1, ids.length]),
        input_lengths: new Tensor('int64', BigInt64Array.of(BigInt(ids.length)), [1]),
        scales: new Tensor('float32', Float32Array.of(config.inference.noise_scale, config.inference.length_scale / speed, config.inference.noise_w), [3]),
      };
      if (config.num_speakers > 1) input.sid = new Tensor('int64', BigInt64Array.of(0n), [1]);
      const output = await session.run(input);
      const waveform = output.output?.data;
      if (!waveform?.length) throw Error('La voix n’a pas produit de son.');
      segments.push(Float32Array.from(waveform));
    }
    const wav = encodeWav(segments, config.audio.sample_rate);
    self.postMessage({type:'result', wav}, [wav]);
  } catch (error) { self.postMessage({type:'error', message:error?.message || 'La voix naturelle ne peut pas démarrer sur cet appareil.'}); }
};
