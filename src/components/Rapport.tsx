import type { Apprenant } from "../types";
import { calculerIndicateurs } from "../regles";
import { indicateursDossier } from "../dossier";
import { statsParPromo } from "../rapport";
import { aujourdhui, formatDate, formatMois } from "../dates";
import { Funnel } from "./Funnel";

/**
 * Rapport d'insertion d'une page, pensé pour l'impression ou l'export PDF
 * (reporting RNCP / Qualiopi, comité de direction).
 */
export function Rapport({ apprenants }: { apprenants: Apprenant[] }) {
  const today = aujourdhui();
  const ind = calculerIndicateurs(apprenants, today);
  const dossiers = indicateursDossier(apprenants);
  const promos = statsParPromo(apprenants, today);

  return (
    <section aria-labelledby="titre-rapport" className="rapport">
      <header className="entete-page entete-avec-actions rapport-actions">
        <div>
          <h1 id="titre-rapport">Rapport d'insertion</h1>
          <p className="sous-titre">Une page à imprimer ou à enregistrer en PDF pour le reporting.</p>
        </div>
        <button className="bouton bouton-cta" onClick={() => window.print()}>
          Imprimer ou enregistrer en PDF
        </button>
      </header>

      <article className="rapport-page">
        <header className="rapport-entete">
          <img src="/logo.svg" alt="" width="44" height="44" />
          <div>
            <h2>Rapport d'insertion professionnelle</h2>
            <p className="secondaire">
              Pôle carrière · arrêté au {formatDate(today)} {today.slice(0, 4)}
            </p>
          </div>
        </header>

        <dl className="rapport-chiffres">
          <div>
            <dt>Taux d'insertion à 6 mois</dt>
            <dd>{ind.tauxSixMois === null ? "—" : `${ind.tauxSixMois} %`}</dd>
            <small>{ind.baseSixMois} apprenants dont la fenêtre de 6 mois est close</small>
          </div>
          <div>
            <dt>Délai moyen d'insertion</dt>
            <dd>{ind.delaiMoyen === null ? "—" : `${ind.delaiMoyen} jours`}</dd>
            <small>de la fin de formation au poste ou au premier client</small>
          </div>
          <div>
            <dt>Dossiers prêts à proposer</dt>
            <dd>
              {dossiers.prets} / {dossiers.base}
            </dd>
            <small>apprenants en accompagnement</small>
          </div>
        </dl>

        <h3>Par promo</h3>
        <table className="tableau rapport-tableau">
          <thead>
            <tr>
              <th scope="col">Promo</th>
              <th scope="col">Fin de formation</th>
              <th scope="col">Effectif</th>
              <th scope="col">Insérés</th>
              <th scope="col">Taux à 6 mois</th>
              <th scope="col">Délai moyen</th>
            </tr>
          </thead>
          <tbody>
            {promos.map((p) => (
              <tr key={p.promo}>
                <th scope="row">{p.promo}</th>
                <td>{formatMois(p.finFormation)}</td>
                <td>{p.effectif}</td>
                <td>{p.enFormation ? "en formation" : p.insertes}</td>
                <td>{p.tauxSixMois === null ? (p.enFormation ? "—" : "fenêtre en cours") : `${p.tauxSixMois} %`}</td>
                <td>{p.delaiMoyen === null ? "—" : `${p.delaiMoyen} j`}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Parcours d'insertion</h3>
        <Funnel apprenants={apprenants} />

        <h3>Parcours d'accompagnement</h3>
        <table className="tableau rapport-tableau">
          <thead>
            <tr>
              <th scope="col">Séance</th>
              <th scope="col">Apprenants l'ayant suivie</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.parEtape.map(({ etape, faites, pourcentage }) => (
              <tr key={etape.id}>
                <th scope="row">{etape.libelle}</th>
                <td>
                  {faites} / {dossiers.base} ({pourcentage} %)
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="rapport-pied secondaire">
          Méthode : un apprenant est inséré s'il est en poste ou lancé en freelance. Le taux à 6 mois ne porte que sur
          les apprenants sortis de formation depuis plus de 6 mois. Données fictives de démonstration.
        </footer>
      </article>
    </section>
  );
}
