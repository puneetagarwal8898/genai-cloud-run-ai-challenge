export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'female' | 'male';
  tone: string;
  description: string;
  keywords: string[];
}

export const CURATED_VOICES: VoiceProfile[] = [
  {
    id: 'female-serena',
    name: 'Serena',
    gender: 'female',
    tone: 'Warm & Calming',
    description: 'A soft, soothing female cadence ideal for morning meditation and grounding.',
    keywords: ['natural', 'samantha', 'karen', 'victoria', 'female', 'google uk english female', 'zira']
  },
  {
    id: 'male-julian',
    name: 'Julian',
    gender: 'male',
    tone: 'Grounded & Centered',
    description: 'A deep, reassuring male voice with measured cadence for clarity and focus.',
    keywords: ['daniel', 'alex', 'david', 'male', 'google uk english male', 'george', 'guy']
  },
  {
    id: 'female-aria',
    name: 'Aria',
    gender: 'female',
    tone: 'Gentle & Uplifting',
    description: 'An airy, delicate tone bringing lightness and gratitude to reflections.',
    keywords: ['moira', 'tessa', 'fiona', 'jenny', 'susan', 'female']
  },
  {
    id: 'male-marcus',
    name: 'Marcus',
    gender: 'male',
    tone: 'Deep & Resonant',
    description: 'A low, peaceful voice fostering contemplation and evening decompression.',
    keywords: ['oliver', 'rishi', 'tom', 'male', 'richard']
  }
];

/**
 * Returns available system voices from the browser.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices() || [];
}

/**
 * Matches a chosen voice URI or profile to an actual browser SpeechSynthesisVoice.
 */
export function resolveSpeechVoice(
  voiceURI?: string,
  preferredGender?: 'female' | 'male' | 'neutral'
): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (!voices.length) return null;

  // 1. Match by exact URI or name
  if (voiceURI) {
    const exact = voices.find((v) => v.voiceURI === voiceURI || v.name === voiceURI);
    if (exact) return exact;
  }

  // 2. Filter English voices
  const enVoices = voices.filter((v) => v.lang.startsWith('en'));
  const candidatePool = enVoices.length ? enVoices : voices;

  // 3. Match preferred gender if requested
  if (preferredGender === 'female') {
    const femaleMatch = candidatePool.find((v) =>
      /female|samantha|victoria|karen|zira|aria|jenny|moira|tessa/i.test(v.name)
    );
    if (femaleMatch) return femaleMatch;
  } else if (preferredGender === 'male') {
    const maleMatch = candidatePool.find((v) =>
      /male|daniel|alex|david|george|oliver|guy|rishi/i.test(v.name)
    );
    if (maleMatch) return maleMatch;
  }

  // 4. Default natural sounding voice
  const natural = candidatePool.find((v) => /natural|enhanced/i.test(v.name));
  return natural || candidatePool[0] || null;
}

/**
 * Plays a quick test sample using the selected voice.
 */
export function previewVoice(
  voice: SpeechSynthesisVoice | null,
  rate = 0.95,
  pitch = 1.0,
  onComplete?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const text = "Welcome to your peaceful sanctuary. Take a gentle breath and let your thoughts rest.";
  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.rate = rate;
  utterance.pitch = pitch;

  if (onComplete) {
    utterance.onend = onComplete;
    utterance.onerror = onComplete;
  }

  window.speechSynthesis.speak(utterance);
}
