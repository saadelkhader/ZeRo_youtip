import type { VideoPriority } from "@/lib/types";

/** Emoji choices for a vault icon. */
export const VAULT_EMOJIS = [
  "📁",
  "📚",
  "🧠",
  "💡",
  "🎯",
  "🔬",
  "💼",
  "🌿",
  "🎵",
  "🕌",
  "⚡",
  "🌍",
] as const;

export interface VaultColor {
  name: string;
  value: string;
}

/** Eight sober pastilles for a vault accent. */
export const VAULT_COLORS: VaultColor[] = [
  { name: "Bleu", value: "#3B72E8" },
  { name: "Vert", value: "#2D9B6F" },
  { name: "Violet", value: "#7C5CD6" },
  { name: "Orange", value: "#E8803B" },
  { name: "Rose", value: "#D65C9A" },
  { name: "Teal", value: "#2FA6A6" },
  { name: "Rouge", value: "#D94B4B" },
  { name: "Gris", value: "#8C8A84" },
];

export interface PriorityOption {
  value: VideoPriority;
  label: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: "now", label: "Maintenant" },
  { value: "this_week", label: "Cette semaine" },
  { value: "later", label: "Plus tard" },
  { value: "archive", label: "Archive" },
];

export const PRIORITY_LABELS: Record<VideoPriority, string> =
  Object.fromEntries(PRIORITY_OPTIONS.map((o) => [o.value, o.label])) as Record<
    VideoPriority,
    string
  >;

/** Sentinel select value for "no vault" (the Inbox). */
export const INBOX_VALUE = "__inbox__";
