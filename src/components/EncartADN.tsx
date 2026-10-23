import type { Apprenant } from "../types";
import { enAccompagnement } from "../dossier";
import { confianceMoyenne, freinsFrequents, libelleMeteo, meteoCohorte } from "../accompagnement/adn";

/** Sur le tableau de bord : la méthode ADN en un coup d'œil, et qui écouter en priorité. */
export function EncartADN({
  apprenants,
  ouvrir,
  voirADN,
}: {
  apprenants: Apprenant[];
  ouvrir: (id: string) => void;
  voirADN: () => void;
}) {
  const suivis = enAccompagnement(apprenants);
  const aEcouter = meteoCohorte(suivis).filter((m) => m.alerte);
  const moyenne = confianceMoyenne(suivis);
  const frein = freinsFrequents(suivis)[0];

  return (
    <section className="encart-adn" aria-labelledby="titre-encart-adn">
      <div className="encart-adn-marque" aria-hidden="true">
        <span>A</span>
        <span>D</span>
        <span>N</span>
      </div>
      <div className="encart-adn-corps">
        <h2 id="titre-encart-adn">Méthode ADN · la confiance de la cohorte</h2>
        <p>
          Confiance moyenne{" "}
          <strong>{moyenne === null ? "—" : `${String(moyenne).replace(".", ",")}/5 (${libelleMeteo(Math.round(moyenne)).toLowerCase()})`}</strong>
          {frein && (
            <>
              {" "}
              · frein n°1 : <strong>{frein.frein.libelle.toLowerCase()}</strong> ({frein.apprenants.length} apprenants)
            </>
          )}
        </p>
        {aEcouter.length > 0 && (
          <p className="encart-adn-ecoute">
            À écouter en priorité :{" "}
            {aEcouter.map((m, i) => (
              <span key={m.apprenant.id}>
                {i > 0 && ", "}
                <button className="lien-ligne" onClick={() => ouvrir(m.apprenant.id)}>
                  {m.apprenant.prenom} {m.apprenant.nom}
                </button>{" "}
                ({libelleMeteo(m.derniere).toLowerCase()})
              </span>
            ))}
          </p>
        )}
      </div>
      <button className="bouton bouton-cta" onClick={voirADN}>
        Ouvrir la méthode ADN
      </button>
    </section>
  );
}
