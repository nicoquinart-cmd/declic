# Déclic

Sélectionne ou dépose plusieurs PDF et photos à la fois (20 Mo par fichier). Les documents sont traités dans l’ordre et leur texte est ajouté aux notes déjà présentes. Une erreur sur un fichier ne bloque pas les suivants ; la liste indique les imports réussis et les échecs. Le bouton Effacer vide le texte et cette liste.

Application de révision en français : import de PDF texte et de photos (OCR français/anglais), résumé, fiches de révision modifiables et téléchargeables en PDF, carte mentale visuelle, lecture vocale et export Markdown.

## Démarrage

Node.js 22.12+ ou 24 et npm sont nécessaires.

```sh
ONNXRUNTIME_NODE_INSTALL_CUDA=skip ONNXRUNTIME_NODE_INSTALL=skip npm ci
npm run dev
```

```sh
npm run build
```

Le serveur Vite affiche son port (5173 par défaut). Aucun compte ni service payant requis. Les cours non enregistrés restent en mémoire ; recharger la page efface ce travail. Le bouton Enregistrer sauvegarde le texte et les révisions sur cet appareil, ou dans le compte si Google est configuré et connecté. Les PDF scannés doivent être importés sous forme d’images de leurs pages. Les fichiers OCR (moteur et langues français/anglais) sont installés via npm puis servis localement. Aucune connexion externe n’est nécessaire pour reconnaître les photos après installation.

## Modes de génération

- **Essentiel** : sélection déterministe de phrases du cours et regroupement par mots fréquents. Ce mode ne produit pas de reformulation intelligente ni de véritable podcast.
- **IA gratuite sur cet appareil** (par défaut, disponible sur GitHub Pages) : Transformers.js exécute Qwen2.5-0.5B-Instruct quantifié en WebAssembly, dans un worker. Le premier usage télécharge plusieurs centaines de Mo depuis Hugging Face ; le modèle est ensuite mis en cache si le navigateur le permet. Le cours n’est jamais envoyé au fournisseur du modèle. Une connexion Internet est nécessaire au premier chargement. Un navigateur récent et suffisamment de mémoire sont nécessaires ; les téléphones modestes peuvent ne pas convenir. Le texte est limité à 12 000 caractères par génération, sans troncature silencieuse. La génération peut prendre plusieurs minutes ; le bouton Annuler reste accessible. Le modèle rédige quatre notions essentielles, que l’application organise en résumé, questions de révision, carte et texte à écouter ; le texte audio reprend ces notions, sans dialogue entre plusieurs voix. Les réponses de ce petit modèle peuvent comporter des erreurs et doivent être vérifiées avec le cours. Une erreur ne déclenche pas de faux résultat IA ni de passage silencieux au mode Essentiel.
- **IA locale Ollama** (développement uniquement) : installer Ollama depuis sa source officielle sur la machine qui héberge Vite, puis exécuter `ollama pull qwen2.5:3b` et `ollama serve` (s’il n’est pas déjà actif). Choisir « IA locale — Ollama » dans l’interface. Vite transmet `/ollama` à `http://127.0.0.1:11434`. Ce modèle requiert plusieurs Go de RAM et de stockage. Aucun modèle n’est inclus. La qualité et le temps de réponse dépendent du matériel. Le cours est limité à 40 000 caractères par appel. Toujours vérifier les productions avec le cours.

La lecture audio propose par défaut une voix neuronale française Piper Siwis (modèle medium) exécutée sur l’appareil, dans un worker WebAssembly. Le premier usage télécharge environ 65 Mo de modèle depuis Hugging Face. Les fichiers de prononciation et le runtime sont servis avec l’application ; aucun texte n’est envoyé à un service vocal. La génération découpe les phrases pour limiter la mémoire, ajoute de courtes pauses et adapte la durée des phonèmes au rythme choisi (Posé, Dynamique, Rapide). Le résultat s’écoute avec les contrôles du lecteur et se télécharge en WAV. Un appareil récent avec suffisamment de mémoire est nécessaire.

Le mode « Voix de l’appareil » reste disponible en secours, avec choix d’une voix française installée. Certaines voix système utilisent un service en ligne ; elles sont identifiées dans le menu. La qualité dépend du navigateur et du système. Le texte audio reprend les notions du cours ; il ne s’agit pas d’un dialogue entre plusieurs animateurs. Aucun export MP3 n’est proposé.

## Périmètre actuel

Prototype de développement : la synchronisation Google nécessite un projet Firebase configuré ; aucun serveur IA distant n’est utilisé. Le proxy Ollama est fourni pour `npm run dev` uniquement ; une mise en production nécessite un serveur dédié et un contrôle d’accès. Ne pas exposer ce serveur à un réseau public sans protection.

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

`npm run test:audio` vérifie dans Chrome la génération d’une courte phrase française avec le vrai modèle, le décodage du WAV, sa durée et la présence d’un signal. `node tests/browser-audio.mjs --simulate` teste les contrôles avec un worker simulé ; `--offline` vérifie le message d’erreur et le secours sans téléchargement réussi. Les tests automatiques ne mesurent pas la perception du naturel de la voix.

La carte mentale présente le sujet central, les notions et leurs explications sous forme de branches colorées. Le sujet central est modifiable. Le zoom, le déplacement, l’affichage agrandi et le téléchargement SVG fonctionnent sans service externe.

La carte classe désormais les notions par thématiques, avec la hiérarchie sujet → thématique → sous-titre → explication. L’IA propose deux grands thèmes adaptés au cours. Si une notion n’a pas de thème (notamment en mode Essentiel), un classement par vocabulaire fournit des catégories de révision ; ce classement automatique doit être vérifié. Les regroupements sont conservés dans les exports SVG et Markdown.

## Comptes Google et bibliothèque

La bibliothèque « Mes cours » conserve le texte et les révisions. Sans connexion, la sauvegarde est locale à cet appareil. Avec Firebase configuré, Google permet une bibliothèque privée synchronisée entre appareils. La sauvegarde se fait explicitement avec le bouton Enregistrer ; les documents originaux et l’audio WAV ne sont pas téléversés.

La configuration du projet, de Google, des règles privées et des variables GitHub est décrite dans [FIREBASE_SETUP.md](FIREBASE_SETUP.md). La configuration publique du projet `declic-revision` est intégrée. Le fournisseur Google, le domaine autorisé et les règles Firestore doivent être activés dans la console du projet. Les nouveaux enregistrements cloud sont bloqués si le contrôle invité révèle une base ouverte ou absente. Ne jamais mettre de clé de compte de service dans l’application.

`npm run test:auth` vérifie les retours de connexion (progression, erreurs visibles, relance et déconnexion) avec un service d’authentification simulé. Il ne prouve pas qu’un compte Google réel peut se connecter ; cela dépend également des réglages du projet Firebase.


Les fiches de révision sont éditables : titres, sous-titres, contenu et notes personnelles. On peut ajouter ou supprimer des parties et des fiches, puis télécharger une fiche ou le dossier complet en PDF A4. La génération PDF et les polices intégrées restent locales au navigateur. Les longs textes passent sur plusieurs pages. Le bouton Enregistrer conserve les modifications avec le cours ; régénérer les révisions demande confirmation avant de remplacer des fiches modifiées.

La carte mentale démarre en vue compacte. Un clic sur une notion affiche son explication ; une option affiche tous les textes. Les branches sont réparties selon leur hauteur réelle, y compris pour une thématique unique (deux branches de même couleur, avec une mention « suite »). Les thèmes absents ou génériques sont regroupés par vocabulaire du cours ; ce classement lexical peut être corrigé avec « Modifier le classement des thèmes ». Les corrections sont enregistrables avec les révisions. L’export SVG garde toutes les explications.

Dans **Quiz**, sélectionne les thèmes de tes fiches, le nombre de questions (1 à 20, limité aux notions disponibles) et le format : QCM ou réponse libre. Les questions utilisent les fiches actuelles, sans nouveau téléchargement IA. Le QCM associe une notion à son explication parmi d’autres explications du cours ; la réponse libre affiche le corrigé puis demande une autoévaluation. Le résultat permet de reprendre les erreurs. **Enregistrer** conserve le quiz et sa progression avec le cours. Un nouveau quiz reprend les dernières modifications des fiches ; régénérer les révisions remplace le quiz.

Le bouton **Agenda**, à côté de **Mes cours**, ouvre la liste des évaluations. Chaque date contient un titre, une matière et les thèmes à réviser ; elle peut être modifiée ou supprimée. Le bandeau en haut affiche la prochaine évaluation (y compris celles d’aujourd’hui) et les jours restants, selon la date locale de l’appareil. Les évaluations passées restent consultables dans l’agenda. Les dates sont sauvegardées automatiquement dans ce navigateur, séparément pour chaque compte Google et pour les visiteurs ; elles ne sont pas synchronisées entre appareils. Effacer les données du navigateur les supprime. Le rappel est affiché dans l’application ouverte : aucune notification en arrière-plan ou par e-mail n’est envoyée.

L’agenda propose un **calendrier mensuel interactif**, du lundi au dimanche : flèches pour changer de mois, choix direct du mois et bouton **Aujourd’hui**. Clique sur une date pour afficher ses évaluations et préremplir le formulaire. Les matières apparaissent dans les cases sur ordinateur ; sur téléphone, un point signale les jours contenant des évaluations. Les boutons **Jour sélectionné** et **Toutes les évaluations** permettent de filtrer la liste. Les flèches du clavier déplacent la sélection d’un jour ou d’une semaine. Les dates déjà enregistrées sont conservées.
