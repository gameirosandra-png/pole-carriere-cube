import type { Apprenant } from "../types";
import { formatDate } from "../dates";
import { enAccompagnement } from "../dossier";
import {
  PILIERS,
  confianceMoyenne,
  freinsFrequents,
  libelleMeteo,
  meteoCohorte,
  victoiresRecentes,
} from "../accompagnement/adn";

/**
 * Écran « Méthode ADN » : l'accompagnement signature du pôle, vu à l'échelle de la cohorte.
 * Qui écouter en priorité, quels freins travailler en collectif, quelles victoires célébrer.
 */
export function PageMethodeADN({ apprenants, ouvrir }: { apprenants: Apprenant[]; ouvrir: (id: string) => void }) {
  const suivis = enAccompagnement(apprenants);
  const meteo = meteoCohorte(suivis);
  const aEcouter = meteo.filter((m) => m.alerte);
  const freins = freinsFrequents(suivis);
  const victoires = victoiresRecentes(apprenants);
  const moyenne = confianceMoyenne(suivis);
  const maxFrein = Math.max(1, ...freins.map((f) => f.apprenants.length));

  return (
    <section aria-labelledby="titre-adn-page">
      <header className="adn-banniere">
        <div className="adn-banniere-lettres" aria-hidden="true">
          <span>A</span>
          <span>D</span>
          <span>N</span>
        </div>
        <div>
          <p className="adn-banniere-sur-titre">L'accompagnement signature du pôle</p>
          <h1 id="titre-adn-page">Méthode ADN</h1>
          <p>
            Un CV ne suffit pas à décrocher un poste : il faut aussi y croire, et savoir raconter son histoire. La méthode
            ADN travaille la confiance et le récit de la reconversion, en plus des outils.
          </p>
          <p className="adn-banniere-signature">
            Conçue par Sandra Gameiro, à partir de 10 ans d'accompagnement humain : soins, formation, management.
          </p>
        </div>
      </header>

      <ol className="adn-piliers">
        {PILIERS.map((p, i) => (
          <li key={p.lettre}>
            <span className="adn-pilier-lettre">{p.lettre}</span>
            <strong>{p.nom}</strong>
            <span>{p.promesse}</span>
            <small className="secondaire">
              {
                [
                  "Forces, valeurs, héritage du métier d'avant, météo de confiance",
                  "Cap à 6 mois, freins à lever avec un exercice, croyances recadrées",
                  "Journal des victoires, qui nourrit le pitch et la fiche candidat",
                ][i]
              }
            </small>
          </li>
        ))}
      </ol>

      <dl className="chiffres adn-chiffres">
        <div>
          <dt>Confiance moyenne</dt>
          <dd>{moyenne === null ? "—" : `${String(moyenne).replace(".", ",")}/5`}</dd>
          <small>{moyenne === null ? "aucune météo notée" : `${libelleMeteo(Math.round(moyenne)).toLowerCase()}, sur ${meteo.length} apprenants`}</small>
        </div>
        <div className={aEcouter.length ? "chiffre-alerte" : ""}>
          <dt>À écouter en priorité</dt>
          <dd>{aEcouter.length}</dd>
          <small>confiance basse ou en chute</small>
        </div>
        <div>
          <dt>Frein le plus fréquent</dt>
          <dd className="adn-chiffre-texte">{freins[0]?.frein.libelle ?? "—"}</dd>
          <small>{freins[0] ? `${freins[0].apprenants.length} apprenants concernés` : "aucun frein noté"}</small>
        </div>
      </dl>

      <div className="adn-cohorte">
        <section aria-labelledby="titre-meteo-cohorte">
          <h2 className="titre-section" id="titre-meteo-cohorte">
            Météo de la cohorte
          </h2>
          {meteo.length === 0 ? (
            <p className="vide">Aucune météo notée pour l'instant.</p>
          ) : (
            <ul className="meteo-liste">
              {meteo.map((m) => (
                <li key={m.apprenant.id}>
                  <button className={m.alerte ? "meteo-ligne alerte" : "meteo-ligne"} onClick={() => ouvrir(m.apprenant.id)}>
                    <span className="meteo-nom">
                      {m.apprenant.prenom} {m.apprenant.nom}
                    </span>
                    <span className="meteo-jauge" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={n <= m.derniere ? "plein" : ""} />
                      ))}
                    </span>
                    <span className="meteo-libelle">
                      {libelleMeteo(m.derniere)}
                      {m.evolution < 0 && <span className="texte-alerte"> · en baisse</span>}
                      {m.evolution > 0 && <span className="texte-succes"> · en hausse</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titre-freins-cohorte">
          <h2 className="titre-section" id="titre-freins-cohorte">
            Freins les plus fréquents
          </h2>
          {freins.length === 0 ? (
            <p className="vide">Aucun frein noté pour l'instant.</p>
          ) : (
            <>
              <ul className="freins-liste">
                {freins.map(({ frein, apprenants: qui }) => (
                  <li key={frein.id}>
                    <span className="freins-libelle">{frein.libelle}</span>
                    <span className="etapes-kpi-barre" aria-hidden="true">
                      <span style={{ width: `${(qui.length / maxFrein) * 100}%` }} />
                    </span>
                    <span className="freins-qui">{qui.map((a) => a.prenom).join(", ")}</span>
                  </li>
                ))}
              </ul>
              <p className="adn-conseil">
                <strong>Atelier collectif à proposer : « {freins[0].frein.libelle} ».</strong> Exercice de départ :{" "}
                {freins[0].frein.exercice}
              </p>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="titre-victoires-cohorte">
        <h2 className="titre-section" id="titre-victoires-cohorte">
          Dernières victoires
        </h2>
        {victoires.length === 0 ? (
          <p className="vide">Pas encore de victoire notée. Elles se notent dans la fiche ou dans l'espace apprenant.</p>
        ) : (
          <ul className="adn-victoires victoires-cohorte">
            {victoires.map(({ apprenant: a, victoire: v }) => (
              <li key={v.id}>
                <time dateTime={v.date}>{formatDate(v.date)}</time>
                <button className="lien-ligne" onClick={() => ouvrir(a.id)}>
                  {a.prenom} {a.nom}
                </button>{" "}
                · {v.texte}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
