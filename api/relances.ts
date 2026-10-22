// POST /api/relances : envoie les relances préparées par l'app, via le même scénario Make que le récap.
// En démo, le scénario les livre toutes dans la boîte du pôle (le destinataire est fixé dans Make) :
// on voit exactement ce que chaque apprenant recevrait. Le contenu est reconstruit et échappé ici.

const limite = creerLimite(30_000, 20);

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

const texte = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

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

  const relances = (Array.isArray(corps.relances) ? corps.relances : []).slice(0, 30).map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    return { destinataire: texte(o.destinataire, 60), objet: texte(o.objet, 120), message: texte(o.message, 500) };
  });
  if (!relances.length) return json(400, { erreur: "Aucune relance à envoyer." });

  const refus = limite();
  if (refus) return json(429, { erreur: refus });

  const bloc = (r: (typeof relances)[number]) => `
    <div style="border:1px solid #e5e7eb;border-left:4px solid #fe771b;padding:12px 14px;margin:10px 0">
      <div style="font-size:12px;color:#5f6069">Pour ${echapperHtml(r.destinataire)}</div>
      <div style="font-weight:bold;margin:2px 0 6px">${echapperHtml(r.objet)}</div>
      <div>${echapperHtml(r.message)}</div>
    </div>`;

  const html = `
<div style="font-family:Arial,sans-serif;color:#1d1d23;max-width:560px">
  <div style="background:#2a0462;color:#fff;padding:18px 22px">
    <div style="font-size:20px;font-weight:bold">Relances automatiques du pôle carrière</div>
    <div style="opacity:.85">${relances.length} message${relances.length > 1 ? "s" : ""} préparé${relances.length > 1 ? "s" : ""} par l'app</div>
  </div>
  <div style="padding:8px 22px 18px;border:1px solid #e5e7eb;border-top:0">
    ${relances.map(bloc).join("")}
    <p style="font-size:12px;color:#5f6069;margin-top:22px">Démo : en production, chaque apprenant reçoit son message. Ici, tout arrive au pôle (données fictives), via un scénario Make.</p>
  </div>
</div>`;

  const reponse = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      sujet: `Pôle carrière · ${relances.length} relance${relances.length > 1 ? "s" : ""} envoyée${relances.length > 1 ? "s" : ""}`,
      html,
      aRelancer: relances.length,
      dossiersPrets: 0,
    }),
  });

  if (!reponse.ok) return json(502, { erreur: "Le scénario Make n'a pas répondu. Réessayez plus tard." });
  return json(200, { envoye: relances.length });
}
