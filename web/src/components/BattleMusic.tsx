import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface BattleMusicProps {
  isPlaying: boolean;
}

export const BattleMusic: React.FC<BattleMusicProps> = ({ isPlaying }) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (isPlaying && !isMuted) {
      startMusic();
    } else {
      stopMusic();
    }

    return () => {
      stopMusic();
    };
  }, [isPlaying, isMuted]);

  const startMusic = () => {
    if (oscillatorsRef.current.length > 0) return; // Already playing

    // Create audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.06; // Lower volume (6% instead of 15%)
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    // Exciting battle music pattern (Epic tension)
    const notes = [
      // Main bass line (dramatic)
      { freq: 110, type: 'triangle' as OscillatorType, gain: 0.3, detune: 0 },
      // Tension chord
      { freq: 165, type: 'sawtooth' as OscillatorType, gain: 0.15, detune: 5 },
      { freq: 220, type: 'sawtooth' as OscillatorType, gain: 0.15, detune: -5 },
      // High tension notes
      { freq: 330, type: 'sine' as OscillatorType, gain: 0.1, detune: 10 },
      // Pulsing rhythm
      { freq: 55, type: 'square' as OscillatorType, gain: 0.2, detune: 0 },
    ];

    const oscillators: OscillatorNode[] = [];

    notes.forEach((note) => {
      const oscillator = audioContext.createOscillator();
      const noteGain = audioContext.createGain();

      oscillator.type = note.type;
      oscillator.frequency.value = note.freq;
      oscillator.detune.value = note.detune;

      noteGain.gain.value = note.gain;

      oscillator.connect(noteGain);
      noteGain.connect(gainNode);

      // Add tremolo effect for tension
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      lfo.frequency.value = 6; // 6 Hz tremolo
      lfoGain.gain.value = 0.3;

      lfo.connect(lfoGain);
      lfoGain.connect(noteGain.gain);

      oscillator.start();
      lfo.start();

      oscillators.push(oscillator);
    });

    oscillatorsRef.current = oscillators;

    // Add rhythm pattern (pulsing effect)
    const rhythmInterval = setInterval(() => {
      if (gainNodeRef.current) {
        const currentGain = gainNodeRef.current.gain.value;
        gainNodeRef.current.gain.setValueAtTime(currentGain, audioContext.currentTime);
        gainNodeRef.current.gain.exponentialRampToValueAtTime(
          currentGain * 1.3,
          audioContext.currentTime + 0.1
        );
        gainNodeRef.current.gain.exponentialRampToValueAtTime(
          currentGain,
          audioContext.currentTime + 0.2
        );
      }
    }, 800); // Pulse every 800ms

    // Store interval for cleanup
    (gainNodeRef.current as any).rhythmInterval = rhythmInterval;
  };

  const stopMusic = () => {
    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    oscillatorsRef.current = [];

    if (gainNodeRef.current) {
      const rhythmInterval = (gainNodeRef.current as any).rhythmInterval;
      if (rhythmInterval) {
        clearInterval(rhythmInterval);
      }
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!isPlaying) return null;

  return (
    <button
      onClick={toggleMute}
      className="fixed bottom-6 right-6 z-[2200] bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full transition shadow-lg border border-white/20"
      title={isMuted ? 'Bật nhạc' : 'Tắt nhạc'}
    >
      {isMuted ? (
        <VolumeX className="w-6 h-6" />
      ) : (
        <Volume2 className="w-6 h-6 animate-pulse" />
      )}
    </button>
  );
};
