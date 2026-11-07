import { pipeline, env, TextStreamer } from '@huggingface/transformers';
import { MAX_AI_CHARACTERS, parseRevisions, revisionMessages } from './revisions.js';

const MODEL = 'onnx-community/Qwen2.5-0.5B-Instruct';
env.allowLocalModels = false;
env.useBrowserCache = true;
// GitHub Pages cannot supply isolation headers required for WASM threads.
env.backends.onnx.wasm.numThreads = 1;
let generator;

self.onmessage = async ({ data: { text, baseUrl } }) => {
  const send = (type, content) => self.postMessage({ type, ...content });
  try {
    if (typeof text !== 'string' || text.length > MAX_AI_CHARACTERS) {
      throw Error(`Pour l’IA, utilise au maximum ${MAX_AI_CHARACTERS.toLocaleString('fr')} caractères. Traite ton cours par parties.`);
    }
    env.backends.onnx.wasm.wasmPaths = new URL('ai/', baseUrl).href;
    if (!generator) {
      send('progress', { message: 'Chargement du modèle IA… Le premier téléchargement peut prendre plusieurs minutes.' });
      generator = await pipeline('text-generation', MODEL, {
        device: 'wasm', dtype: 'q4',
        progress_callback: progress => {
          if (progress.status === 'progress') {
            const percent = Math.floor(progress.progress || 0);
            send('progress', { message: `Téléchargement du modèle : ${progress.file} · ${percent} %` });
          } else if (progress.status === 'done') {
            send('progress', { message: 'Préparation de l’IA sur cet appareil…' });
          }
        },
      });
    }
    send('progress', { message: 'L’IA rédige tes révisions… Tu peux annuler si ton appareil est trop lent.' });
    let lastUpdate = 0, characters = 0;
    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true, skip_special_tokens: true,
      callback_function: chunk => {
        characters += chunk.length;
        if (Date.now() - lastUpdate > 1000) {
          lastUpdate = Date.now();
          send('progress', { message: `L’IA rédige tes révisions… ${characters} caractères générés.` });
        }
      },
    });
    const output = await generator(revisionMessages(text), {
      max_new_tokens: 500, do_sample: false, repetition_penalty: 1.05,
      return_full_text: false, streamer,
    });
    const generated = output[0]?.generated_text;
    const raw = typeof generated === 'string' ? generated : generated?.at(-1)?.content;
    if (typeof raw !== 'string') throw Error('L’IA n’a pas renvoyé de texte. Réessaie.');
    send('result', { revisions: parseRevisions(raw) });
  } catch (error) {
    send('error', { message: error?.message || 'Le modèle IA n’a pas pu démarrer.' });
  }
};
