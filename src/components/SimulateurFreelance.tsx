import { useState } from "react";
import { formatDate } from "../dates";
import { devinerPoste } from "../accompagnement/salaire";
import {
  HYPOTHESES_DEFAUT,
  MICRO_2026,
  euros,
  positionMarche,
  simulerDepuisRevenu,
  simulerDepuisTjm,
  type HypothesesFreelance,
} from "../accompagnement/freelance";

type Mode = "revenu" | "tjm";

interface Curseur {
  cle: keyof HypothesesFreelance;
  libelle: string;
  min: number;
  max: number;
  pas: number;
  format: (v: number) => string;
  aide?: string;
}

const CURSEURS: Curseur[] = [
  { cle: "joursParSemaine", libelle: "Jours travaillés par semaine", min: 1, max: 5, pas: 0.5, format: (v) => `${String(v).replace(".", ",")} j` },
  { cle: "semainesConges", libelle: "Semaines de congés par an", min: 0, max: 12, pas: 1, format: (v) => `${v} sem.` },
  {
    cle: "tauxFacturation",
    libelle: "Part du temps facturée",
    min: 0.4,
    max: 1,
    pas: 0.05,
    format: (v) => `${Math.round(v * 100)} %`,
    aide: "Le reste : prospection, devis, administratif, formation. Au démarrage, 60 à 70 % est réaliste.",
  },
  { cle: "heuresParJour", libelle: "Heures par jour", min: 4, max: 10, pas: 0.5, format: (v) => `${String(v).replace(".", ",")} h` },
  {
    cle: "fraisMensuels",
    libelle: "Frais pro par mois",
    min: 0,
    max: 1000,
    pas: 10,
    format: (v) => euros(v),
    aide: "Logiciels, assurance RC Pro, banque, comptabilité, matériel.",
  },
  { cle: "dureeMission", libelle: "Durée typique d'une mission", min: 1, max: 60, pas: 1, format: (v) => `${v} j` },
];

/**
 * Simulateur de revenus freelance, côté apprenant : il fait ses propres essais
 * (« je veux 3 000 € net, combien de jours, quel TJM ? »). Utilisable seul, comme un module à intégrer.
 */
export function SimulateurFreelance({ posteVise = "Product Builder" }: { posteVise?: string }) {
  const [mode, setMode] = useState<Mode>("revenu");
  const [h, setH] = useState<HypothesesFreelance>(HYPOTHESES_DEFAUT);
  const [tjmChoisi, setTjmChoisi] = useState(350);
  const maj = <K extends keyof HypothesesFreelance>(cle: K, v: HypothesesFreelance[K]) => setH((x) => ({ ...x, [cle]: v }));

  const s = mode === "revenu" ? simulerDepuisRevenu(h) : simulerDepuisTjm(h, tjmChoisi);
  const marche = positionMarche(s.tjm, devinerPoste(posteVise));
  const r = s.repartition;
  const total = Math.max(1, r.cotisations + r.impot + r.frais + Math.max(0, r.net));
  const part = (n: number) => `${Math.max(0, (n / total) * 100)}%`;

  return (
    <div className="simulateur">
      <div className="simulateur-modes" role="group" aria-label="Type de simulation">
        <button className={mode === "revenu" ? "actif" : ""} aria-pressed={mode === "revenu"} onClick={() => setMode("revenu")}>
          Je vise un revenu
        </button>
        <button className={mode === "tjm" ? "actif" : ""} aria-pressed={mode === "tjm"} onClick={() => setMode("tjm")}>
          Je fixe mon TJM
        </button>
      </div>

      <div className="simulateur-grille">
        <div className="simulateur-reglages">
          {mode === "revenu" ? (
            <label className="champ simulateur-principal">
              <span>Ce que je veux dans ma poche chaque mois</span>
              <div className="simulateur-saisie">
                <input
                  type="range"
                  min={1000}
                  max={8000}
                  step={100}
                  value={h.netMensuel}
                  onChange={(e) => maj("netMensuel", Number(e.target.value))}
                  aria-label="Revenu net mensuel visé"
                />
                <strong>{euros(h.netMensuel)}</strong>
              </div>
            </label>
          ) : (
            <label className="champ simulateur-principal">
              <span>Mon taux journalier (TJM)</span>
              <div className="simulateur-saisie">
                <input
                  type="range"
                  min={100}
                  max={900}
                  step={10}
                  value={tjmChoisi}
                  onChange={(e) => setTjmChoisi(Number(e.target.value))}
                  aria-label="TJM facturé"
                />
                <strong>{euros(tjmChoisi)}</strong>
              </div>
            </label>
          )}

          {CURSEURS.map((c) => (
            <label key={c.cle} className="champ">
              <span>{c.libelle}</span>
              <div className="simulateur-saisie">
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.pas}
                  value={h[c.cle] as number}
                  onChange={(e) => maj(c.cle, Number(e.target.value) as never)}
                  aria-label={c.libelle}
                />
                <strong>{c.format(h[c.cle] as number)}</strong>
              </div>
              {c.aide && <small className="secondaire">{c.aide}</small>}
            </label>
          ))}

          <label className="case">
            <input
              type="checkbox"
              checked={h.versementLiberatoire}
              onChange={(e) => maj("versementLiberatoire", e.target.checked)}
            />
            Payer l'impôt au fil de l'eau (versement libératoire, 2,2 %)
          </label>
          <label className="champ champ-court">
            <span>Taux de cotisations sociales</span>
            <div className="simulateur-saisie">
              <input
                type="number"
                min={10}
                max={40}
                step={0.1}
                value={Math.round(h.tauxCotisations * 1000) / 10}
                onChange={(e) => maj("tauxCotisations", Number(e.target.value) / 100)}
                aria-label="Taux de cotisations sociales en pourcentage"
              />
              <strong>%</strong>
            </div>
          </label>
        </div>

        <div className="simulateur-resultats" aria-live="polite">
          <div className="simulateur-chiffre">
            <span>{mode === "revenu" ? "TJM à facturer" : "Ce qui te reste chaque mois"}</span>
            <strong className="simulateur-reponse">{mode === "revenu" ? euros(s.tjm) : euros(s.netMensuel)}</strong>
            <small>
              {mode === "revenu" ? `par jour, soit ${euros(s.tauxHoraire)} de l'heure` : `pour ${euros(s.tjm)} par jour facturé`}
            </small>
          </div>

          <dl className="simulateur-details">
            <div>
              <dt>Jours facturés</dt>
              <dd>{String(s.joursFacturesMois).replace(".", ",")} / mois</dd>
            </div>
            <div>
              <dt>Missions</dt>
              <dd>
                {String(s.missionsParMois).replace(".", ",")} / mois
              </dd>
            </div>
            <div>
              <dt>Chiffre d'affaires</dt>
              <dd>{euros(s.caMensuel)} / mois</dd>
            </div>
            <div>
              <dt>Sur l'année</dt>
              <dd>{euros(s.caAnnuel)}</dd>
            </div>
          </dl>

          <div className="simulateur-barre" role="img" aria-label={`Sur ${euros(s.caAnnuel)} facturés par an : ${euros(r.cotisations)} de cotisations, ${euros(r.impot)} d'impôt, ${euros(r.frais)} de frais, ${euros(r.net)} pour toi`}>
            <span className="part-net" style={{ width: part(r.net) }} />
            <span className="part-cotisations" style={{ width: part(r.cotisations) }} />
            {r.impot > 0 && <span className="part-impot" style={{ width: part(r.impot) }} />}
            <span className="part-frais" style={{ width: part(r.frais) }} />
          </div>
          <ul className="simulateur-legende">
            <li>
              <span className="pastille-net" aria-hidden="true" />
              Pour toi : {euros(r.net)} / an
            </li>
            <li>
              <span className="pastille-cotisations" aria-hidden="true" />
              Cotisations : {euros(r.cotisations)}
            </li>
            {r.impot > 0 && (
              <li>
                <span className="pastille-impot" aria-hidden="true" />
                Impôt : {euros(r.impot)}
              </li>
            )}
            <li>
              <span className="pastille-frais" aria-hidden="true" />
              Frais : {euros(r.frais)}
            </li>
          </ul>

          <p className={`simulateur-marche marche-${marche.position}`}>
            {marche.position === "dans"
              ? `Dans la fourchette du marché junior ${marche.libelle.toLowerCase()} (${marche.min} à ${marche.max} €/jour).`
              : marche.position === "au-dessus"
                ? `Au-dessus du marché junior ${marche.libelle.toLowerCase()} (${marche.min} à ${marche.max} €/jour) : facture plus de jours, baisse tes frais, ou vise un revenu plus progressif.`
                : `Sous le marché junior ${marche.libelle.toLowerCase()} (${marche.min} à ${marche.max} €/jour) : tu peux viser plus haut.`}
          </p>
          {s.depassePlafond && (
            <p className="simulateur-alerte">
              Plus de {euros(MICRO_2026.plafondCA)} par an : au-delà, la micro-entreprise ne suffit plus. Une société
              (EURL, SASU) est à étudier avec un expert-comptable.
            </p>
          )}
          {!s.depassePlafond && s.depasseTVA && (
            <p className="simulateur-alerte">
              Plus de {euros(MICRO_2026.seuilTVA)} par an : tu devras facturer la TVA (20 %) en plus de ton TJM. Ça ne
              change pas ce qui te reste, mais ça change le prix pour un client particulier.
            </p>
          )}
        </div>
      </div>

      <p className="note-methode">
        Estimation pour une micro-entreprise en activité libérale, avant impôt sur le revenu (sauf versement libératoire).
        Taux et seuils 2026 vérifiés le {formatDate(MICRO_2026.verifieLe)} {MICRO_2026.verifieLe.slice(0, 4)} :{" "}
        {MICRO_2026.sources.map((src, i) => (
          <span key={src.url}>
            {i > 0 && " · "}
            <a href={src.url} target="_blank" rel="noreferrer">
              {src.nom}
            </a>
          </span>
        ))}
        . Information, pas un conseil juridique ou fiscal : pour un cas précis, un expert-comptable.
      </p>
    </div>
  );
}
