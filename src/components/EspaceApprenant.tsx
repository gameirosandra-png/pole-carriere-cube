import { useEffect, useState, type FormEvent } from "react";
import type { Apprenant, Entreprise, Statut } from "../types";
import { STATUTS, changerStatut, estInsere } from "../regles";
import { aujourdhui, formatDate, joursEntre } from "../dates";
import { nouvelId } from "../store";
import { Pastille } from "./Pastille";
import { ChecklistDossier, JaugeDossier } from "./ChecklistDossier";
import { cocherEtape, completude, prochaineEtape } from "../dossier";
import { evaluerCV } from "../accompagnement/cv";
import { scorePortfolio } from "../accompagnement/portfolio";
import { genererPitch } from "../accompagnement/convaincre";
import { calculerPretention, formatMontant } from "../accompagnement/salaire";
import { Progression } from "./Progression";
import { Entrainement } from "./Entrainement";
import { BoiteQuestions, QuestionnaireApprenant } from "./QuestionnaireApprenant";
import { SimulateurFreelance } from "./SimulateurFreelance";
import { SeLancerModule } from "./SeLancerModule";
import { AtelierADN } from "./ateliers/AtelierADN";
import { viseFreelance } from "../accompagnement/seLancer";

interface Props {
  apprenants: Apprenant[];
  entreprises: Entreprise[];
  maj: (id: string, f: (a: Apprenant) => Apprenant) => void;
  /** Apprenant affiché imposé de l'extérieur (démo automatique). */
  idImpose?: string | null;
}

/**
 * Ce que verrait un apprenant via son lien personnel : sa situation,
 * sa prochaine étape, les offres proposées, et un formulaire pour dire où il en est.
 * Chaque mise à jour alimente directement le suivi de l'équipe.
 */
export function EspaceApprenant({ apprenants, entreprises, maj, idImpose }: Props) {
  // Tous les apprenants non insérés : le dossier se prépare dès la formation.
  const candidats = apprenants.filter((a) => !estInsere(a));
  const [idChoisi, setId] = useState(candidats[0]?.id ?? "");
  const id = idImpose ?? idChoisi;
  const a = apprenants.find((x) => x.id === id);

  return (
    <section aria-labelledby="titre-espace">
      <header className="entete-page">
        <h1 id="titre-espace">Espace apprenant</h1>
        <p className="sous-titre">
          Démo de la page que chaque apprenant recevrait par un lien personnel. Ses réponses mettent à jour le suivi de
          l'équipe sans relance manuelle.
        </p>
      </header>

      <label className="champ choix-demo">
        <span>Voir la page de</span>
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {candidats.map((x) => (
            <option key={x.id} value={x.id}>
              {x.prenom} {x.nom}
              {x.statut === "formation" ? " (en formation)" : ""}
            </option>
          ))}
        </select>
      </label>

      {a ? (
        <PageApprenant key={a.id} apprenant={a} entreprises={entreprises} maj={(f) => maj(a.id, f)} />
      ) : (
        <p className="vide">Aucun apprenant en accompagnement pour l'instant.</p>
      )}
    </section>
  );
}

function PageApprenant({
  apprenant: a,
  entreprises,
  maj,
}: {
  apprenant: Apprenant;
  entreprises: Entreprise[];
  maj: (f: (a: Apprenant) => Apprenant) => void;
}) {
  const [statut, setStatut] = useState<Statut>(a.statut);
  const [entreprise, setEntreprise] = useState(a.entreprise ?? "");
  const [message, setMessage] = useState("");
  const [envoye, setEnvoye] = useState(false);

  const offres = entreprises.flatMap((e) =>
    e.offres.filter((o) => o.candidats.includes(a.id)).map((o) => ({ entreprise: e.nom, offre: o })),
  );

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    const today = aujourdhui();
    const insere = statut === "poste" || statut === "freelance";
    maj((x) => {
      const suivant = changerStatut(x, statut, today);
      let texte = `Mise à jour par l'apprenant : ${STATUTS.find((s) => s.id === statut)?.libelle}`;
      if (insere && entreprise.trim()) texte += ` chez ${entreprise.trim()}`;
      if (message.trim()) texte += `. « ${message.trim()} »`;
      return {
        ...suivant,
        dernierContact: today,
        entreprise: insere ? entreprise.trim() || suivant.entreprise : undefined,
        notes: [{ id: nouvelId(), date: today, texte }, ...suivant.notes],
      };
    });
    setMessage("");
    setEnvoye(true);
  };

  const c = completude(a);
  const etape = prochaineEtape(a);
  const offresOuvertes = offres.filter((o) => o.offre.ouverte).length;

  return (
    <div className="espace-page">
      <div className="espace-bonjour">
        <h2>Bonjour {a.prenom}</h2>
        <p>
          Ta situation enregistrée : <Pastille statut={a.statut} />
          {estInsere(a) && a.entreprise && <> chez {a.entreprise}</>}
        </p>
      </div>

      <dl className="tuiles">
        <div className="tuile">
          <dt>Ton parcours</dt>
          <dd className="tuile-chiffre">
            {c.faites}/{c.total}
          </dd>
          <JaugeDossier apprenant={a} avecTexte={false} />
          <small>
            {c.faites === c.total
              ? "Complet : tu peux être proposé aux entreprises"
              : `Encore ${c.total - c.faites} étape${c.total - c.faites > 1 ? "s" : ""} avant d'être proposé`}
          </small>
        </div>
        <div className="tuile">
          <dt>Ta prochaine étape</dt>
          {a.prochaineAction ? (
            <>
              <dd className="tuile-texte">{a.prochaineAction.libelle}</dd>
              <small>Prévue le {formatDate(a.prochaineAction.date)} avec le pôle carrière</small>
            </>
          ) : etape ? (
            <>
              <dd className="tuile-texte">{etape.libelle}</dd>
              <small>{etape.par === "apprenant" ? etape.aide : "Demande un rendez-vous au pôle carrière"}</small>
            </>
          ) : (
            <>
              <dd className="tuile-texte">Ton dossier est prêt</dd>
              <small>Le pôle carrière te propose aux entreprises partenaires</small>
            </>
          )}
        </div>
        <div className="tuile">
          <dt>Offres proposées</dt>
          <dd className="tuile-chiffre">{offres.length}</dd>
          <small>
            {offres.length === 0
              ? "Elles arrivent une fois ton dossier complet"
              : `dont ${offresOuvertes} encore ouverte${offresOuvertes > 1 ? "s" : ""}`}
          </small>
        </div>
      </dl>

      <QuestionnaireApprenant apprenant={a} maj={maj} />

      <div className="espace">
        <div className="espace-carte">
          <h2>Ton parcours en 7 séances</h2>
          <p className="secondaire">
            Coche ce que tu as fait de ton côté. Les séances avec l'équipe sont validées lors de vos rendez-vous.
          </p>
          <ChecklistDossier
            apprenant={a}
            mode="apprenant"
            cocher={(id, faite) => maj((x) => cocherEtape(x, id, faite))}
          />
        </div>

        <div className="espace-colonne">
          {a.statut === "formation" ? (
            <div className="espace-carte">
              <h2>Encore en formation</h2>
              <p>
                Ta formation se termine le <strong>{formatDate(a.finFormation)}</strong>
                {joursEntre(aujourdhui(), a.finFormation) > 0 &&
                  `, dans ${joursEntre(aujourdhui(), a.finFormation)} jours`}
                .
              </p>
              <p className="secondaire">
                C'est le bon moment pour avancer ton dossier : un dossier complet à la sortie, c'est une recherche
                d'emploi qui démarre tout de suite.
              </p>
            </div>
          ) : (
            <form className="espace-carte" onSubmit={envoyer}>
              <h2>Où en es-tu ?</h2>
              <fieldset className="choix-statut">
                <legend className="secondaire">Ta situation aujourd'hui</legend>
                {STATUTS.filter((s) => s.id !== "formation").map((s) => (
                  <label key={s.id} className="case">
                    <input
                      type="radio"
                      name="statut"
                      value={s.id}
                      checked={statut === s.id}
                      onChange={() => {
                        setStatut(s.id);
                        setEnvoye(false);
                      }}
                    />
                    {s.libelle}
                  </label>
                ))}
              </fieldset>

              {(statut === "poste" || statut === "freelance") && (
                <label className="champ">
                  <span>{statut === "freelance" ? "Ton premier client" : "Ton entreprise"}</span>
                  <input value={entreprise} onChange={(e) => setEntreprise(e.target.value)} />
                </label>
              )}

              <label className="champ">
                <span>Un message pour le pôle carrière (facultatif)</span>
                <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
              </label>

              <button className="bouton" type="submit">
                Envoyer ma mise à jour
              </button>
              {envoye && (
                <p className="texte-succes" role="status">
                  Mise à jour envoyée. Elle apparaît dans ta fiche côté équipe.
                </p>
              )}
            </form>
          )}
          <BoiteQuestions apprenant={a} maj={maj} />
          <div className="espace-carte">
            <h2>Offres qu'on t'a proposées</h2>
            {offres.length === 0 ? (
              <p className="vide">Pas encore d'offre. Le pôle carrière t'en proposera selon ton projet.</p>
            ) : (
              <ul className="liste-simple">
                {offres.map(({ entreprise: nomEntreprise, offre }) => (
                  <li key={offre.id}>
                    {offre.titre} chez {nomEntreprise} ({offre.contrat}){!offre.ouverte && " · pourvue"}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <section className="espace-adn" aria-labelledby="titre-adn">
        <h2 id="titre-adn">Ma méthode ADN</h2>
        <p className="secondaire">Ancrer, Diriger, Narrer : la confiance et le récit, en plus des outils.</p>
        <AtelierADN apprenant={a} maj={maj} mode="apprenant" />
      </section>
      <BoiteOutils apprenant={a} />
      <VoletFreelance key={`freelance-${a.id}`} apprenant={a} maj={maj} />
    </div>
  );
}

/** Et en freelance ? Ouvert d'office si l'apprenant vise le freelance. */
function VoletFreelance({
  apprenant: a,
  maj,
}: {
  apprenant: Apprenant;
  maj: (f: (a: Apprenant) => Apprenant) => void;
}) {
  const vise = viseFreelance(a);
  const [ouvert, setOuvert] = useState(vise);
  const [vue, setVue] = useState<"tjm" | "lancer">("tjm");
  // Il vient de cocher « freelance » dans son questionnaire : le volet s'ouvre de lui-même.
  useEffect(() => {
    if (vise) setOuvert(true);
  }, [vise]);
  return (
    <section className="volet-freelance" aria-labelledby="titre-freelance">
      <div className="boite-tete">
        <div>
          <h2 id="titre-freelance">{vise ? "Ton projet freelance" : "Et en freelance ?"}</h2>
          <p className="secondaire">
            Combien facturer, combien de jours, combien de missions pour vivre de ton activité : fais tes essais.
          </p>
        </div>
        <div className="actions">
          {!ouvert && (
            <button className="bouton bouton-cta" onClick={() => setOuvert(true)}>
              Ouvrir le simulateur
            </button>
          )}
          <a className="bouton bouton-discret" href="/#simulateur-freelance" target="_blank" rel="noreferrer">
            Plein écran
          </a>
        </div>
      </div>
      {ouvert && (
        <>
          <div className="onglets" role="tablist" aria-label="Projet freelance">
            <button role="tab" aria-selected={vue === "tjm"} className={vue === "tjm" ? "onglet actif" : "onglet"} onClick={() => setVue("tjm")}>
              Simuler mon TJM
            </button>
            <button
              role="tab"
              aria-selected={vue === "lancer"}
              className={vue === "lancer" ? "onglet actif" : "onglet"}
              onClick={() => setVue("lancer")}
            >
              Se lancer
            </button>
          </div>
          {vue === "tjm" ? <SimulateurFreelance posteVise={a.posteVise} /> : <SeLancerModule apprenant={a} maj={maj} />}
        </>
      )}
    </section>
  );
}

/** Ce que l'apprenant retrouve de ses ateliers : il avance seul entre deux séances. */
function BoiteOutils({ apprenant: a }: { apprenant: Apprenant }) {
  const [entrainement, setEntrainement] = useState(false);
  const cv = evaluerCV(a.accompagnement?.cv);
  const portfolio = scorePortfolio(a.accompagnement?.portfolio ?? []);
  const pitch = genererPitch(a);
  const salaire = a.accompagnement?.salaire;
  const pretention = salaire ? calculerPretention(a, salaire) : null;

  return (
    <section className="boite-outils" aria-labelledby="titre-boite">
      <div className="boite-tete">
        <div>
          <h2 id="titre-boite">Ta boîte à outils</h2>
          <p className="secondaire">Ce qu'on a travaillé ensemble, pour avancer entre deux séances.</p>
        </div>
        <button className="bouton bouton-cta" onClick={() => setEntrainement(true)}>
          S'entraîner à l'oral
        </button>
      </div>
      {entrainement && <Entrainement apprenant={a} fermer={() => setEntrainement(false)} />}

      <div className="boite-grille">
        <div className="espace-carte">
          <h3>Ton CV</h3>
          {cv.score === null ? (
            <p className="vide">Ton CV sera évalué à la séance 2, avec l'équipe.</p>
          ) : (
            <>
              <p className="boite-score">
                {cv.score}
                <small>/100</small>
              </p>
              {cv.priorites.length ? (
                <ol className="plan-action">
                  {cv.priorites.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <strong>{c.libelle}</strong> : {c.conseil}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="texte-succes">Tous les critères sont solides. Bravo.</p>
              )}
            </>
          )}
        </div>

        <div className="espace-carte">
          <h3>Ta progression</h3>
          <Progression apprenant={a} compact />
        </div>

        <div className="espace-carte">
          <h3>Ton portfolio</h3>
          {portfolio.projets.length === 0 ? (
            <p className="vide">Ajoute tes projets avec l'équipe à la séance 3.</p>
          ) : (
            <>
              <p>
                <strong>{portfolio.projetsSolides}</strong> projet{portfolio.projetsSolides > 1 ? "s" : ""} solide
                {portfolio.projetsSolides > 1 ? "s" : ""} sur {portfolio.projets.length}
                {portfolio.phare && (
                  <>
                    {" "}
                    · à mettre en avant : <strong>{portfolio.phare.nom}</strong>
                  </>
                )}
              </p>
              {portfolio.aTravailler && (
                <p className="secondaire">
                  À compléter sur tes projets :{" "}
                  {portfolio.aTravailler.libelle.toLowerCase()}. {portfolio.aTravailler.question}
                </p>
              )}
            </>
          )}
        </div>

        <div className="espace-carte">
          <h3>Ta prétention salariale</h3>
          {pretention ? (
            <>
              <p className="boite-score">{formatMontant(pretention.annonce, pretention.unite)}</p>
              <p className="secondaire">
                Marché pour ton profil : {formatMontant(pretention.basMarche, pretention.unite)} à{" "}
                {formatMontant(pretention.hautMarche, pretention.unite)}. Ne descends pas sous{" "}
                {formatMontant(pretention.plancher, pretention.unite)} sans contrepartie.
              </p>
            </>
          ) : (
            <p className="vide">On la calcule ensemble à la séance 7, avec les chiffres du marché.</p>
          )}
        </div>
      </div>

      <div className="espace-carte">
        <h3>Ton pitch de 2 minutes</h3>
        <ol className="pitch">
          {pitch.map((p) => (
            <li key={p.titre}>
              <span className="pitch-titre">
                {p.titre} <span className="secondaire">· {p.duree}</span>
              </span>
              <p>
                {p.texte
                  .split(/(\[[^\]]+\])/)
                  .map((m, i) => (m.startsWith("[") ? <mark key={i}>{m}</mark> : <span key={i}>{m}</span>))}
              </p>
            </li>
          ))}
        </ol>
        <p className="secondaire">Les passages surlignés sont à compléter : prépare-les pour la prochaine séance.</p>
      </div>
    </section>
  );
}
