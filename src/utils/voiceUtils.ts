export interface VoiceProfile {
  id: string;
  name: string;
  meaning: string;
  gender: 'female' | 'male';
  tone: string;
  accent: string;
  description: string;
  keywords: string[];
  preferredLocale?: 'en-GB' | 'en-US' | 'en-IN' | 'any';
  defaultRate: number;
  defaultPitch: number;
  sampleText: string;
}

export const CURATED_VOICES: VoiceProfile[] = [
  {
    id: 'voice-ananya',
    name: 'Ananya',
    meaning: 'Sanskrit: "Unique & Serene Presence"',
    gender: 'female',
    tone: 'Soft, Warm & Tranquil',
    accent: 'Natural English / Melodic & Serene',
    description: 'A beautifully natural, velvety female voice with an unhurried, restorative presence designed for deep calm, gentle clarity, and peaceful relaxation.',
    keywords: [
      'natural',
      'neural',
      'neerja',
      'ava',
      'jenny',
      'samantha',
      'allison',
      'libby',
      'sonia',
      'moira',
      'claire',
      'google us english female',
      'google us english',
      'siri'
    ],
    preferredLocale: 'any',
    defaultRate: 0.92,
    defaultPitch: 1.0,
    sampleText: 'Breathe in gentle stillness, and let every tension melt away. You are safe, relaxed, and fully present in this quiet sanctuary.'
  },
  {
    id: 'voice-tara',
    name: 'Tara',
    meaning: 'Sanskrit & Vedic: "Guiding Star of Compassion"',
    gender: 'female',
    tone: 'Warm, Reassuring & Restorative',
    accent: 'British English / Soft Cadence',
    description: 'A velvety, soothing British English cadence ideal for morning meditation, unhurried breathing, and gentle emotional grounding.',
    keywords: [
      'google uk english female',
      'victoria',
      'hazel',
      'serena',
      'libby',
      'sonia',
      'stephanie',
      'susan',
      'catherine',
      'natural',
      'neural'
    ],
    preferredLocale: 'en-GB',
    defaultRate: 0.90,
    defaultPitch: 1.0,
    sampleText: 'Welcome to this quiet moment. Soften your posture, take an easy restful breath, and let your thoughts settle into peaceful comfort.'
  },
  {
    id: 'voice-mira',
    name: 'Mira',
    meaning: 'Sanskrit: "Ocean of Grace & Mindful Devotion"',
    gender: 'female',
    tone: 'Bright, Mindful & Uplifting',
    accent: 'Expressive English / Warm Intonation',
    description: 'An uplifting, organic voice characterized by gentle intonation and clarity, perfect for cultivating gratitude, mental presence, and self-compassion.',
    keywords: [
      'natural',
      'neural',
      'sonia',
      'elena',
      'karen',
      'fiona',
      'tessa',
      'aria',
      'siri',
      'google'
    ],
    preferredLocale: 'any',
    defaultRate: 0.92,
    defaultPitch: 1.02,
    sampleText: 'Notice this present moment, just as it is. Allow gratitude to soften your heart, bringing lightness and calm to your day.'
  },
  {
    id: 'voice-bodhi',
    name: 'Bodhi',
    meaning: 'Sanskrit: "Awakening, Deep Insight & Stillness"',
    gender: 'male',
    tone: 'Centered, Grounded & Reassuring',
    accent: 'Classic English Baritone / Steady Cadence',
    description: 'A deep, reassuring male voice with measured cadence, intentional spacing, and a steady contemplative presence for centered reflection.',
    keywords: [
      'google uk english male',
      'daniel',
      'george',
      'oliver',
      'arthur',
      'guy',
      'prabhat',
      'rishi',
      'natural',
      'neural'
    ],
    preferredLocale: 'en-GB',
    defaultRate: 0.90,
    defaultPitch: 0.98,
    sampleText: 'In the quiet space between your thoughts lies true stillness. Be present with whatever is unfolding, with patience and ease.'
  },
  {
    id: 'voice-varun',
    name: 'Varun',
    meaning: 'Vedic Mythology: "Lord of Cosmic Waters & Deep Peace"',
    gender: 'male',
    tone: 'Deep, Warm & Resonant Bass',
    accent: 'Contemplative English / Evening Decompression',
    description: 'A rich, peaceful bass voice with a slow, soothing cadence, crafted for evening decompression, releasing anxiety, and letting go of the day.',
    keywords: [
      'prabhat',
      'rishi',
      'google us english male',
      'david',
      'alex',
      'mark',
      'richard',
      'natural',
      'neural',
      'guy'
    ],
    preferredLocale: 'any',
    defaultRate: 0.88,
    defaultPitch: 0.96,
    sampleText: 'Release the weight of this day into the quiet ocean of peace. You are safe here. Rest your mind in complete and effortless calm.'
  },
  {
    id: 'voice-kailas',
    name: 'Kailas',
    meaning: 'Sacred Himalayan Sanctuary: "Mountain of Serenity"',
    gender: 'male',
    tone: 'Calm, Gentle Tenor & Empathic',
    accent: 'Gentle Tenor / Restorative Flow',
    description: 'A smooth, gentle tenor voice with an empathetic rhythm, guiding you through reflective journaling with ease, patience, and warmth.',
    keywords: [
      'oliver',
      'natural',
      'neural',
      'guy',
      'ryan',
      'christopher',
      'daniel',
      'google'
    ],
    preferredLocale: 'any',
    defaultRate: 0.90,
    defaultPitch: 1.0,
    sampleText: 'Allow your thoughts to flow freely onto the page. Every feeling you experience is worthy of gentle understanding and quiet care.'
  }
];

/**
 * Normalizes any voice ID (including legacy saved IDs) to a current curated voice ID.
 */
export function normalizeVoiceId(rawId?: string | null): string {
  if (!rawId) return CURATED_VOICES[0].id;
  const lower = rawId.toLowerCase().trim();

  // Modern voice IDs
  if (lower === 'voice-ananya' || lower === 'ananya') return 'voice-ananya';
  if (lower === 'voice-tara' || lower === 'tara') return 'voice-tara';
  if (lower === 'voice-mira' || lower === 'mira') return 'voice-mira';
  if (lower === 'voice-bodhi' || lower === 'bodhi') return 'voice-bodhi';
  if (lower === 'voice-varun' || lower === 'varun') return 'voice-varun';
  if (lower === 'voice-kailas' || lower === 'kailas') return 'voice-kailas';

  // Legacy mappings for backward compatibility
  if (lower === 'female-celeste' || lower === 'celeste' || lower === 'female-aria' || lower === 'aria') {
    return 'voice-ananya';
  }
  if (lower === 'female-serena' || lower === 'serena') {
    return 'voice-tara';
  }
  if (lower === 'female-elena' || lower === 'elena') {
    return 'voice-mira';
  }
  if (lower === 'male-julian' || lower === 'julian') {
    return 'voice-bodhi';
  }
  if (lower === 'male-marcus' || lower === 'marcus') {
    return 'voice-varun';
  }
  if (lower === 'male-oliver' || lower === 'oliver') {
    return 'voice-kailas';
  }

  // Exact ID or name match
  const exact = CURATED_VOICES.find(v => v.id === rawId || v.name.toLowerCase() === lower);
  if (exact) return exact.id;

  return CURATED_VOICES[0].id;
}

/**
 * Formats reflection or narration text for natural, human-like speech synthesis:
 * - Strips markdown syntax and symbols.
 * - Inserts natural comma breath pauses at syntactic junctions.
 * - Prevents rushed run-on machine speech.
 */
export function formatTextForNaturalSpeech(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/;/g, ',')
    .replace(/,([^\s])/g, ', $1')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ', ')
    .replace(/\.{4,}/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices() || [];
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  };
}

/**
 * Returns available system voices from the browser, populating and caching when available.
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

  if (/female|woman/i.test(combined)) return true;
  if (/samantha|victoria|karen|zira|aria|jenny|moira|tessa|fiona|hazel|stephanie|susan|catherine|ava|allison|serena|claire|libby|sonia|natasha|kate|elena|neerja|ananya/i.test(combined)) {
    if (!/(?<!fe)male/i.test(combined)) return true;
  }
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
  if (/daniel|david|george|oliver|guy|rishi|richard|arthur|tom|mark|alex|fred|james|william|john|prabhat|bodhi|varun|kailas/i.test(combined)) {
    return true;
  }
  return false;
}

/**
 * Computes a quality and naturalness rating for a browser voice:
 * - Heavily penalizes robotic legacy synthetic engines (eSpeak, SAPI Desktop).
 * - Strongly rewards high-fidelity Neural, Natural, Online, Enhanced, and Siri voices.
 */
export function rateVoiceNaturalness(voice: SpeechSynthesisVoice): number {
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();
  const combined = `${name} ${uri}`;
  let score = 100;

  // 1. Strict elimination of robotic desktop/legacy synth engines
  if (/espeak|desktop|zira desktop|david desktop|mark desktop|hazel desktop|sample|synthesizer|mbrola|festival|klatt/i.test(combined)) {
    return -9999;
  }

  // 2. High-Fidelity Neural / Natural voices (Microsoft Edge Natural, Apple Enhanced/Premium)
  if (/natural|neural|online \(natural\)|wavenet|enhanced|premium|hi-fi/i.test(combined)) {
    score += 1500;
  }

  // 3. Apple Siri & Google Cloud voices
  if (/\bsiri\b/i.test(combined)) {
    score += 1200;
  }
  if (/google us english|google uk english|google english/i.test(combined)) {
    score += 1000;
  } else if (/google/i.test(combined)) {
    score += 800;
  }

  // 4. Renowned high-quality studio voices
  if (/ava|jenny|samantha|serena|libby|neerja|sonia|prabhat|rishi|daniel|oliver|victoria/i.test(combined)) {
    score += 700;
  }

  // 5. Cloud-rendered voices (localService === false usually means high-bitrate neural service)
  if (voice.localService === false) {
    score += 300;
  }

  // 6. English language match
  const lang = (voice.lang || '').toLowerCase();
  if (lang.startsWith('en')) {
    score += 400;
  } else {
    score -= 2000;
  }

  return score;
}

/**
 * Matches a chosen voice profile to an actual browser SpeechSynthesisVoice.
 * Eliminates harsh robotic or synthetic desktop voices and picks the highest-fidelity natural voice.
 */
export function resolveSpeechVoice(
  voiceIdentifier?: string,
  preferredGender?: 'female' | 'male' | 'neutral'
): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (!voices.length) return null;

  const normalizedId = normalizeVoiceId(voiceIdentifier);
  const matchedProfile = CURATED_VOICES.find((p) => p.id === normalizedId) || CURATED_VOICES[0];
  const targetGender = matchedProfile?.gender || (preferredGender === 'female' || preferredGender === 'male' ? preferredGender : null);

  // If exact match by voiceURI or name exists and is not robotic
  if (voiceIdentifier) {
    const exact = voices.find((v) => v.voiceURI === voiceIdentifier || v.name === voiceIdentifier);
    if (exact && rateVoiceNaturalness(exact) > 0) {
      if (!targetGender) return exact;
      if (targetGender === 'female' && !isVoiceMale(exact)) return exact;
      if (targetGender === 'male' && !isVoiceFemale(exact)) return exact;
    }
  }

  // Score all available voices for the best match
  let bestVoice: SpeechSynthesisVoice | null = null;
  let highestScore = -Infinity;

  for (const v of voices) {
    let score = rateVoiceNaturalness(v);
    if (score < 0) continue; // Skip robotic voices

    const isFemale = isVoiceFemale(v);
    const isMale = isVoiceMale(v);

    // Gender score
    if (targetGender === 'female') {
      if (isFemale) score += 1200;
      else if (isMale) score -= 3000;
    } else if (targetGender === 'male') {
      if (isMale) score += 1200;
      else if (isFemale) score -= 3000;
    }

    // Preferred locale
    const lang = (v.lang || '').toLowerCase();
    if (matchedProfile.preferredLocale === 'en-GB' && (lang.includes('gb') || /uk|british/i.test(v.name))) {
      score += 350;
    } else if (matchedProfile.preferredLocale === 'en-US' && (lang.includes('us') || /us english|united states/i.test(v.name))) {
      score += 250;
    }

    // Keyword match
    const vName = (v.name || '').toLowerCase();
    for (const kw of matchedProfile.keywords) {
      if (vName.includes(kw.toLowerCase())) {
        score += 300;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestVoice = v;
    }
  }

  if (bestVoice) return bestVoice;

  // Fallback: Pick highest quality voice matching gender
  const genderFiltered = voices.filter((v) => {
    if (targetGender === 'female') return isVoiceFemale(v) && rateVoiceNaturalness(v) > -500;
    if (targetGender === 'male') return isVoiceMale(v) && rateVoiceNaturalness(v) > -500;
    return rateVoiceNaturalness(v) > -500;
  });

  if (genderFiltered.length > 0) {
    genderFiltered.sort((a, b) => rateVoiceNaturalness(b) - rateVoiceNaturalness(a));
    return genderFiltered[0];
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
 * Plays a test sample using the selected voice and tailored parameters.
 * Maintains an active utterance reference so Chrome does not garbage-collect mid-sentence.
 * Clamps rate and pitch to natural vocal acoustic boundaries to preserve human tone.
 */
export function previewVoice(
  voice: SpeechSynthesisVoice | null,
  rate = 0.92,
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

  const text = formatTextForNaturalSpeech(
    customSampleText || 'Welcome to your peaceful sanctuary. Take a gentle breath and let your thoughts rest.'
  );
  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance; // Pin to module scope!

  if (voice) {
    utterance.voice = voice;
  }

  // Safe acoustic boundaries: pitch between 0.92 and 1.08 preserves natural throat resonance without robotization
  const safeRate = Math.min(1.15, Math.max(0.80, rate));
  const safePitch = Math.min(1.08, Math.max(0.92, pitch));

  utterance.rate = safeRate;
  utterance.pitch = safePitch;

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

  // Safety timer to ensure stop state returns even if browser misses onend event
  activePreviewTimer = setTimeout(() => {
    if (activeUtterance === utterance) {
      finish();
    }
  }, 16000);

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  window.speechSynthesis.speak(utterance);
}

// ==========================================
// 432Hz Ambient Sound Synthesis & Preview
// ==========================================

interface AmbientSession {
  ctx: AudioContext;
  masterGain: GainNode;
  oscillators: OscillatorNode[];
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
}

let activeAmbientSession: AmbientSession | null = null;
let ambientTimer: any = null;

/**
 * Checks if 432Hz ambient preview is currently playing.
 */
export function is432HzPreviewPlaying(): boolean {
  return activeAmbientSession !== null;
}

/**
 * Stops the 432Hz ambient sound preview gracefully with a soft audio fade-out or immediately.
 */
export function stop432HzPreview(immediate = false): void {
  if (ambientTimer) {
    clearTimeout(ambientTimer);
    ambientTimer = null;
  }

  const session = activeAmbientSession;
  if (!session) return;
  activeAmbientSession = null; // Unbind immediately so new sessions are never clobbered

  const { ctx, masterGain, oscillators, lfo, lfoGain } = session;

  if (immediate) {
    try {
      oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (_) {}
      });
      if (lfo) {
        try {
          lfo.stop();
          lfo.disconnect();
        } catch (_) {}
      }
      if (lfoGain) {
        try {
          lfoGain.disconnect();
        } catch (_) {}
      }
      masterGain.disconnect();
    } catch (_) {}
    return;
  }

  // Smooth natural fade-out over 350ms
  try {
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(Math.max(masterGain.gain.value, 0.0001), now);
    masterGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.35);

    setTimeout(() => {
      try {
        oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (_) {}
        });
        if (lfo) {
          try {
            lfo.stop();
            lfo.disconnect();
          } catch (_) {}
        }
        if (lfoGain) {
          try {
            lfoGain.disconnect();
          } catch (_) {}
        }
        masterGain.disconnect();
      } catch (_) {}
    }, 400);
  } catch (e) {
    // Immediate fallback if ramping fails
    try {
      oscillators.forEach((osc) => osc.stop());
    } catch (_) {}
  }
}

/**
 * Plays a soothing 432Hz sine tone enriched with warm sub-octave (216Hz) and singing-bowl chime (864Hz).
 * Resolves browser AudioContext suspension immediately on user click and fades out after 8 seconds.
 */
export function play432HzPreview(onEnd?: () => void): void {
  // Immediately terminate any prior session cleanly
  stop432HzPreview(true);

  if (typeof window === 'undefined') {
    onEnd?.();
    return;
  }

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      console.warn('Web Audio API is not supported in this environment');
      onEnd?.();
      return;
    }

    const ctx = new AudioCtx();

    // Critical: Resume immediately within the user gesture event loop
    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => console.warn('AudioContext resume note:', err));
    }

    const now = ctx.currentTime;

    // Master volume control with gentle fade-in ramp
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    // Smooth fade in to a warm, clearly audible soothing level (0.16)
    masterGain.gain.exponentialRampToValueAtTime(0.16, now + 0.5);

    // Warm biquad lowpass filter (simulates Tibetan singing bowl acoustics)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, now);
    filter.Q.setValueAtTime(1.5, now);

    // 1. Primary 432 Hz Healing Fundamental Tone
    const oscFundamental = ctx.createOscillator();
    oscFundamental.type = 'sine';
    oscFundamental.frequency.setValueAtTime(432, now);

    const fundamentalGain = ctx.createGain();
    fundamentalGain.gain.setValueAtTime(0.75, now);
    oscFundamental.connect(fundamentalGain);
    fundamentalGain.connect(filter);

    // 2. Harmonic Sub-Octave (216 Hz warm grounding resonance)
    const oscSub = ctx.createOscillator();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(216, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.25, now);
    oscSub.connect(subGain);
    subGain.connect(filter);

    // 3. Gentle Crystalline Overtone (864 Hz chime resonance)
    const oscOvertone = ctx.createOscillator();
    oscOvertone.type = 'sine';
    oscOvertone.frequency.setValueAtTime(864, now);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.08, now);
    oscOvertone.connect(overtoneGain);
    overtoneGain.connect(filter);

    // 4. Meditative Breath Modulation (0.15 Hz slow calming breath wave)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.035, now);
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);

    // Route filter -> masterGain -> destination
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Start all audio nodes
    oscFundamental.start(now);
    oscSub.start(now);
    oscOvertone.start(now);
    lfo.start(now);

    const session: AmbientSession = {
      ctx,
      masterGain,
      oscillators: [oscFundamental, oscSub, oscOvertone],
      lfo,
      lfoGain
    };
    activeAmbientSession = session;

    // Auto fade-out after 8 seconds of peaceful preview
    ambientTimer = setTimeout(() => {
      stop432HzPreview(false);
      onEnd?.();
    }, 8000);
  } catch (err) {
    console.warn('432Hz preview audio note:', err);
    onEnd?.();
  }
}
