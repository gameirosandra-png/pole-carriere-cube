import type { CritereCV, NoteCritere } from "../../types";
import { CRITERES_CV, NIVEAUX, evaluerCV } from "../../accompagnement/cv";
import { avecAccompagnement, type PropsAtelier } from "./commun";

export function AtelierCV({ apprenant: a, maj }: PropsAtelier) {
  const atelier = a.accompagnement?.cv;
  const e = evaluerCV(atelier);

  const noter = (critere: CritereCV, note: NoteCritere) =>
    maj(avecAccompagnement("cv", (cv) => ({ ...cv, notes: { ...cv?.notes, [critere]: note } })));
  const ecrire = (champ: "accrocheAvant" | "accrocheApres", valeur: string) =>
    maj(avecAccompagnement("cv", (cv) => ({ notes: {}, ...cv, [champ]: valeur })));

  return (
    <div className="atelier">
      <div className="atelier-resultat">
        <div>
          <span className="atelier-score">{e.score === null ? "—" : e.score}</span>
          <span className="secondaire">/100</span>
        </div>
        <p>
          {e.score === null
            ? "Notez chaque critère pendant la revue du CV avec l'apprenant."
            : e.priorites.length
              ? `${e.priorites.length} point${e.priorites.length > 1 ? "s" : ""} à retravailler, par ordre de priorité ci-dessous.`
              : e.complet
                ? "CV solide sur les 6 critères : prêt à être envoyé."
                : `${e.total - e.evalues} critère${e.total - e.evalues > 1 ? "s" : ""} encore à évaluer.`}
        </p>
      </div>

      <table className="grille">
        <thead>
          <tr>
            <th scope="col">Critère</th>
            {NIVEAUX.map((n) => (
              <th scope="col" key={n.valeur}>
                {n.libelle}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CRITERES_CV.map((c) => (
            <tr key={c.id}>
              <th scope="row">{c.libelle}</th>
              {NIVEAUX.map((n) => (
                <td key={n.valeur}>
                  <input
                    type="radio"
                    name={`cv-${a.id}-${c.id}`}
                    checked={atelier?.notes[c.id] === n.valeur}
                    onChange={() => noter(c.id, n.valeur)}
                    aria-label={`${c.libelle} : ${n.libelle}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {e.priorites.length > 0 && (
        <>
          <h4>Plan d'action</h4>
          <ol className="plan-action">
            {e.priorites.map((c) => (
              <li key={c.id}>
                <strong>{c.libelle}</strong> · {c.conseil}
              </li>
            ))}
          </ol>
        </>
      )}

      <h4>Réécrire l'accroche</h4>
      <div className="grille-champs">
        <label className="champ">
          <span>Avant</span>
          <textarea
            rows={4}
            value={atelier?.accrocheAvant ?? ""}
            onChange={(ev) => ecrire("accrocheAvant", ev.target.value)}
            placeholder="L'accroche actuelle du CV"
          />
        </label>
        <label className="champ">
          <span>Après l'atelier</span>
          <textarea
            rows={4}
            value={atelier?.accrocheApres ?? ""}
            onChange={(ev) => ecrire("accrocheApres", ev.target.value)}
            placeholder="Ce que je fais, la preuve, ce que j'apporte de mon parcours"
          />
        </label>
      </div>
    </div>
  );
}
