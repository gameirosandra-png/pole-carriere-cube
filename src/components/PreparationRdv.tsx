import { useState } from "react";
import type { Apprenant, Entreprise } from "../types";
import { briefSansIA, type RubriqueBrief } from "../brief";

/**
 * Brief de rendez-vous préparé à partir des règles du suivi.
 * V2 : rédaction par l'IA. La fonction serveur est prête (api/brief.ts, demanderBrief dans api.ts) ;
 * il suffira d'ajouter la clé ANTHROPIC_API_KEY sur Vercel et d'appeler demanderBrief ici.
 */
export function PreparationRdv({ apprenant, entreprises }: { apprenant: Apprenant; entreprises: Entreprise[] }) {
  const [rubriques, setRubriques] = useState<RubriqueBrief[] | null>(null);

  return (
    <div className="preparation">
      <div className="preparation-tete">
        <p className="secondaire">
          Une synthèse avant le rendez-vous : situation, points à travailler, questions à poser.
        </p>
        <button className="bouton bouton-discret" onClick={() => setRubriques(briefSansIA(apprenant, entreprises))}>
          {rubriques ? "Actualiser le brief" : "Préparer le rendez-vous"}
        </button>
      </div>

      {rubriques && (
        <div className="brief" aria-live="polite">
          {rubriques.map((r) => (
            <div key={r.titre}>
              <h4>{r.titre}</h4>
              <ul>
                {r.points.map((p, j) => (
                  <li key={j}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="note-methode">
            Préparé à partir du suivi (statut, dossier, offres, notes). Prochaine version : rédaction par l'IA.
          </p>
        </div>
      )}
    </div>
  );
}
