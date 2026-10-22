// Dates manipulées au format ISO "aaaa-mm-jj", sans heure.
// Tous les calculs se font en UTC pour éviter les décalages d'un jour
// liés au fuseau horaire ou au passage à l'heure d'été.

const JOUR = 86_400_000;

/** Date du jour dans le fuseau de l'utilisateur, au format aaaa-mm-jj. */
export function aujourdhui(maintenant = new Date()): string {
  const a = maintenant.getFullYear();
  const m = String(maintenant.getMonth() + 1).padStart(2, "0");
  const j = String(maintenant.getDate()).padStart(2, "0");
  return `${a}-${m}-${j}`;
}

const versUtc = (iso: string) => {
  const [a, m, j] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, j);
};

const versIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Nombre de jours entre deux dates (positif si `a` est après `de`). */
export const joursEntre = (de: string, a: string) => Math.round((versUtc(a) - versUtc(de)) / JOUR);

/** Ajoute (ou retire) des jours à une date. */
export const ajouterJours = (iso: string, jours: number) => versIso(versUtc(iso) + jours * JOUR);

/** Ajoute des mois en restant dans le mois cible : 31 mars + 6 mois = 30 septembre. */
export function ajouterMois(iso: string, mois: number): string {
  const [a, m, j] = iso.split("-").map(Number);
  const cible = new Date(Date.UTC(a, m - 1 + mois, 1));
  const dernierJour = new Date(Date.UTC(cible.getUTCFullYear(), cible.getUTCMonth() + 1, 0)).getUTCDate();
  cible.setUTCDate(Math.min(j, dernierJour));
  return versIso(cible.getTime());
}

/** « 22 oct. » */
export const formatDate = (iso: string) =>
  new Date(versUtc(iso)).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

/** « juin 2026 » */
export const formatMois = (iso: string) =>
  new Date(versUtc(iso)).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
