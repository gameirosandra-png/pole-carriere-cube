import { useState } from "react";
import type { Apprenant, AtelierCollectif } from "../types";
import { relancesAuto } from "../accompagnement/relances";
import { envoyerRelances } from "../api";

/** Messages préparés automatiquement : rappels d'atelier et apprenants à relancer. Envoi en un clic via Make. */
export function RelancesAuto({
  apprenants,
  ateliers,
  ouvrir,
}: {
  apprenants: Apprenant[];
  ateliers: AtelierCollectif[];
  ouvrir: (id: string) => void;
}) {
  const relances = relancesAuto(apprenants, ateliers);
  const [toutVoir, setToutVoir] = useState(false);
  const [etat, setEtat] = useState<"repos" | "envoi" | "envoye" | "erreur">("repos");
  const [message, setMessage] = useState("");

  const rappels = relances.filter((r) => r.type === "atelier").length;
  const visibles = toutVoir ? relances : relances.slice(0, 3);

  const envoyer = async () => {
    setEtat("envoi");
    const r = await envoyerRelances(relances);
    if (r.ok) {
      setEtat("envoye");
      setMessage(`${r.valeur.envoye} relances envoyées via Make. En démo, elles arrivent dans la boîte du pôle.`);
    } else {
      setEtat("erreur");
      setMessage(r.erreur);
    }
  };

  return (
    <section className="relances-auto" aria-labelledby="titre-relances-auto">
      <div className="relances-auto-tete">
        <div>
          <h2 className="titre-section" id="titre-relances-auto">
            Relances automatiques
          </h2>
          <p className="secondaire">
            {relances.length === 0
              ? "Rien à envoyer : aucun atelier dans les 2 jours, aucun apprenant sans nouvelles."
              : `${relances.length} messages prêts : ${rappels} rappel${rappels > 1 ? "s" : ""} d'atelier, ${relances.length - rappels} apprenant${relances.length - rappels > 1 ? "s" : ""} sans contact depuis plus de 14 jours.`}
          </p>
        </div>
        {relances.length > 0 && (
          <button className="bouton bouton-cta" onClick={envoyer} disabled={etat === "envoi" || etat === "envoye"}>
            {etat === "envoi" ? "Envoi…" : etat === "envoye" ? "Relances envoyées" : `Envoyer les ${relances.length} relances`}
          </button>
        )}
      </div>
      {message && (
        <p className={etat === "erreur" ? "texte-alerte" : "texte-succes"} role="status">
          {message}
        </p>
      )}
      {relances.length > 0 && (
        <ul className="relances-auto-liste">
          {visibles.map((r) => (
            <li key={`${r.type}-${r.apprenantId}-${r.objet}`} className={`relance-auto relance-${r.type}`}>
              <span className="relance-auto-type">{r.type === "atelier" ? "Rappel atelier" : "Sans contact"}</span>
              <button className="lien-ligne" onClick={() => ouvrir(r.apprenantId)}>
                {r.destinataire}
              </button>
              <strong className="relance-auto-objet">{r.objet}</strong>
              <span className="relance-auto-message">{r.message}</span>
            </li>
          ))}
        </ul>
      )}
      {relances.length > 3 && (
        <button className="bouton-texte" onClick={() => setToutVoir(!toutVoir)}>
          {toutVoir ? "Réduire" : `Voir les ${relances.length} messages`}
        </button>
      )}
    </section>
  );
}
