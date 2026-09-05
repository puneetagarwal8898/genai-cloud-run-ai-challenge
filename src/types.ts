export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  authProvider?: 'google' | 'linkedin' | 'facebook' | 'email' | 'demo';
  emailVerified?: boolean;
  createdAt: string;
  lastActiveAt?: string;
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
}

export interface ConverseRequestBody {
  prompt: string;
  mode?: ReflectionMode;
  title?: string;
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
}
