# Déclic

Application de révision en français : import de PDF texte et de photos (OCR français/anglais), résumé, fiches à déplier, carte mentale structurée, lecture vocale et export Markdown.

## Démarrage

Node.js 22.12+ ou 24 et npm sont nécessaires.

```sh
npm ci
npm run dev
```

```sh
npm run build
```

Le serveur Vite affiche son port (5173 par défaut). Aucun compte ni service payant requis. Les documents restent en mémoire dans le navigateur ; recharger la page efface le travail. Les PDF scannés doivent être importés sous forme d’images de leurs pages. Les fichiers OCR (moteur et langues français/anglais) sont installés via npm puis servis localement. Aucune connexion externe n’est nécessaire pour reconnaître les photos après installation.

## Deux modes distincts

- **Essentiel** : sélection déterministe de phrases du cours et regroupement par mots fréquents. Ce mode ne produit pas de reformulation intelligente ni de véritable podcast.
- **IA locale** : installer Ollama depuis sa source officielle sur la machine qui héberge Vite, puis exécuter `ollama pull qwen2.5:3b` et `ollama serve` (s’il n’est pas déjà actif). Choisir « IA locale — Ollama » dans l’interface. Vite transmet `/ollama` à `http://127.0.0.1:11434`. Ce modèle requiert plusieurs Go de RAM et de stockage. Aucun modèle n’est inclus. La qualité et le temps de réponse dépendent du matériel. Le cours est limité à 40 000 caractères par appel. Toujours vérifier les productions avec le cours.

La lecture audio utilise SpeechSynthesis du navigateur ; disponibilité des voix et traitement vocal dépendent du navigateur et du système. Ce n’est pas un export MP3. En mode IA locale, le modèle génère un script pédagogique à écouter.

## Périmètre actuel

Prototype de développement : pas de comptes, de stockage persistant, de synchronisation ni d’hébergement de production. Le proxy Ollama est fourni pour `npm run dev` uniquement ; une mise en production nécessite un serveur dédié et un contrôle d’accès. Ne pas exposer ce serveur à un réseau public sans protection.

## Publication gratuite avec GitHub Pages

Le workflow `.github/workflows/deploy.yml` compile et publie l’application à chaque envoi sur `main`. Dans le dépôt GitHub, sélectionner **Settings → Pages → Source → GitHub Actions**. Puis lancer le workflow **Publier Déclic** dans l’onglet Actions si nécessaire. GitHub indique l’adresse réelle du site après le déploiement.

La version GitHub Pages fonctionne entièrement dans le navigateur en mode Essentiel. L’option Ollama y est désactivée : GitHub Pages ne fournit pas de serveur pour faire tourner une IA locale. Aucune clé API n’est nécessaire. Pour un dépôt privé, vérifier les conditions de disponibilité de GitHub Pages de l’abonnement avant activation ; la visibilité du dépôt n’est pas changée automatiquement.

Pour vérifier la compilation dans un sous-dossier comme sur GitHub Pages :

```sh
DEPLOY_BASE=/declic/ npm run build
npm run preview
```
