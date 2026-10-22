import { useState } from "react";
import type { Apprenant, Donnees, Entreprise, Offre, TypeContrat } from "../types";
import { estInsere } from "../regles";
import { nouvelId } from "../store";
import { completude, pretAProposer } from "../dossier";
import { suggerer } from "../matching";

interface Props {
  donnees: Donnees;
  setDonnees: (f: (d: Donnees) => Donnees) => void;
  modifierAvecAnnulation: (message: string, f: (d: Donnees) => Donnees) => void;
  ouvrir: (id: string) => void;
}

const CONTRATS: TypeContrat[] = ["CDI", "CDD", "Alternance", "Freelance"];

export function Entreprises({ donnees, setDonnees, modifierAvecAnnulation, ouvrir }: Props) {
  const [nom, setNom] = useState("");
  const [secteur, setSecteur] = useState("");
  const [contact, setContact] = useState("");

  const avecEntreprise = (d: Donnees, id: string, f: (e: Entreprise) => Entreprise): Donnees => ({
    ...d,
    entreprises: d.entreprises.map((e) => (e.id === id ? f(e) : e)),
  });
  const avecOffre = (e: Entreprise, offreId: string, f: (o: Offre) => Offre): Entreprise => ({
    ...e,
    offres: e.offres.map((o) => (o.id === offreId ? f(o) : o)),
  });

  const majOffre = (entrepriseId: string, offreId: string, f: (o: Offre) => Offre) =>
    setDonnees((d) => avecEntreprise(d, entrepriseId, (e) => avecOffre(e, offreId, f)));

  const ajouterEntreprise = () => {
    if (!nom.trim()) return;
    setDonnees((d) => ({
      ...d,
      entreprises: [
        ...d.entreprises,
        { id: nouvelId(), nom: nom.trim(), secteur: secteur.trim(), contact: contact.trim(), offres: [] },
      ],
    }));
    setNom("");
    setSecteur("");
    setContact("");
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

      {donnees.entreprises.length === 0 && (
        <p className="vide">Aucune entreprise partenaire. Ajoutez la première avec le formulaire ci-dessous.</p>
      )}

      {donnees.entreprises.map((e) => (
        <article className="entreprise" key={e.id}>
          <header className="entreprise-entete">
            <h2>{e.nom}</h2>
            <span className="secondaire">
              {e.secteur}
              {e.contact && ` · ${e.contact}`}
            </span>
            <button
              className="bouton-texte texte-alerte entreprise-supprimer"
              onClick={() =>
                modifierAvecAnnulation(`Entreprise ${e.nom} supprimée`, (d) => ({
                  ...d,
                  entreprises: d.entreprises.filter((x) => x.id !== e.id),
                }))
              }
            >
              Supprimer l'entreprise
            </button>
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
                      onChange={(ev) => majOffre(e.id, o.id, (y) => ({ ...y, ouverte: ev.target.checked }))}
                    />
                    Ouverte
                  </label>
                  <button
                    className="bouton-texte texte-alerte"
                    onClick={() =>
                      modifierAvecAnnulation(`Offre « ${o.titre} » supprimée`, (d) =>
                        avecEntreprise(d, e.id, (x) => ({ ...x, offres: x.offres.filter((y) => y.id !== o.id) })),
                      )
                    }
                  >
                    Supprimer
                  </button>
                </div>

                <div className="candidats">
                  {o.candidats.map((cid) => {
                    const a = parId(cid);
                    return a ? (
                      <span key={cid} className={`jeton s-${a.statut}`}>
                        <button className="jeton-nom" onClick={() => ouvrir(cid)}>
                          {a.prenom} {a.nom}
                        </button>
                        <button
                          className="jeton-retirer"
                          aria-label={`Retirer ${a.prenom} ${a.nom} de cette offre`}
                          title="Retirer de cette offre"
                          onClick={() =>
                            modifierAvecAnnulation(`${a.prenom} ${a.nom} retiré de l'offre`, (d) =>
                              avecEntreprise(d, e.id, (x) =>
                                avecOffre(x, o.id, (y) => ({ ...y, candidats: y.candidats.filter((c) => c !== cid) })),
                              ),
                            )
                          }
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                  {o.ouverte && (
                    <SelectionCandidat
                      exclus={o.candidats}
                      apprenants={disponibles}
                      ajouter={(cid) => majOffre(e.id, o.id, (y) => ({ ...y, candidats: [...y.candidats, cid] }))}
                    />
                  )}
                </div>

                {o.ouverte && (
                  <Suggestions
                    offre={o}
                    apprenants={donnees.apprenants}
                    ouvrir={ouvrir}
                    proposer={(cid) => majOffre(e.id, o.id, (y) => ({ ...y, candidats: [...y.candidats, cid] }))}
                  />
                )}
              </li>
            ))}
          </ul>

          <NouvelleOffre
            ajouter={(titre, contrat) =>
              setDonnees((d) =>
                avecEntreprise(d, e.id, (x) => ({
                  ...x,
                  offres: [...x.offres, { id: nouvelId(), titre, contrat, ouverte: true, candidats: [] }],
                })),
              )
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
          <label className="champ">
            <span>Contact (fonction)</span>
            <input value={contact} onChange={(ev) => setContact(ev.target.value)} placeholder="Ex. Responsable RH" />
          </label>
          <button className="bouton" type="submit" disabled={!nom.trim()}>
            Ajouter l'entreprise
          </button>
        </div>
      </form>
    </section>
  );
}

/** Les 3 meilleurs candidats pour l'offre, avec les raisons du score. */
function Suggestions({
  offre,
  apprenants,
  proposer,
  ouvrir,
}: {
  offre: Offre;
  apprenants: Apprenant[];
  proposer: (id: string) => void;
  ouvrir: (id: string) => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const suggestions = suggerer(apprenants, offre);

  if (!ouvert) {
    return (
      <button className="bouton-suggerer" onClick={() => setOuvert(true)}>
        Suggérer des candidats
      </button>
    );
  }

  return (
    <div className="suggestions">
      <div className="suggestions-tete">
        <strong>Meilleurs profils pour cette offre</strong>
        <button className="bouton-texte" onClick={() => setOuvert(false)}>
          Masquer
        </button>
      </div>
      {suggestions.length === 0 ? (
        <p className="vide">Tous les apprenants disponibles sont déjà proposés.</p>
      ) : (
        <ol className="suggestions-liste">
          {suggestions.map((s) => (
            <li key={s.apprenant.id}>
              <span className="score" aria-label={`Score ${s.score} sur 100`}>
                {s.score}
              </span>
              <span className="suggestion-corps">
                <button className="lien-ligne" onClick={() => ouvrir(s.apprenant.id)}>
                  {s.apprenant.prenom} {s.apprenant.nom}
                </button>
                <span className="secondaire">{s.raisons.join(" · ")}</span>
              </span>
              <button className="bouton bouton-discret" onClick={() => proposer(s.apprenant.id)}>
                Proposer
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="note-methode">
        Score sur 100 : dossier (40), adéquation entre poste visé et offre (35), disponibilité (25).
      </p>
    </div>
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
  // Les dossiers prêts d'abord : ce sont eux qu'on propose en priorité.
  const choix = apprenants
    .filter((a) => !exclus.includes(a.id))
    .sort((x, y) => completude(y).faites - completude(x).faites);
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
          {a.prenom} {a.nom} ·{" "}
          {pretAProposer(a) ? "dossier prêt" : `dossier ${completude(a).faites}/${completude(a).total}`}
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
