import { releaseIdleBrowserAI } from '../ai/client.js';
let worker, rejectPending, cleanup;
let prepared = {key:'', url:''};
let mode = 'natural', speed = '1.08', voiceURI = '';

function cancelGeneration() {
  worker?.terminate(); worker = undefined;
  rejectPending?.(new Error('Préparation audio annulée.')); rejectPending = undefined;
}
export function stopPodcast() {
  cleanup?.(); cleanup = undefined;
  cancelGeneration();
  globalThis.speechSynthesis?.cancel();
}
function generate(text, rate, onProgress) {
  releaseIdleBrowserAI();
  worker ||= new Worker(new URL('./worker.js', import.meta.url), {type:'module'});
  return new Promise((resolve, reject) => {
    rejectPending = reject;
    worker.onmessage = ({data}) => {
      if (data.type === 'progress') onProgress(data.message);
      if (data.type === 'result') { rejectPending = undefined; resolve(new Blob([data.wav], {type:'audio/wav'})); }
      if (data.type === 'error') { worker.terminate(); worker = undefined; rejectPending = undefined; reject(new Error(data.message)); }
    };
    worker.onerror = event => { event.preventDefault(); worker.terminate(); worker=undefined; rejectPending=undefined; reject(new Error('La voix naturelle ne peut pas démarrer dans ce navigateur. Essaie un navigateur récent ou les voix de l’appareil.')); };
    worker.postMessage({text, speed:rate, baseUrl:new URL(import.meta.env.BASE_URL, location.href).href});
  });
}
export function mountPodcast(container, text) {
  stopPodcast();
  container.innerHTML=`<div class="settings audio-settings"><label>Voix<select id="audio-engine"><option value="natural">Français naturel — Siwis</option><option value="system">Voix de l’appareil</option></select></label><label>Rythme<select id="audio-speed"><option value="0.94">Posé</option><option value="1.08">Dynamique</option><option value="1.2">Rapide</option></select></label></div><label class="system-voice" hidden>Voix française<select id="system-voice"></select></label><p id="voice-hint" class="hint"></p><div class="audio-controls"><button class="button primary" id="play">▶ Écouter</button><button class="button secondary" id="stop">■ Arrêter</button></div><p id="audio-status" class="hint" role="status" aria-live="polite"></p><audio id="podcast-player" controls hidden></audio><a id="audio-download" class="link" download="declic-podcast.wav" hidden>↓ Télécharger l’audio WAV</a>`;
  const $ = selector => container.querySelector(selector);
  const audio = $('#podcast-player');
  let active = true, request = 0;
  const say = message => { if(active) $('#audio-status').textContent=message; };
  const key = () => `${speed}:${text}`;
  const showPrepared = () => {
    const available = prepared.key===key() && mode==='natural';
    audio.hidden=!available; $('#audio-download').hidden=!available;
    if(available) { audio.src=prepared.url; $('#audio-download').href=prepared.url; }
    else { audio.removeAttribute('src'); audio.load(); }
  };
  const voices = () => globalThis.speechSynthesis?.getVoices().filter(voice => /^fr(?:-|_)/i.test(voice.lang) || voice.lang==='fr') || [];
  const refreshVoices = () => {
    const list=voices().sort((a,b)=>Number(b.localService)-Number(a.localService));
    $('#system-voice').replaceChildren(...list.map(voice=>{
      const option=document.createElement('option'); option.value=voice.voiceURI;
      option.textContent=`${voice.name}${voice.localService?' · sur l’appareil':' · en ligne'}`;return option;
    }));
    if(!list.length) { const option=document.createElement('option');option.textContent='Voix française par défaut';option.value='';$('#system-voice').append(option); }
    if(list.some(voice=>voice.voiceURI===voiceURI)) $('#system-voice').value=voiceURI;
  };
  const stop = () => { request++; audio.pause(); if(audio.src) audio.currentTime=0; globalThis.speechSynthesis?.cancel(); cancelGeneration(); };
  const update = () => {
    mode=$('#audio-engine').value; speed=$('#audio-speed').value;
    $('.system-voice').hidden=mode!=='system';
    $('#voice-hint').textContent=mode==='natural'
      ? 'Voix neuronale française, créée sur cet appareil. Premier usage : environ 65 Mo à télécharger. Le rythme Dynamique accélère légèrement la diction ; aucun texte envoyé à un service vocal.'
      : 'La qualité dépend des voix installées. Une voix indiquée « en ligne » peut transmettre le texte au service vocal de ton navigateur.';
    showPrepared();
  };
  $('#audio-engine').value=mode; $('#audio-speed').value=speed;
  $('#audio-engine').onchange=()=>{stop();update();};
  $('#audio-speed').onchange=()=>{stop();update();};
  $('#system-voice').onchange=()=>{stop();voiceURI=$('#system-voice').value;};
  refreshVoices();update();
  globalThis.speechSynthesis?.addEventListener('voiceschanged', refreshVoices);
  $('#stop').onclick=()=>{stop();say('Lecture arrêtée.');};
  $('#play').onclick=async()=>{
    if(mode==='system') {
      if(!globalThis.speechSynthesis) { say('La lecture système est indisponible dans ce navigateur.');return; }
      stop(); const utterance=new SpeechSynthesisUtterance(text);
      utterance.voice=voices().find(voice=>voice.voiceURI===$('#system-voice').value)||null;
      utterance.lang=utterance.voice?.lang||'fr-FR';utterance.rate=Number(speed);
      utterance.onerror=event=>{if(!['canceled','interrupted'].includes(event.error))say('Cette voix est indisponible. Essaie une autre voix ou la voix naturelle.');};
      say('Lecture avec la voix de l’appareil.');speechSynthesis.speak(utterance);return;
    }
    const current=++request;
    $('#play').disabled=true;
    $('#audio-engine').disabled=true;$('#audio-speed').disabled=true;
    try {
      if(prepared.key!==key()) {
        const blob=await generate(text,Number(speed),say);
        if(!active || current!==request)return;
        if(prepared.url)URL.revokeObjectURL(prepared.url);
        prepared={key:key(),url:URL.createObjectURL(blob)};
      }
      if(!active)return;
      showPrepared();say('Audio prêt. Tu peux l’écouter et le télécharger.');
      try { await audio.play(); } catch { say('Audio prêt : appuie sur lecture dans le lecteur audio.'); }
    } catch(error) { if(current===request)say(`${error.message} Tu peux aussi choisir une voix de l’appareil.`); }
    finally { if(active){$('#play').disabled=false;$('#audio-engine').disabled=false;$('#audio-speed').disabled=false;} }
  };
  cleanup=()=>{active=false;audio.pause();globalThis.speechSynthesis?.removeEventListener('voiceschanged',refreshVoices);};
}
