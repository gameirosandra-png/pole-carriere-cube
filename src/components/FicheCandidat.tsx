import { useState } from "react";
import type { Apprenant } from "../types";
import { ficheCandidat, lienFiche, type FicheCandidat } from "../accompagnement/ficheCandidat";

/** La fiche d'une page, telle que l'entreprise la reçoit. */
export function VueFicheCandidat({ fiche: f }: { fiche: FicheCandidat }) {
  return (
    <article className="fiche-candidat" aria-label={`Fiche candidat de ${f.prenom} ${f.initiale}.`}>
      <header className="fc-entete">
        <img src="/logo.svg" alt="" width="34" height="34" />
        <div>
          <p className="fc-sur-titre">Pôle carrière · profil recommandé</p>
          <h2>
            {f.prenom} {f.initiale}.
          </h2>
          <p className="fc-poste">{f.posteVise}</p>
        </div>
      </header>

      <p className="fc-dispo">{f.disponibilite}</p>

      {f.presentation.length > 0 && (
        <section>
          <h3>En quelques mots</h3>
          {f.presentation.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
        </section>
      )}

      {f.projets.length > 0 && (
        <section>
          <h3>Projets réalisés</h3>
          <ul className="fc-projets">
            {f.projets.map((p) => (
              <li key={p.nom}>
                {p.lien ? (
                  <a href={p.lien} target="_blank" rel="noreferrer">
                    {p.nom}
                  </a>
                ) : (
                  p.nom
                )}
                {p.phare && <span className="fc-phare">Projet phare</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {f.preparation.length > 0 && (
        <section>
          <h3>Préparé par le pôle carrière</h3>
          <ul className="fc-preparation">
            {f.preparation.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      <footer className="fc-pied">
        {f.promo} · Formation Product Builder no-code · Démo indépendante, non affiliée à l'École Cube, données
        fictives.
      </footer>
    </article>
  );
}

/** Onglet de la fiche apprenant : aperçu, lien à partager, impression. */
export function OngletFicheCandidat({ apprenant }: { apprenant: Apprenant }) {
  const fiche = ficheCandidat(apprenant);
  const lien = lienFiche(apprenant, window.location.origin);
  const [copie, setCopie] = useState(false);

  return (
    <div className="atelier">
      <p className="secondaire">
        La page envoyée aux entreprises. Elle reprend le pitch, les projets et la préparation, sans notes internes
        ni prétention salariale. Le lien contient la fiche elle-même : rien n'est stocké en ligne.
      </p>
      <div className="actions">
        <button
          className="bouton"
          onClick={() =>
            navigator.clipboard?.writeText(lien).then(
              () => setCopie(true),
              () => setCopie(false),
            )
          }
        >
          {copie ? "Lien copié" : "Copier le lien à partager"}
        </button>
        <a className="bouton bouton-discret" href={lien} target="_blank" rel="noreferrer">
          Ouvrir et imprimer en PDF
        </a>
      </div>
      <VueFicheCandidat fiche={fiche} />
    </div>
  );
}

/** Page publique ouverte depuis un lien de partage : la fiche seule, prête à imprimer. */
export function PageFicheCandidat({ fiche }: { fiche: FicheCandidat | null }) {
  return (
    <main className="page-fiche">
      {fiche ? (
        <>
          <VueFicheCandidat fiche={fiche} />
          <div className="page-fiche-actions">
            <button className="bouton" onClick={() => window.print()}>
              Imprimer ou enregistrer en PDF
            </button>
          </div>
        </>
      ) : (
        <p className="vide">Ce lien de fiche candidat est incomplet. Demandez-en un nouveau au pôle carrière.</p>
      )}
    </main>
  );
}
