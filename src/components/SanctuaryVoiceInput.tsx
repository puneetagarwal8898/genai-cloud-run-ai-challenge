import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, X } from 'lucide-react';

interface SanctuaryVoiceInputProps {
  onTranscriptChange: (transcript: string) => void;
  currentValue: string;
  disabled?: boolean;
}

export const SanctuaryVoiceInput: React.FC<SanctuaryVoiceInputProps> = ({
  onTranscriptChange,
  currentValue,
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentValueRef = useRef<string>(currentValue);
  const onTranscriptChangeRef = useRef(onTranscriptChange);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  const triggerError = (msg: string) => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    setErrorMessage(msg);
    // Automatically disappear after 4 seconds
    errorTimerRef.current = setTimeout(() => {
      setErrorMessage(null);
      errorTimerRef.current = null;
    }, 4000);
  };

  const dismissError = () => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setErrorMessage(null);
  };

  useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }

      if (finalTranscript.trim()) {
        const cur = currentValueRef.current;
        const updated = cur
          ? `${cur} ${finalTranscript.trim()}`
          : finalTranscript.trim();
        onTranscriptChangeRef.current(updated);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event:', event.error);
      if (event.error === 'not-allowed') {
        triggerError('Microphone access permission was denied.');
      } else if (event.error === 'service-not-allowed') {
        triggerError('Microphone service is not allowed.');
      } else if (event.error === 'no-speech') {
        // Silent timeout or no speech detected, do not spam
      } else {
        triggerError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, []);

  const toggleListening = () => {
    if (disabled || !recognitionRef.current) return;
    dismissError();

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.warn('Speech recognition start note:', err);
        triggerError('Could not start microphone.');
      }
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative inline-flex items-center">
      <button
        id="sanctuary-voice-mic-button"
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        title={isListening ? 'Stop voice recording' : 'Speak your reflection (Sanctuary Voice Mode)'}
        className={`p-2 rounded-xl transition-all relative ${
          isListening
            ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30 animate-pulse'
            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200 dark:hover:bg-stone-700'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}

        {isListening && (
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
        )}
      </button>

      {errorMessage && (
        <div
          role="alert"
          className="absolute bottom-full left-0 mb-2 p-2 px-2.5 bg-rose-900 text-rose-100 text-[11px] rounded-lg shadow-lg max-w-[calc(100vw-3rem)] sm:max-w-xs flex items-center gap-2 z-30 animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
          <span className="break-words leading-tight">{errorMessage}</span>
          <button
            type="button"
            onClick={dismissError}
            className="p-0.5 rounded hover:bg-rose-800 text-rose-300 hover:text-rose-100 cursor-pointer ml-1 shrink-0"
            title="Dismiss error"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
