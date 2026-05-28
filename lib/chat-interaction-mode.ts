export type InteractionMode = "text" | "voice";

export const INTERACTION_MODE_STORAGE_KEY = "stockmind-chat-interaction-mode";

export const INTERACTION_MODE_LABELS: Record<InteractionMode, string> = {
  text: "Text chat",
  voice: "Voice chat",
};

export function isInteractionMode(value: string): value is InteractionMode {
  return value === "text" || value === "voice";
}

export function readStoredInteractionMode(): InteractionMode {
  if (typeof window === "undefined") return "text";
  try {
    const stored = sessionStorage.getItem(INTERACTION_MODE_STORAGE_KEY);
    if (stored && isInteractionMode(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "text";
}
