class SoundEngine {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackNode: GainNode | null = null;
  private isRunning: boolean = false;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playTone(frequency: number, echo: boolean = false, dampening: boolean = false) {
    try {
      this.init();
      if (!this.ctx) return;

      this.stop();

      this.osc = this.ctx.createOscillator();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.osc.type = 'sine';
      this.osc.frequency.setValueAtTime(Math.min(2000, Math.max(100, frequency)), this.ctx.currentTime);

      if (echo && !dampening) {
        // Create echo with delay and feedback
        this.delayNode = this.ctx.createDelay();
        this.delayNode.delayTime.value = 0.25;

        this.feedbackNode = this.ctx.createGain();
        this.feedbackNode.gain.value = 0.45;

        this.osc.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);
        this.gainNode.connect(this.delayNode);
        this.delayNode.connect(this.feedbackNode);
        this.feedbackNode.connect(this.delayNode);
        this.delayNode.connect(this.ctx.destination);
      } else {
        this.osc.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);
      }

      this.osc.start();
      this.isRunning = true;
    } catch {
      // Audio autoplay policy handled silently
    }
  }

  public playPulse(frequency: number, echoCount: number = 3, dampened: boolean = false) {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const count = dampened ? 1 : echoCount;

      for (let i = 0; i < count; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = i * 0.28;
        const volume = Math.max(0.01, 0.15 * Math.pow(dampened ? 0.2 : 0.6, i));

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, now + delay);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(volume, now + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.25);
      }
    } catch {
      // Audio autoplay policy handled silently
    }
  }

  public setFrequency(freq: number) {
    if (this.osc && this.ctx) {
      this.osc.frequency.setValueAtTime(Math.min(2000, Math.max(100, freq)), this.ctx.currentTime);
    }
  }

  public stop() {
    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch {
        // already stopped
      }
      this.osc = null;
    }
    this.isRunning = false;
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }
}

export const soundEngine = new SoundEngine();
