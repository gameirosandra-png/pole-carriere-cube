import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Panneau latéral modal, accessible au clavier :
 * - le focus entre dans le panneau à l'ouverture et y reste (Tab / Maj+Tab) ;
 * - Échap ferme ;
 * - à la fermeture, le focus revient sur l'élément qui l'avait ouvert.
 */
export function Panneau({ titreId, fermer, children }: { titreId: string; fermer: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const declencheur = document.activeElement as HTMLElement | null;
    ref.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        fermer();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const elements = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLES)];
      if (elements.length === 0) return;
      const premier = elements[0];
      const dernier = elements[elements.length - 1];
      if (e.shiftKey && (document.activeElement === premier || document.activeElement === ref.current)) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      declencheur?.focus?.();
    };
  }, [fermer]);

  return (
    <div className="voile" onClick={fermer}>
      <div
        className="fiche"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
