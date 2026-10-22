import type { Apprenant } from "../types";
import { STATUTS, calculerIndicateurs, formatDate, libelleStatut, raisonRelance } from "../lib";

interface Props {
  apprenants: Apprenant[];
  ouvrir: (id: string) => void;
}

export function TableauDeBord({ apprenants, ouvrir }: Props) {
  const ind = calculerIndicateurs(apprenants);

  // Regroupe les apprenants par promo, dans l'ordre d'apparition.
  const promos = [...new Set(apprenants.map((a) => a.promo))].map((promo) => ({
    promo,
    membres: apprenants
      .filter((a) => a.promo === promo)
      .sort((x, y) => ordre(x) - ordre(y)),
  }));

  return (
    <section aria-labelledby="titre-tdb">
      <header className="entete-page">
        <h1 id="titre-tdb">Où en sont les apprenants</h1>
        <p className="sous-titre">Chaque carré est une personne. Cliquez dessus pour ouvrir sa fiche.</p>
      </header>

      <div className="promos">
        {promos.map(({ promo, membres }) => (
          <div className="promo-ligne" key={promo}>
            <div className="promo-nom">
              <strong>{promo}</strong>
              <span>{membres.length} apprenants</span>
            </div>
            <div className="promo-carres">
              {membres.map((a) => (
                <button
                  key={a.id}
                  className={`carre s-${a.statut}`}
                  onClick={() => ouvrir(a.id)}
                  title={`${a.prenom} ${a.nom}`}
                  aria-label={`${a.prenom} ${a.nom}, ${libelleStatut(a.statut)}`}
                >
                  {a.prenom[0]}
                  {a.nom[0]}
                  {raisonRelance(a) && <span className="carre-alerte" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        ))}
        <ul className="legende" aria-label="Légende">
          {STATUTS.map((s) => (
            <li key={s.id}>
              <span className={`legende-carre s-${s.id}`} aria-hidden="true" />
              {s.libelle}
            </li>
          ))}
          <li>
            <span className="legende-alerte" aria-hidden="true" />À relancer
          </li>
        </ul>
      </div>

      <dl className="chiffres">
        <div>
          <dt>Insérés à 6 mois</dt>
          <dd>{ind.tauxSixMois === null ? "—" : `${ind.tauxSixMois} %`}</dd>
          <small>sur {ind.baseSixMois} apprenants dont la fenêtre est close</small>
        </div>
        <div>
          <dt>Délai moyen d'insertion</dt>
          <dd>{ind.delaiMoyen === null ? "—" : `${ind.delaiMoyen} j`}</dd>
          <small>de la fin de formation au poste</small>
        </div>
        <div>
          <dt>En entretiens</dt>
          <dd>{ind.enEntretiens}</dd>
          <small>process de recrutement en cours</small>
        </div>
        <div className={ind.aRelancer.length ? "chiffre-alerte" : ""}>
          <dt>À relancer</dt>
          <dd>{ind.aRelancer.length}</dd>
          <small>action en retard ou silence &gt; 14 j</small>
        </div>
      </dl>

      <h2 className="titre-section">À relancer</h2>
      {ind.aRelancer.length === 0 ? (
        <p className="vide">Personne à relancer : tous les suivis sont à jour.</p>
      ) : (
        <ul className="relances">
          {ind.aRelancer.map((a) => (
            <li key={a.id}>
              <button className="relance" onClick={() => ouvrir(a.id)}>
                <span className="relance-nom">
                  {a.prenom} {a.nom}
                </span>
                <span className="relance-raison">{raisonRelance(a)}</span>
                <span className="relance-action">
                  {a.prochaineAction
                    ? `${a.prochaineAction.libelle} (prévu le ${formatDate(a.prochaineAction.date)})`
                    : "Aucune action prévue"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Les personnes insérées d'abord, pour lire la barre comme une progression.
const ORDRE = { poste: 0, freelance: 1, entretiens: 2, recherche: 3, formation: 4 } as const;
const ordre = (a: Apprenant) => ORDRE[a.statut];
