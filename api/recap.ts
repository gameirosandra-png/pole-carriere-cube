// POST /api/recap : envoie le récap du pôle carrière par e-mail, via un scénario Make.
// Le navigateur envoie des données structurées ; l'e-mail est construit ici, côté serveur,
// pour qu'on ne puisse pas faire envoyer n'importe quel contenu. Le destinataire est fixé
// dans le scénario Make (l'équipe du pôle), jamais par le visiteur.

const limite = creerLimite(30_000, 20);

interface Relance {
  nom: string;
  raison: string;
  action: string;
}

// --- Utilitaires (dupliqués dans chaque fonction pour que chacune soit autonome) ---

function creerLimite(delaiMs: number, plafondJour: number) {
  let dernier = 0;
  let jour = "";
  let compte = 0;
  return (): string | null => {
    const maintenant = Date.now();
    const aujourdHui = new Date(maintenant).toISOString().slice(0, 10);
    if (aujourdHui !== jour) {
      jour = aujourdHui;
      compte = 0;
    }
    if (compte >= plafondJour) return "Plafond quotidien de la démo atteint. Réessayez demain.";
    if (maintenant - dernier < delaiMs) return "Un envoi vient d'avoir lieu. Réessayez dans quelques secondes.";
    dernier = maintenant;
    compte += 1;
    return null;
  };
}

const json = (status: number, corps: unknown) =>
  new Response(JSON.stringify(corps), { status, headers: { "content-type": "application/json; charset=utf-8" } });

/** Coupe et nettoie un texte reçu du navigateur. */
const texte = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

const entier = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0);

const echapperHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(request: Request): Promise<Response> {
  const webhook = process.env.MAKE_RECAP_WEBHOOK;
  if (!webhook) return json(503, { erreur: "L'envoi par e-mail n'est pas encore configuré sur ce déploiement." });

  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { erreur: "Requête illisible." });
  }

  const refus = limite();
  if (refus) return json(429, { erreur: refus });

  const relances: Relance[] = (Array.isArray(corps.relances) ? corps.relances : []).slice(0, 20).map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    return { nom: texte(o.nom, 60), raison: texte(o.raison, 60), action: texte(o.action, 120) };
  });
  const prets = (Array.isArray(corps.prets) ? corps.prets : []).slice(0, 20).map((n) => texte(n, 60));
  const taux = corps.tauxSixMois === null ? null : entier(corps.tauxSixMois);
  const date = texte(corps.date, 20);

  const ligne = (r: Relance) =>
    `<li><strong>${echapperHtml(r.nom)}</strong> · ${echapperHtml(r.raison)}${r.action ? ` · ${echapperHtml(r.action)}` : ""}</li>`;

  const html = `
<div style="font-family:Arial,sans-serif;color:#1d1d23;max-width:560px">
  <div style="background:#6e1fff;color:#fff;padding:18px 22px">
    <div style="font-size:20px;font-weight:bold">Récap du pôle carrière</div>
    <div style="opacity:.85">${echapperHtml(date)}</div>
  </div>
  <div style="padding:18px 22px;border:1px solid #e5e7eb;border-top:0">
    <p><strong>${relances.length}</strong> apprenant${relances.length > 1 ? "s" : ""} à relancer ·
       <strong>${prets.length}</strong> dossier${prets.length > 1 ? "s" : ""} prêt${prets.length > 1 ? "s" : ""} à proposer ·
       taux d'insertion à 6 mois : <strong>${taux === null ? "—" : `${taux} %`}</strong></p>
    <h3 style="margin:18px 0 6px">À relancer cette semaine</h3>
    ${relances.length ? `<ul>${relances.map(ligne).join("")}</ul>` : "<p>Personne : tous les suivis sont à jour.</p>"}
    <h3 style="margin:18px 0 6px">Prêts à être proposés</h3>
    ${prets.length ? `<ul>${prets.map((n) => `<li>${echapperHtml(n)}</li>`).join("")}</ul>` : "<p>Aucun dossier complet pour l'instant.</p>"}
    <p style="font-size:12px;color:#5f6069;margin-top:22px">Envoyé depuis le MVP pôle carrière (données fictives de démonstration), via un scénario Make.</p>
  </div>
</div>`;

  const reponse = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sujet: `Pôle carrière · ${relances.length} à relancer, ${prets.length} dossier${prets.length > 1 ? "s" : ""} prêt${prets.length > 1 ? "s" : ""}`,
      html,
      aRelancer: relances.length,
      dossiersPrets: prets.length,
    }),
  });

  if (!reponse.ok) return json(502, { erreur: "Le scénario Make n'a pas répondu. Réessayez plus tard." });
  return json(200, { envoye: true });
}
