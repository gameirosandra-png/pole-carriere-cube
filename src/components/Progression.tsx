import type { Apprenant } from "../types";
import { progression, type Evolution } from "../accompagnement/progression";
import { formatDate, joursEntre } from "../dates";

const SERIES = [
  { cle: "cv", libelle: "Score CV", classe: "serie-cv" },
  { cle: "simulation", libelle: "Simulation d'entretien", classe: "serie-sim" },
] as const;

/** Courbe avant / après des scores CV et simulation, relevés à chaque séance. */
export function Progression({ apprenant, compact = false }: { apprenant: Apprenant; compact?: boolean }) {
  const p = progression(apprenant);
  const series = SERIES.map((s) => ({ ...s, evo: p[s.cle] })).filter(
    (s): s is (typeof s & { evo: Evolution }) => s.evo !== null,
  );

  if (!series.length) {
    return (
      <p className="vide">
        La courbe apparaît dès que le CV ou la simulation a été évalué à deux séances différentes.
      </p>
    );
  }

  const dates = series.flatMap((s) => s.evo.points.map((x) => x.date)).sort();
  const debut = dates[0];
  const duree = Math.max(1, joursEntre(debut, dates[dates.length - 1]));
  const L = 320;
  const H = compact ? 90 : 120;
  const m = { g: 28, d: 44, h: 10, b: 20 };
  const x = (d: string) => m.g + (joursEntre(debut, d) / duree) * (L - m.g - m.d);
  const y = (v: number) => m.h + (1 - v / 100) * (H - m.h - m.b);

  return (
    <figure className="progression">
      <svg
        viewBox={`0 0 ${L} ${H}`}
        role="img"
        aria-label={series
          .map((s) => `${s.libelle} : de ${s.evo.debut} à ${s.evo.fin} sur 100`)
          .join(". ")}
      >
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line className="progression-grille" x1={m.g} x2={L - m.d} y1={y(v)} y2={y(v)} />
            <text className="progression-axe" x={m.g - 6} y={y(v) + 4} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {series.map((s) => {
          const pts = s.evo.points;
          const dernier = pts[pts.length - 1];
          return (
            <g key={s.cle} className={s.classe}>
              <polyline points={pts.map((pt) => `${x(pt.date)},${y(pt.valeur)}`).join(" ")} />
              {pts.map((pt) => (
                <circle key={pt.date} cx={x(pt.date)} cy={y(pt.valeur)} r={3.5}>
                  <title>
                    {s.libelle} le {formatDate(pt.date)} : {pt.valeur}/100
                  </title>
                </circle>
              ))}
              <text className="progression-valeur" x={x(dernier.date) + 7} y={y(dernier.valeur) + 4}>
                {dernier.valeur}
              </text>
            </g>
          );
        })}
        <text className="progression-axe" x={m.g} y={H - 4}>
          {formatDate(debut)}
        </text>
        <text className="progression-axe" x={L - m.d} y={H - 4} textAnchor="end">
          {formatDate(dates[dates.length - 1])}
        </text>
      </svg>
      <figcaption className="progression-legende">
        {series.map((s) => (
          <span key={s.cle} className={s.classe}>
            <span className="progression-pastille" aria-hidden="true" />
            {s.libelle} : {s.evo.debut} → {s.evo.fin}{" "}
            <strong className={s.evo.gain >= 0 ? "gain" : "perte"}>
              ({s.evo.gain >= 0 ? "+" : ""}
              {s.evo.gain} pts)
            </strong>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
