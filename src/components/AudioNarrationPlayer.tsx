import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Sparkles, RefreshCw } from 'lucide-react';

interface AudioNarrationPlayerProps {
  textToRead: string;
  autoPlay?: boolean;
  voiceRate?: number;
  voicePitch?: number;
  ambientSoundEnabled?: boolean;
}

export const AudioNarrationPlayer: React.FC<AudioNarrationPlayerProps> = ({
  textToRead,
  autoPlay = false,
  voiceRate = 0.95,
  voicePitch = 1.0,
  ambientSoundEnabled = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [ambientActive, setAmbientActive] = useState(ambientSoundEnabled);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Initialize Web Audio API for 432Hz Theta Drone
  const startAmbientDrone = () => {
    if (!ambientActive) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      // 432Hz tuning tone with gentle harmonic low-pass
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, audioCtxRef.current.currentTime); // 432Hz Miracle / Calming tone

      // Soft envelope
      gain.gain.setValueAtTime(0.001, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.03, audioCtxRef.current.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
    } catch (e) {
      console.warn('Ambient drone audio context note:', e);
    }
  };

  const stopAmbientDrone = () => {
    try {
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.8);
      }
      setTimeout(() => {
        try {
          oscRef.current?.stop();
          oscRef.current?.disconnect();
          gainRef.current?.disconnect();
          oscRef.current = null;
          gainRef.current = null;
        } catch (e) {}
      }, 900);
    } catch (e) {}
  };

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    return () => {
      window.speechSynthesis.cancel();
      stopAmbientDrone();
    };
  }, []);

  const handlePlayToggle = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      stopAmbientDrone();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();

      // Clean text of markdown asterisks/links for natural narration
      const cleanNarration = textToRead
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/#{1,6}\s+/g, '')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanNarration);
      utterance.rate = voiceRate;
      utterance.pitch = voicePitch;

      // Select gentle natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Google UK'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
        startAmbientDrone();
      };

      utterance.onend = () => {
        setIsPlaying(false);
        stopAmbientDrone();
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        stopAmbientDrone();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported || !textToRead) return null;

  return (
    <div className="flex items-center gap-2 bg-stone-100/80 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 rounded-xl px-2.5 py-1 text-xs">
      <button
        id="audio-narration-play-button"
        type="button"
        onClick={handlePlayToggle}
        className={`flex items-center gap-1.5 font-medium transition-colors ${
          isPlaying
            ? 'text-amber-600 dark:text-amber-400 font-semibold'
            : 'text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400'
        }`}
        title={isPlaying ? 'Pause spoken reflection' : 'Listen with Sanctuary voice'}
      >
        {isPlaying ? (
          <>
            <Pause className="w-3.5 h-3.5" />
            <span>Pause Audio</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Listen (Voice)</span>
          </>
        )}
      </button>

      {isPlaying && (
        <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 pl-1 border-l border-stone-200 dark:border-stone-700">
          <Sparkles className="w-3 h-3 animate-spin" />
          <span>432Hz</span>
        </span>
      )}
    </div>
  );
};
