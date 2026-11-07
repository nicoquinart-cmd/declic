# Composants de la voix française

- Le moteur de synthèse utilise le format ONNX de [Piper](https://github.com/rhasspy/piper) (MIT). Les entrées ONNX sont décrites par Piper ; l’intégration s’appuie aussi sur l’exemple d’inférence de [diffusion-studio/vits-web](https://github.com/diffusion-studio/vits-web) (MIT, Konstantin Paulus).
- Le modèle vocal est [fr_FR-siwis-medium](https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium). Ses informations et conditions sont disponibles dans le [MODEL_CARD](https://huggingface.co/rhasspy/piper-voices/blob/main/fr/fr_FR/siwis/medium/MODEL_CARD). Le modèle est téléchargé depuis ce dépôt officiel au premier usage.
- La préparation de la prononciation utilise les binaires de [diffusion-studio/piper-wasm](https://github.com/diffusion-studio/piper-wasm), distribués par le paquet `@diffusionstudio/piper-wasm` (déclaration npm : MIT). Les sources et instructions de compilation sont dans ce dépôt. Piper phonemize inclut [eSpeak NG](https://github.com/espeak-ng/espeak-ng), distribué sous GPL-3.0 ; les sources et la licence sont disponibles dans le dépôt amont et les dépendances du projet de compilation.
- [ONNX Runtime](https://github.com/microsoft/onnxruntime) est distribué sous licence MIT.

Les fichiers JavaScript et WebAssembly sont copiés depuis les paquets npm verrouillés, sans modification des binaires. Le script Emscripten reçoit uniquement une ligne d’export ES module pour être chargé par le worker.

# Export PDF

- jsPDF est utilisé sous licence MIT pour générer les documents dans le navigateur.
- Les polices DejaVu Sans et DejaVu Sans Bold proviennent du paquet système `fonts-dejavu-core`. Leur licence et les mentions de copyright sont conservées dans `src/assets/fonts/LICENSE.txt` et distribuées avec le site dans `licenses/dejavu-fonts.txt`.
