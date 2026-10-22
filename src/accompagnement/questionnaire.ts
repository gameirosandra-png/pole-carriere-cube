// Questionnaire « Faisons connaissance » : rempli par l'apprenant avant la séance 1.
// Ses réponses remplissent la fiche, le pitch, l'atelier salaire, et signalent les points d'attention.
// Boîte à questions : l'apprenant pose une question au pôle, l'équipe y répond.
// Fonctions pures, testées.

import type { Apprenant, EtapeDossier, Inquietude, QuestionPole, Questionnaire } from "../types";
import { aujourdhui, formatDate } from "../dates";
import { devinerPoste } from "./salaire";

export const INQUIETUDES: { id: Inquietude; libelle: string; seance: EtapeDossier | null; conseil: string }[] = [
  { id: "cv", libelle: "Mon CV", seance: "cv", conseil: "Prioriser l'atelier CV" },
  { id: "portfolio", libelle: "Montrer mes projets", seance: "portfolio", conseil: "Prioriser l'atelier portfolio" },
  { id: "pitch", libelle: "Me présenter en peu de temps", seance: "pitch", conseil: "Travailler le pitch tôt" },
  { id: "entretien", libelle: "Les entretiens", seance: "simulation", conseil: "Proposer un entretien blanc" },
  { id: "salaire", libelle: "Parler salaire", seance: "negociation", conseil: "Préparer la négociation salariale" },
  { id: "reseau", libelle: "Trouver des offres, le réseau", seance: "linkedin", conseil: "Activer LinkedIn et le réseau de l'école" },
  { id: "confiance", libelle: "La confiance en moi", seance: null, conseil: "Valoriser son parcours d'avant dès la séance 1" },
];

export const CONTRATS_SOUHAITES: { id: NonNullable<Questionnaire["contrat"]>; libelle: string }[] = [
  { id: "cdi", libelle: "CDI ou CDD" },
  { id: "alternance", libelle: "Alternance" },
  { id: "freelance", libelle: "Freelance" },
  { id: "ouvert", libelle: "Ouvert à tout" },
];

export const TELETRAVAIL: { id: NonNullable<Questionnaire["teletravail"]>; libelle: string }[] = [
  { id: "sur-site", libelle: "Sur site" },
  { id: "hybride", libelle: "Hybride" },
  { id: "complet", libelle: "Télétravail complet" },
];

const nettoyer = (t: string | undefined) => t?.trim() || undefined;

/**
 * Enregistre les réponses et en reporte l'essentiel là où il sert :
 * fiche (parcours, poste visé), pitch (motivation), atelier salaire (zone, contrat).
 * Ce que l'équipe a déjà saisi n'est remplacé que si l'apprenant a répondu.
 */
export function appliquerQuestionnaire(a: Apprenant, q: Omit<Questionnaire, "rempliLe">, today = aujourdhui()): Apprenant {
  const questionnaire: Questionnaire = { ...q, rempliLe: today };
  const posteVise = nettoyer(q.posteVise) ?? a.posteVise;
  const motivation = nettoyer(q.motivation);
  const salaireActuel = a.accompagnement?.salaire;
  const salaire =
    q.zone || q.contrat
      ? {
          poste: salaireActuel?.poste ?? devinerPoste(posteVise),
          zone: q.zone ?? salaireActuel?.zone ?? "idf",
          contrat: q.contrat === "freelance" ? ("freelance" as const) : q.contrat ? ("salarie" as const) : (salaireActuel?.contrat ?? "salarie"),
        }
      : salaireActuel;
  const premiereFois = !a.questionnaire;

  return {
    ...a,
    questionnaire,
    posteVise,
    parcoursAvant: nettoyer(q.parcoursAvant) ?? a.parcoursAvant,
    anneesExperience: q.anneesExperience ?? a.anneesExperience,
    dernierContact: today,
    accompagnement: {
      ...a.accompagnement,
      salaire,
      convaincre: motivation ? { ...a.accompagnement?.convaincre, motivation } : a.accompagnement?.convaincre,
    },
    notes: premiereFois
      ? [{ id: `q-${today}`, date: today, texte: "Questionnaire « Faisons connaissance » rempli par l'apprenant." }, ...a.notes]
      : a.notes,
  };
}

export interface PointAttention {
  texte: string;
  seance: EtapeDossier | null;
}

/** Ce que l'équipe doit retenir avant la séance 1. */
export function pointsAttention(q: Questionnaire | undefined): PointAttention[] {
  if (!q) return [];
  return (q.inquietudes ?? []).flatMap((id) => {
    const i = INQUIETUDES.find((x) => x.id === id);
    return i ? [{ texte: `Inquiet·e : ${i.libelle.toLowerCase()}. ${i.conseil}.`, seance: i.seance }] : [];
  });
}

/** Résumé lisible des réponses, pour la fiche. */
export function resumeQuestionnaire(q: Questionnaire): { libelle: string; valeur: string }[] {
  const lignes: { libelle: string; valeur: string | undefined }[] = [
    { libelle: "Vise", valeur: [q.posteVise, q.secteurs && `secteurs : ${q.secteurs}`].filter(Boolean).join(" · ") },
    {
      libelle: "Cherche",
      valeur: [
        CONTRATS_SOUHAITES.find((c) => c.id === q.contrat)?.libelle,
        q.zone === "idf" ? "Île-de-France" : q.zone === "regions" ? "en régions" : undefined,
        TELETRAVAIL.find((t) => t.id === q.teletravail)?.libelle.toLowerCase(),
      ]
        .filter(Boolean)
        .join(" · "),
    },
    { libelle: "Disponible", valeur: q.disponibleLe && `à partir du ${formatDate(q.disponibleLe)}` },
    { libelle: "Points forts", valeur: q.pointsForts },
    { libelle: "Ce qui le motive", valeur: q.motivation },
  ];
  return lignes.filter((l): l is { libelle: string; valeur: string } => Boolean(l.valeur));
}

/* ---------- Boîte à questions ---------- */

export const poserQuestion = (a: Apprenant, texte: string, id: string, today = aujourdhui()): Apprenant => ({
  ...a,
  dernierContact: today,
  questions: [...(a.questions ?? []), { id, date: today, texte: texte.trim() }],
});

export const repondreQuestion = (a: Apprenant, id: string, reponse: string, today = aujourdhui()): Apprenant => ({
  ...a,
  dernierContact: today,
  questions: (a.questions ?? []).map((q) => (q.id === id ? { ...q, reponse: reponse.trim(), reponduLe: today } : q)),
});

/** Questions sans réponse, de la plus ancienne à la plus récente. */
export function questionsEnAttente(apprenants: Apprenant[]): { apprenant: Apprenant; question: QuestionPole }[] {
  return apprenants
    .flatMap((a) => (a.questions ?? []).filter((q) => !q.reponse).map((question) => ({ apprenant: a, question })))
    .sort((x, y) => x.question.date.localeCompare(y.question.date));
}
