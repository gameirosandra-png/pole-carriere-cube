import { useState } from "react";
import type { Apprenant } from "../types";
import { envoyerRecap } from "../api";

/** Envoie le récap de la semaine par e-mail à l'équipe du pôle, via un scénario Make. */
export function BoutonRecap({ apprenants }: { apprenants: Apprenant[] }) {
  const [etat, setEtat] = useState<"repos" | "envoi" | "envoye" | "erreur">("repos");
  const [message, setMessage] = useState("");

  const envoyer = async () => {
    setEtat("envoi");
    const r = await envoyerRecap(apprenants);
    if (r.ok) {
      setEtat("envoye");
      setMessage("Récap envoyé à l'équipe du pôle par e-mail, via Make.");
    } else {
      setEtat("erreur");
      setMessage(r.erreur);
    }
  };

  return (
    <>
      <button className="bouton bouton-discret" onClick={envoyer} disabled={etat === "envoi"}>
        {etat === "envoi" ? "Envoi…" : "Envoyer le récap par e-mail"}
      </button>
      {message && (
        <p className={etat === "erreur" ? "recap-message recap-erreur" : "recap-message"} role="status">
          {message}
        </p>
      )}
    </>
  );
}
