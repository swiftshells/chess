/**
 * Procedural Web Audio API sound synthesizer for Nordic Wood 3D Chess.
 * Eliminates external MP3/WAV dependencies and guarantees zero 404 network errors.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Read mute preference from localStorage
    try {
      const saved = localStorage.getItem('nordic_chess_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      this.isMuted = false;
    }
  }

  private initContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('nordic_chess_muted', String(this.isMuted));
    } catch {
      // ignore
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Warm wooden piece placement tap.
   */
  public playMove(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Low-pass filter for acoustic wood warmth
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.07);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);

    // Subtle high click
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.type = 'sine';
    click.frequency.setValueAtTime(850, t);
    click.frequency.exponentialRampToValueAtTime(200, t + 0.02);
    clickGain.gain.setValueAtTime(0.15, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.start(t);
    click.stop(t + 0.03);
  }

  /**
   * Deeper resonating wooden capture clack.
   */
  public playCapture(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;

    // First impact
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(240, t);
    osc1.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    gain1.gain.setValueAtTime(0.65, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.13);

    // Secondary ricochet click
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(620, t + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(140, t + 0.09);
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.setValueAtTime(0.3, t + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.02);
    osc2.stop(t + 0.11);
  }

  /**
   * Alert check chime (two harmonious wooden tones).
   */
  public playCheck(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const notes = [440, 659.25]; // A4 -> E5

    notes.forEach((freq, idx) => {
      const start = t + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /**
   * Victory fanfare (warm acoustic arpeggio).
   */
  public playVictory(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const chord = [329.63, 440, 554.37, 659.25, 880]; // E Major / A Major arpeggio

    chord.forEach((freq, idx) => {
      const start = t + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.75);
    });
  }

  /**
   * Defeat cadence.
   */
  public playDefeat(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const notes = [392, 369.99, 329.63, 261.63];

    notes.forEach((freq, idx) => {
      const start = t + idx * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  }

  /**
   * Low time clock tick.
   */
  public playClockTick(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.02);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  }
}

export const sounds = new SoundManager();
