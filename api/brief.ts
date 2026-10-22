// POST /api/brief : prépare le brief d'un rendez-vous avec un apprenant, rédigé par Claude.
// Le prompt est construit ici à partir de champs structurés et bornés : l'endpoint
// ne peut pas servir de chatbot générique. La clé API reste côté serveur (variable d'environnement).

const limite = creerLimite(5_000, 60);

const MODELE = "claude-haiku-5-5";
const VERSION_API = "2026-10-21";

const CONSIGNE = `Tu es conseiller·e en insertion professionnelle dans une école de formation No-Code et IA.
Tu prépares un rendez-vous individuel avec un apprenant, à partir de sa fiche de suivi.
Réponds en français, en 120 mots maximum, avec exactement ces trois rubriques, chacune sur sa ligne :
Situation
- (1 à 2 puces factuelles)
Points à travailler
- (2 à 3 puces concrètes, liées aux étapes manquantes du dossier ou à la situation)
Questions à poser
- (2 à 3 questions ouvertes, bienveillantes)
Pas de titre en plus, pas de markdown autre que les tirets, pas de formule de politesse.`;

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

export async function POST(request: Request): Promise<Response> {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) return json(503, { erreur: "Le brief IA n'est pas encore configuré sur ce déploiement." });

  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { erreur: "Requête illisible." });
  }

  const refus = limite();
  if (refus) return json(429, { erreur: refus });

  const liste = (v: unknown, n: number, max: number) =>
    (Array.isArray(v) ? v : [])
      .slice(0, n)
      .map((x) => texte(x, max))
      .filter(Boolean);

  const fiche = [
    `Prénom : ${texte(corps.prenom, 40)}`,
    `Statut : ${texte(corps.statut, 40)}`,
    `Poste visé : ${texte(corps.posteVise, 80)}`,
    `Fin de formation : ${texte(corps.finFormation, 20)}`,
    `Jours depuis le dernier contact : ${texte(String(corps.joursSansContact ?? ""), 5)}`,
    `Prochaine action prévue : ${texte(corps.prochaineAction, 120) || "aucune"}`,
    `Étapes du dossier faites : ${liste(corps.etapesFaites, 7, 60).join(", ") || "aucune"}`,
    `Étapes du dossier manquantes : ${liste(corps.etapesManquantes, 7, 60).join(", ") || "aucune"}`,
    `Offres proposées : ${liste(corps.offres, 5, 100).join(" ; ") || "aucune"}`,
    `Dernières notes : ${liste(corps.notes, 3, 300).join(" | ") || "aucune"}`,
  ].join("\n");

  const reponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": cle, "anthropic-version": VERSION_API, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODELE,
      max_tokens: 500,
      system: CONSIGNE,
      messages: [{ role: "user", content: `Fiche de l'apprenant :\n${fiche}` }],
    }),
  });

  if (!reponse.ok) return json(502, { erreur: "Le service IA n'a pas répondu. Réessayez dans un instant." });
  const donnees = (await reponse.json()) as { content?: { type: string; text?: string }[] };
  const brief = (donnees.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n")
    .trim();
  return json(200, { brief, modele: MODELE });
}
