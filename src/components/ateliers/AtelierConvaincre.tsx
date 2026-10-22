import { useState } from "react";
import type { CritereEntretien } from "../../types";
import {
  CRITERES_ENTRETIEN,
  QUESTIONS_ENTRETIEN,
  evaluerSimulation,
  genererPitch,
  trousDansPitch,
} from "../../accompagnement/convaincre";
import { avecAccompagnement, type PropsAtelier } from "./commun";

export function AtelierConvaincre({ apprenant: a, maj }: PropsAtelier) {
  const pitch = genererPitch(a);
  const trous = trousDansPitch(pitch);
  const notes = a.accompagnement?.convaincre?.simulation;
  const sim = evaluerSimulation(notes);
  const [copie, setCopie] = useState(false);

  const noter = (critere: CritereEntretien, note: 1 | 2 | 3 | 4) =>
    maj(avecAccompagnement("convaincre", (c) => ({ ...c, simulation: { ...c?.simulation, [critere]: note } })));

  const texte = pitch.map((p) => `${p.titre} (${p.duree}) : ${p.texte}`).join("\n\n");

  return (
    <div className="atelier">
      <h4>Pitch de 2 minutes</h4>
      <p className="secondaire">
        Construit à partir de la fiche.{" "}
        {trous
          ? `${trous} passage${trous > 1 ? "s" : ""} entre crochets à compléter avec l'apprenant.`
          : "Complet : à répéter à voix haute."}
      </p>
      <ol className="pitch">
        {pitch.map((p) => (
          <li key={p.titre}>
            <span className="pitch-titre">
              {p.titre} <span className="secondaire">· {p.duree}</span>
            </span>
            <p>
              {p.texte
                .split(/(\[[^\]]+\])/)
                .map((morceau, i) =>
                  morceau.startsWith("[") ? <mark key={i}>{morceau}</mark> : <span key={i}>{morceau}</span>,
                )}
            </p>
          </li>
        ))}
      </ol>
      <div className="grille-champs">
        <label className="champ">
          <span>Ce qui motive l'apprenant (pour la fin du pitch)</span>
          <input
            value={a.accompagnement?.convaincre?.motivation ?? ""}
            onChange={(e) => maj(avecAccompagnement("convaincre", (c) => ({ ...c, motivation: e.target.value })))}
            placeholder="Ex. dans le retail, pour outiller les équipes terrain"
          />
        </label>
        <div className="champ champ-bouton">
          <button
            className="bouton bouton-discret"
            onClick={() =>
              navigator.clipboard?.writeText(texte).then(
                () => setCopie(true),
                () => setCopie(false),
              )
            }
          >
            {copie ? "Pitch copié" : "Copier le pitch"}
          </button>
        </div>
      </div>

      <h4>Questions d'entretien à préparer</h4>
      <ol className="plan-action">
        {QUESTIONS_ENTRETIEN.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>

      <h4>Simulation d'entretien</h4>
      <table className="grille">
        <thead>
          <tr>
            <th scope="col">Critère</th>
            {[1, 2, 3, 4].map((n) => (
              <th scope="col" key={n}>
                {n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CRITERES_ENTRETIEN.map((c) => (
            <tr key={c.id}>
              <th scope="row">{c.libelle}</th>
              {([1, 2, 3, 4] as const).map((n) => (
                <td key={n}>
                  <input
                    type="radio"
                    name={`sim-${a.id}-${c.id}`}
                    checked={notes?.[c.id] === n}
                    onChange={() => noter(c.id, n)}
                    aria-label={`${c.libelle} : ${n} sur 4`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={sim.pretPourEntretien ? "texte-succes" : ""}>
        {sim.score === null
          ? "Notez chaque critère de 1 (à travailler) à 4 (excellent) pendant l'entretien blanc."
          : sim.pretPourEntretien
            ? `${sim.score}/100 : prêt pour les vrais entretiens.`
            : `${sim.score}/100.${sim.aTravailler ? ` À travailler en priorité : ${sim.aTravailler.libelle.toLowerCase()}.` : ""}`}
      </p>
    </div>
  );
}
