import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Sparkles, RefreshCw } from 'lucide-react';
import { resolveSpeechVoice, formatTextForNaturalSpeech } from '../utils/voiceUtils';

interface AudioNarrationPlayerProps {
  textToRead: string;
  autoPlay?: boolean;
  voiceRate?: number;
  voicePitch?: number;
  selectedVoiceId?: string;
  selectedVoiceURI?: string;
  selectedVoiceGender?: 'female' | 'male' | 'neutral';
  ambientSoundEnabled?: boolean;
}

export const AudioNarrationPlayer: React.FC<AudioNarrationPlayerProps> = ({
  textToRead,
  autoPlay = false,
  voiceRate = 0.92,
  voicePitch = 1.0,
  selectedVoiceId,
  selectedVoiceURI,
  selectedVoiceGender,
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
      osc.frequency.setValueAtTime(432, audioCtxRef.current.currentTime); // 432Hz Calming tone

      // Soft envelope with soothing warm volume
      const now = audioCtxRef.current.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.065, now + 1.2);

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
      const oldOsc = oscRef.current;
      const oldGain = gainRef.current;
      oscRef.current = null;
      gainRef.current = null;

      if (oldGain && audioCtxRef.current) {
        oldGain.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.6);
      }
      setTimeout(() => {
        try {
          oldOsc?.stop();
          oldOsc?.disconnect();
          oldGain?.disconnect();
        } catch (e) {}
      }, 700);
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

      // Clean text and insert natural human breath pauses
      const cleanNarration = formatTextForNaturalSpeech(textToRead);

      const utterance = new SpeechSynthesisUtterance(cleanNarration);
      
      // Safe clamping: preserve organic human formant resonance
      const safeRate = Math.min(1.15, Math.max(0.80, voiceRate));
      const safePitch = Math.min(1.08, Math.max(0.92, voicePitch));
      utterance.rate = safeRate;
      utterance.pitch = safePitch;

      // Select user's chosen voice or gentle natural voice
      const storedVoiceId = typeof window !== 'undefined' ? localStorage.getItem('reflectai_selected_voice_id') || undefined : undefined;
      const storedVoiceURI = typeof window !== 'undefined' ? localStorage.getItem('reflectai_selected_voice_uri') || undefined : undefined;
      const targetVoice = selectedVoiceId || storedVoiceId || selectedVoiceURI || storedVoiceURI;
      const resolvedVoice = resolveSpeechVoice(targetVoice, selectedVoiceGender);

      if (resolvedVoice) {
        utterance.voice = resolvedVoice;
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
