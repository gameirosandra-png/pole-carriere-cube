// Client minimal pour Supabase (Auth + base PostgREST), sans dépendance :
// connexion par lien magique, rafraîchissement de session, lecture et écriture des documents.
// La clé publishable est publique par nature : la sécurité repose sur les règles RLS de la base.

import type { Apprenant, AtelierCollectif, Entreprise } from "./types";

export const SUPABASE_URL = "https://yxnvgytdjxtqxqhoxbth.supabase.co";
export const SUPABASE_CLE_PUBLIQUE = "sb_publishable_YnWosDgrboegfPruuv6xqA_Gh5xn-09";

export const CLE_SESSION = "pole-carriere-cube:session";

export interface Session {
  accessToken: string;
  refreshToken: string;
  expireA: number; // secondes depuis 1970
  email: string;
}

/* ---------- Session ---------- */

function emailDuJeton(jeton: string): string {
  try {
    const charge = JSON.parse(atob(jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof charge.email === "string" ? charge.email : "";
  } catch {
    return "";
  }
}

function enregistrer(s: Session | null) {
  try {
    if (s) localStorage.setItem(CLE_SESSION, JSON.stringify(s));
    else localStorage.removeItem(CLE_SESSION);
  } catch {
    /* stockage indisponible : la session vit le temps de l'onglet */
  }
}

/**
 * Au retour du lien magique, Supabase place les jetons dans l'URL (#access_token=…).
 * On les récupère, on les enregistre, puis on nettoie l'adresse.
 */
export function lireRetourLienMagique(): Session | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  const session: Session = {
    accessToken,
    refreshToken,
    expireA: Math.floor(Date.now() / 1000) + Number(params.get("expires_in") ?? 3600),
    email: emailDuJeton(accessToken),
  };
  enregistrer(session);
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return session;
}

/** L'erreur renvoyée par un lien magique expiré ou déjà utilisé, s'il y en a une dans l'URL. */
export function lireErreurLienMagique(): string | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const erreur = params.get("error_description");
  if (!erreur) return null;
  history.replaceState(null, "", window.location.pathname + window.location.search);
  return "Ce lien de connexion a expiré ou a déjà servi. Demandez-en un nouveau.";
}

export function sessionEnregistree(): Session | null {
  try {
    const brut = localStorage.getItem(CLE_SESSION);
    return brut ? (JSON.parse(brut) as Session) : null;
  } catch {
    return null;
  }
}

/** Renvoie une session valide, en la rafraîchissant si elle expire bientôt. */
export async function sessionValide(s: Session): Promise<Session | null> {
  if (s.expireA - 60 > Date.now() / 1000) return s;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_CLE_PUBLIQUE, "content-type": "application/json" },
    body: JSON.stringify({ refresh_token: s.refreshToken }),
  });
  if (!r.ok) {
    enregistrer(null);
    return null;
  }
  const d = (await r.json()) as { access_token: string; refresh_token: string; expires_in: number };
  const nouvelle: Session = {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    expireA: Math.floor(Date.now() / 1000) + d.expires_in,
    email: emailDuJeton(d.access_token) || s.email,
  };
  enregistrer(nouvelle);
  return nouvelle;
}

/** Envoie un lien de connexion par e-mail. Le lien ramène sur la page actuelle. */
export async function envoyerLienMagique(email: string): Promise<string | null> {
  const retour = encodeURIComponent(window.location.origin + window.location.pathname);
  const r = await fetch(`${SUPABASE_URL}/auth/v1/otp?redirect_to=${retour}`, {
    method: "POST",
    headers: { apikey: SUPABASE_CLE_PUBLIQUE, "content-type": "application/json" },
    body: JSON.stringify({ email, create_user: true }),
  });
  if (r.ok) return null;
  if (r.status === 429) return "Trop de demandes de lien. Patientez une minute avant de réessayer.";
  return "L'envoi du lien a échoué. Vérifiez l'adresse e-mail et réessayez.";
}

export async function deconnecter(s: Session | null) {
  if (s) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_CLE_PUBLIQUE, authorization: `Bearer ${s.accessToken}` },
    }).catch(() => undefined);
  }
  enregistrer(null);
}

/* ---------- Données ---------- */

type Table = "apprenants" | "entreprises" | "ateliers";

const entetes = (s: Session) => ({
  apikey: SUPABASE_CLE_PUBLIQUE,
  authorization: `Bearer ${s.accessToken}`,
  "content-type": "application/json",
});

async function verifier(r: Response) {
  if (!r.ok) throw new Error(`Supabase ${r.status} : ${(await r.text()).slice(0, 200)}`);
}

export async function lireTable<T>(s: Session, table: Table): Promise<T[]> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=donnees&order=id`, { headers: entetes(s) });
  await verifier(r);
  return ((await r.json()) as { donnees: T }[]).map((l) => l.donnees);
}

/** Insère ou met à jour des documents (par id). */
export async function ecrire(s: Session, table: Table, documents: (Apprenant | Entreprise | AtelierCollectif)[]) {
  if (!documents.length) return;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: { ...entetes(s), prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(documents.map((d) => ({ id: d.id, donnees: d }))),
  });
  await verifier(r);
}

export async function supprimer(s: Session, table: Table, ids: string[]) {
  if (!ids.length) return;
  const liste = ids.map((id) => `"${id.replace(/"/g, "")}"`).join(",");
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=in.(${encodeURIComponent(liste)})`, {
    method: "DELETE",
    headers: { ...entetes(s), prefer: "return=minimal" },
  });
  await verifier(r);
}
