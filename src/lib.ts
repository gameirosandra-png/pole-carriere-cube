import { useEffect, useState } from "react";
import type { Apprenant, Donnees, Statut } from "./types";
import { SEED } from "./data/seed";

/* ---------- Libellés et couleurs des statuts ---------- */

export const STATUTS: { id: Statut; libelle: string }[] = [
  { id: "formation", libelle: "En formation" },
  { id: "recherche", libelle: "En recherche" },
  { id: "entretiens", libelle: "En entretiens" },
  { id: "poste", libelle: "En poste" },
  { id: "freelance", libelle: "Freelance" },
];

export const libelleStatut = (s: Statut) =>
  STATUTS.find((x) => x.id === s)?.libelle ?? s;

export const estInsere = (a: Apprenant) =>
  a.statut === "poste" || a.statut === "freelance";

/* ---------- Dates ---------- */

const JOUR = 86_400_000;

export const aujourdhui = () => new Date().toISOString().slice(0, 10);

export const joursEntre = (de: string, a: string) =>
  Math.round((Date.parse(a) - Date.parse(de)) / JOUR);

export const ajouterMois = (iso: string, mois: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + mois);
  return d.toISOString().slice(0, 10);
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/* ---------- Indicateurs du tableau de bord ---------- */

export const SEUIL_RELANCE_JOURS = 14;

export interface Indicateurs {
  tauxSixMois: number | null; // % insérés dans les 6 mois, promos dont la fenêtre est close
  baseSixMois: number;
  delaiMoyen: number | null;  // jours entre fin de formation et insertion
  enEntretiens: number;
  aRelancer: Apprenant[];
}

/** Un apprenant est à relancer si son action prévue est dépassée
 *  ou s'il n'a pas été contacté depuis SEUIL_RELANCE_JOURS jours. */
export function raisonRelance(a: Apprenant, today = aujourdhui()): string | null {
  if (estInsere(a)) return null;
  if (a.prochaineAction && a.prochaineAction.date < today) return "Action en retard";
  const silence = joursEntre(a.dernierContact, today);
  if (a.statut !== "formation" && silence > SEUIL_RELANCE_JOURS) return `Sans contact depuis ${silence} j`;
  return null;
}

export function calculerIndicateurs(apprenants: Apprenant[], today = aujourdhui()): Indicateurs {
  // Taux à 6 mois : uniquement les apprenants dont la fenêtre de 6 mois est terminée.
  const fenetreClose = apprenants.filter((a) => ajouterMois(a.finFormation, 6) <= today);
  const insereDansLesTemps = fenetreClose.filter(
    (a) => estInsere(a) && a.dateInsertion && a.dateInsertion <= ajouterMois(a.finFormation, 6),
  );

  const delais = apprenants
    .filter((a) => estInsere(a) && a.dateInsertion)
    .map((a) => joursEntre(a.finFormation, a.dateInsertion!));

  return {
    tauxSixMois: fenetreClose.length ? Math.round((insereDansLesTemps.length / fenetreClose.length) * 100) : null,
    baseSixMois: fenetreClose.length,
    delaiMoyen: delais.length ? Math.round(delais.reduce((s, d) => s + d, 0) / delais.length) : null,
    enEntretiens: apprenants.filter((a) => a.statut === "entretiens").length,
    aRelancer: apprenants.filter((a) => raisonRelance(a, today) !== null),
  };
}

/* ---------- Persistance (localStorage, MVP sans backend) ---------- */

const CLE = "pole-carriere-cube:v1";

function charger(): Donnees {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return JSON.parse(brut) as Donnees;
  } catch {
    /* stockage indisponible : on repart des données de démo */
  }
  return structuredClone(SEED);
}

export function useDonnees() {
  const [donnees, setDonnees] = useState<Donnees>(charger);

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
    } catch {
      /* navigation privée : les modifications restent en mémoire */
    }
  }, [donnees]);

  const majApprenant = (id: string, maj: (a: Apprenant) => Apprenant) =>
    setDonnees((d) => ({ ...d, apprenants: d.apprenants.map((a) => (a.id === id ? maj(a) : a)) }));

  const reinitialiser = () => setDonnees(structuredClone(SEED));

  return { donnees, setDonnees, majApprenant, reinitialiser };
}

export const nouvelId = () => Math.random().toString(36).slice(2, 10);
