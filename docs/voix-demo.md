# Voix de la démo automatique

La démo auto est commentée à voix haute. Par défaut, elle utilise la meilleure voix française du navigateur (sur Edge, une voix neuronale Microsoft « Natural »). Pour une voix plus naturelle, on peut générer les 15 commentaires avec une IA vocale (ElevenLabs par exemple) et les déposer dans l'app : ils sont alors utilisés en priorité.

## Générer les fichiers

1. Dans l'outil de voix IA, choisir une voix française (modèle multilingue), réglages par défaut.
2. Coller chaque texte ci-dessous, un par un, et télécharger l'audio en MP3.
3. Nommer les fichiers `demo-01.mp3` à `demo-15.mp3` et les placer dans `public/voix/`.
4. Ajouter `public/voix/demo.json` :

```json
{ "fichiers": ["demo-01.mp3", "demo-02.mp3", "demo-03.mp3", "demo-04.mp3", "demo-05.mp3", "demo-06.mp3", "demo-07.mp3", "demo-08.mp3", "demo-09.mp3", "demo-10.mp3", "demo-11.mp3", "demo-12.mp3", "demo-13.mp3", "demo-14.mp3", "demo-15.mp3"] }
```

Si un fichier manque, l'étape correspondante est lue par la voix du navigateur. Sans voix du tout, la démo avance seule toutes les 11 secondes.

## Les 15 textes

Écrits pour l'oral : phrases courtes, environ 10 secondes chacune, environ 2 min 30 au total. Si un texte change ici, le changer aussi dans `src/components/VisiteGuidee.tsx` (champ `voix`).

**01 · Le pôle carrière**

> Voici le pôle carrière : un outil pour accompagner les apprenants d'une école no-code jusqu'à l'emploi. Deux minutes pour en faire le tour.

**02 · Lundi matin au pôle carrière**

> Lundi matin, en un coup d'œil : les rendez-vous de la semaine, les ateliers collectifs, et ce qui est en retard.

**03 · Les relances sont déjà écrites**

> Les relances sont déjà écrites : rappels d'atelier, et messages aux apprenants sans nouvelles depuis deux semaines. Un clic, et elles partent.

**04 · Ma méthode signature : ADN**

> Au cœur de l'accompagnement, ma méthode signature, ADN : ancrer ses forces, diriger son cap, narrer sa reconversion. Ici, la confiance de toute la cohorte, et les freins à lever : syndrome de l'imposteur, plafond de verre, peur d'annoncer son prix.

**05 · L'effet de l'accompagnement, mesuré**

> Suivons Hugo, en recherche d'emploi. À chaque séance, ses scores de CV et d'entretien sont relevés : l'accompagnement a un effet mesurable.

**06 · Atelier CV**

> Atelier CV : six critères notés pendant la séance, un score sur cent, et un plan d'action qui commence par le point le plus faible.

**07 · Une prétention salariale argumentée**

> Pour le salaire, l'outil part de fourchettes de marché sourcées, et calcule le montant à annoncer selon les atouts d'Hugo. Avec un plancher à ne pas franchir.

**08 · S'entraîner à convaincre**

> Pour convaincre : un pitch de deux minutes, construit à partir de sa fiche, et un mode entraînement chronométré, en plein écran.

**09 · La fiche envoyée à l'entreprise**

> Voici la fiche envoyée à l'entreprise : son pitch, ses projets, sa préparation. Sans notes internes, ni salaire. Partageable par lien, ou en PDF.

**10 · La shortlist part en un clic**

> Côté entreprises, la shortlist part en un clic : trois profils, un mail prêt, avec la fiche de chacun. Le pôle ne fait pas que suivre : il place.

**11 · L'apprenant avance seul**

> Entre deux séances, Hugo avance seul. Dans son espace, il retrouve sa méthode ADN, son CV à corriger, son pitch, et il s'entraîne à l'oral.

**12 · Et pour se lancer en freelance**

> Et pour ceux qui se lancent en freelance, un simulateur : je veux trois mille euros net par mois. Il donne le TJM à facturer, les jours et les missions nécessaires, chiffres 2026 à l'appui.

**13 · Faire connaissance dès l'arrivée**

> Dès son arrivée, chaque apprenant remplit un questionnaire pour faire connaissance. Ses objectifs et ses inquiétudes remontent dans sa fiche : la première séance démarre sur l'essentiel.

**14 · Et la direction a ses chiffres**

> Enfin, la direction a ses chiffres : taux d'insertion, délais, promo par promo. Un pôle carrière piloté, de l'accompagnement jusqu'à l'emploi.

**15 · Sandra Gameiro**

> Ce MVP a été construit en une journée avec Claude, et vérifié par plus de cent soixante-dix tests automatiques. Je suis Sandra Gameiro : je serais ravie de vous le présenter.
