// Lightweight offline sound-effects manager for the match-3 game.
// Uses expo-audio with locally generated (copyright-free) tone files.
// All calls are wrapped in try/catch so audio never crashes gameplay
// (e.g. on web where playback support is limited).

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

const sources = {
  swap: require("../../assets/sounds/swap.wav"),
  match: require("../../assets/sounds/match.wav"),
  combo: require("../../assets/sounds/combo.wav"),
  win: require("../../assets/sounds/win.wav"),
  over: require("../../assets/sounds/over.wav"),
};

export type SfxName = keyof typeof sources;

let players: Partial<Record<SfxName, AudioPlayer>> = {};
let ready = false;
let muted = false;

export function initSfx() {
  if (ready) return;
  try {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    (Object.keys(sources) as SfxName[]).forEach((name) => {
      const player = createAudioPlayer(sources[name]);
      player.volume = 0.6;
      players[name] = player;
    });
    ready = true;
  } catch {
    ready = false;
  }
}

export function playSfx(name: SfxName) {
  if (muted) return;
  const player = players[name];
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // ignore playback errors (unsupported platform, etc.)
  }
}

export function setSfxMuted(value: boolean) {
  muted = value;
}

export function isSfxMuted() {
  return muted;
}
