import { useState } from "react";
import type { CriterePortfolio, ProjetPortfolio } from "../../types";
import {
  CRITERES_PORTFOLIO,
  MODELE_FICHE_PROJET,
  SEUIL_PROJET_SOLIDE,
  scorePortfolio,
  scoreProjet,
} from "../../accompagnement/portfolio";
import { nouvelId } from "../../store";
import { avecAccompagnement, type PropsAtelier } from "./commun";

export function AtelierPortfolio({ apprenant: a, maj }: PropsAtelier) {
  const projets = a.accompagnement?.portfolio ?? [];
  const s = scorePortfolio(projets);
  const [nom, setNom] = useState("");
  const [modeleCopie, setModeleCopie] = useState(false);

  const majProjets = (f: (p: ProjetPortfolio[]) => ProjetPortfolio[]) =>
    maj(avecAccompagnement("portfolio", (p) => f(p ?? [])));
  const cocher = (id: string, critere: CriterePortfolio, valeur: boolean) =>
    majProjets((p) => p.map((x) => (x.id === id ? { ...x, criteres: { ...x.criteres, [critere]: valeur } } : x)));

  return (
    <div className="atelier">
      <div className="atelier-resultat">
        <div>
          <span className="atelier-score">{s.projetsSolides}</span>
          <span className="secondaire">/{Math.max(2, projets.length)} projets solides</span>
        </div>
        <p>
          {s.phare ? (
            <>
              À mettre en avant en premier : <strong>{s.phare.nom}</strong>.{" "}
            </>
          ) : (
            "Ajoutez les projets de l'apprenant pour les évaluer. "
          )}
          {s.aTravailler &&
            `Priorité de l'atelier : ${s.aTravailler.libelle.toLowerCase()} (${s.aTravailler.question.toLowerCase()})`}
        </p>
      </div>

      {projets.map((p) => {
        const score = scoreProjet(p);
        return (
          <div key={p.id} className={score >= SEUIL_PROJET_SOLIDE ? "projet projet-solide" : "projet"}>
            <div className="projet-tete">
              <strong>{p.nom}</strong>
              <span className="secondaire">{score}/5</span>
              <button
                className="bouton-texte texte-alerte"
                onClick={() => majProjets((liste) => liste.filter((x) => x.id !== p.id))}
              >
                Retirer
              </button>
            </div>
            <div className="projet-criteres">
              {CRITERES_PORTFOLIO.map((c) => (
                <label key={c.id} className="case" title={c.question}>
                  <input
                    type="checkbox"
                    checked={Boolean(p.criteres[c.id])}
                    onChange={(ev) => cocher(p.id, c.id, ev.target.checked)}
                  />
                  {c.libelle}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <form
        className="nouvelle-offre"
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!nom.trim()) return;
          majProjets((p) => [...p, { id: nouvelId(), nom: nom.trim(), criteres: {} }]);
          setNom("");
        }}
      >
        <input
          value={nom}
          onChange={(ev) => setNom(ev.target.value)}
          placeholder="Nom du projet"
          aria-label="Nom du projet"
        />
        <button className="bouton bouton-discret" type="submit" disabled={!nom.trim()}>
          Ajouter le projet
        </button>
      </form>

      <h4>Modèle de fiche projet</h4>
      <pre className="modele">{MODELE_FICHE_PROJET}</pre>
      <button
        className="bouton bouton-discret"
        onClick={() => {
          navigator.clipboard?.writeText(MODELE_FICHE_PROJET).then(
            () => setModeleCopie(true),
            () => setModeleCopie(false),
          );
        }}
      >
        {modeleCopie ? "Modèle copié" : "Copier le modèle pour l'apprenant"}
      </button>
    </div>
  );
}
