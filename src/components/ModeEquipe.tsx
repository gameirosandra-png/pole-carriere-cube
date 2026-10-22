import { useState, type FormEvent } from "react";
import { envoyerLienMagique, type Session } from "../supabase";
import type { EtatSynchro } from "../store";
import { Panneau } from "./Panneau";

const LIBELLE_SYNCHRO: Record<EtatSynchro, string> = {
  local: "Démo locale",
  chargement: "Chargement de la base…",
  vide: "Base partagée vide",
  synchronise: "Enregistré dans la base partagée",
  enregistrement: "Enregistrement…",
  erreur: "Erreur d'enregistrement, nouvel essai à la prochaine modification",
};

/** Bloc du menu : passage en mode équipe (connexion par lien magique) et état de la synchronisation. */
export function ModeEquipe({
  session,
  synchro,
  erreurLien,
  deconnecter,
}: {
  session: Session | null;
  synchro: EtatSynchro;
  erreurLien: string | null;
  deconnecter: () => void;
}) {
  const [ouvert, setOuvert] = useState(Boolean(erreurLien));

  if (session) {
    return (
      <div className="mode-equipe mode-connecte">
        <p className="mode-titre">Mode équipe</p>
        <p className="mode-email" title={session.email}>
          {session.email}
        </p>
        <p className={`synchro synchro-${synchro}`} role="status">
          <span className="synchro-point" aria-hidden="true" />
          {LIBELLE_SYNCHRO[synchro]}
        </p>
        <button className="bouton-texte" onClick={deconnecter}>
          Se déconnecter (retour à la démo)
        </button>
      </div>
    );
  }

  return (
    <>
      <button className="bouton-mode" onClick={() => setOuvert(true)}>
        Passer en mode équipe
      </button>
      {ouvert && <Connexion erreurInitiale={erreurLien} fermer={() => setOuvert(false)} />}
    </>
  );
}

function Connexion({ erreurInitiale, fermer }: { erreurInitiale: string | null; fermer: () => void }) {
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<"saisie" | "envoi" | "envoye">("saisie");
  const [erreur, setErreur] = useState<string | null>(erreurInitiale);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErreur("Saisissez une adresse e-mail valide.");
      return;
    }
    setEtat("envoi");
    setErreur(null);
    const probleme = await envoyerLienMagique(email.trim());
    if (probleme) {
      setErreur(probleme);
      setEtat("saisie");
    } else {
      setEtat("envoye");
    }
  };

  return (
    <Panneau titreId="titre-connexion" fermer={fermer}>
      <header className="fiche-entete">
        <h2 id="titre-connexion">Mode équipe</h2>
        <button className="bouton-fermer" onClick={fermer} aria-label="Fermer">
          ×
        </button>
      </header>
      <p>
        En mode équipe, les données ne sont plus dans votre navigateur : elles sont partagées entre les membres du pôle,
        dans une base Supabase protégée. Chacun voit les mises à jour des autres.
      </p>
      <p className="secondaire">
        Connexion sans mot de passe : vous recevez un lien par e-mail, valable une fois. Démo : toute personne connectée
        voit la même base fictive.
      </p>

      {etat === "envoye" ? (
        <div className="brief" role="status">
          <h4>Lien envoyé à {email.trim()}</h4>
          <p>Ouvrez l'e-mail sur cet appareil et cliquez sur le lien : vous reviendrez ici, connecté.</p>
        </div>
      ) : (
        <form className="formulaire" onSubmit={envoyer} noValidate>
          <label className="champ">
            <span>Votre adresse e-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          {erreur && (
            <p className="texte-alerte" role="alert">
              {erreur}
            </p>
          )}
          <div className="actions">
            <button className="bouton" type="submit" disabled={etat === "envoi"}>
              {etat === "envoi" ? "Envoi…" : "Recevoir mon lien de connexion"}
            </button>
          </div>
        </form>
      )}
    </Panneau>
  );
}
