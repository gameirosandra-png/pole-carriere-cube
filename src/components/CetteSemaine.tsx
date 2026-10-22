import type { Apprenant, AtelierCollectif } from "../types";
import { agendaSemaine } from "../accompagnement/collectif";
import { aujourdhui, formatDate } from "../dates";

/** Ce que le pôle a à faire dans les 7 jours : rendez-vous individuels et ateliers collectifs. */
export function CetteSemaine({
  apprenants,
  ateliers,
  ouvrir,
  voirAteliers,
}: {
  apprenants: Apprenant[];
  ateliers: AtelierCollectif[];
  ouvrir: (id: string) => void;
  voirAteliers: () => void;
}) {
  const today = aujourdhui();
  const agenda = agendaSemaine(apprenants, ateliers, today);

  return (
    <section className="semaine" aria-labelledby="titre-semaine">
      <h2 className="titre-section" id="titre-semaine">
        Cette semaine au pôle
      </h2>
      {agenda.length === 0 ? (
        <p className="vide">Rien de prévu dans les 7 jours. Planifiez un rendez-vous ou un atelier.</p>
      ) : (
        <ul className="agenda">
          {agenda.map((e, i) => (
            <li key={i} className={`agenda-ligne agenda-${e.type}${e.enRetard ? " agenda-retard" : ""}`}>
              <span className="agenda-date">
                {e.enRetard ? "En retard" : e.date === today ? "Aujourd'hui" : formatDate(e.date)}
              </span>
              <span className="agenda-type">{e.type === "atelier" ? "Atelier collectif" : "Rendez-vous"}</span>
              <button className="agenda-titre" onClick={() => (e.apprenantId ? ouvrir(e.apprenantId) : voirAteliers())}>
                <strong>{e.titre}</strong>
                <span>{e.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
