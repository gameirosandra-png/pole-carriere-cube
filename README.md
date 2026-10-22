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
| Tableau de bord | Équipe | Voir chaque promo d'un coup d'œil, le taux d'insertion à 6 mois, le délai moyen, les apprenants à relancer. Exporter les indicateurs en CSV. |
| Apprenants | Équipe | Rechercher, filtrer, ajouter un apprenant, exporter la liste en CSV (ouvrable dans Excel). |
| Fiche apprenant | Équipe | Changer le statut, planifier la prochaine action, noter les échanges, voir les offres proposées, supprimer la fiche. |
| Entreprises & offres | Équipe | Suivre les partenaires et leurs offres, proposer des apprenants. |
| Espace apprenant | Apprenant | L'apprenant indique lui-même où il en est ; sa fiche se met à jour sans relance manuelle. |

> Toutes les données sont fictives et calculées à partir de la date du jour, pour que la démo reste cohérente quel que soit le jour de visite. Elles sont enregistrées dans le navigateur (localStorage) : aucune donnée personnelle ne quitte l'ordinateur.

## Règles métier

| Indicateur | Règle |
| --- | --- |
| Inséré | Statut « En poste » ou « Freelance » |
| Taux à 6 mois | Insérés dans les 6 mois après la fin de formation / apprenants dont ces 6 mois sont écoulés |
| Délai moyen | Jours entre la fin de formation et la date d'insertion |
| À relancer | Prochaine action dépassée, ou aucun contact depuis plus de 14 jours (hors apprenants en formation ou insérés) |
| Dernier contact | Mis à jour par une note, un changement de statut, une action faite ou une réponse de l'apprenant |

Ces règles sont des fonctions pures dans [`src/regles.ts`](src/regles.ts), couvertes par des tests dans [`src/regles.test.ts`](src/regles.test.ts).

## Qualité

- **Tests** : règles métier, calculs de dates (fin de mois, changement d'heure, fuseaux) et export CSV, avec Vitest.
- **Intégration continue** : à chaque modification, GitHub vérifie les types TypeScript, lance les tests et le build ([workflow](.github/workflows/ci.yml)).
- **Accessibilité** : couleurs de statut au contraste WCAG AA (4,5:1), statut toujours écrit en plus de la couleur, panneaux utilisables au clavier (focus piégé, Échap, retour du focus).
- **Responsive** : utilisable sur mobile.

## Stack

React 19 + TypeScript, Vite, CSS sans framework, Vitest. Déployé sur Vercel à chaque push sur `main`. Construit avec Claude.

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
  dates.ts            calculs de dates sans décalage de fuseau (testés)
  csv.ts              export CSV compatible Excel (testé)
  store.ts            état de l'app et persistance locale
  data/seed.ts        données de démo, relatives à la date du jour
  components/         un composant par écran, plus le panneau accessible
```

## Prochaines étapes (V2)

1. Base de données partagée (Supabase) et connexion de l'équipe du pôle.
2. Lien personnel et sécurisé pour l'espace apprenant, envoyé automatiquement chaque mois.
3. Relances par e-mail (Make ou n8n) quand un apprenant passe en « À relancer ».
4. Import des apprenants depuis l'outil de gestion de l'école.

---

Conçu par Sandra Gameiro, apprenante Product Builder No-Code · [LinkedIn](https://www.linkedin.com/in/sandra-gameiro/)
