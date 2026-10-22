// Fiche candidat : la page d'une page envoyée à une entreprise.
// Elle ne contient que ce qu'un recruteur doit voir : ni notes internes, ni prétention salariale,
// ni nom de famille complet. Le lien de partage embarque les données de la fiche dans l'URL
// (après le #, jamais envoyé au serveur) : rien n'est stocké en ligne. Pour garder des liens courts,
// on n'y met que les données brutes ; les textes sont reconstruits à l'ouverture. Fonctions pures, testées.

import type { Apprenant, Statut } from "../types";
import { formatDate } from "../dates";
import { pretAProposer } from "../dossier";
import { evaluerSimulation, pitchDepuis } from "./convaincre";
import { scorePortfolio, scoreProjet } from "./portfolio";

export interface FicheCandidat {
  prenom: string;
  initiale: string;
  posteVise: string;
  promo: string;
  /** Pitch en quelques phrases, sans les passages encore à compléter. */
  presentation: string[];
  parcoursAvant?: string;
  projets: { nom: string; lien?: string; phare: boolean }[];
  disponibilite: string;
  /** Repères de préparation, exprimés en qualitatif pour l'entreprise. */
  preparation: string[];
}

/** Données brutes de la fiche, aux clés courtes : c'est ce que transporte le lien. */
export interface DonneesFiche {
  p: string; // prénom
  i: string; // initiale du nom
  v: string; // poste visé
  r: string; // promo
  a?: string; // parcours avant
  m?: string; // motivation
  j: [string, string?][]; // projets [nom, lien], du meilleur au moins bon
  h?: 1; // le premier projet est le projet phare
  s: Statut;
  f: string; // fin de formation
  c?: 1; // parcours complet
  n?: number; // projets solides
  e?: 1; // prêt pour les entretiens
}

export function donneesFiche(a: Apprenant): DonneesFiche {
  const portfolio = scorePortfolio(a.accompagnement?.portfolio ?? []);
  const d: DonneesFiche = {
    p: a.prenom,
    i: a.nom.charAt(0).toUpperCase(),
    v: a.posteVise,
    r: a.promo,
    j: [...(a.accompagnement?.portfolio ?? [])]
      .filter((p) => p.nom.trim())
      .sort((x, y) => scoreProjet(y) - scoreProjet(x))
      .slice(0, 3)
      .map((p): [string, string?] => (p.lien ? [p.nom, p.lien] : [p.nom])),
    s: a.statut,
    f: a.finFormation,
  };
  const motivation = a.accompagnement?.convaincre?.motivation?.trim();
  if (a.parcoursAvant) d.a = a.parcoursAvant;
  if (motivation) d.m = motivation;
  if (portfolio.phare) d.h = 1;
  if (pretAProposer(a)) d.c = 1;
  if (portfolio.projetsSolides) d.n = portfolio.projetsSolides;
  if (evaluerSimulation(a.accompagnement?.convaincre?.simulation).pretPourEntretien) d.e = 1;
  return d;
}

const sansTrous = (texte: string) => !/\[[^\]]+\]/.test(texte);

export function construireFiche(d: DonneesFiche): FicheCandidat {
  const disponibilite =
    d.s === "formation"
      ? `Disponible à partir du ${formatDate(d.f)} ${d.f.slice(0, 4)}, en alternance dès maintenant`
      : d.s === "entretiens"
        ? "Disponible rapidement (d'autres process en cours)"
        : "Disponible immédiatement";

  const preparation: string[] = [];
  if (d.c) preparation.push("Parcours d'accompagnement complet (7 séances)");
  if (d.n) preparation.push(`${d.n} projet${d.n > 1 ? "s" : ""} documenté${d.n > 1 ? "s" : ""} de bout en bout`);
  if (d.e) preparation.push("Entraîné·e aux entretiens");

  const phare = d.h ? d.j[0]?.[0] : undefined;
  return {
    prenom: d.p,
    initiale: d.i,
    posteVise: d.v,
    promo: d.r,
    presentation: pitchDepuis({ prenom: d.p, posteVise: d.v, parcoursAvant: d.a, phare, motivation: d.m })
      .map((x) => x.texte)
      .filter(sansTrous),
    parcoursAvant: d.a,
    projets: d.j.map(([nom, lien], k) => ({ nom, lien, phare: k === 0 && Boolean(phare) })),
    disponibilite,
    preparation,
  };
}

export const ficheCandidat = (a: Apprenant) => construireFiche(donneesFiche(a));

/* ---------- Lien de partage ---------- */

const PREFIXE = "#candidat=";

function versBase64Url(texte: string): string {
  const octets = new TextEncoder().encode(texte);
  let binaire = "";
  octets.forEach((o) => (binaire += String.fromCharCode(o)));
  return btoa(binaire).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function depuisBase64Url(code: string): string {
  const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const binaire = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binaire, (c) => c.charCodeAt(0)));
}

export const lienFiche = (a: Apprenant, origine: string) =>
  `${origine}/${PREFIXE}${versBase64Url(JSON.stringify(donneesFiche(a)))}`;

const STATUTS_VALIDES: Statut[] = ["formation", "recherche", "entretiens", "poste", "freelance"];
const chaine = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

/** Lit une fiche depuis l'adresse de la page ; null si le lien est absent ou abîmé. */
export function lireFicheDepuisHash(hash: string): FicheCandidat | null {
  if (!hash.startsWith(PREFIXE)) return null;
  try {
    const o = JSON.parse(depuisBase64Url(hash.slice(PREFIXE.length))) as Record<string, unknown>;
    if (typeof o.p !== "string" || typeof o.v !== "string") return null;
    const date = chaine(o.f, 10);
    return construireFiche({
      p: chaine(o.p, 60),
      i: chaine(o.i, 1),
      v: chaine(o.v, 80),
      r: chaine(o.r, 60),
      a: chaine(o.a, 200) || undefined,
      m: chaine(o.m, 300) || undefined,
      j: (Array.isArray(o.j) ? o.j.slice(0, 3) : []).map((x): [string, string?] => {
        const [nom, lien] = Array.isArray(x) ? x : [];
        const url = chaine(lien, 300);
        return /^https?:\/\//.test(url) ? [chaine(nom, 120), url] : [chaine(nom, 120)];
      }),
      h: o.h === 1 ? 1 : undefined,
      s: STATUTS_VALIDES.includes(o.s as Statut) ? (o.s as Statut) : "recherche",
      f: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "2026-01-01",
      c: o.c === 1 ? 1 : undefined,
      n: typeof o.n === "number" ? Math.max(0, Math.min(3, Math.round(o.n))) : undefined,
      e: o.e === 1 ? 1 : undefined,
    });
  } catch {
    return null;
  }
}
