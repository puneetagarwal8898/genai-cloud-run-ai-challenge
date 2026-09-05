export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'female' | 'male';
  tone: string;
  accent: string;
  description: string;
  keywords: string[];
  defaultRate: number;
  defaultPitch: number;
  sampleText: string;
}

export const CURATED_VOICES: VoiceProfile[] = [
  {
    id: 'female-serena',
    name: 'Serena',
    gender: 'female',
    tone: 'Warm & Calming',
    accent: 'British English / Soft Cadence',
    description: 'A velvety, soothing female cadence ideal for morning meditation, unhurried breathing, and gentle grounding.',
    keywords: [
      'google uk english female',
      'victoria',
      'serena',
      'en-gb',
      'en_gb',
      'samantha',
      'hazel',
      'stephanie',
      'female'
    ],
    defaultRate: 0.86,
    defaultPitch: 0.92,
    sampleText: 'Welcome to your morning sanctuary. Take a gentle breath, soften your posture, and let your thoughts rest in quiet comfort.'
  },
  {
    id: 'female-aria',
    name: 'Aria',
    gender: 'female',
    tone: 'Uplifting & Bright',
    accent: 'Oceanic / Airy & Vibrant',
    description: 'An ethereal, delicate female tone bringing lightness, creative clarity, and optimistic gratitude to reflections.',
    keywords: [
      'moira',
      'tessa',
      'fiona',
      'google us english',
      'jenny',
      'zira',
      'karen',
      'en-au',
      'en-ie',
      'female'
    ],
    defaultRate: 0.95,
    defaultPitch: 1.08,
    sampleText: 'Every quiet moment carries light. Notice the gentle clarity within you, and celebrate the beautiful journey you are walking today.'
  },
  {
    id: 'male-julian',
    name: 'Julian',
    gender: 'male',
    tone: 'Grounded & Centered',
    accent: 'Reassuring Baritone / Classic',
    description: 'A deep, reassuring male voice with measured cadence, intentional spacing, and steady contemplative presence.',
    keywords: [
      'daniel',
      'google uk english male',
      'george',
      'oliver',
      'arthur',
      'en-gb',
      'en_gb',
      'male'
    ],
    defaultRate: 0.89,
    defaultPitch: 0.95,
    sampleText: 'In the quiet space between your thoughts lies true stillness. Be present with whatever is unfolding, without judgment.'
  },
  {
    id: 'male-marcus',
    name: 'Marcus',
    gender: 'male',
    tone: 'Deep & Resonant',
    accent: 'Low Contemplative Bass / Decompression',
    description: 'A low, peaceful bass voice with slow cadence, crafted for evening decompression and releasing tension.',
    keywords: [
      'alex',
      'david',
      'richard',
      'rishi',
      'tom',
      'google us english male',
      'en-us',
      'en_us',
      'male'
    ],
    defaultRate: 0.82,
    defaultPitch: 0.78,
    sampleText: 'Release the weight of this day. You are safe here in this quiet hour. Rest your mind in complete and effortless peace.'
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
 * Ensures the 4 voices map to genuinely distinct voices on the user's browser.
 */
export function resolveSpeechVoice(
  voiceIdentifier?: string,
  preferredGender?: 'female' | 'male' | 'neutral'
): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (!voices.length) return null;

  // 1. Identify which curated profile is requested
  const matchedProfile = CURATED_VOICES.find(
    (p) => p.id === voiceIdentifier || p.name.toLowerCase() === (voiceIdentifier || '').toLowerCase()
  );

  // 2. Exact match by voiceURI or name
  if (voiceIdentifier) {
    const exact = voices.find((v) => v.voiceURI === voiceIdentifier || v.name === voiceIdentifier);
    if (exact) return exact;
  }

  // 3. Match using the profile's prioritized keywords
  if (matchedProfile) {
    for (const kw of matchedProfile.keywords) {
      const kwLower = kw.toLowerCase();
      const match = voices.find((v) => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        const uri = (v.voiceURI || '').toLowerCase();
        return name.includes(kwLower) || lang.includes(kwLower) || uri.includes(kwLower);
      });
      if (match) return match;
    }
  }

  // 4. Distinguish between female voices (Serena vs Aria) and male voices (Julian vs Marcus)
  const enVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const candidatePool = enVoices.length ? enVoices : voices;

  const femaleVoices = candidatePool.filter((v) =>
    /female|samantha|victoria|karen|zira|aria|jenny|moira|tessa|fiona|hazel/i.test(v.name)
  );
  const maleVoices = candidatePool.filter((v) =>
    /male|daniel|alex|david|george|oliver|guy|rishi|richard|arthur|tom/i.test(v.name)
  );

  if (matchedProfile?.id === 'female-serena' && femaleVoices.length > 0) {
    return femaleVoices[0];
  }
  if (matchedProfile?.id === 'female-aria' && femaleVoices.length > 1) {
    return femaleVoices[femaleVoices.length - 1]; // Pick distinct secondary female voice
  }
  if (matchedProfile?.id === 'male-julian' && maleVoices.length > 0) {
    return maleVoices[0];
  }
  if (matchedProfile?.id === 'male-marcus' && maleVoices.length > 1) {
    return maleVoices[maleVoices.length - 1]; // Pick distinct secondary male voice
  }

  // Fallback by requested gender
  if (preferredGender === 'female' && femaleVoices.length > 0) {
    return femaleVoices[0];
  }
  if (preferredGender === 'male' && maleVoices.length > 0) {
    return maleVoices[0];
  }

  // Default natural sounding voice
  const natural = candidatePool.find((v) => /natural|enhanced/i.test(v.name));
  return natural || candidatePool[0] || null;
}

/**
 * Plays a quick test sample using the selected voice and tailored parameters.
 */
export function previewVoice(
  voice: SpeechSynthesisVoice | null,
  rate = 0.88,
  pitch = 1.0,
  onComplete?: () => void,
  customSampleText?: string
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();

  const text = customSampleText || 'Welcome to your peaceful sanctuary. Take a gentle breath and let your thoughts rest.';
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
