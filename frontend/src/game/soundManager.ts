class SoundManager {
  private bgm: HTMLAudioElement | null = null;
  private isMuted: boolean = false;

  constructor() {
    this.initBGM();
  }

  private initBGM() {
    try {
      this.bgm = new Audio('/assets/sounds/bgm_map.mp3');
      this.bgm.loop = true;
      this.bgm.volume = 0.4;
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  }

  public playBGM() {
    if (this.bgm && !this.isMuted) {
      this.bgm.play().catch(() => {
        // Browser autoplay policy handling
      });
    }
  }

  public stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  public playPop() {
    this.playEffect('/assets/sounds/match_pop.mp3', 0.8);
  }

  public playBlast() {
    this.playEffect('/assets/sounds/blast.mp3', 0.9);
  }

  public playWin() {
    this.playEffect('/assets/sounds/win.mp3', 1.0);
  }

  private playEffect(src: string, volume: number = 0.8) {
    if (this.isMuted) return;
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Sound effect error:', e);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.playBGM();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
