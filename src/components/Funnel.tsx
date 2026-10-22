import type { Apprenant } from "../types";
import { funnelInsertion, goulot } from "../rapport";

const CONSEIL: Record<string, string> = {
  dossier: "Priorité : ateliers collectifs sur les séances les moins avancées (portfolio, simulation d'entretien, négociation).",
  entretiens: "Priorité : proposer davantage de dossiers prêts aux entreprises partenaires.",
  insertion: "Priorité : débriefer les entretiens pour transformer les process en embauches.",
};

/** Entonnoir d'insertion : combien d'apprenants franchissent chaque étape, et où on en perd. */
export function Funnel({ apprenants }: { apprenants: Apprenant[] }) {
  const etapes = funnelInsertion(apprenants);
  const pire = goulot(etapes);

  if (etapes[0].effectif === 0) {
    return <p className="vide">L'entonnoir apparaîtra quand une première promo sera sortie de formation.</p>;
  }

  return (
    <div className="funnel">
      <ol className="funnel-etapes">
        {etapes.map((e, k) => (
          <li key={e.id} className={`funnel-etape funnel-${k}`}>
            <span className="funnel-libelle">
              {e.libelle}
              {k > 0 && e.perte > 0 && (
                <span
                  className={pire?.id === e.id ? "funnel-perte funnel-perte-max" : "funnel-perte"}
                  title={`${e.perte} apprenant${e.perte > 1 ? "s" : ""} de moins qu'à l'étape précédente`}
                >
                  −{e.perte}
                </span>
              )}
            </span>
            <span className="funnel-piste">
              <span className="funnel-barre" style={{ width: `${Math.max(e.pourcentage, 6)}%` }}>
                <strong>{e.effectif}</strong>
                <span>{e.pourcentage}&nbsp;%</span>
              </span>
            </span>
          </li>
        ))}
      </ol>
      {pire && (
        <p className="funnel-conseil">
          <strong>
            Plus gros décrochage avant « {pire.libelle} » : {pire.perte} apprenant{pire.perte > 1 ? "s" : ""}.
          </strong>{" "}
          {CONSEIL[pire.id]}
        </p>
      )}
    </div>
  );
}
