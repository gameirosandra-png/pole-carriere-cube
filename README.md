# Pôle carrière · École Cube (MVP)

Outil de suivi de l'insertion professionnelle des apprenants, construit comme preuve de concept pour le pôle carrière de l'École Cube.

**Problème** : le suivi des apprenants après la formation est souvent dispersé (tableurs, messages, mémoire). On perd de vue ceux qui décrochent, et le taux d'insertion est difficile à calculer.

**Ce que fait le MVP**

- **Tableau de bord** : chaque promo affichée en carrés colorés par statut, taux d'insertion à 6 mois, délai moyen d'insertion, apprenants à relancer.
- **Suivi des apprenants** : recherche et filtres par statut, promo et besoin de relance.
- **Fiche apprenant** : statut, poste visé, prochaine action, notes de suivi datées, offres proposées.
- **Entreprises & offres** : partenaires, offres ouvertes ou pourvues, mises en relation avec les apprenants.

> Toutes les données sont fictives. Elles sont enregistrées dans le navigateur (localStorage) : aucune donnée personnelle ne quitte l'ordinateur.

## Règles métier

| Indicateur | Règle |
| --- | --- |
| Inséré | Statut « En poste » ou « Freelance » |
| Taux à 6 mois | Insérés dans les 6 mois / apprenants dont la fin de formation date de plus de 6 mois |
| À relancer | Prochaine action dépassée, ou aucun contact depuis plus de 14 jours (hors apprenants en formation ou insérés) |

Le code de ces règles est dans [`src/lib.ts`](src/lib.ts).

## Stack

React 19 + TypeScript, Vite, CSS sans framework. Déployé sur Vercel. Construit avec Claude.

## Lancer en local

```bash
npm install
npm run dev
```

## Structure

```
src/
  types.ts            modèle de données (Apprenant, Entreprise, Offre)
  data/seed.ts        données de démo
  lib.ts              règles métier, indicateurs, persistance
  components/         un composant par écran
```

## Prochaines étapes (V2)

1. Base de données partagée (Supabase) et connexion de l'équipe du pôle.
2. Import des apprenants depuis le CRM de l'école.
3. Relances automatiques par e-mail (Make ou n8n) quand un apprenant passe en « À relancer ».
4. Formulaire de mise à jour envoyé aux apprenants (où en êtes-vous ?) qui met à jour leur statut.

---

Conçu par Sandra Gameiro, apprenante Product Builder No-Code · [LinkedIn](https://www.linkedin.com/in/sandra-gameiro/)
