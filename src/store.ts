import { useCallback, useEffect, useRef, useState } from "react";
import type { Apprenant, AtelierCollectif, Donnees, Entreprise } from "./types";
import { creerDonneesDemo } from "./data/seed";
import { changementsDonnees } from "./synchro";
import { ecrire, lireTable, sessionValide, supprimer, type Session } from "./supabase";

// Deux modes, mêmes écrans :
// - démo (par défaut) : données fictives enregistrées dans le navigateur (localStorage) ;
// - équipe : données partagées dans Supabase, après connexion par lien magique.

const CLE = "pole-carriere-cube:v4";
const DUREE_ANNULATION_MS = 8000;
const DELAI_ENREGISTREMENT_MS = 600;
const INTERVALLE_ACTUALISATION_MS = 20_000;

function charger(): Donnees {
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) return JSON.parse(brut) as Donnees;
  } catch {
    /* stockage indisponible ou corrompu : on repart des données de démo */
  }
  return creerDonneesDemo();
}

export type EtatSynchro = "local" | "chargement" | "vide" | "synchronise" | "enregistrement" | "erreur";

export interface Annulation {
  message: string;
  annuler: () => void;
}

export function useDonnees(session: Session | null, sessionPerdue: () => void) {
  const [donnees, setDonnees] = useState<Donnees>(charger);
  const [annulation, setAnnulation] = useState<Annulation | null>(null);
  const [synchro, setSynchro] = useState<EtatSynchro>(session ? "chargement" : "local");
  const minuteur = useRef<number | undefined>(undefined);

  // Mode équipe : dernier état connu de la base, pour n'envoyer que les différences.
  const distant = useRef<Donnees | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const donneesCourantes = useRef(donnees);
  donneesCourantes.current = donnees;

  const sessionFraiche = useCallback(async () => {
    const s = sessionRef.current ? await sessionValide(sessionRef.current) : null;
    if (!s) sessionPerdue();
    return s;
  }, [sessionPerdue]);

  const lireBase = useCallback(async (): Promise<Donnees | null> => {
    const s = await sessionFraiche();
    if (!s) return null;
    const [apprenants, entreprises, ateliers] = await Promise.all([
      lireTable<Apprenant>(s, "apprenants"),
      lireTable<Entreprise>(s, "entreprises"),
      lireTable<AtelierCollectif>(s, "ateliers"),
    ]);
    return { apprenants, entreprises, ateliers };
  }, [sessionFraiche]);

  // Changement de mode : connexion → chargement de la base ; déconnexion → retour à la démo locale.
  const connecte = Boolean(session);
  useEffect(() => {
    if (!connecte) {
      distant.current = null;
      setDonnees(charger());
      setSynchro("local");
      return;
    }
    let actif = true;
    setSynchro("chargement");
    lireBase()
      .then((d) => {
        if (!actif || !d) return;
        distant.current = d;
        setDonnees(d);
        setSynchro(d.apprenants.length || d.entreprises.length ? "synchronise" : "vide");
      })
      .catch(() => actif && setSynchro("erreur"));
    return () => {
      actif = false;
    };
  }, [connecte, lireBase]);

  // Mode démo : sauvegarde locale.
  useEffect(() => {
    if (connecte) return;
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
    } catch {
      /* navigation privée : les modifications restent en mémoire */
    }
  }, [donnees, connecte]);

  // Mode équipe : envoi des différences, regroupées après une courte pause de saisie.
  useEffect(() => {
    if (!connecte || !distant.current) return;
    const c = changementsDonnees(distant.current, donnees);
    if (c.vide) return;
    setSynchro("enregistrement");
    const instantane = donnees;
    const t = window.setTimeout(async () => {
      try {
        const s = await sessionFraiche();
        if (!s) return;
        await Promise.all([
          ecrire(s, "apprenants", c.apprenants.aEcrire),
          ecrire(s, "entreprises", c.entreprises.aEcrire),
          supprimer(s, "apprenants", c.apprenants.aSupprimer),
          supprimer(s, "entreprises", c.entreprises.aSupprimer),
          ecrire(s, "ateliers", c.ateliers.aEcrire),
          supprimer(s, "ateliers", c.ateliers.aSupprimer),
        ]);
        distant.current = instantane;
        setSynchro("synchronise");
      } catch {
        setSynchro("erreur");
      }
    }, DELAI_ENREGISTREMENT_MS);
    return () => window.clearTimeout(t);
  }, [donnees, connecte, sessionFraiche]);

  // Mode équipe : récupère les modifications des collègues (toutes les 20 s et au retour sur l'onglet).
  useEffect(() => {
    if (!connecte) return;
    const actualiser = async () => {
      if (!distant.current) return;
      try {
        const d = await lireBase();
        if (!d || !distant.current) return;
        const local = changementsDonnees(distant.current, donneesCourantes.current);
        if (!local.vide) return; // des modifications locales sont en cours d'envoi
        if (!changementsDonnees(distant.current, d).vide) {
          distant.current = d;
          setDonnees(d);
        }
      } catch {
        /* réessai au prochain cycle */
      }
    };
    const t = window.setInterval(actualiser, INTERVALLE_ACTUALISATION_MS);
    window.addEventListener("focus", actualiser);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", actualiser);
    };
  }, [connecte, lireBase]);

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
      ateliers: (d.ateliers ?? []).map((x) => ({ ...x, inscrits: x.inscrits.filter((i) => i !== id) })),
      apprenants: d.apprenants.filter((x) => x.id !== id),
      entreprises: d.entreprises.map((e) => ({
        ...e,
        offres: e.offres.map((o) => ({ ...o, candidats: o.candidats.filter((c) => c !== id) })),
      })),
    }));
  };

  /** Remet les données de démo (en mode équipe : remplace le contenu de la base partagée). */
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
    synchro,
  };
}

export const nouvelId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
