// Export CSV pour le reporting (format lisible directement par Excel en français :
// séparateur « ; » et encodage UTF-8 avec BOM pour les accents).

import type { Apprenant } from "./types";
import type { Indicateurs } from "./regles";
import { libelleStatut, raisonRelance } from "./regles";

const echapper = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const versCsv = (lignes: (string | number | null | undefined)[][]) =>
  lignes.map((l) => l.map(echapper).join(";")).join("\r\n");

export function csvApprenants(apprenants: Apprenant[], today?: string): string {
  return versCsv([
    ["Prénom", "Nom", "Promo", "Fin de formation", "Statut", "Poste visé", "Entreprise", "Date d'insertion", "Dernier contact", "Prochaine action", "Date de l'action", "À relancer"],
    ...apprenants.map((a) => [
      a.prenom,
      a.nom,
      a.promo,
      a.finFormation,
      libelleStatut(a.statut),
      a.posteVise,
      a.entreprise,
      a.dateInsertion,
      a.dernierContact,
      a.prochaineAction?.libelle,
      a.prochaineAction?.date,
      raisonRelance(a, today) ?? "",
    ]),
  ]);
}

export function csvIndicateurs(ind: Indicateurs, date: string): string {
  return versCsv([
    ["Indicateur", "Valeur", "Date du calcul"],
    ["Taux d'insertion à 6 mois (%)", ind.tauxSixMois, date],
    ["Base du taux à 6 mois (apprenants)", ind.baseSixMois, date],
    ["Délai moyen d'insertion (jours)", ind.delaiMoyen, date],
    ["Apprenants en entretiens", ind.enEntretiens, date],
    ["Apprenants à relancer", ind.aRelancer.length, date],
  ]);
}

/** Déclenche le téléchargement d'un fichier CSV dans le navigateur. */
export function telechargerCsv(nomFichier: string, contenu: string) {
  const blob = new Blob(["﻿" + contenu], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  lien.click();
  URL.revokeObjectURL(url);
}
