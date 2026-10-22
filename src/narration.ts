// Narration de la démo automatique.
// 1. Si des fichiers audio générés par une IA vocale sont déposés dans public/voix/ (avec demo.json),
//    on les lit : c'est la meilleure qualité.
// 2. Sinon, synthèse vocale du navigateur (Web Speech API), en choisissant la meilleure voix française
//    disponible : les voix neuronales (« Natural », « Online ») de Edge, Google sur Chrome, etc.
// 3. Sans voix disponible, la démo continue en silence, au rythme d'un minuteur.

/**
 * À appeler dans le clic qui lance la démo : certains navigateurs (Safari iOS) n'autorisent
 * la synthèse vocale que si elle démarre pendant un geste de l'utilisateur.
 */
export function amorcerVoix() {
  try {
    const synthese = window.speechSynthesis;
    if (!synthese || typeof SpeechSynthesisUtterance === "undefined") return;
    const vide = new SpeechSynthesisUtterance(" ");
    vide.volume = 0;
    synthese.speak(vide);
  } catch {
    /* pas de synthèse vocale : la démo restera muette */
  }
}

export type FinNarration = "fini" | "indisponible" | "annule";

/** Classe une voix française : les voix neuronales d'abord. Pure, testée. */
export function scoreVoix(v: { name: string; lang: string; localService?: boolean }): number {
  if (!v.lang.toLowerCase().startsWith("fr")) return -1;
  let score = 0;
  if (/natural|neural|online/i.test(v.name)) score += 4;
  if (/google/i.test(v.name)) score += 2;
  if (/amélie|amelie|audrey|thomas|marie|denise|henri|eloise|vivienne|remy/i.test(v.name)) score += 1;
  if (v.lang.toLowerCase() === "fr-fr" || v.lang.toLowerCase() === "fr_fr") score += 1;
  return score;
}

/** Durée estimée d'un texte lu à voix haute (environ 2,6 mots par seconde). */
export const dureeEstimeeMs = (texte: string) => Math.max(5000, Math.round((texte.split(/\s+/).length / 2.6) * 1000));

interface Fichiers {
  fichiers: string[];
}

let fichiersIA: Promise<string[] | null> | null = null;

/** Liste des fichiers audio IA déposés, ou null s'il n'y en a pas (lue une seule fois). */
function chargerFichiersIA(): Promise<string[] | null> {
  fichiersIA ??= fetch("/voix/demo.json")
    .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? (r.json() as Promise<Fichiers>) : null))
    .then((d) => (d && Array.isArray(d.fichiers) && d.fichiers.length ? d.fichiers : null))
    .catch(() => null);
  return fichiersIA;
}

function meilleureVoix(): SpeechSynthesisVoice | null {
  const voix = window.speechSynthesis?.getVoices() ?? [];
  return voix.filter((v) => scoreVoix(v) >= 0).sort((a, b) => scoreVoix(b) - scoreVoix(a))[0] ?? null;
}

/** Attend que le navigateur ait chargé ses voix (chargement asynchrone sur Chrome). */
function voixPretes(): Promise<void> {
  const synthese = window.speechSynthesis;
  if (!synthese || synthese.getVoices().length) return Promise.resolve();
  return new Promise((ok) => {
    const fini = () => ok();
    synthese.addEventListener("voiceschanged", fini, { once: true });
    setTimeout(fini, 1200);
  });
}

/** Vitesses proposées pour la démo. */
export const VITESSES = [0.75, 1, 1.25, 1.5] as const;
export type Vitesse = (typeof VITESSES)[number];

/** Vitesse suivante, en boucle (1 → 1,25 → 1,5 → 0,75 → 1). Pure, testée. */
export const vitesseSuivante = (v: number): Vitesse => VITESSES[(VITESSES.indexOf(v as Vitesse) + 1) % VITESSES.length];

/** « 1,25× » */
export const libelleVitesse = (v: number) => `${String(v).replace(".", ",")}×`;

export class Narrateur {
  private audio: HTMLAudioElement | null = null;
  // Garder une référence à l'énoncé : sinon Chrome peut le libérer et ne jamais signaler la fin.
  private enonce: SpeechSynthesisUtterance | null = null;
  private terminer: ((f: FinNarration) => void) | null = null;
  nomVoix = "";

  /** Lit le texte de l'étape `index` ; la promesse se résout quand la lecture est finie. */
  async dire(texte: string, index: number, vitesse = 1): Promise<FinNarration> {
    this.arreter();
    const fichiers = await chargerFichiersIA();
    const fichier = fichiers?.[index];
    if (fichier) return this.lireFichier(`/voix/${fichier}`, vitesse);
    return this.lireSynthese(texte, vitesse);
  }

  private attendre(): Promise<FinNarration> {
    return new Promise((ok) => (this.terminer = ok));
  }

  private finir(f: FinNarration) {
    const t = this.terminer;
    this.terminer = null;
    t?.(f);
  }

  private lireFichier(src: string, vitesse: number): Promise<FinNarration> {
    const audio = new Audio(src);
    audio.playbackRate = vitesse;
    this.audio = audio;
    this.nomVoix = "une voix générée par IA";
    const fin = this.attendre();
    audio.onended = () => this.finir("fini");
    audio.onerror = () => this.finir("indisponible");
    audio.play().catch(() => this.finir("indisponible"));
    return fin;
  }

  private async lireSynthese(texte: string, vitesse: number): Promise<FinNarration> {
    const synthese = window.speechSynthesis;
    if (!synthese || typeof SpeechSynthesisUtterance === "undefined") return "indisponible";
    await voixPretes();
    const voix = meilleureVoix();
    if (!voix) return "indisponible";
    const enonce = new SpeechSynthesisUtterance(texte);
    enonce.voice = voix;
    enonce.lang = voix.lang;
    enonce.rate = 1.02 * vitesse;
    this.enonce = enonce;
    this.nomVoix = voix.name;
    const fin = this.attendre();
    enonce.onend = () => this.finir("fini");
    enonce.onerror = (e) => this.finir(e.error === "interrupted" || e.error === "canceled" ? "annule" : "indisponible");
    synthese.speak(enonce);
    return fin;
  }

  pause() {
    this.audio?.pause();
    if (this.enonce) window.speechSynthesis?.pause();
  }

  reprendre() {
    this.audio?.play().catch(() => undefined);
    if (this.enonce) window.speechSynthesis?.resume();
  }

  arreter() {
    if (this.audio) {
      this.audio.onended = null;
      this.audio.pause();
      this.audio = null;
    }
    if (this.enonce) {
      this.enonce.onend = null;
      this.enonce = null;
      window.speechSynthesis?.cancel();
    }
    this.finir("annule");
  }
}
