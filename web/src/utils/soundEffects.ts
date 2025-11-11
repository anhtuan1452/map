// Sound Effects using Web Audio API

class SoundEffects {
  private audioContext: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  // Play correct answer sound (cheerful beep)
  playCorrect() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Create oscillators for a pleasant "ding" sound
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (major chord)
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      // Quick fade in and out
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3 + (i * 0.05));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + (i * 0.05));
      osc.stop(now + 0.35 + (i * 0.05));
    });
  }

  // Play incorrect answer sound (gentle buzz)
  playIncorrect() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Create a gentle "buzz" sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Play celebration sound (for completion)
  playCelebration() {
    const ctx = this.getAudioContext();
    const now = ctx.currentTime;

    // Create a celebratory ascending arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'triangle';

      const startTime = now + (i * 0.08);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }
}

export const soundEffects = new SoundEffects();
