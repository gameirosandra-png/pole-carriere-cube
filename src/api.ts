// Appels aux fonctions serveur (dossier /api, déployé sur Vercel).

import type { Apprenant, Entreprise } from "./types";
import { aujourdhui, formatDate } from "./dates";
import { calculerIndicateurs, raisonRelance } from "./regles";
import { pretAProposer } from "./dossier";
import { donneesPourBrief } from "./brief";

export type Resultat<T> = { ok: true; valeur: T } | { ok: false; erreur: string; nonConfigure: boolean };

async function appeler<T>(chemin: string, corps: unknown): Promise<Resultat<T>> {
  try {
    const r = await fetch(chemin, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corps),
    });
    const donnees = (await r.json().catch(() => ({}))) as T & { erreur?: string };
    if (!r.ok) {
      return {
        ok: false,
        erreur: donnees.erreur ?? "Le service ne répond pas. Réessayez plus tard.",
        nonConfigure: r.status === 503 || r.status === 404,
      };
    }
    return { ok: true, valeur: donnees };
  } catch {
    return { ok: false, erreur: "Impossible de joindre le serveur. Vérifiez votre connexion.", nonConfigure: true };
  }
}

/** Envoie le récap de la semaine à l'équipe du pôle, par e-mail via Make. */
export function envoyerRecap(apprenants: Apprenant[], today = aujourdhui()) {
  const ind = calculerIndicateurs(apprenants, today);
  return appeler<{ envoye: boolean }>("/api/recap", {
    date: `Semaine du ${formatDate(today)} ${today.slice(0, 4)}`,
    tauxSixMois: ind.tauxSixMois,
    relances: ind.aRelancer.map((a) => ({
      nom: `${a.prenom} ${a.nom}`,
      raison: raisonRelance(a, today) ?? "",
      action: a.prochaineAction?.libelle ?? "",
    })),
    prets: apprenants
      .filter((a) => a.statut !== "poste" && a.statut !== "freelance" && pretAProposer(a))
      .map((a) => `${a.prenom} ${a.nom} (${a.posteVise})`),
  });
}

/** V2 : demande à l'IA un brief de rendez-vous (fonction serveur api/brief.ts, prête mais non activée). */
export function demanderBrief(a: Apprenant, entreprises: Entreprise[]) {
  return appeler<{ brief: string; modele: string }>("/api/brief", donneesPourBrief(a, entreprises));
}
