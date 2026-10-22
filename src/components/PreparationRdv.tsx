import { useState } from "react";
import type { Apprenant, Entreprise } from "../types";
import { briefSansIA, lireBrief, type RubriqueBrief } from "../brief";
import { demanderBrief } from "../api";

type Etat =
  | { type: "vide" }
  | { type: "chargement" }
  | { type: "pret"; rubriques: RubriqueBrief[]; source: "ia" | "regles"; message?: string };

/** Brief de rendez-vous rédigé par l'IA, avec un repli sur les règles métier si l'IA est indisponible. */
export function PreparationRdv({ apprenant, entreprises }: { apprenant: Apprenant; entreprises: Entreprise[] }) {
  const [etat, setEtat] = useState<Etat>({ type: "vide" });

  const generer = async () => {
    setEtat({ type: "chargement" });
    const r = await demanderBrief(apprenant, entreprises);
    if (r.ok && r.valeur.brief) {
      setEtat({ type: "pret", rubriques: lireBrief(r.valeur.brief), source: "ia" });
      return;
    }
    // L'IA est indisponible (non configurée, plafond atteint, panne) : on ne laisse pas l'utilisateur
    // les mains vides, on prépare le brief à partir des règles du suivi.
    setEtat({
      type: "pret",
      rubriques: briefSansIA(apprenant, entreprises),
      source: "regles",
      message:
        !r.ok && !r.nonConfigure
          ? `${r.erreur} En attendant, brief préparé à partir des règles du suivi.`
          : "IA non disponible sur cette version : brief préparé à partir des règles du suivi.",
    });
  };

  return (
    <div className="preparation">
      <div className="preparation-tete">
        <p className="secondaire">
          Une synthèse avant le rendez-vous : situation, points à travailler, questions à poser.
        </p>
        <button className="bouton bouton-ia" onClick={generer} disabled={etat.type === "chargement"}>
          {etat.type === "chargement"
            ? "Rédaction en cours…"
            : etat.type === "pret"
              ? "Régénérer le brief"
              : "Préparer le rendez-vous avec l'IA"}
        </button>
      </div>

      {etat.type === "pret" && (
        <div className="brief" aria-live="polite">
          {etat.rubriques.map((r, i) => (
            <div key={i}>
              {r.titre && <h4>{r.titre}</h4>}
              <ul>
                {r.points.map((p, j) => (
                  <li key={j}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
          <p className="note-methode">
            {etat.source === "ia"
              ? "Rédigé par Claude à partir de la fiche. À relire avant le rendez-vous."
              : etat.message}
          </p>
        </div>
      )}
    </div>
  );
}
