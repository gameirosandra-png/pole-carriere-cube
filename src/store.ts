import { useEffect, useState } from "react";
import type { Apprenant, Donnees } from "./types";
import { creerDonneesDemo } from "./data/seed";

// Persistance locale (MVP sans backend) : les données restent dans le navigateur.
// La V2 remplacera ce module par une base partagée (Supabase).

const CLE = "pole-carriere-cube:v2";

function charger(): Donnees {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return JSON.parse(brut) as Donnees;
  } catch {
    /* stockage indisponible ou corrompu : on repart des données de démo */
  }
  return creerDonneesDemo();
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

  const ajouterApprenant = (a: Apprenant) => setDonnees((d) => ({ ...d, apprenants: [...d.apprenants, a] }));

  /** Supprime l'apprenant et le retire des offres où il était proposé. */
  const supprimerApprenant = (id: string) =>
    setDonnees((d) => ({
      apprenants: d.apprenants.filter((a) => a.id !== id),
      entreprises: d.entreprises.map((e) => ({
        ...e,
        offres: e.offres.map((o) => ({ ...o, candidats: o.candidats.filter((c) => c !== id) })),
      })),
    }));

  const reinitialiser = () => setDonnees(creerDonneesDemo());

  return { donnees, setDonnees, majApprenant, ajouterApprenant, supprimerApprenant, reinitialiser };
}

export const nouvelId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
