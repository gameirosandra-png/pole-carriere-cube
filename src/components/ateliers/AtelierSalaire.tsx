import type { AtelierSalaire as Reglage, PosteReference } from "../../types";
import {
  ATELIER_SALAIRE_DEFAUT,
  REFERENTIEL,
  SOURCES_SALAIRE,
  calculerPretention,
  formatMontant,
  scriptNegociation,
} from "../../accompagnement/salaire";
import { avecAccompagnement, type PropsAtelier } from "./commun";

export function AtelierSalaire({ apprenant: a, maj }: PropsAtelier) {
  const reglage = a.accompagnement?.salaire ?? ATELIER_SALAIRE_DEFAUT(a);
  const p = calculerPretention(a, reglage);
  const script = scriptNegociation(a, p);
  const sources = SOURCES_SALAIRE.filter((s) => [...p.reference.sources, "apec"].includes(s.id));

  const regler = (champ: Partial<Reglage>) =>
    maj(avecAccompagnement("salaire", (actuel) => ({ ...(actuel ?? ATELIER_SALAIRE_DEFAUT(a)), ...champ })));

  // Position de la prétention sur la jauge de marché
  const pct = (n: number) => ((n - p.basMarche) / (p.hautMarche - p.basMarche)) * 100;

  return (
    <div className="atelier">
      <div className="grille-champs grille-3">
        <label className="champ">
          <span>Poste de référence</span>
          <select value={reglage.poste} onChange={(e) => regler({ poste: e.target.value as PosteReference })}>
            {REFERENTIEL.map((r) => (
              <option key={r.id} value={r.id}>
                {r.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="champ">
          <span>Zone</span>
          <select value={reglage.zone} onChange={(e) => regler({ zone: e.target.value as Reglage["zone"] })}>
            <option value="idf">Île-de-France</option>
            <option value="regions">Régions</option>
          </select>
        </label>
        <label className="champ">
          <span>Statut</span>
          <select value={reglage.contrat} onChange={(e) => regler({ contrat: e.target.value as Reglage["contrat"] })}>
            <option value="salarie">Salarié (CDI, CDD)</option>
            <option value="freelance">Freelance (TJM)</option>
          </select>
        </label>
      </div>

      <div className="marche">
        <div className="marche-bornes">
          <span>{formatMontant(p.basMarche, p.unite)}</span>
          <span className="secondaire">Marché junior, France</span>
          <span>{formatMontant(p.hautMarche, p.unite)}</span>
        </div>
        <div className="marche-piste" aria-hidden="true">
          <span
            className="marche-zone"
            style={{ left: `${pct(p.plancher)}%`, width: `${pct(p.annonce) - pct(p.plancher)}%` }}
          />
          <span className="marche-repere" style={{ left: `${pct(p.annonce)}%` }} />
        </div>
        <div className="marche-chiffres">
          <div>
            <span className="secondaire">Prétention à annoncer</span>
            <strong>{formatMontant(p.annonce, p.unite)}</strong>
          </div>
          <div>
            <span className="secondaire">Plancher de négociation</span>
            <strong>{formatMontant(p.plancher, p.unite)}</strong>
          </div>
        </div>
      </div>

      <h4>Ce qui justifie la prétention</h4>
      {p.facteurs.length ? (
        <ul className="liste-simple">
          {p.facteurs.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      ) : (
        <p className="vide">
          Profil junior sans atout chiffré encore : on part du bas de fourchette. Le portfolio et l'expérience d'avant
          feront monter la prétention.
        </p>
      )}

      <h4>Script de négociation à répéter</h4>
      <ol className="plan-action">
        {script.map((ligne) => (
          <li key={ligne}>{ligne}</li>
        ))}
      </ol>

      <p className="note-methode">
        Fourchettes indicatives, salaires bruts annuels juniors (0-2 ans) en France, à actualiser chaque année. Sources
        :{" "}
        {sources.map((s, i) => (
          <span key={s.id}>
            {i > 0 && " · "}
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.titre}
            </a>{" "}
            ({s.date})
          </span>
        ))}
        .
      </p>
    </div>
  );
}
