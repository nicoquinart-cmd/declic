# Activer Google et les cours synchronisés sur Déclic

Le site peut déjà enregistrer et rouvrir des cours **sur l’appareil utilisé**. Pour retrouver ses cours sur plusieurs appareils, il faut configurer le service Firebase ci-dessous. La configuration publique du projet `declic-revision` est maintenant intégrée au code. Il reste à activer le fournisseur Google, autoriser le domaine et publier les règles Firestore dans ce projet.

## 1. Créer le projet gratuit

1. Ouvrir https://console.firebase.google.com/ avec ton compte Google.
2. Créer un projet, par exemple « Déclic ». Un identifiant unique sera proposé.
3. Google Analytics n’est pas nécessaire. Garder l’offre **Spark**, sans activer un abonnement payant.

L’offre gratuite possède des quotas ; ce n’est pas un stockage illimité.

## 2. Activer Google

1. Ouvrir **Authentication → Commencer → Méthode de connexion**.
2. Activer **Google**, choisir l’adresse d’assistance proposée, puis enregistrer.
3. Dans **Authentication → Paramètres → Domaines autorisés**, ajouter `nicoquinart-cmd.github.io` (sans chemin `/declic/`).
4. Ajouter `localhost` seulement si tu souhaites aussi tester la connexion en développement sur ton ordinateur.

## 3. Créer la base privée

1. Ouvrir **Firestore Database → Créer une base de données**.
2. Utiliser le mode **production**, pas le mode test ouvert. Choisir la région souhaitée, idéalement en Europe pour tes utilisateurs ; la localisation se choisit à la création.
3. Dans l’onglet **Règles**, copier le contenu de [firestore.rules](firestore.rules), puis **Publier**. Ces règles limitent l’accès à `users/<identifiant connecté>/courses` au propriétaire du compte.
4. Pour les très grands textes, désactiver les index des champs `source` et `revisions` pour le groupe `courses`, comme dans [firestore.indexes.json](firestore.indexes.json). Ce fichier et les règles peuvent aussi être déployés ensemble depuis le dépôt :

```sh
npx firebase login
npx firebase deploy --only firestore:rules,firestore:indexes --project IDENTIFIANT_DU_PROJET
```

Ne jamais remplacer les règles par `allow read, write: if true`.

## 4. Récupérer la configuration web publique

Dans **Paramètres du projet → Général → Vos applications**, enregistrer une application **Web** (icône `</>`), sans activer Firebase Hosting : le site reste sur GitHub Pages.

Récupérer les quatre champs du bloc `firebaseConfig` :

| Champ Firebase | Variable de compilation Déclic |
| --- | --- |
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

Ces champs identifient l’application web et sont publics dans un site Firebase. **Aucune clé administrateur, aucun fichier de compte de service, aucun mot de passe Google n’est nécessaire dans le navigateur ou dans le dépôt.** La confidentialité dépend de la connexion et des règles Firestore.

## 5. Activer sur GitHub Pages

La configuration Web publique de `declic-revision` fournie par le propriétaire est intégrée dans `src/account/public-config.js` : il n’est pas nécessaire d’ajouter des variables GitHub pour ce projet.

Pour utiliser un autre projet :

1. Ouvrir https://github.com/nicoquinart-cmd/declic/settings/variables/actions .
2. Ajouter les quatre variables du tableau ensemble. Une surcharge partielle ne mélange pas les paramètres de deux projets.
3. Ouvrir l’onglet **Actions → Publier Déclic → Run workflow**.
4. Après le succès, actualiser le site. Le bouton **Connexion Google** devient disponible.
5. Se connecter, saisir un titre et cliquer **Enregistrer dans mon compte**. Puis vérifier **Mes cours** et rouvrir ce cours sur un autre appareil connecté au même compte.

Un succès des tests sur émulateur ne prouve pas qu’un projet réel est configuré : la première connexion Google et la lecture/écriture sur ton projet doivent encore être vérifiées après cette étape.

## Ce qui est conservé

- Le titre, le texte extrait des documents, les révisions, le sujet de la carte et le moteur sélectionné.
- Les dates de création et de modification ; les cours du compte sont affichés par modification récente, avec pagination.
- Les PDF/photos d’origine et les fichiers audio WAV ne sont pas envoyés dans cette version ; l’audio est régénéré à partir du texte enregistré.
- La sauvegarde est explicite via le bouton Enregistrer. Les cours locaux ne sont pas transférés automatiquement vers Google. Pour copier un cours local dans le compte, l’ouvrir avant de se connecter, puis l’enregistrer dans le compte.
- Après déconnexion, le contenu du compte est retiré de l’éditeur et de la bibliothèque. Les cours enregistrés sur l’appareil restent séparés et accessibles aux utilisateurs de ce navigateur.

## Développement et tests

Copier `.env.example` vers `.env.local` et renseigner uniquement la configuration web publique. Redémarrer Vite après modification. Ne pas versionner `.env.local`.

`npm run test:library` teste la bibliothèque locale dans Chrome. `npm run test:rules` lance l’émulateur Firestore avec un projet fictif `demo-declic` et vérifie les accès de deux utilisateurs et d’un invité. Java 21 et le téléchargement officiel de l’émulateur sont nécessaires ; aucun vrai projet ni compte Google n’est utilisé par ce test.
