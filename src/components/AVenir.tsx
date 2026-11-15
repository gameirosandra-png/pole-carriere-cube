/**
 * Modules « à venir » : présents dans le menu pour montrer la feuille de route,
 * sans fonctionnalité construite. Chaque page dit ce que fera le module et pourquoi.
 */

type Module = {
  id: string;
  titre: string;
  accroche: string;
  pourquoi: string;
  fonctions: string[];
  indicateurs: string[];
};

export const MODULES_A_VENIR: Record<"prospection" | "mentors", Module> = {
  prospection: {
    id: "prospection",
    titre: "Prospection entreprises",
    accroche: "Trouver, suivre et fidéliser les entreprises qui recrutent les apprenants.",
    pourquoi:
      "Aujourd'hui l'outil gère les entreprises déjà partenaires. Ce module suivra tout ce qui se passe avant : le premier contact, les relances, jusqu'au partenariat signé.",
    fonctions: [
      "Pipeline des entreprises : à contacter, contactée, en discussion, partenaire, inactive.",
      "Relances automatiques quand une entreprise n'a pas répondu depuis 10 jours.",
      "Historique des échanges et prochaine action pour chaque entreprise.",
      "Besoins de recrutement par entreprise, rapprochés des profils d'apprenants prêts.",
      "Alerte quand un partenaire n'a pas recruté depuis 6 mois, pour le relancer.",
    ],
    indicateurs: [
      "Nombre d'entreprises contactées par mois",
      "Taux de transformation contact → partenaire",
      "Offres reçues par partenaire",
    ],
  },
  mentors: {
    id: "mentors",
    titre: "Mentors",
    accroche: "Mettre chaque apprenant en relation avec le bon mentor, au bon moment.",
    pourquoi:
      "Les mentors techniques sont une force de l'école. Ce module rendra leur rôle visible dans le parcours d'insertion : qui accompagne qui, sur quoi, et avec quel effet.",
    fonctions: [
      "Annuaire des mentors : expertises (Make, Airtable, Bubble, IA…), disponibilités, langues.",
      "Proposition automatique d'un mentor selon le projet et la cible de l'apprenant.",
      "Suivi des sessions : date, sujet, prochaine étape, partagé avec le pôle carrière.",
      "Retours des apprenants après chaque session.",
      "Repérage des mentors surchargés pour équilibrer les attributions.",
    ],
    indicateurs: [
      "Sessions de mentorat par apprenant",
      "Délai entre la demande et la première session",
      "Satisfaction des apprenants",
    ],
  },
};

export function PageAVenir({ module }: { module: Module }) {
  return (
    <section aria-labelledby={`titre-${module.id}`} className="a-venir">
      <header className="entete-page">
        <p className="a-venir-etiquette">À venir · feuille de route</p>
        <h1 id={`titre-${module.id}`}>{module.titre}</h1>
        <p className="sous-titre">{module.accroche}</p>
      </header>

      <div className="a-venir-bloc">
        <h2>Pourquoi ce module</h2>
        <p>{module.pourquoi}</p>
      </div>

      <div className="a-venir-grille">
        <div className="a-venir-bloc">
          <h2>Ce qu'il fera</h2>
          <ul>
            {module.fonctions.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        <div className="a-venir-bloc">
          <h2>Ce qu'il permettra de suivre</h2>
          <ul>
            {module.indicateurs.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="secondaire a-venir-note">
        Module non construit dans ce MVP : il sera conçu avec l'équipe, à partir des vrais besoins du pôle.
      </p>
    </section>
  );
}
