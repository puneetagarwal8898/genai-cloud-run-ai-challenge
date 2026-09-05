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
      'hazel',
      'stephanie',
      'susan',
      'serena',
      'catherine'
    ],
    defaultRate: 0.86,
    defaultPitch: 1.02,
    sampleText: 'Welcome to your morning sanctuary. Take a gentle breath, soften your posture, and let your thoughts rest in quiet comfort.'
  },
  {
    id: 'female-celeste',
    name: 'Celeste',
    gender: 'female',
    tone: 'Soft, Warm & Tranquil',
    accent: 'Gentle Natural Cadence / Deep Relaxation',
    description: 'A beautifully natural, velvety female voice with an unhurried, restorative presence designed for deep calm, gentle clarity, and total peaceful relaxation.',
    keywords: [
      'natural',
      'neural',
      'ava',
      'jenny',
      'samantha',
      'allison',
      'libby',
      'moira',
      'claire',
      'google us english'
    ],
    defaultRate: 0.84,
    defaultPitch: 0.98,
    sampleText: 'Breathe in gentle stillness, and let every tension melt away. You are safe, relaxed, and fully present in this quiet sanctuary.'
  },
  {
    id: 'male-julian',
    name: 'Julian',
    gender: 'male',
    tone: 'Grounded & Centered',
    accent: 'Reassuring Baritone / Classic',
    description: 'A deep, reassuring male voice with measured cadence, intentional spacing, and steady contemplative presence.',
    keywords: [
      'google uk english male',
      'daniel',
      'george',
      'oliver',
      'arthur',
      'guy'
    ],
    defaultRate: 0.88,
    defaultPitch: 0.92,
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
      'google us english male',
      'david',
      'alex',
      'mark',
      'richard',
      'rishi',
      'tom',
      'fred'
    ],
    defaultRate: 0.80,
    defaultPitch: 0.72,
    sampleText: 'Release the weight of this day. You are safe here in this quiet hour. Rest your mind in complete and effortless peace.'
  }
];

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices() || [];
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  };
}

/**
 * Returns available system voices from the browser.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
    return voices;
  }
  return cachedVoices;
}

/**
 * Accurately determines if a SpeechSynthesisVoice is female.
 */
export function isVoiceFemale(v: SpeechSynthesisVoice): boolean {
  const name = (v.name || '').toLowerCase();
  const uri = (v.voiceURI || '').toLowerCase();
  const combined = `${name} ${uri}`;

  // Definite female cues
  if (/female|woman/i.test(combined)) return true;
  if (/samantha|victoria|karen|zira|aria|jenny|moira|tessa|fiona|hazel|stephanie|susan|catherine|ava|allison|serena|claire|libby|sonia|natasha|kate|elena/i.test(combined)) {
    if (!/(?<!fe)male/i.test(combined)) return true;
  }
  // Standard Google US English in Chrome is female
  if (combined.includes('google us english') && !/(?<!fe)male/i.test(combined)) {
    return true;
  }
  return false;
}

/**
 * Accurately determines if a SpeechSynthesisVoice is male.
 */
export function isVoiceMale(v: SpeechSynthesisVoice): boolean {
  if (isVoiceFemale(v)) return false;
  const name = (v.name || '').toLowerCase();
  const uri = (v.voiceURI || '').toLowerCase();
  const combined = `${name} ${uri}`;

  if (/(?<!fe)male|\bman\b/i.test(combined)) return true;
  if (/daniel|david|george|oliver|guy|rishi|richard|arthur|tom|mark|alex|fred|james|william|john/i.test(combined)) {
    return true;
  }
  return false;
}

/**
 * Matches a chosen voice profile to an actual browser SpeechSynthesisVoice.
 * Ensures Serena and Celeste are naturally soothing female voices, Julian and Marcus are male,
 * and eliminates harsh robotic or synthetic desktop voices.
 */
export function resolveSpeechVoice(
  voiceIdentifier?: string,
  preferredGender?: 'female' | 'male' | 'neutral'
): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (!voices.length) return null;

  // Seamlessly alias legacy Aria preference to the new serene Celeste voice
  const normalizedIdentifier = (voiceIdentifier === 'female-aria' || voiceIdentifier === 'aria')
    ? 'female-celeste'
    : voiceIdentifier;

  const matchedProfile = CURATED_VOICES.find(
    (p) => p.id === normalizedIdentifier || p.name.toLowerCase() === (normalizedIdentifier || '').toLowerCase()
  );

  const targetGender = matchedProfile?.gender || (preferredGender === 'female' || preferredGender === 'male' ? preferredGender : null);

  // Exact match by voiceURI or name (if gender matches)
  if (normalizedIdentifier) {
    const exact = voices.find((v) => v.voiceURI === normalizedIdentifier || v.name === normalizedIdentifier);
    if (exact) {
      if (!targetGender) return exact;
      if (targetGender === 'female' && !isVoiceMale(exact)) return exact;
      if (targetGender === 'male' && !isVoiceFemale(exact)) return exact;
    }
  }

  const femaleVoices = voices.filter((v) => isVoiceFemale(v));
  const maleVoices = voices.filter((v) => isVoiceMale(v));

  // Profile-specific resolution
  if (matchedProfile?.id === 'female-serena') {
    // 1. Natural / UK female voice (Google UK English Female, Victoria, Hazel, Libby, Susan)
    const ukFemale = femaleVoices.find((v) =>
      (v.name.toLowerCase().includes('google uk english female') ||
      /victoria|hazel|susan|stephanie|libby|catherine/i.test(v.name) ||
      v.lang.toLowerCase().includes('gb')) &&
      !/zira|desktop|espeak/i.test(v.name)
    );
    if (ukFemale) return ukFemale;

    // 2. High quality female voice not robotic
    const calmFemale = femaleVoices.find((v) => !/zira|desktop|espeak/i.test(v.name));
    if (calmFemale) return calmFemale;

    if (femaleVoices.length > 0) return femaleVoices[0];
    const notMale = voices.find((v) => !isVoiceMale(v));
    if (notMale) return notMale;
  }

  if (matchedProfile?.id === 'female-celeste') {
    // 1. Prioritize Natural / Neural / Premium / Enhanced voices (Microsoft Natural, Apple Enhanced)
    const naturalNeural = femaleVoices.find((v) =>
      /natural|neural|enhanced|premium|siri/i.test(v.name) &&
      !/zira|desktop|espeak/i.test(v.name)
    );
    if (naturalNeural) return naturalNeural;

    // 2. Renowned soothing, velvety female voices (Ava, Jenny, Samantha, Allison, Libby, Moira, Claire, Sonia)
    const soothingFemale = femaleVoices.find((v) =>
      /ava|jenny|samantha|allison|libby|moira|claire|sonia|fiona/i.test(v.name) &&
      !/zira|desktop|espeak/i.test(v.name)
    );
    if (soothingFemale) return soothingFemale;

    // 3. Clean Google US English or Google UK female
    const googleFemale = femaleVoices.find((v) =>
      v.name.toLowerCase().includes('google') &&
      !/zira|desktop|espeak/i.test(v.name)
    );
    if (googleFemale) return googleFemale;

    // 4. Any female voice that is explicitly not robotic desktop synth
    const nonRoboticFemale = femaleVoices.find((v) => !/zira|desktop|espeak/i.test(v.name));
    if (nonRoboticFemale) return nonRoboticFemale;

    if (femaleVoices.length > 0) return femaleVoices[0];
    const notMale = voices.find((v) => !isVoiceMale(v));
    if (notMale) return notMale;
  }

  if (matchedProfile?.id === 'male-julian') {
    // 1. British / UK male
    const ukMale = maleVoices.find((v) =>
      v.name.toLowerCase().includes('google uk english male') ||
      /daniel|george|oliver|arthur/i.test(v.name) ||
      v.lang.toLowerCase().includes('gb')
    );
    if (ukMale) return ukMale;

    // 2. Any male voice
    if (maleVoices.length > 0) return maleVoices[0];

    // 3. Fallback
    const notFemale = voices.find((v) => !isVoiceFemale(v));
    if (notFemale) return notFemale;
  }

  if (matchedProfile?.id === 'male-marcus') {
    // 1. US / Deep male
    const usMale = maleVoices.find((v) =>
      v.name.toLowerCase().includes('google us english male') ||
      /david|alex|mark|richard|tom/i.test(v.name)
    );
    if (usMale) return usMale;

    // 2. Secondary male voice if available
    if (maleVoices.length > 1) return maleVoices[maleVoices.length - 1];
    if (maleVoices.length > 0) return maleVoices[0];

    // 3. Fallback
    const notFemale = voices.find((v) => !isVoiceFemale(v));
    if (notFemale) return notFemale;
  }

  // Generic gender fallback
  if (targetGender === 'female' && femaleVoices.length > 0) {
    return femaleVoices[0];
  }
  if (targetGender === 'male' && maleVoices.length > 0) {
    return maleVoices[0];
  }

  return voices[0] || null;
}

// Module-level pointer to prevent Chrome Garbage Collection of SpeechSynthesisUtterance
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activePreviewTimer: any = null;

/**
 * Stops any currently active voice preview safely.
 */
export function stopVoicePreview(): void {
  if (activePreviewTimer) {
    clearTimeout(activePreviewTimer);
    activePreviewTimer = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
}

/**
 * Plays a quick test sample using the selected voice and tailored parameters.
 * Maintains an active utterance reference so Chrome does not garbage-collect mid-sentence.
 */
export function previewVoice(
  voice: SpeechSynthesisVoice | null,
  rate = 0.88,
  pitch = 1.0,
  onStart?: () => void,
  onEnd?: () => void,
  customSampleText?: string
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  stopVoicePreview();

  const text = customSampleText || 'Welcome to your peaceful sanctuary. Take a gentle breath and let your thoughts rest.';
  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance; // Pin to module scope!

  if (voice) {
    utterance.voice = voice;
  }
  utterance.rate = rate;
  utterance.pitch = pitch;

  let hasEnded = false;
  const finish = () => {
    if (hasEnded) return;
    hasEnded = true;
    if (activePreviewTimer) {
      clearTimeout(activePreviewTimer);
      activePreviewTimer = null;
    }
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
    onEnd?.();
  };

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    finish();
  };

  utterance.onerror = (e) => {
    if (e.error === 'interrupted' || e.error === 'canceled') {
      return;
    }
    finish();
  };

  // Chrome safety timer to ensure stop state returns even if browser misses onend event
  activePreviewTimer = setTimeout(() => {
    if (activeUtterance === utterance) {
      finish();
    }
  }, 14000);

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  window.speechSynthesis.speak(utterance);
}
