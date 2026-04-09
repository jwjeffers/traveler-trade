class AudioService {
  private ctx: AudioContext | null = null;
  private initialized = false;

  init() {
    if (!this.initialized) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playKeystroke(vol = 0.05) {
    const freqs = [800, 900, 1000, 1100, 1200];
    const freq = freqs[Math.floor(Math.random() * freqs.length)];
    this.playTone(freq, 'square', 0.05, vol);
  }

  playClick(vol = 0.1) {
    this.playTone(600, 'sine', 0.1, vol);
  }

  playConfirm(vol = 0.2) {
    // Two tones rapidly ascending
    this.playTone(400, 'sine', 0.1, vol);
    setTimeout(() => {
      this.playTone(600, 'sine', 0.15, vol);
    }, 100);
  }

  playError(vol = 0.2) {
    // Discordant buzz
    this.playTone(150, 'sawtooth', 0.4, vol);
    this.playTone(155, 'sawtooth', 0.4, vol);
  }

  playBoot(vol = 0.2) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(50, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 1.5);
    
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2.0);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 2.0);
  }
}

export const audioService = new AudioService();
