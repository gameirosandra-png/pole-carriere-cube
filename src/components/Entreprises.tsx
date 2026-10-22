import { useState } from "react";
import type { Apprenant, Donnees, Entreprise, TypeContrat } from "../types";
import { estInsere } from "../regles";
import { nouvelId } from "../store";

interface Props {
  donnees: Donnees;
  setDonnees: (f: (d: Donnees) => Donnees) => void;
  ouvrir: (id: string) => void;
}

const CONTRATS: TypeContrat[] = ["CDI", "CDD", "Alternance", "Freelance"];

export function Entreprises({ donnees, setDonnees, ouvrir }: Props) {
  const [nom, setNom] = useState("");
  const [secteur, setSecteur] = useState("");

  const majEntreprise = (id: string, f: (e: Entreprise) => Entreprise) =>
    setDonnees((d) => ({ ...d, entreprises: d.entreprises.map((e) => (e.id === id ? f(e) : e)) }));

  const ajouterEntreprise = () => {
    if (!nom.trim()) return;
    setDonnees((d) => ({
      ...d,
      entreprises: [...d.entreprises, { id: nouvelId(), nom: nom.trim(), secteur: secteur.trim(), contact: "", offres: [] }],
    }));
    setNom("");
    setSecteur("");
  };

  const disponibles = donnees.apprenants.filter((a) => !estInsere(a));
  const parId = (id: string) => donnees.apprenants.find((a) => a.id === id);
  const offresOuvertes = donnees.entreprises.reduce((n, e) => n + e.offres.filter((o) => o.ouverte).length, 0);

  return (
    <section aria-labelledby="titre-entreprises">
      <header className="entete-page">
        <h1 id="titre-entreprises">Entreprises & offres</h1>
        <p className="sous-titre">
          {donnees.entreprises.length} entreprises partenaires · {offresOuvertes} offres ouvertes
        </p>
      </header>

      {donnees.entreprises.map((e) => (
        <article className="entreprise" key={e.id}>
          <header className="entreprise-entete">
            <h2>{e.nom}</h2>
            <span className="secondaire">
              {e.secteur}
              {e.contact && ` · ${e.contact}`}
            </span>
          </header>

          {e.offres.length === 0 && <p className="vide">Pas encore d'offre. Ajoutez la première ci-dessous.</p>}

          <ul className="offres">
            {e.offres.map((o) => (
              <li key={o.id} className={o.ouverte ? "offre" : "offre offre-pourvue"}>
                <div className="offre-tete">
                  <strong>{o.titre}</strong>
                  <span className="contrat">{o.contrat}</span>
                  <label className="case">
                    <input
                      type="checkbox"
                      checked={o.ouverte}
                      onChange={(ev) =>
                        majEntreprise(e.id, (x) => ({
                          ...x,
                          offres: x.offres.map((y) => (y.id === o.id ? { ...y, ouverte: ev.target.checked } : y)),
                        }))
                      }
                    />
                    Ouverte
                  </label>
                </div>

                <div className="candidats">
                  {o.candidats.map((cid) => {
                    const a = parId(cid);
                    return a ? (
                      <button key={cid} className={`jeton s-${a.statut}`} onClick={() => ouvrir(cid)}>
                        {a.prenom} {a.nom}
                      </button>
                    ) : null;
                  })}
                  {o.ouverte && (
                    <SelectionCandidat
                      exclus={o.candidats}
                      apprenants={disponibles}
                      ajouter={(cid) =>
                        majEntreprise(e.id, (x) => ({
                          ...x,
                          offres: x.offres.map((y) => (y.id === o.id ? { ...y, candidats: [...y.candidats, cid] } : y)),
                        }))
                      }
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          <NouvelleOffre
            ajouter={(titre, contrat) =>
              majEntreprise(e.id, (x) => ({
                ...x,
                offres: [...x.offres, { id: nouvelId(), titre, contrat, ouverte: true, candidats: [] }],
              }))
            }
          />
        </article>
      ))}

      <form
        className="ajout-entreprise"
        onSubmit={(ev) => {
          ev.preventDefault();
          ajouterEntreprise();
        }}
      >
        <h2 className="titre-section">Ajouter une entreprise</h2>
        <div className="filtres">
          <label className="champ">
            <span>Nom</span>
            <input value={nom} onChange={(ev) => setNom(ev.target.value)} required />
          </label>
          <label className="champ">
            <span>Secteur</span>
            <input value={secteur} onChange={(ev) => setSecteur(ev.target.value)} />
          </label>
          <button className="bouton" type="submit" disabled={!nom.trim()}>
            Ajouter l'entreprise
          </button>
        </div>
      </form>
    </section>
  );
}

function SelectionCandidat({
  apprenants,
  exclus,
  ajouter,
}: {
  apprenants: Apprenant[];
  exclus: string[];
  ajouter: (id: string) => void;
}) {
  const choix = apprenants.filter((a) => !exclus.includes(a.id));
  if (choix.length === 0) return null;
  return (
    <select
      className="select-jeton"
      value=""
      aria-label="Proposer un apprenant pour cette offre"
      onChange={(e) => e.target.value && ajouter(e.target.value)}
    >
      <option value="">+ Proposer un apprenant</option>
      {choix.map((a) => (
        <option key={a.id} value={a.id}>
          {a.prenom} {a.nom} ({a.posteVise})
        </option>
      ))}
    </select>
  );
}

function NouvelleOffre({ ajouter }: { ajouter: (titre: string, contrat: TypeContrat) => void }) {
  const [titre, setTitre] = useState("");
  const [contrat, setContrat] = useState<TypeContrat>("CDI");
  return (
    <form
      className="nouvelle-offre"
      onSubmit={(e) => {
        e.preventDefault();
        if (!titre.trim()) return;
        ajouter(titre.trim(), contrat);
        setTitre("");
      }}
    >
      <input
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        placeholder="Intitulé de la nouvelle offre"
        aria-label="Intitulé de la nouvelle offre"
      />
      <select value={contrat} onChange={(e) => setContrat(e.target.value as TypeContrat)} aria-label="Type de contrat">
        {CONTRATS.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <button className="bouton bouton-discret" type="submit" disabled={!titre.trim()}>
        Ajouter l'offre
      </button>
    </form>
  );
}
