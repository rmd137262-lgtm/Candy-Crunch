import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

type SoundName = 'music' | 'swap' | 'match' | 'combo' | 'win' | 'over';

const soundSources: Record<SoundName, number> = {
  music: require('../../assets/sounds/bgm_map.mp3'),
  swap: require('../../assets/sounds/swap.wav'),
  match: require('../../assets/sounds/match_pop.mp3'),
  combo: require('../../assets/sounds/combo.wav'),
  win: require('../../assets/sounds/win.wav'),
  over: require('../../assets/sounds/over.wav'),
};

class GameSoundManager {
  private players: Partial<Record<SoundName, AudioPlayer>> = {};
  private muted = false;
  private musicRequested = false;

  private ensurePlayer(name: SoundName): AudioPlayer | null {
    if (this.players[name]) return this.players[name]!;

    try {
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      const player = createAudioPlayer(soundSources[name]);
      player.volume = name === 'music' ? 0.34 : 0.72;
      player.loop = name === 'music';
      player.muted = this.muted;
      this.players[name] = player;
      return player;
    } catch {
      return null;
    }
  }

  private play(name: SoundName) {
    if (this.muted) return;
    const player = this.ensurePlayer(name);
    if (!player) return;

    try {
      if (name === 'music' && player.playing) return;
      player.seekTo(0).then(() => player.play()).catch(() => {});
    } catch {
      // Some browsers block audio until the player taps a control.
    }
  }

  getMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    Object.values(this.players).forEach((player) => {
      if (player) player.muted = muted;
    });
    if (!muted && this.musicRequested) this.play('music');
  }

  playSwap() {
    this.play('swap');
  }

  playPop() {
    this.play('match');
  }

  playBlast() {
    this.play('combo');
  }

  playWin() {
    this.play('win');
  }

  playOver() {
    this.play('over');
  }

  playBGM() {
    this.musicRequested = true;
    this.play('music');
  }

  stopBGM() {
    this.musicRequested = false;
    const player = this.players.music;
    if (!player) return;
    player.pause();
    player.seekTo(0).catch(() => {});
  }
}

export const soundManager = new GameSoundManager();