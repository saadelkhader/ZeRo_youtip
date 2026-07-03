import { toast as sonner } from "sonner";

/**
 * Sober toast helpers. Success = green check, info = orange dot. No aggressive
 * error toasts; network errors are framed as info with an optional retry.
 */
export const toast = {
  success(message: string) {
    sonner.success(message);
  },
  info(message: string) {
    sonner(message);
  },
  /** Network/server hiccup — calm wording, optional retry action. */
  networkError(retry?: () => void) {
    sonner("Connexion interrompue.", {
      description: "Vérifie ta connexion et réessaie.",
      ...(retry ? { action: { label: "Réessayer", onClick: retry } } : {}),
    });
  },
  // Common app events, centralised so wording stays consistent.
  videoQueued() {
    sonner.success("Vidéo ajoutée à la queue");
  },
  noteSaved() {
    sonner.success("Note sauvegardée");
  },
  actionCreated() {
    sonner.success("Action créée");
  },
  actionDone() {
    sonner.success("Action terminée");
  },
  limitReached() {
    sonner("Limite d'écoute atteinte pour aujourd'hui.");
  },
};
