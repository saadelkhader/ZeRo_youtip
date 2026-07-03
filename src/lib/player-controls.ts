// ─────────────────────────────────────────────────────────────
// Shared imperative handle to the single YouTube player instance.
// useYouTubePlayer registers the real implementation; any component
// (PlayerView, MiniPlayer, ScreenFreeMode) can call these without props.
// ─────────────────────────────────────────────────────────────

import type { PlaybackRate } from "@/lib/stores/playerStore";

export interface PlayerControls {
  seekTo: (seconds: number) => void;
  seekBy: (delta: number) => void;
  setRate: (rate: PlaybackRate) => void;
}

const noop: PlayerControls = {
  seekTo: () => {},
  seekBy: () => {},
  setRate: () => {},
};

let controls: PlayerControls = noop;

export function setPlayerControls(next: PlayerControls) {
  controls = next;
}

export function clearPlayerControls() {
  controls = noop;
}

export const playerControls: PlayerControls = {
  seekTo: (s) => controls.seekTo(s),
  seekBy: (d) => controls.seekBy(d),
  setRate: (r) => controls.setRate(r),
};
