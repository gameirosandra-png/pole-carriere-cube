// Atelier « Convaincre » : pitch de 2 minutes construit à partir de la fiche,
// questions d'entretien types et grille de simulation. Fonctions pures, testées.

import type { Apprenant, CritereEntretien } from "../types";
import { scorePortfolio } from "./portfolio";

export interface PartiePitch {
  titre: string;
  duree: string;
  texte: string;
}

/** Ce dont le pitch a besoin : de quoi le reconstruire aussi depuis un lien de fiche candidat. */
export interface InfosPitch {
  prenom: string;
  posteVise: string;
  parcoursAvant?: string;
  /** Nom du projet phare. */
  phare?: string;
  motivation?: string;
}

/** Pitch en 4 temps : accroche, parcours, preuve, projet. Les trous sont signalés entre crochets. */
export const genererPitch = (a: Apprenant): PartiePitch[] =>
  pitchDepuis({
    prenom: a.prenom,
    posteVise: a.posteVise,
    parcoursAvant: a.parcoursAvant,
    phare: scorePortfolio(a.accompagnement?.portfolio ?? []).phare?.nom,
    motivation: a.accompagnement?.convaincre?.motivation?.trim(),
  });

export function pitchDepuis(a: InfosPitch): PartiePitch[] {
  const { phare, motivation } = a;
  return [
    {
      titre: "Accroche",
      duree: "15 s",
      texte: `Je suis ${a.prenom}, ${a.posteVise.toLowerCase()} : je transforme des process lents et manuels en outils simples, sans code.`,
    },
    {
      titre: "Parcours",
      duree: "30 s",
      texte: a.parcoursAvant
        ? `Avant ma reconversion, j'ai passé ${a.parcoursAvant}. J'y ai vu de près les problèmes que les outils no-code règlent, et c'est ce terrain que j'apporte.`
        : "Avant ma reconversion, j'ai travaillé [métier d'avant, nombre d'années]. J'y ai vu de près les problèmes que les outils no-code règlent.",
    },
    {
      titre: "Preuve",
      duree: "45 s",
      texte: phare
        ? `Par exemple, avec ${phare} : [le problème], j'ai construit [la solution] avec [les outils], et [le résultat chiffré].`
        : "Par exemple, avec [mon meilleur projet] : [le problème], j'ai construit [la solution] avec [les outils], et [le résultat chiffré].",
    },
    {
      titre: "Projet",
      duree: "30 s",
      texte: motivation
        ? `Aujourd'hui, je cherche un poste de ${a.posteVise.toLowerCase()} : ${motivation}`
        : `Aujourd'hui, je cherche un poste de ${a.posteVise.toLowerCase()} dans [type d'entreprise], parce que [ce qui me motive chez vous].`,
    },
  ];
}

/** Nombre de passages encore à compléter (texte entre crochets). */
export const trousDansPitch = (pitch: PartiePitch[]) =>
  pitch.reduce((n, p) => n + (p.texte.match(/\[[^\]]+\]/g)?.length ?? 0), 0);

export const QUESTIONS_ENTRETIEN = [
  "Pourquoi cette reconversion, et pourquoi le no-code ?",
  "Racontez-moi un projet dont vous êtes fier·e : le problème, ce que vous avez fait, le résultat.",
  "Un outil no-code ne suffit pas pour un besoin : que faites-vous ?",
  "Comment expliquez-vous un projet technique à quelqu'un qui n'est pas du métier ?",
  "Quelles sont vos prétentions salariales ?",
];

/** Questions supplémentaires pour le mode entraînement. */
export const QUESTIONS_ENTRAINEMENT = [
  ...QUESTIONS_ENTRETIEN,
  "Présentez-vous en 1 minute.",
  "Qu'est-ce qui vous a le plus appris pendant la formation ?",
  "Parlez-moi d'une erreur sur un projet et de ce que vous en avez tiré.",
  "Pourquoi notre entreprise ?",
  "Comment priorisez-vous quand plusieurs demandes arrivent en même temps ?",
  "Quel outil no-code recommanderiez-vous pour un premier projet, et pourquoi ?",
  "Où vous voyez-vous dans 2 ans ?",
];

/** Tire n questions différentes ; `hasard` est injectable pour les tests. */
export function tirerQuestions(n: number, hasard: () => number = Math.random): string[] {
  const pioche = [...QUESTIONS_ENTRAINEMENT];
  for (let i = pioche.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [pioche[i], pioche[j]] = [pioche[j], pioche[i]];
  }
  return pioche.slice(0, Math.min(n, pioche.length));
}

export const formatChrono = (secondes: number) =>
  `${Math.floor(Math.max(0, secondes) / 60)}:${String(Math.max(0, secondes) % 60).padStart(2, "0")}`;

export const CRITERES_ENTRETIEN: { id: CritereEntretien; libelle: string }[] = [
  { id: "clarte", libelle: "Clarté et concision" },
  { id: "star", libelle: "Réponses structurées (situation, tâche, action, résultat)" },
  { id: "exemples", libelle: "Exemples concrets et chiffrés" },
  { id: "posture", libelle: "Posture et énergie" },
  { id: "questions", libelle: "Questions posées au recruteur" },
];

export function evaluerSimulation(notes: Partial<Record<CritereEntretien, 1 | 2 | 3 | 4>> | undefined) {
  const n = notes ?? {};
  const notes_ = CRITERES_ENTRETIEN.filter((c) => n[c.id] !== undefined);
  if (!notes_.length) return { score: null, aTravailler: null, pretPourEntretien: false };
  const somme = notes_.reduce((s, c) => s + (n[c.id] ?? 0), 0);
  const score = Math.round((somme / (notes_.length * 4)) * 100);
  const plusFaible = notes_.reduce((m, c) => ((n[c.id] ?? 0) < (n[m.id] ?? 0) ? c : m), notes_[0]);
  return {
    score,
    aTravailler: (n[plusFaible.id] ?? 0) < 3 ? plusFaible : null,
    pretPourEntretien: notes_.length === CRITERES_ENTRETIEN.length && score >= 70,
  };
}
