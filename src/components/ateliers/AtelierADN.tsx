import { useState } from "react";
import type { FreinId } from "../../types";
import { formatDate } from "../../dates";
import { nouvelId } from "../../store";
import {
  FREINS,
  MAX_VALEURS,
  METEO,
  PILIERS,
  VALEURS,
  avancementADN,
  avecADN,
  libelleMeteo,
  noterMeteo,
  tendanceConfiance,
} from "../../accompagnement/adn";
import { aujourdhui } from "../../dates";
import type { PropsAtelier } from "./commun";

/**
 * Méthode ADN : Ancrer, Diriger, Narrer. Le même atelier côté équipe (fiche) et côté apprenant (son espace) :
 * seul le ton change, tutoiement pour l'apprenant.
 */
export function AtelierADN({ apprenant: a, maj, mode = "equipe" }: PropsAtelier & { mode?: "equipe" | "apprenant" }) {
  const adn = a.accompagnement?.adn ?? {};
  const toi = mode === "apprenant";
  const av = avancementADN(adn);
  const t = tendanceConfiance(adn);
  const today = aujourdhui();
  const meteoDuJour = adn.meteo?.find((m) => m.date === today)?.note;

  const [croyance, setCroyance] = useState("");
  const [victoire, setVictoire] = useState("");

  const majADN = (f: Parameters<typeof avecADN>[0]) => maj(avecADN(f));
  const basculerValeur = (v: string) =>
    majADN((x) => {
      const valeurs = x.valeurs ?? [];
      if (valeurs.includes(v)) return { ...x, valeurs: valeurs.filter((y) => y !== v) };
      return valeurs.length < MAX_VALEURS ? { ...x, valeurs: [...valeurs, v] } : x;
    });
  const basculerFrein = (id: FreinId) =>
    majADN((x) => {
      const freins = x.freins ?? [];
      return { ...x, freins: freins.includes(id) ? freins.filter((f) => f !== id) : [...freins, id] };
    });

  return (
    <div className="atelier adn">
      <div className="adn-tete">
        <div className="adn-lettres" aria-hidden="true">
          {PILIERS.map((p, i) => (
            <span key={p.lettre} className={[av.ancrer, av.diriger, av.narrer][i] ? "fait" : ""}>
              {p.lettre}
            </span>
          ))}
        </div>
        <p>
          <strong>Méthode ADN</strong> : {toi ? "ton accompagnement" : "l'accompagnement"} au-delà du CV.{" "}
          {toi ? "Tu avances" : "On avance"} sur la confiance, les freins et le récit de la reconversion.{" "}
          <span className="secondaire">{av.faits}/3 piliers en place.</span>
        </p>
      </div>

      {/* A · ANCRER */}
      <section className="adn-pilier" aria-labelledby={`adn-a-${a.id}`}>
        <h4 id={`adn-a-${a.id}`}>
          <span className="adn-lettre">A</span> Ancrer <span className="secondaire">· {PILIERS[0].promesse}</span>
        </h4>

        <div className="adn-meteo">
          <p className="adn-question">{toi ? "Ta météo de confiance aujourd'hui" : "Météo de confiance du jour"}</p>
          <div className="choix-ligne" role="radiogroup" aria-label="Météo de confiance">
            {METEO.map((m) => (
              <label key={m.note} className="pastille-choix">
                <input
                  type="radio"
                  name={`meteo-${a.id}-${mode}`}
                  checked={meteoDuJour === m.note}
                  onChange={() => majADN((x) => noterMeteo(x, m.note))}
                />
                {m.libelle}
              </label>
            ))}
          </div>
          {adn.meteo && adn.meteo.length > 0 && (
            <ol className="adn-historique" aria-label="Historique de la météo de confiance">
              {adn.meteo.slice(-8).map((m) => (
                <li key={m.date} title={`${formatDate(m.date)} : ${libelleMeteo(m.note)}`}>
                  <span className="adn-barre" style={{ height: `${m.note * 8}px` }} />
                  <small>{formatDate(m.date)}</small>
                </li>
              ))}
            </ol>
          )}
          {t?.alerte && (
            <p className="adn-alerte">
              {toi
                ? "La confiance est basse en ce moment : parles-en au pôle à ta prochaine séance, c'est fait pour ça."
                : `Confiance en baisse (${libelleMeteo(t.derniere).toLowerCase()}) : commencer le prochain rendez-vous par l'écoute.`}
            </p>
          )}
        </div>

        <label className="champ">
          <span>{toi ? "Tes forces" : "Ses forces"} (ce que les autres viennent chercher chez {toi ? "toi" : "lui ou elle"})</span>
          <textarea
            rows={2}
            value={adn.forces ?? ""}
            onChange={(e) => majADN((x) => ({ ...x, forces: e.target.value }))}
            placeholder="Ex. calme sous pression, sens du client, organiser une équipe"
          />
        </label>
        <p className="adn-question">
          {toi ? "Tes" : "Ses"} 3 valeurs essentielles{" "}
          <span className="secondaire">({(adn.valeurs ?? []).length}/{MAX_VALEURS})</span>
        </p>
        <div className="choix-ligne">
          {VALEURS.map((v) => (
            <label key={v} className="pastille-choix">
              <input
                type="checkbox"
                checked={(adn.valeurs ?? []).includes(v)}
                disabled={!(adn.valeurs ?? []).includes(v) && (adn.valeurs ?? []).length >= MAX_VALEURS}
                onChange={() => basculerValeur(v)}
              />
              {v}
            </label>
          ))}
        </div>
        <label className="champ">
          <span>Ce {toi ? "que tu gardes de ton" : "qu'il ou elle garde de son"} métier d'avant</span>
          <input
            value={adn.heritage ?? ""}
            onChange={(e) => majADN((x) => ({ ...x, heritage: e.target.value }))}
            placeholder="Ex. la connaissance du terrain, la relation client, gérer l'imprévu"
          />
        </label>
      </section>

      {/* D · DIRIGER */}
      <section className="adn-pilier" aria-labelledby={`adn-d-${a.id}`}>
        <h4 id={`adn-d-${a.id}`}>
          <span className="adn-lettre">D</span> Diriger <span className="secondaire">· {PILIERS[1].promesse}</span>
        </h4>
        <label className="champ">
          <span>{toi ? "Ton" : "Son"} cap : dans 6 mois, {toi ? "je" : "il ou elle"}…</span>
          <input
            value={adn.cap ?? ""}
            onChange={(e) => majADN((x) => ({ ...x, cap: e.target.value }))}
            placeholder="Ex. travaille comme product builder dans le retail, en hybride"
          />
        </label>

        <p className="adn-question">{toi ? "Ce qui te freine" : "Ce qui freine"} (cocher ce qui résonne)</p>
        <div className="choix-ligne">
          {FREINS.map((f) => (
            <label key={f.id} className="pastille-choix">
              <input type="checkbox" checked={(adn.freins ?? []).includes(f.id)} onChange={() => basculerFrein(f.id)} />
              {f.libelle}
            </label>
          ))}
        </div>
        {(adn.freins ?? []).length > 0 && (
          <ul className="adn-freins">
            {FREINS.filter((f) => (adn.freins ?? []).includes(f.id)).map((f) => (
              <li key={f.id}>
                <strong>{f.libelle}</strong>
                <span className="secondaire">{f.signe}</span>
                <span>
                  <em>Exercice</em> : {f.exercice}
                </span>
                <span>
                  <em>À se redire</em> : {f.recadrage}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="adn-question">Croyances à recadrer</p>
        <ul className="adn-croyances">
          {(adn.croyances ?? []).map((c) => (
            <li key={c.id}>
              <span className="adn-croyance">« {c.croyance} »</span>
              <label className="champ">
                <span className="visuellement-cache">Recadrage de « {c.croyance} »</span>
                <input
                  value={c.recadrage ?? ""}
                  placeholder={toi ? "Ta reformulation, travaillée avec le pôle" : "La reformulation travaillée en séance"}
                  onChange={(e) =>
                    majADN((x) => ({
                      ...x,
                      croyances: (x.croyances ?? []).map((y) => (y.id === c.id ? { ...y, recadrage: e.target.value } : y)),
                    }))
                  }
                />
              </label>
              <button
                className="bouton-texte texte-alerte"
                onClick={() => majADN((x) => ({ ...x, croyances: (x.croyances ?? []).filter((y) => y.id !== c.id) }))}
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
        <form
          className="adn-ajout"
          onSubmit={(e) => {
            e.preventDefault();
            if (!croyance.trim()) return;
            majADN((x) => ({ ...x, croyances: [...(x.croyances ?? []), { id: nouvelId(), croyance: croyance.trim() }] }));
            setCroyance("");
          }}
        >
          <label className="champ">
            <span className="visuellement-cache">Nouvelle croyance</span>
            <input value={croyance} onChange={(e) => setCroyance(e.target.value)} placeholder="Ex. Je suis trop vieux pour la tech" />
          </label>
          <button className="bouton bouton-discret" type="submit" disabled={!croyance.trim()}>
            Ajouter
          </button>
        </form>
      </section>

      {/* N · NARRER */}
      <section className="adn-pilier" aria-labelledby={`adn-n-${a.id}`}>
        <h4 id={`adn-n-${a.id}`}>
          <span className="adn-lettre">N</span> Narrer <span className="secondaire">· {PILIERS[2].promesse}</span>
        </h4>
        <p className="adn-question">
          Journal des victoires <span className="secondaire">(les petites comptent : une relance envoyée, un retour positif, un projet fini)</span>
        </p>
        <form
          className="adn-ajout"
          onSubmit={(e) => {
            e.preventDefault();
            if (!victoire.trim()) return;
            majADN((x) => ({
              ...x,
              victoires: [{ id: nouvelId(), date: aujourdhui(), texte: victoire.trim() }, ...(x.victoires ?? [])],
            }));
            setVictoire("");
          }}
        >
          <label className="champ">
            <span className="visuellement-cache">Nouvelle victoire</span>
            <input value={victoire} onChange={(e) => setVictoire(e.target.value)} placeholder="Ex. J'ai annoncé mon TJM sans baisser les yeux" />
          </label>
          <button className="bouton bouton-discret" type="submit" disabled={!victoire.trim()}>
            Noter
          </button>
        </form>
        {(adn.victoires ?? []).length > 0 && (
          <ul className="adn-victoires">
            {(adn.victoires ?? []).map((v) => (
              <li key={v.id}>
                <time dateTime={v.date}>{formatDate(v.date)}</time> {v.texte}
              </li>
            ))}
          </ul>
        )}
        <p className="secondaire">
          Ces victoires deviennent les preuves {toi ? "de ton" : "du"} pitch et de {toi ? "ta" : "la"} fiche candidat :
          {toi ? " tu les racontes" : " on les raconte"} en entretien.
        </p>
      </section>
    </div>
  );
}
