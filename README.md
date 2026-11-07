# Déclic

Sélectionne ou dépose plusieurs PDF et photos à la fois (20 Mo par fichier). Les documents sont traités dans l’ordre et leur texte est ajouté aux notes déjà présentes. Une erreur sur un fichier ne bloque pas les suivants ; la liste indique les imports réussis et les échecs. Le bouton Effacer vide le texte et cette liste.

Application de révision en français : import de PDF texte et de photos (OCR français/anglais), résumé, fiches à déplier, carte mentale structurée, lecture vocale et export Markdown.

## Démarrage

Node.js 22.12+ ou 24 et npm sont nécessaires.

```sh
ONNXRUNTIME_NODE_INSTALL_CUDA=skip ONNXRUNTIME_NODE_INSTALL=skip npm ci
npm run dev
```

```sh
npm run build
```

Le serveur Vite affiche son port (5173 par défaut). Aucun compte ni service payant requis. Les documents restent en mémoire dans le navigateur ; recharger la page efface le travail. Les PDF scannés doivent être importés sous forme d’images de leurs pages. Les fichiers OCR (moteur et langues français/anglais) sont installés via npm puis servis localement. Aucune connexion externe n’est nécessaire pour reconnaître les photos après installation.

## Modes de génération

- **Essentiel** : sélection déterministe de phrases du cours et regroupement par mots fréquents. Ce mode ne produit pas de reformulation intelligente ni de véritable podcast.
- **IA gratuite sur cet appareil** (par défaut, disponible sur GitHub Pages) : Transformers.js exécute Qwen2.5-0.5B-Instruct quantifié en WebAssembly, dans un worker. Le premier usage télécharge plusieurs centaines de Mo depuis Hugging Face ; le modèle est ensuite mis en cache si le navigateur le permet. Le cours n’est jamais envoyé au fournisseur du modèle. Une connexion Internet est nécessaire au premier chargement. Un navigateur récent et suffisamment de mémoire sont nécessaires ; les téléphones modestes peuvent ne pas convenir. Le texte est limité à 12 000 caractères par génération, sans troncature silencieuse. La génération peut prendre plusieurs minutes ; le bouton Annuler reste accessible. Le modèle rédige quatre notions essentielles, que l’application organise en résumé, questions de révision, carte et texte à écouter ; le texte audio reprend ces notions, sans dialogue entre plusieurs voix. Les réponses de ce petit modèle peuvent comporter des erreurs et doivent être vérifiées avec le cours. Une erreur ne déclenche pas de faux résultat IA ni de passage silencieux au mode Essentiel.
- **IA locale Ollama** (développement uniquement) : installer Ollama depuis sa source officielle sur la machine qui héberge Vite, puis exécuter `ollama pull qwen2.5:3b` et `ollama serve` (s’il n’est pas déjà actif). Choisir « IA locale — Ollama » dans l’interface. Vite transmet `/ollama` à `http://127.0.0.1:11434`. Ce modèle requiert plusieurs Go de RAM et de stockage. Aucun modèle n’est inclus. La qualité et le temps de réponse dépendent du matériel. Le cours est limité à 40 000 caractères par appel. Toujours vérifier les productions avec le cours.

La lecture audio utilise SpeechSynthesis du navigateur ; disponibilité des voix et traitement vocal dépendent du navigateur et du système. Ce n’est pas un export MP3. En mode IA, le modèle génère un script pédagogique à écouter.

## Périmètre actuel

Prototype de développement : pas de comptes, de stockage persistant, de synchronisation ni de serveur IA distant. Le proxy Ollama est fourni pour `npm run dev` uniquement ; une mise en production nécessite un serveur dédié et un contrôle d’accès. Ne pas exposer ce serveur à un réseau public sans protection.

## Publication gratuite avec GitHub Pages

Le workflow `.github/workflows/deploy.yml` compile et publie l’application à chaque envoi sur `main`. Dans le dépôt GitHub, sélectionner **Settings → Pages → Source → GitHub Actions**. Puis lancer le workflow **Publier Déclic** dans l’onglet Actions si nécessaire. GitHub indique l’adresse réelle du site après le déploiement.

La version GitHub Pages fonctionne entièrement dans le navigateur en mode IA gratuite ou Essentiel. L’option Ollama y est masquée : GitHub Pages ne fournit pas de serveur pour faire tourner une IA locale. Aucune clé API n’est nécessaire. Pour un dépôt privé, vérifier les conditions de disponibilité de GitHub Pages de l’abonnement avant activation ; la visibilité du dépôt n’est pas changée automatiquement.

Pour vérifier la compilation dans un sous-dossier comme sur GitHub Pages :

```sh
DEPLOY_BASE=/declic/ npm run build
npm run preview
```

Le moteur WebAssembly est servi localement avec l’application ; les modèles sont téléchargés depuis `huggingface.co` et ses domaines de distribution `*.hf.co`. Les bibliothèques natives Node/CUDA ne sont pas utilisées par le navigateur ; les variables ONNXRUNTIME dans les commandes d’installation évitent leur téléchargement optionnel.

## Validation de l’IA

`npm test` vérifie la lecture des notions rédigées par le modèle et le prompt. Après compilation avec `DEPLOY_BASE=/declic/ npm run build`, `npm run test:ai` lance Chrome, télécharge le vrai modèle et vérifie une génération complète avant le déploiement GitHub Pages. Chrome doit être installé ; sinon définir `CHROME_PATH` vers Chromium. Ce test requiert Internet, de la mémoire et plusieurs minutes. Les variantes `node tests/browser-ai.mjs --offline` et `--simulate` vérifient respectivement les erreurs de téléchargement et l’interface avec un worker simulé ; elles ne valident pas le modèle.
