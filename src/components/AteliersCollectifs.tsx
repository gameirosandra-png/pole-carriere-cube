import { useState, type FormEvent } from "react";
import type { AtelierCollectif, Donnees, EtapeDossier } from "../types";
import { THEMES_ATELIER, aInviter, libelleTheme, placesRestantes } from "../accompagnement/collectif";
import { aujourdhui, ajouterJours, formatDate } from "../dates";
import { nouvelId } from "../store";

interface Props {
  donnees: Donnees;
  setDonnees: (f: (d: Donnees) => Donnees) => void;
  modifierAvecAnnulation: (message: string, f: (d: Donnees) => Donnees) => void;
  ouvrir: (id: string) => void;
}

/** Ateliers collectifs : planning, inscrits, et apprenants à inviter selon leur parcours. */
export function AteliersCollectifs({ donnees, setDonnees, modifierAvecAnnulation, ouvrir }: Props) {
  const today = aujourdhui();
  const ateliers = [...(donnees.ateliers ?? [])].sort((x, y) => x.date.localeCompare(y.date));
  const aVenir = ateliers.filter((x) => x.date >= today);
  const passes = ateliers.filter((x) => x.date < today);

  const majAtelier = (id: string, f: (x: AtelierCollectif) => AtelierCollectif) =>
    setDonnees((d) => ({ ...d, ateliers: (d.ateliers ?? []).map((x) => (x.id === id ? f(x) : x)) }));

  return (
    <section aria-labelledby="titre-ateliers">
      <header className="entete-page">
        <h1 id="titre-ateliers">Ateliers collectifs</h1>
        <p className="sous-titre">
          {aVenir.length} atelier{aVenir.length > 1 ? "s" : ""} à venir. Pour chacun, l'outil propose les apprenants
          dont la séance correspondante n'est pas encore faite.
        </p>
      </header>

      {aVenir.length === 0 && <p className="vide">Aucun atelier prévu. Planifiez le prochain ci-dessous.</p>}

      <ul className="ateliers">
        {aVenir.map((x) => {
          const invites = aInviter(x, donnees.apprenants);
          const restantes = placesRestantes(x);
          return (
            <li key={x.id} className="atelier-collectif">
              <div className="atelier-date">
                <strong>{formatDate(x.date)}</strong>
                <span>{x.heure}</span>
              </div>
              <div className="atelier-corps">
                <div className="atelier-tete">
                  <h2>{x.titre}</h2>
                  <span className="contrat">{libelleTheme(x.theme)}</span>
                  <span className={restantes ? "secondaire" : "texte-alerte"}>
                    {x.inscrits.length}/{x.places} inscrits
                  </span>
                  <button
                    className="bouton-texte texte-alerte"
                    onClick={() =>
                      modifierAvecAnnulation(`Atelier « ${x.titre} » supprimé`, (d) => ({
                        ...d,
                        ateliers: (d.ateliers ?? []).filter((y) => y.id !== x.id),
                      }))
                    }
                  >
                    Supprimer
                  </button>
                </div>

                <div className="candidats">
                  {x.inscrits.map((id) => {
                    const a = donnees.apprenants.find((y) => y.id === id);
                    return a ? (
                      <span key={id} className={`jeton s-${a.statut}`}>
                        <button className="jeton-nom" onClick={() => ouvrir(id)}>
                          {a.prenom} {a.nom}
                        </button>
                        <button
                          className="jeton-retirer"
                          aria-label={`Désinscrire ${a.prenom} ${a.nom}`}
                          onClick={() =>
                            majAtelier(x.id, (y) => ({ ...y, inscrits: y.inscrits.filter((i) => i !== id) }))
                          }
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                  {!x.inscrits.length && <span className="secondaire">Personne d'inscrit pour l'instant.</span>}
                </div>

                {invites.length > 0 && restantes > 0 && (
                  <div className="a-inviter">
                    <span className="secondaire">À inviter (séance pas encore faite) :</span>
                    {invites.slice(0, 6).map((a) => (
                      <button
                        key={a.id}
                        className="bouton-inviter"
                        onClick={() => majAtelier(x.id, (y) => ({ ...y, inscrits: [...y.inscrits, a.id] }))}
                      >
                        + {a.prenom} {a.nom}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <NouvelAtelier
        ajouter={(atelier) => setDonnees((d) => ({ ...d, ateliers: [...(d.ateliers ?? []), atelier] }))}
        today={today}
      />

      {passes.length > 0 && (
        <>
          <h2 className="titre-section">Ateliers passés</h2>
          <ul className="liste-simple">
            {passes.map((x) => (
              <li key={x.id}>
                {formatDate(x.date)} · {x.titre} · {x.inscrits.length} participant{x.inscrits.length > 1 ? "s" : ""}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function NouvelAtelier({ ajouter, today }: { ajouter: (a: AtelierCollectif) => void; today: string }) {
  const [theme, setTheme] = useState<EtapeDossier>("cv");
  const [titre, setTitre] = useState("");
  const [date, setDate] = useState(ajouterJours(today, 7));
  const [heure, setHeure] = useState("18:00");
  const [places, setPlaces] = useState(10);

  const valider = (e: FormEvent) => {
    e.preventDefault();
    if (!date) return;
    ajouter({
      id: nouvelId(),
      theme,
      titre: titre.trim() || `Atelier ${libelleTheme(theme).toLowerCase()}`,
      date,
      heure,
      places: Math.max(1, places),
      inscrits: [],
    });
    setTitre("");
  };

  return (
    <form className="ajout-entreprise" onSubmit={valider}>
      <h2 className="titre-section">Planifier un atelier</h2>
      <div className="filtres">
        <label className="champ">
          <span>Thème</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value as EtapeDossier)}>
            {THEMES_ATELIER.map((t) => (
              <option key={t.id} value={t.id}>
                {t.libelle}
              </option>
            ))}
          </select>
        </label>
        <label className="champ champ-large">
          <span>Titre</span>
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex. Négocier son premier salaire"
          />
        </label>
        <label className="champ">
          <span>Date</span>
          <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="champ champ-court">
          <span>Heure</span>
          <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} />
        </label>
        <label className="champ champ-court">
          <span>Places</span>
          <input type="number" min={1} max={50} value={places} onChange={(e) => setPlaces(Number(e.target.value))} />
        </label>
        <button className="bouton" type="submit">
          Planifier l'atelier
        </button>
      </div>
    </form>
  );
}
