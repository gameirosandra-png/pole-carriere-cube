import type { Apprenant } from "../types";
import { formatDate } from "../dates";
import {
  ETAPES_LANCEMENT,
  MENTIONS_FACTURE,
  SOURCES_LANCEMENT,
  STATUTS_JURIDIQUES,
  avancementLancement,
  avecLancement,
  cocherLancement,
} from "../accompagnement/seLancer";

/** Se lancer en freelance : choisir son statut, cocher les démarches, préparer sa facturation. */
export function SeLancerModule({
  apprenant: a,
  maj,
}: {
  apprenant: Apprenant;
  maj: (f: (a: Apprenant) => Apprenant) => void;
}) {
  const l = a.accompagnement?.seLancer ?? {};
  const av = avancementLancement(l);

  return (
    <div className="se-lancer">
      <div className="se-lancer-tete">
        <strong>
          {av.faites}/{av.total} démarches faites
        </strong>
        <span className="etapes-kpi-barre" aria-hidden="true">
          <span style={{ width: `${(av.faites / av.total) * 100}%` }} />
        </span>
        {av.prochaine && <span className="secondaire">Prochaine : {av.prochaine.libelle.toLowerCase()}</span>}
      </div>

      <h4>Quel statut pour démarrer ?</h4>
      <div className="statuts" role="radiogroup" aria-label="Statut choisi">
        {STATUTS_JURIDIQUES.map((s) => (
          <label key={s.id} className={l.statut === s.id ? "statut choisi" : "statut"}>
            <span className="statut-tete">
              <input
                type="radio"
                name={`statut-${a.id}`}
                checked={l.statut === s.id}
                onChange={() => maj(avecLancement((x) => cocherLancement({ ...x, statut: s.id }, "statut", true)))}
              />
              <strong>{s.nom}</strong>
            </span>
            <span className="statut-pour">{s.pourQui}</span>
            <span>
              <em>Atouts</em> : {s.atouts}
            </span>
            <span>
              <em>Limites</em> : {s.limites}
            </span>
          </label>
        ))}
      </div>

      <h4>Les démarches, dans l'ordre</h4>
      <ol className="checklist-lancement">
        {ETAPES_LANCEMENT.map((e) => {
          const faite = l.etapes?.[e.id];
          return (
            <li key={e.id} className={faite ? "fait" : ""}>
              <label className="case">
                <input
                  type="checkbox"
                  checked={Boolean(faite)}
                  onChange={(ev) => maj(avecLancement((x) => cocherLancement(x, e.id, ev.target.checked)))}
                />
                <span>
                  <strong>{e.libelle}</strong>
                  {faite && <span className="secondaire"> · fait le {formatDate(faite)}</span>}
                  <span className="secondaire etape-aide">
                    {e.aide}
                    {e.lien && (
                      <>
                        {" "}
                        <a href={e.lien} target="_blank" rel="noreferrer">
                          Ouvrir
                        </a>
                      </>
                    )}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ol>

      <h4>Les mentions obligatoires d'une facture</h4>
      <ul className="liste-simple">
        {MENTIONS_FACTURE.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>

      <p className="note-methode">
        Information générale, vérifiée le 23 oct. 2026, pas un conseil juridique ou fiscal : pour un cas précis, un
        expert-comptable. Sources :{" "}
        {SOURCES_LANCEMENT.map((s, i) => (
          <span key={s.url}>
            {i > 0 && " · "}
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.nom}
            </a>
          </span>
        ))}
        .
      </p>
    </div>
  );
}
