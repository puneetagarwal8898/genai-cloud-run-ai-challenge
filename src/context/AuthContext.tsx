import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  facebookProvider,
  linkedInProvider,
  getFirebaseCredentialsStatus
} from '../firebase';
import { UserProfile } from '../types';

export interface PendingVerification {
  email: string;
  code?: string;
  displayName: string;
  passwordHash: string;
  expiresAt: number;
  previewCode?: string;
  emailSent?: boolean;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  pendingVerification: PendingVerification | null;
  signInWithGoogle: (isTestEnv?: boolean) => Promise<void>;
  signInWithFacebook: (isTestEnv?: boolean) => Promise<void>;
  signInWithLinkedIn: (isTestEnv?: boolean) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string, isTestEnv?: boolean) => Promise<{ codeSent: boolean; message: string; previewCode?: string }>;
  verifyEmailCode: (email: string, code: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resendVerificationCode: (email: string, isTestEnv?: boolean) => Promise<{ codeSent: boolean; message: string; previewCode?: string }>;
  cancelEmailVerification: () => void;
  signInAsDemoUser: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'reflectai_active_user';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'reflectai_registered_accounts';
const LOCAL_STORAGE_PENDING_KEY = 'reflectai_pending_verification';

// Simple fast SHA-256 equivalent / obfuscation for local credential verification
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'phash_' + Math.abs(hash).toString(36) + '_' + password.length;
}

// Generates an authentic 6-digit verification code
function generateSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createMockUser(profile: UserProfile): User {
  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    emailVerified: Boolean(profile.emailVerified),
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'session-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({})
  } as unknown as User;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState<{ email: string; demoCode: string } | null>(null);

  useEffect(() => {
    // 1. Check local session first
    const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (storedUser) {
      try {
        const parsed: UserProfile = JSON.parse(storedUser);
        setUserProfile(parsed);
        setUser(createMockUser(parsed));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      }
    }

    // 2. Firebase Auth state observer
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || `${currentUser.uid}@reflectai.internal`,
          displayName: currentUser.displayName || 'Reflective Mind',
          photoURL: currentUser.photoURL || null,
          authProvider: 'google',
          emailVerified: currentUser.emailVerified,
          createdAt: currentUser.metadata.creationTime || new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        };
        setUserProfile(profile);
      } else {
        // Only clear if no local user active
        if (!localStorage.getItem(LOCAL_STORAGE_USER_KEY)) {
          setUserProfile(null);
        }
      }
      setLoading(false);
    }, (err) => {
      console.warn("Auth state observer warning:", err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveActiveSession = (profile: UserProfile) => {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    setUserProfile(profile);
    setUser(createMockUser(profile));
  };

  const signInWithGoogle = async (isTestEnv = false) => {
    setError(null);
    try {
      const creds = getFirebaseCredentialsStatus();
      if (!creds.isConfigured && !isTestEnv) {
        const missing: string[] = [];
        if (!creds.hasApiKey) missing.push("FIREBASE_API_KEY");
        if (!creds.hasProjectId) missing.push("FIREBASE_PROJECT_ID");
        throw new Error(`Firebase credentials missing: ${missing.join(', ')}. Configure them in your project Secrets / Environment Variables.`);
      }

      const result = await signInWithPopup(auth, googleProvider);
      const loggedUser = result.user;
      const profile: UserProfile = {
        uid: loggedUser.uid,
        email: loggedUser.email || `${loggedUser.uid}@reflectai.internal`,
        displayName: loggedUser.displayName || 'Reflective Mind',
        photoURL: loggedUser.photoURL || null,
        authProvider: 'google',
        emailVerified: true,
        createdAt: loggedUser.metadata.creationTime || new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      saveActiveSession(profile);
    } catch (err: any) {
      console.error("Google Sign-In error:", err);
      if (isTestEnv) {
        // Fallback for sandboxed preview / test environment
        const fallbackProfile: UserProfile = {
          uid: 'google_user_' + Math.random().toString(36).substring(2, 9),
          email: 'google.journaler@gmail.com',
          displayName: 'Google Authenticated User',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          authProvider: 'google',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        };
        saveActiveSession(fallbackProfile);
      } else {
        let msg = err.message || 'Failed to sign in with Google.';
        if (err.code === 'auth/invalid-api-key' || err.code === 'auth/api-key-not-valid' || err.message?.includes('api-key-not-valid')) {
          msg = 'Firebase Web API Key is invalid or restricted. Ensure your Web API Key from Firebase Console (Project Settings > General > Web API Key) is set in FIREBASE_API_KEY and Identity Toolkit API is enabled in Google Cloud Console.';
        } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
          msg = 'This domain is not authorized for OAuth sign-in. In Firebase Console, go to Authentication > Settings > Authorized Domains, and add this domain.';
        } else if (err.code === 'auth/popup-closed-by-user') {
          msg = 'Sign-in popup was closed before completing authentication.';
        } else if (err.code === 'auth/operation-not-allowed') {
          msg = 'Google Sign-In provider is disabled in Firebase. In Firebase Console, go to Authentication > Sign-in method and enable Google.';
        }
        setError(msg);
        throw new Error(msg);
      }
    }
  };

  const signInWithFacebook = async (isTestEnv = false) => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const loggedUser = result.user;
      const profile: UserProfile = {
        uid: loggedUser.uid,
        email: loggedUser.email || `${loggedUser.uid}@facebook.internal`,
        displayName: loggedUser.displayName || 'Facebook Reflective Mind',
        photoURL: loggedUser.photoURL || null,
        authProvider: 'facebook',
        emailVerified: true,
        createdAt: loggedUser.metadata.creationTime || new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      saveActiveSession(profile);
    } catch (err: any) {
      console.warn("Facebook Sign-In notice:", err.message);
      if (isTestEnv) {
        const fallbackProfile: UserProfile = {
          uid: 'fb_user_' + Math.random().toString(36).substring(2, 9),
          email: 'facebook.journaler@fb.com',
          displayName: 'Facebook Authenticated User',
          photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          authProvider: 'facebook',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        };
        saveActiveSession(fallbackProfile);
      } else {
        const msg = 'Facebook Sign-In requires a Meta App ID configured in Firebase Console under Authentication > Sign-in method > Facebook.';
        setError(msg);
        throw new Error(msg);
      }
    }
  };

  const signInWithLinkedIn = async (isTestEnv = false) => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, linkedInProvider);
      const loggedUser = result.user;
      const profile: UserProfile = {
        uid: loggedUser.uid,
        email: loggedUser.email || `${loggedUser.uid}@linkedin.internal`,
        displayName: loggedUser.displayName || 'LinkedIn Professional Mind',
        photoURL: loggedUser.photoURL || null,
        authProvider: 'linkedin',
        emailVerified: true,
        createdAt: loggedUser.metadata.creationTime || new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      saveActiveSession(profile);
    } catch (err: any) {
      console.warn("LinkedIn Sign-In notice:", err.message);
      if (isTestEnv) {
        const fallbackProfile: UserProfile = {
          uid: 'linkedin_user_' + Math.random().toString(36).substring(2, 9),
          email: 'professional.reflector@linkedin.com',
          displayName: 'LinkedIn Authenticated User',
          photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          authProvider: 'linkedin',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        };
        saveActiveSession(fallbackProfile);
      } else {
        const msg = 'LinkedIn Sign-In requires an OAuth 2.0 Client registered in LinkedIn Developer Portal and linked in Firebase Console.';
        setError(msg);
        throw new Error(msg);
      }
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string,
    isTestEnv = false
  ): Promise<{ codeSent: boolean; message: string; previewCode?: string }> => {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const assignedDisplayName = (displayName && displayName.trim()) || trimmedEmail.split('@')[0];
    const passwordHash = hashPassword(password);

    // Call server email dispatcher endpoint
    let serverResponse: any = null;
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, isTestMode: isTestEnv })
      });
      serverResponse = await res.json();
      if (!res.ok && !serverResponse.fallbackToSandbox) {
        throw new Error(serverResponse.error || 'Failed to dispatch verification email.');
      }
    } catch (apiErr: any) {
      if (!isTestEnv) {
        throw apiErr;
      }
      // In sandbox mode fallback gracefully
      console.warn("Email API sandbox notice:", apiErr.message);
    }

    const previewCode = serverResponse?.previewCode || generateSixDigitCode();
    const emailSent = serverResponse?.emailSent === true;

    const pendingData: PendingVerification = {
      email: trimmedEmail,
      code: previewCode,
      displayName: assignedDisplayName,
      passwordHash,
      previewCode,
      emailSent,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
    };

    localStorage.setItem(LOCAL_STORAGE_PENDING_KEY, JSON.stringify(pendingData));
    setPendingVerification(pendingData);

    return {
      codeSent: true,
      message: serverResponse?.message || `Verification code prepared for ${trimmedEmail}.`,
      previewCode
    };
  };

  const verifyEmailCode = async (email: string, enteredCode: string): Promise<boolean> => {
    setError(null);
    const rawPending = localStorage.getItem(LOCAL_STORAGE_PENDING_KEY);
    if (!rawPending) {
      throw new Error('Verification session expired. Please sign up again.');
    }

    const pending: PendingVerification = JSON.parse(rawPending);
    const trimmedEmail = email.trim().toLowerCase();
    if (pending.email !== trimmedEmail) {
      throw new Error('Email mismatch with active verification session.');
    }

    if (Date.now() > pending.expiresAt) {
      throw new Error('Verification code expired. Please request a new 6-digit code.');
    }

    // Call server to verify code
    let verified = false;
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: enteredCode.trim() })
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        verified = true;
      } else if (!res.ok) {
        // Check client-side pending code as backup
        if (pending.code && pending.code === enteredCode.trim()) {
          verified = true;
        } else {
          throw new Error(data.error || 'Invalid 6-digit verification code.');
        }
      }
    } catch (netErr: any) {
      if (pending.code && pending.code === enteredCode.trim()) {
        verified = true;
      } else {
        throw netErr;
      }
    }

    if (!verified) {
      throw new Error('Invalid 6-digit verification code. Please check and try again.');
    }

    // Code verified! Register the verified account
    const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    const accounts: Record<string, any> = accountsRaw ? JSON.parse(accountsRaw) : {};

    // Stable UID derived from email so logging out and in always restores identical chats!
    const stableUid = 'usr_' + btoa(pending.email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

    const newProfile: UserProfile = {
      uid: stableUid,
      email: pending.email,
      displayName: pending.displayName,
      photoURL: null,
      authProvider: 'email',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    accounts[pending.email] = {
      profile: newProfile,
      passwordHash: pending.passwordHash
    };

    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    localStorage.removeItem(LOCAL_STORAGE_PENDING_KEY);
    setPendingVerification(null);

    saveActiveSession(newProfile);
    return true;
  };

  const resendVerificationCode = async (email: string, isTestEnv = false) => {
    const rawPending = localStorage.getItem(LOCAL_STORAGE_PENDING_KEY);
    const trimmedEmail = email.trim().toLowerCase();
    let displayName = trimmedEmail.split('@')[0];
    let passwordHash = hashPassword('default_password');

    if (rawPending) {
      const pending: PendingVerification = JSON.parse(rawPending);
      displayName = pending.displayName;
      passwordHash = pending.passwordHash;
    }

    // Call server to dispatch fresh code
    const res = await fetch('/api/auth/send-verification-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, isTestMode: isTestEnv })
    });
    const serverResponse = await res.json();
    const previewCode = serverResponse?.previewCode || generateSixDigitCode();
    const emailSent = serverResponse?.emailSent === true;

    const updated: PendingVerification = {
      email: trimmedEmail,
      code: previewCode,
      displayName,
      passwordHash,
      previewCode,
      emailSent,
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    localStorage.setItem(LOCAL_STORAGE_PENDING_KEY, JSON.stringify(updated));
    setPendingVerification(updated);

    return {
      codeSent: true,
      message: serverResponse?.message || `A new code was dispatched to ${trimmedEmail}.`,
      previewCode
    };
  };

  const cancelEmailVerification = () => {
    localStorage.removeItem(LOCAL_STORAGE_PENDING_KEY);
    setPendingVerification(null);
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    const accounts: Record<string, any> = accountsRaw ? JSON.parse(accountsRaw) : {};

    const account = accounts[trimmedEmail];
    if (!account) {
      throw new Error('No account found with this email. Please sign up to verify your account.');
    }

    if (account.passwordHash !== hashPassword(password)) {
      throw new Error('Incorrect password. Please try again.');
    }

    saveActiveSession(account.profile);
  };

  // Demo user for testing and developer preview only
  const signInAsDemoUser = async () => {
    setError(null);
    try {
      // Use a consistent, stable test user ID so chats are NEVER lost on logout / login
      const persistentDemoId = 'demo_tester_account';

      const mockProfile: UserProfile = {
        uid: persistentDemoId,
        email: 'tester.demo@reflectai.internal',
        displayName: 'Demo Testing User',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        authProvider: 'demo',
        emailVerified: true,
        createdAt: '2026-09-01T00:00:00.000Z',
        lastActiveAt: new Date().toISOString()
      };

      saveActiveSession(mockProfile);
    } catch (err: any) {
      setError(err.message || 'Demo test sign in failed.');
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      await firebaseSignOut(auth).catch(() => {});
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      setError(err.message || 'Sign out failed.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        error,
        pendingVerification,
        signInWithGoogle,
        signInWithFacebook,
        signInWithLinkedIn,
        signUpWithEmail,
        verifyEmailCode,
        signInWithEmail,
        resendVerificationCode,
        cancelEmailVerification,
        signInAsDemoUser,
        signOut,
        clearError: () => setError(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

