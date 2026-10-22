import type { Apprenant, EtapeDossier } from "../types";
import { ETAPES_DOSSIER, completude, etapeFaite, pretAProposer } from "../dossier";
import { formatDate } from "../dates";

interface Props {
  apprenant: Apprenant;
  /** "apprenant" : l'apprenant ne coche que ses propres étapes. "equipe" : tout est modifiable. */
  mode: "apprenant" | "equipe";
  cocher: (etape: EtapeDossier, faite: boolean) => void;
}

/** Barre de progression du dossier, réutilisée dans les listes et les tableaux de bord. */
export function JaugeDossier({
  apprenant,
  compacte = false,
  avecTexte = true,
}: {
  apprenant: Apprenant;
  compacte?: boolean;
  avecTexte?: boolean;
}) {
  const c = completude(apprenant);
  const pret = c.faites === c.total;
  return (
    <span className={compacte ? "jauge jauge-compacte" : "jauge"}>
      <span
        className="jauge-barre"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={c.total}
        aria-valuenow={c.faites}
        aria-label={`Dossier complété à ${c.pourcentage} %`}
      >
        <span className={pret ? "jauge-rempli jauge-pret" : "jauge-rempli"} style={{ width: `${c.pourcentage}%` }} />
      </span>
      {avecTexte && (
        <span className="jauge-texte">
          {c.faites}/{c.total}
        </span>
      )}
    </span>
  );
}

export function ChecklistDossier({ apprenant: a, mode, cocher }: Props) {
  const pret = pretAProposer(a);
  return (
    <div className="checklist">
      <div className="checklist-entete">
        <JaugeDossier apprenant={a} />
        {pret ? (
          <span className="badge-pret">Prêt à être proposé</span>
        ) : (
          <span className="secondaire">Toutes les étapes sont nécessaires avant de proposer le dossier</span>
        )}
      </div>
      <ul className="checklist-etapes">
        {ETAPES_DOSSIER.map((e) => {
          const faite = etapeFaite(a, e.id);
          const modifiable = mode === "equipe" || e.par === "apprenant";
          const date = a.dossier?.[e.id];
          return (
            <li key={e.id} className={faite ? "etape etape-faite" : "etape"}>
              <label className={modifiable ? "etape-case" : "etape-case etape-verrouillee"}>
                <input
                  type="checkbox"
                  checked={faite}
                  disabled={!modifiable}
                  onChange={(ev) => cocher(e.id, ev.target.checked)}
                />
                <span>
                  <span className="etape-libelle">{e.libelle}</span>
                  <span className="etape-aide">
                    {faite && date
                      ? `Fait le ${formatDate(date)}${e.par === "equipe" && mode === "apprenant" ? ", validé par l'équipe" : ""}`
                      : !modifiable
                        ? "À faire avec l'équipe du pôle carrière"
                        : e.aide}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
