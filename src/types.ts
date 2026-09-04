export type AuthProviderType = 'google' | 'linkedin' | 'twitter' | 'email';

export type SanctuaryMood = 'calm' | 'clarity' | 'gratitude' | 'courage' | 'growth' | 'anxious' | 'reflective';

export interface SanctuaryLocation {
  name?: string;
  placeName?: string;
  lat?: number;
  lng?: number;
  latitude: number;
  longitude: number;
  description?: string;
  category?: 'nature' | 'urban' | 'zen' | 'coastal' | 'home';
}

export interface TimeCapsuleData {
  isSealed: boolean;
  isOpened?: boolean;
  sealDate: string;
  unlockDate: string;
  openedDate?: string;
  capsulePrompt?: string;
  growthSummary?: string;
  celebrationText?: string;
}

export interface UserPreferences {
  voicePitch?: number;
  voiceRate?: number;
  voiceSpeed?: number;
  ambientSound?: boolean;
  ambientSoundEnabled?: boolean;
  autoReadAloud?: boolean;
  avatarSeed?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
  authProvider?: AuthProviderType | 'demo';
  emailVerified?: boolean;
  createdAt: string;
  lastActiveAt?: string;
  preferences?: UserPreferences;
}

export type ReflectionMode = 'reflection' | 'brainstorm' | 'summary' | 'advice';

export type ThemeId = 'midnight' | 'candlelight' | 'sage' | 'nordic' | 'warm-paper' | 'solar' | 'daylight-sage';

export type AppEnvironment = 'test' | 'production';

export type DeviceViewportMode = 'desktop' | 'tablet' | 'mobile';

export interface ColorTheme {
  id: ThemeId;
  name: string;
  type: 'dark' | 'light';
  tagline: string;
  dotColor: string;
  accentHex: string; // for canvas cursor wave
}

export interface JournalInteraction {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  geminiResponse: string;
  summary?: string;
  tags?: string[];
  mode: ReflectionMode;
  suggestedPrompts?: string[];
  trail?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
  createdAt: string;
  updatedAt: string;
  // Standout capabilities
  mood?: SanctuaryMood;
  location?: SanctuaryLocation;
  timeCapsule?: TimeCapsuleData;
  isTimeCapsule?: boolean;
  capsuleUnlockDate?: string;
  capsuleSealed?: boolean;
  capsuleNote?: string;
  growthSynthesis?: string;
}

export interface ConverseRequestBody {
  prompt: string;
  mode?: ReflectionMode;
  title?: string;
  location?: SanctuaryLocation;
  isTimeCapsule?: boolean;
  capsuleUnlockDate?: string;
  history?: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}

export interface ConverseResponseBody {
  response: string;
  summary?: string;
  suggestedPrompts?: string[];
  modelUsed: string;
  mood?: SanctuaryMood;
}

export interface GrowthSynthesisResponse {
  growthAnalysis: string;
  celebrationText: string;
  emergentStrengths: string[];
  modelUsed: string;
}
