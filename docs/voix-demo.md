# Voix de la démo automatique

La démo auto est commentée à voix haute. Par défaut, elle utilise la meilleure voix française du navigateur (sur Edge, une voix neuronale Microsoft « Natural »). Pour une voix plus naturelle, on peut générer les 11 commentaires avec une IA vocale (ElevenLabs par exemple) et les déposer dans l'app : ils sont alors utilisés en priorité.

## Générer les fichiers

1. Dans l'outil de voix IA, choisir une voix française (modèle multilingue), réglages par défaut.
2. Coller chaque texte ci-dessous, un par un, et télécharger l'audio en MP3.
3. Nommer les fichiers `demo-01.mp3` à `demo-11.mp3` et les placer dans `public/voix/`.
4. Ajouter `public/voix/demo.json` :

```json
{ "fichiers": ["demo-01.mp3", "demo-02.mp3", "demo-03.mp3", "demo-04.mp3", "demo-05.mp3", "demo-06.mp3", "demo-07.mp3", "demo-08.mp3", "demo-09.mp3", "demo-10.mp3", "demo-11.mp3"] }
```

Si un fichier manque, l'étape correspondante est lue par la voix du navigateur. Sans voix du tout, la démo avance seule toutes les 11 secondes.

## Les 11 textes

Écrits pour l'oral : phrases courtes, environ 10 secondes chacune, 2 minutes au total. Si un texte change ici, le changer aussi dans `src/components/VisiteGuidee.tsx` (champ `voix`).

**01 · Lundi matin au pôle carrière**

> Bienvenue au pôle carrière. Lundi matin, en un coup d'œil : les rendez-vous de la semaine, les ateliers collectifs, et ce qui est en retard.

**02 · Les relances sont déjà écrites**

> Les relances sont déjà écrites : rappels d'atelier, et messages aux apprenants sans nouvelles depuis deux semaines. Un clic, et elles partent.

**03 · Chaque carré est un apprenant**

> Ici, chaque carré est un apprenant, avec une couleur par situation. Le point rouge signale qui relancer. Suivons Hugo, en recherche d'emploi.

**04 · L'effet de l'accompagnement, mesuré**

> À chaque séance, ses scores de CV et d'entretien sont relevés. La courbe le montre : l'accompagnement a un effet mesurable.

**05 · Atelier CV**

> Atelier CV : six critères notés pendant la séance, un score sur cent, et un plan d'action qui commence par le point le plus faible.

**06 · Une prétention salariale argumentée**

> Pour le salaire, l'outil part de fourchettes de marché sourcées, et calcule le montant à annoncer selon les atouts d'Hugo. Avec un plancher à ne pas franchir.

**07 · S'entraîner à convaincre**

> Pour convaincre : un pitch de deux minutes, construit à partir de sa fiche, et un mode entraînement chronométré, en plein écran.

**08 · La fiche envoyée à l'entreprise**

> Voici la fiche envoyée à l'entreprise : son pitch, ses projets, sa préparation. Sans notes internes, ni salaire. Partageable par lien, ou en PDF.

**09 · La shortlist part en un clic**

> Côté entreprises, la shortlist part en un clic : trois profils, un mail prêt, avec la fiche de chacun. Le pôle ne fait pas que suivre : il place.

**10 · L'apprenant avance seul**

> Entre deux séances, Hugo avance seul. Dans son espace, il retrouve son CV à corriger, son pitch, sa prétention, et il s'entraîne à l'oral.

**11 · Et la direction a ses chiffres**

> Enfin, la direction a ses chiffres : taux d'insertion, délais, promo par promo. Un pôle carrière piloté, de l'accompagnement jusqu'à l'emploi.
