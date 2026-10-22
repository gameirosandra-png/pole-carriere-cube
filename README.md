<img src="public/logo.svg" alt="" width="56" />

# Pôle carrière · École Cube (MVP)

[![Vérifications](https://github.com/gameirosandra-png/pole-carriere-cube/actions/workflows/ci.yml/badge.svg)](https://github.com/gameirosandra-png/pole-carriere-cube/actions/workflows/ci.yml)

**Démo en ligne : [pole-carriere-cube.vercel.app](https://pole-carriere-cube.vercel.app)**

Outil de suivi de l'insertion professionnelle des apprenants, construit comme preuve de concept pour le pôle carrière de l'École Cube.

![Tableau de bord : chaque carré est un apprenant, coloré selon sa situation](docs/capture-tableau-de-bord.png)

## Le problème

Après la formation, le suivi des apprenants est souvent dispersé entre tableurs, messages et mémoire. On perd de vue ceux qui décrochent, et le taux d'insertion (demandé pour le reporting RNCP et Qualiopi) est long à calculer.

## Ce que fait le MVP

| Écran | Pour qui | Ce qu'on y fait |
| --- | --- | --- |
| Tableau de bord | Équipe | Voir chaque promo d'un coup d'œil, le taux d'insertion à 6 mois, le délai moyen, l'entonnoir d'insertion avec son point de décrochage, les apprenants à relancer, et l'avancement des dossiers étape par étape. Exporter les indicateurs en CSV. |
| Apprenants | Équipe | Rechercher, filtrer (dont « prêts à proposer »), voir l'avancement de chaque dossier, ajouter un apprenant, exporter la liste en CSV (ouvrable dans Excel). |
| Fiche apprenant | Équipe | Changer le statut, valider les étapes du dossier, planifier la prochaine action, noter les échanges, voir les offres proposées, supprimer la fiche. |
| Entreprises & offres | Équipe | Suivre les partenaires et leurs offres. **Suggérer des candidats** : les 3 meilleurs profils par offre, avec un score expliqué. Proposer, retirer, supprimer (avec annulation). |
| Rapport | Direction | Rapport d'insertion d'une page par promo, prêt à imprimer ou à enregistrer en PDF. |
| Espace apprenant | Apprenant | Son tableau de bord (dossier, prochaine étape, offres), sa checklist de dossier, et un formulaire pour dire où il en est. Sa fiche se met à jour sans relance manuelle. |

Au premier passage, une **visite guidée** de 7 étapes présente l'app ; elle se relance depuis le tableau de bord.

> Toutes les données sont fictives et calculées à partir de la date du jour, pour que la démo reste cohérente quel que soit le jour de visite. Elles sont enregistrées dans le navigateur (localStorage) : aucune donnée personnelle ne quitte l'ordinateur.

## Mode équipe (base partagée)

Par défaut, l'app tourne en **démo locale** : données fictives dans le navigateur. Le bouton « Passer en mode équipe » permet de se connecter **par lien magique** (sans mot de passe) : les données vivent alors dans une base **Supabase** partagée, et chaque membre voit les mises à jour des autres (actualisation toutes les 20 secondes et au retour sur l'onglet).

- Schéma : tables `apprenants` et `entreprises`, un document JSON par ligne, au format de l'app (aucun écran ne change entre les deux modes). Horodatage et auteur de chaque modification par trigger.
- Sécurité : RLS activée, lecture et écriture réservées aux utilisateurs connectés ; taille des documents bornée.
- Synchronisation : seules les fiches ajoutées, modifiées ou supprimées sont envoyées ([`src/synchro.ts`](src/synchro.ts), testé).
- Client Supabase minimal, sans dépendance ([`src/supabase.ts`](src/supabase.ts)) : lien magique, rafraîchissement de session, lecture et écriture via l'API REST.

En production : rôles distincts (équipe, apprenant), politiques RLS par rôle, schéma normalisé (offres et candidatures en tables), temps réel.

## Automatisation et IA

| Fonction | Comment ça marche |
| --- | --- |
| **Récap par e-mail (Make)** | Le bouton « Envoyer le récap par e-mail » appelle la fonction serveur [`api/recap.ts`](api/recap.ts), qui construit l'e-mail (apprenants à relancer, dossiers prêts, taux d'insertion) et le transmet à un scénario Make : *Webhook → Gmail → Réponse*. Le destinataire est fixé dans Make (l'équipe du pôle), jamais par le visiteur. |
| **Brief de rendez-vous** | Dans la fiche, « Préparer le rendez-vous » propose une synthèse en 3 rubriques (situation, points à travailler, questions à poser), calculée à partir du suivi ([`src/brief.ts`](src/brief.ts), testé). |

Les fonctions serveur limitent le rythme et le volume d'appels, et n'acceptent que des champs structurés et tronqués : elles ne peuvent servir ni de relais d'e-mails ni de chatbot générique.

Variable d'environnement (Vercel) : `MAKE_RECAP_WEBHOOK` (URL du webhook Make). Sans elle, l'app fonctionne et l'indique clairement.

## Règles métier

| Indicateur | Règle |
| --- | --- |
| Inséré | Statut « En poste » ou « Freelance » |
| Taux à 6 mois | Insérés dans les 6 mois après la fin de formation / apprenants dont ces 6 mois sont écoulés |
| Délai moyen | Jours entre la fin de formation et la date d'insertion |
| À relancer | Prochaine action dépassée, ou aucun contact depuis plus de 14 jours (hors apprenants en formation ou insérés) |
| Dossier prêt à proposer | Les 7 étapes faites : rendez-vous objectif, CV envoyé, CV validé, LinkedIn, portfolio, pitch, simulation d'entretien |
| Qui coche quoi | L'apprenant coche ses étapes (CV envoyé, LinkedIn, portfolio) ; l'équipe valide les autres |
| KPI de préparation | Part des apprenants en accompagnement (non insérés) ayant fait chaque étape, et nombre de dossiers prêts |
| Score de matching (sur 100) | Dossier (40, proportionnel aux étapes faites) + poste visé retrouvé dans l'intitulé de l'offre (35) + disponibilité (25 en recherche, 15 en entretiens ailleurs, 25 en formation pour une alternance, 5 sinon) |
| Entonnoir d'insertion | Sortis de formation → dossier prêt → en entretiens ou au-delà → en poste ou freelance ; niveaux cumulatifs, le plus gros écart signale le goulot |
| Dernier contact | Mis à jour par une note, un changement de statut, une action faite ou une réponse de l'apprenant |

Ces règles sont des fonctions pures dans [`src/regles.ts`](src/regles.ts), [`src/dossier.ts`](src/dossier.ts), [`src/matching.ts`](src/matching.ts) et [`src/rapport.ts`](src/rapport.ts), couvertes par des tests.

## Qualité

- **Tests** : règles métier, checklist du dossier, matching, entonnoir, calculs de dates (fin de mois, changement d'heure, fuseaux) et export CSV, avec Vitest.
- **Intégration continue** : à chaque modification, GitHub vérifie les types TypeScript, lance les tests et le build ([workflow](.github/workflows/ci.yml)).
- **Accessibilité** : couleurs de statut au contraste WCAG AA (4,5:1), statut toujours écrit en plus de la couleur, panneaux utilisables au clavier (focus piégé, Échap, retour du focus).
- **Responsive** : utilisable sur mobile.

## Stack

React 19 + TypeScript, Vite, CSS sans framework, Vitest. Supabase (Postgres, Auth), fonctions serveur Vercel, Make, API Claude. Déployé sur Vercel à chaque push sur `main`. Construit avec Claude.

## Lancer en local

```bash
npm install
npm run dev      # serveur de développement
npm run check    # types + tests + build, comme la CI
```

## Structure

```
src/
  types.ts            modèle de données (Apprenant, Entreprise, Offre)
  regles.ts           règles métier et indicateurs (testés)
  dossier.ts          checklist du dossier et KPI de préparation (testés)
  matching.ts         suggestion de candidats pour une offre (testé)
  rapport.ts          entonnoir d'insertion et statistiques par promo (testés)
  brief.ts            préparation de rendez-vous : données pour l'IA, brief de secours (testés)
  api.ts              appels aux fonctions serveur
  supabase.ts         client minimal : lien magique, session, lecture/écriture
  synchro.ts          calcul des changements à envoyer à la base (testé)
api/
  recap.ts            envoi du récap via Make
  brief.ts            brief de rendez-vous rédigé par Claude (V2, prêt mais non activé)
  dates.ts            calculs de dates sans décalage de fuseau (testés)
  csv.ts              export CSV compatible Excel (testé)
  store.ts            état de l'app et persistance locale
  data/seed.ts        données de démo, relatives à la date du jour
  components/         un composant par écran, plus le panneau accessible
```

## Prochaines étapes (V2)

1. Rôles et droits par profil (équipe, apprenant) sur la base partagée, et schéma normalisé.
2. Lien personnel et sécurisé pour l'espace apprenant, envoyé automatiquement chaque mois.
3. Récap envoyé automatiquement chaque lundi par Make, à partir de la base partagée.
4. Import des apprenants depuis l'outil de gestion de l'école.
5. **Brief de rendez-vous rédigé par l'IA** : la fonction serveur est prête ([`api/brief.ts`](api/brief.ts) : prompt borné, garde-fous de volume, modèle Claude Haiku). Activation = ajouter `ANTHROPIC_API_KEY` sur Vercel et brancher `demanderBrief` dans la fiche.

---

Conçu par Sandra Gameiro, apprenante Product Builder No-Code · [LinkedIn](https://www.linkedin.com/in/sandra-gameiro/)
