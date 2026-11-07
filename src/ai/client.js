import { MAX_AI_CHARACTERS } from './revisions.js';
let worker;
let pendingReject;

export function cancelBrowserAI() {
  worker?.terminate();
  worker = undefined;
  if (pendingReject) {
    pendingReject(new Error('Génération annulée. Tu peux réessayer ou choisir le mode Essentiel.'));
    pendingReject = undefined;
  }
}

export function generateBrowserRevisions(text, onProgress) {
  if (text.length > MAX_AI_CHARACTERS) {
    return Promise.reject(new Error(`L’IA accepte jusqu’à ${MAX_AI_CHARACTERS.toLocaleString('fr')} caractères par génération. Découpe ton cours en plusieurs parties ; le mode Essentiel accepte le texte complet.`));
  }
  if (!globalThis.WebAssembly || !globalThis.Worker) {
    return Promise.reject(new Error('Ce navigateur ne peut pas exécuter l’IA. Essaie une version récente de Chrome, Edge ou Firefox, ou le mode Essentiel.'));
  }
  if (pendingReject) return Promise.reject(new Error('Une génération est déjà en cours.'));
  worker ||= new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  return new Promise((resolve, reject) => {
    pendingReject = reject;
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') onProgress(data.message);
      if (data.type === 'result') {
        pendingReject = undefined;
        resolve({ ...data.revisions, mode: 'Notions rédigées par IA sur cet appareil · fiches, carte et audio construits à partir de ces notions' });
      }
      if (data.type === 'error') {
        const message = data.message;
        worker.terminate(); worker = undefined; pendingReject = undefined;
        reject(new Error(`IA indisponible : ${message}. Vérifie ta connexion et la mémoire disponible, puis réessaie. Le mode Essentiel reste accessible.`));
      }
    };
    worker.onerror = event => {
      event.preventDefault();
      worker.terminate(); worker = undefined; pendingReject = undefined;
      reject(new Error('Impossible de démarrer l’IA sur cet appareil. Essaie un navigateur récent sur ordinateur ou le mode Essentiel.'));
    };
    worker.postMessage({ text, baseUrl: new URL(import.meta.env.BASE_URL, location.href).href });
  });
}
