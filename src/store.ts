import { useCallback, useEffect, useRef, useState } from "react";
import type { Apprenant, Donnees } from "./types";
import { creerDonneesDemo } from "./data/seed";

// Persistance locale (MVP sans backend) : les données restent dans le navigateur.
// La V2 remplacera ce module par une base partagée (Supabase).

const CLE = "pole-carriere-cube:v3";
const DUREE_ANNULATION_MS = 8000;

function charger(): Donnees {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return JSON.parse(brut) as Donnees;
  } catch {
    /* stockage indisponible ou corrompu : on repart des données de démo */
  }
  return creerDonneesDemo();
}

export interface Annulation {
  message: string;
  annuler: () => void;
}

export function useDonnees() {
  const [donnees, setDonnees] = useState<Donnees>(charger);
  const [annulation, setAnnulation] = useState<Annulation | null>(null);
  const minuteur = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
    } catch {
      /* navigation privée : les modifications restent en mémoire */
    }
  }, [donnees]);

  const fermerAnnulation = useCallback(() => {
    window.clearTimeout(minuteur.current);
    setAnnulation(null);
  }, []);

  /**
   * Applique une modification destructive (suppression) et propose de l'annuler
   * pendant quelques secondes, en restaurant l'état d'avant.
   */
  const modifierAvecAnnulation = (message: string, f: (d: Donnees) => Donnees) => {
    const avant = donnees;
    setDonnees(f(donnees));
    window.clearTimeout(minuteur.current);
    setAnnulation({
      message,
      annuler: () => {
        setDonnees(avant);
        fermerAnnulation();
      },
    });
    minuteur.current = window.setTimeout(() => setAnnulation(null), DUREE_ANNULATION_MS);
  };

  const majApprenant = (id: string, maj: (a: Apprenant) => Apprenant) =>
    setDonnees((d) => ({ ...d, apprenants: d.apprenants.map((a) => (a.id === id ? maj(a) : a)) }));

  const ajouterApprenant = (a: Apprenant) => setDonnees((d) => ({ ...d, apprenants: [...d.apprenants, a] }));

  /** Supprime l'apprenant et le retire des offres où il était proposé (annulable). */
  const supprimerApprenant = (id: string) => {
    const a = donnees.apprenants.find((x) => x.id === id);
    modifierAvecAnnulation(`Fiche de ${a?.prenom ?? ""} ${a?.nom ?? ""} supprimée`.trim(), (d) => ({
      apprenants: d.apprenants.filter((x) => x.id !== id),
      entreprises: d.entreprises.map((e) => ({
        ...e,
        offres: e.offres.map((o) => ({ ...o, candidats: o.candidats.filter((c) => c !== id) })),
      })),
    }));
  };

  const reinitialiser = () => {
    fermerAnnulation();
    setDonnees(creerDonneesDemo());
  };

  return {
    donnees,
    setDonnees,
    majApprenant,
    ajouterApprenant,
    supprimerApprenant,
    modifierAvecAnnulation,
    annulation,
    fermerAnnulation,
    reinitialiser,
  };
}

export const nouvelId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
