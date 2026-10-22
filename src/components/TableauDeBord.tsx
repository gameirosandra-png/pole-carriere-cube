import type { Apprenant, AtelierCollectif } from "../types";
import { STATUTS, calculerIndicateurs, libelleStatut, raisonRelance } from "../regles";
import { aujourdhui, formatDate } from "../dates";
import { csvIndicateurs, telechargerCsv } from "../csv";
import { indicateursDossier } from "../dossier";
import { Funnel } from "./Funnel";
import { BoutonRecap } from "./BoutonRecap";
import { CetteSemaine } from "./CetteSemaine";

interface Props {
  apprenants: Apprenant[];
  ateliers: AtelierCollectif[];
  ouvrir: (id: string) => void;
  lancerVisite: () => void;
  voirAteliers: () => void;
}

export function TableauDeBord({ apprenants, ateliers, ouvrir, lancerVisite, voirAteliers }: Props) {
  const today = aujourdhui();
  const ind = calculerIndicateurs(apprenants, today);
  const dossiers = indicateursDossier(apprenants);

  // Regroupe les apprenants par promo, de la plus ancienne à la plus récente.
  const premiereFin = (promo: string) =>
    apprenants
      .filter((a) => a.promo === promo)
      .reduce((min, a) => (a.finFormation < min ? a.finFormation : min), "9999");
  const promos = [...new Set(apprenants.map((a) => a.promo))]
    .sort((x, y) => premiereFin(x).localeCompare(premiereFin(y)))
    .map((promo) => ({
      promo,
      membres: apprenants.filter((a) => a.promo === promo).sort((x, y) => ordre(x) - ordre(y)),
    }));

  return (
    <section aria-labelledby="titre-tdb">
      <header className="entete-page entete-avec-actions entete-banniere">
        <div>
          <h1 id="titre-tdb">Le pôle carrière, cette semaine</h1>
          <p className="sous-titre">Les rendez-vous et ateliers à venir, puis où en est chaque apprenant.</p>
        </div>
        <div className="actions">
          <button className="bouton bouton-discret" onClick={lancerVisite}>
            Visite guidée
          </button>
          <button
            className="bouton bouton-discret"
            onClick={() => telechargerCsv(`indicateurs-insertion-${today}.csv`, csvIndicateurs(ind, dossiers, today))}
          >
            Exporter les indicateurs
          </button>
          <BoutonRecap apprenants={apprenants} />
        </div>
      </header>

      <CetteSemaine apprenants={apprenants} ateliers={ateliers} ouvrir={ouvrir} voirAteliers={voirAteliers} />

      <h2 className="titre-section">Où en sont les apprenants</h2>
      <p className="sous-titre sous-titre-section">
        Chaque carré est une personne. Cliquez dessus pour ouvrir sa fiche.
      </p>

      {apprenants.length === 0 && (
        <p className="vide">Aucun apprenant pour l'instant. Ajoutez-en depuis l'onglet Apprenants.</p>
      )}

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
          <small>action en retard ou silence de plus de 14&nbsp;jours</small>
        </div>
      </dl>

      <section className="section-funnel" aria-labelledby="titre-funnel">
        <h2 className="titre-section" id="titre-funnel">
          Le parcours d'insertion
        </h2>
        <Funnel apprenants={apprenants} />
      </section>

      <section className="section-relances" aria-labelledby="titre-relances">
        <h2 className="titre-section" id="titre-relances">
          À relancer
        </h2>
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

      <section className="section-dossiers" aria-labelledby="titre-dossiers">
        <h2 className="titre-section" id="titre-dossiers">
          Avancement du parcours
        </h2>
        <p className="lead-section">
          <strong>
            {dossiers.prets} apprenant{dossiers.prets > 1 ? "s" : ""} sur {dossiers.base}
          </strong>{" "}
          en accompagnement {dossiers.prets > 1 ? "ont" : "a"} bouclé les 7 séances et{" "}
          {dossiers.prets > 1 ? "sont prêts" : "est prêt"} à être proposé{dossiers.prets > 1 ? "s" : ""} aux
          entreprises. Avancement moyen du parcours : {dossiers.completudeMoyenne ?? 0}&nbsp;%.
        </p>
        <ul className="etapes-kpi" aria-label="Part des apprenants ayant suivi chaque séance">
          {dossiers.parEtape.map(({ etape, faites, pourcentage }) => (
            <li key={etape.id}>
              <span className="etapes-kpi-libelle">{etape.libelle}</span>
              <span className="etapes-kpi-barre" aria-hidden="true">
                <span style={{ width: `${pourcentage}%` }} />
              </span>
              <span className="etapes-kpi-valeur">
                {faites}/{dossiers.base}
              </span>
            </li>
          ))}
        </ul>
        <p className="secondaire">La séance la moins avancée indique quel atelier collectif organiser en priorité.</p>
      </section>
    </section>
  );
}

// Les personnes insérées d'abord, pour lire la barre comme une progression.
const ORDRE = { poste: 0, freelance: 1, entretiens: 2, recherche: 3, formation: 4 } as const;
const ordre = (a: Apprenant) => ORDRE[a.statut];
