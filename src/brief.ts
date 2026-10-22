// Préparation d'un rendez-vous : données envoyées à l'IA (/api/brief), et brief de secours
// calculé par des règles quand l'IA n'est pas disponible. Fonctions pures, testées.

import type { Apprenant, Entreprise } from "./types";
import { aujourdhui, formatDate, joursEntre } from "./dates";
import { ETAPES_DOSSIER, etapeFaite } from "./dossier";
import { libelleStatut, raisonRelance } from "./regles";
import { pointsAttention } from "./accompagnement/questionnaire";

export interface RubriqueBrief {
  titre: string;
  points: string[];
}

/** Champs envoyés à la fonction serveur : uniquement ce qui sert au brief. */
export function donneesPourBrief(a: Apprenant, entreprises: Entreprise[], today = aujourdhui()) {
  return {
    prenom: a.prenom,
    statut: libelleStatut(a.statut),
    posteVise: a.posteVise,
    finFormation: a.finFormation,
    joursSansContact: joursEntre(a.dernierContact, today),
    prochaineAction: a.prochaineAction ? `${a.prochaineAction.libelle} (${a.prochaineAction.date})` : "",
    etapesFaites: ETAPES_DOSSIER.filter((e) => etapeFaite(a, e.id)).map((e) => e.libelle),
    etapesManquantes: ETAPES_DOSSIER.filter((e) => !etapeFaite(a, e.id)).map((e) => e.libelle),
    offres: entreprises.flatMap((e) =>
      e.offres.filter((o) => o.candidats.includes(a.id)).map((o) => `${o.titre} chez ${e.nom}`),
    ),
    notes: a.notes.slice(0, 3).map((n) => n.texte),
    inquietudes: pointsAttention(a.questionnaire).map((p) => p.texte),
    questionsEnAttente: (a.questions ?? []).filter((q) => !q.reponse).map((q) => q.texte),
  };
}

/** Transforme la réponse texte de l'IA (rubriques + tirets) en rubriques affichables. */
export function lireBrief(texte: string): RubriqueBrief[] {
  const rubriques: RubriqueBrief[] = [];
  for (const brute of texte.split("\n")) {
    const ligne = brute.trim();
    if (!ligne) continue;
    if (/^[-•*]\s*/.test(ligne)) {
      if (!rubriques.length) rubriques.push({ titre: "", points: [] });
      rubriques[rubriques.length - 1].points.push(ligne.replace(/^[-•*]\s*/, ""));
    } else {
      rubriques.push({ titre: ligne.replace(/^#+\s*/, "").replace(/[\s:#*]+$/, ""), points: [] });
    }
  }
  return rubriques.filter((r) => r.titre || r.points.length);
}

/** Brief de secours, sans IA : mêmes rubriques, construites à partir des règles métier. */
export function briefSansIA(a: Apprenant, entreprises: Entreprise[], today = aujourdhui()): RubriqueBrief[] {
  const d = donneesPourBrief(a, entreprises, today);
  const situation = [
    `${libelleStatut(a.statut)}, vise « ${a.posteVise} »`,
    `Dernier contact il y a ${d.joursSansContact} jour${d.joursSansContact > 1 ? "s" : ""} (${formatDate(a.dernierContact)})`,
  ];
  const relance = raisonRelance(a, today);
  if (relance) situation.push(`À relancer : ${relance.toLowerCase()}`);

  const points = d.etapesManquantes
    .slice(0, 3)
    .map((e) => `Avancer sur : ${e.replace(/^Séance \d · /, "").toLowerCase()}`);
  if (!points.length) points.push("Dossier complet : le proposer aux offres ouvertes");
  points.unshift(...d.inquietudes);

  const questions = [
    ...d.questionsEnAttente.map((q) => `Répondre à sa question : « ${q} »`),
    "Où en es-tu dans ta recherche depuis notre dernier échange ?",
    d.offres.length
      ? `Quelles suites pour l'offre « ${d.offres[0]} » ?`
      : "Quels types d'entreprises aimerais-tu que l'on te présente ?",
    "De quoi as-tu besoin de notre part pour la suite ?",
  ];

  return [
    { titre: "Situation", points: situation },
    { titre: "Points à travailler", points },
    { titre: "Questions à poser", points: questions },
  ];
}
