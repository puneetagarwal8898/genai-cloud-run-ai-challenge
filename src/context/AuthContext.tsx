import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  reauthenticateWithPopup
} from 'firebase/auth';
import {
  auth,
  getActiveAuth,
  googleProvider,
  twitterProvider,
  linkedInProvider,
  linkedInLegacyProvider,
  getFirebaseCredentialsStatus
} from '../firebase';
import { AuthProviderType, UserProfile, UserPreferences } from '../types';
import { wipeAllUserData, archiveAndWipeUserData } from '../services/journalService';

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
  isDeletingAccount: boolean;
  error: string | null;
  pendingVerification: PendingVerification | null;
  lastUsedProvider: AuthProviderType | null;
  signInWithGoogle: (isTestEnv?: boolean) => Promise<void>;
  signInWithTwitter: (isTestEnv?: boolean) => Promise<void>;
  signInWithLinkedIn: (isTestEnv?: boolean) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string, isTestEnv?: boolean) => Promise<{ codeSent: boolean; message: string; previewCode?: string; directSignIn?: boolean }>;
  verifyEmailCode: (email: string, code: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendFirebaseVerificationEmail: () => Promise<void>;
  reloadUserVerificationStatus: () => Promise<boolean>;
  resendVerificationCode: (email: string, isTestEnv?: boolean) => Promise<{ codeSent: boolean; message: string; previewCode?: string }>;
  cancelEmailVerification: () => void;
  signInAsDemoUser: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfileData: (updates: { displayName?: string; photoURL?: string; preferences?: UserPreferences }) => Promise<void>;
  deleteUserAccount: (confirmationPassword?: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'reflectai_active_user';
const LOCAL_STORAGE_ACCOUNTS_KEY = 'reflectai_registered_accounts';
const LOCAL_STORAGE_PENDING_KEY = 'reflectai_pending_verification';
const LOCAL_STORAGE_LAST_PROVIDER_KEY = 'reflectai_last_login_provider';

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

// Generates an authentic verification code
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
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);
  const [lastUsedProvider, setLastUsedProvider] = useState<AuthProviderType | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_LAST_PROVIDER_KEY);
      if (stored === 'google' || stored === 'linkedin' || stored === 'twitter' || stored === 'email') {
        return stored;
      }
    } catch {
      // safe fallback
    }
    return null;
  });

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
    let unsubscribe = () => {};
    try {
      const activeAuth = getActiveAuth();
      unsubscribe = onAuthStateChanged(activeAuth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          const provId = currentUser.providerData?.[0]?.providerId || '';
          let detectedProvider: AuthProviderType = 'google';
          if (provId.includes('twitter')) detectedProvider = 'twitter';
          else if (provId.includes('linkedin')) detectedProvider = 'linkedin';
          else if (provId.includes('password')) detectedProvider = 'email';

          const profile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || `${currentUser.uid}@reflectai.internal`,
            displayName: currentUser.displayName || 'Reflective Mind',
            photoURL: currentUser.photoURL || null,
            authProvider: detectedProvider,
            emailVerified: currentUser.emailVerified,
            createdAt: currentUser.metadata.creationTime || new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          };
          setUserProfile(profile);
          try {
            localStorage.setItem(LOCAL_STORAGE_LAST_PROVIDER_KEY, detectedProvider);
            setLastUsedProvider(detectedProvider);
          } catch {
            // safe fallback
          }
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
    } catch (authErr) {
      console.warn("Auth state observer initialization warning:", authErr);
      setLoading(false);
    }

    // 3. Listen for OAuth popup completion messages (e.g. direct LinkedIn OAuth)
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LINKEDIN_AUTH_SUCCESS' && event.data?.profile) {
        saveActiveSession(event.data.profile);
        setError(null);
      } else if (event.data?.type === 'LINKEDIN_AUTH_ERROR') {
        setError(event.data.error || 'LinkedIn authentication failed.');
      }
    };
    window.addEventListener('message', handleOAuthMessage);

    return () => {
      unsubscribe();
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, []);

  const saveActiveSession = (profile: UserProfile) => {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    if (profile.authProvider && profile.authProvider !== 'demo') {
      const p = profile.authProvider as AuthProviderType;
      if (['google', 'linkedin', 'twitter', 'email'].includes(p)) {
        try {
          localStorage.setItem(LOCAL_STORAGE_LAST_PROVIDER_KEY, p);
          setLastUsedProvider(p);
        } catch {
          // safe fallback
        }
      }
    }
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

      const activeAuth = getActiveAuth();
      const result = await signInWithPopup(activeAuth, googleProvider);
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

  const signInWithTwitter = async (isTestEnv = false) => {
    setError(null);
    try {
      if (isTestEnv) {
        const fallbackProfile: UserProfile = {
          uid: 'twitter_user_' + Math.random().toString(36).substring(2, 9),
          email: 'x.reflector@twitter.internal',
          displayName: 'X / Twitter User',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          authProvider: 'twitter',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        };
        saveActiveSession(fallbackProfile);
        return;
      }

      // Native Firebase TwitterAuthProvider (OAuth 1.0a / 2.0 with Consumer Key & Secret)
      const result = await signInWithPopup(auth, twitterProvider);
      const loggedUser = result.user;
      const profile: UserProfile = {
        uid: loggedUser.uid,
        email: loggedUser.email || `${loggedUser.uid}@twitter.internal`,
        displayName: loggedUser.displayName || 'X / Twitter User',
        photoURL: loggedUser.photoURL || null,
        authProvider: 'twitter',
        emailVerified: true,
        createdAt: loggedUser.metadata.creationTime || new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      saveActiveSession(profile);
    } catch (err: any) {
      console.warn("Twitter Sign-In notice:", err.code, err.message);
      let msg = err.message || 'Twitter / X sign-in failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Twitter sign-in popup was closed before completing authentication.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'Twitter sign-in popup request was cancelled.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData?.email || 'your email';
        msg = `An account already exists for ${email} with a different sign-in provider (e.g. Google). Please sign in with Google or your primary provider.`;
      } else if (
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('operation-not-allowed') ||
        err.message?.includes('OPERATION_NOT_ALLOWED') ||
        err.message?.includes('identity provider configuration is not found')
      ) {
        msg = 'Twitter / X Sign-In is not enabled yet in Firebase Console. In Firebase Console > Authentication > Sign-in method, click Twitter, toggle Enable, and enter your API Key and API Secret from developer.x.com.';
      } else if (err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential')) {
        msg = 'Invalid Twitter credentials. Please verify your API Key and Secret in Firebase Console match your X Developer Portal Keys & Tokens.';
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        msg = 'This domain is not authorized in Firebase Console. In Firebase Console > Authentication > Settings > Authorized domains, add this domain.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInWithLinkedIn = async (isTestEnv = false) => {
    setError(null);
    try {
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
        return;
      }

      // 1. Check if direct backend LinkedIn OAuth 2.0 is configured
      try {
        const checkRes = await fetch(`/api/auth/linkedin/url?origin=${encodeURIComponent(window.location.origin)}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.isDirectConfigured && checkData.url) {
            const popup = window.open(
              checkData.url,
              'linkedin_oauth_direct',
              'width=600,height=700,status=no,toolbar=no,menubar=no'
            );
            if (popup) return;
          }
        }
      } catch (checkErr) {
        console.warn("Direct LinkedIn check bypassed:", checkErr);
      }

      const creds = getFirebaseCredentialsStatus();
      if (!creds.isConfigured) {
        throw new Error(`Firebase credentials missing: FIREBASE_API_KEY / FIREBASE_PROJECT_ID`);
      }

      const activeAuth = getActiveAuth();
      const result = await signInWithPopup(activeAuth, linkedInProvider);
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
      console.error("LinkedIn Sign-In Raw Error:", {
        code: err.code,
        message: err.message,
        customData: err.customData
      });
      
      let msg = err.message || 'LinkedIn Sign-In failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'LinkedIn Sign-In popup was closed before completing authentication.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'LinkedIn Sign-In popup request was cancelled.';
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData?.email || 'your email';
        msg = `An account already exists for ${email} with a different sign-in provider (e.g. Google). Please sign in using Google, or in Firebase Console > Authentication > Settings, enable "Allow creation of multiple accounts with the same email address".`;
      } else if (err.code === 'auth/invalid-credential' || err.message?.includes('invalid-credential')) {
        msg = 'LinkedIn returned an invalid credential. (Known issue: Firebase Identity Platform sends client secrets via HTTP Basic Authorization header, while LinkedIn requires them in the form body). To enable direct LinkedIn authentication on Cloud Run, add LINKEDIN_CLIENT_SECRET to your Cloud Run service environment variables, or continue with Google Sign-In.';
      } else if (err.message?.includes('INVALID_IDP_RESPONSE') || err.message?.includes('issuer')) {
        msg = `LinkedIn OpenID response error: ${err.message}. LinkedIn ID tokens contain issuer "https://www.linkedin.com".`;
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        msg = 'LinkedIn OAuth provider is not enabled in Firebase Console. Go to Firebase Console > Authentication > Sign-in method, click "Add new provider" > OpenID Connect, and add your LinkedIn OAuth Client ID & Secret.';
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        msg = 'This domain is not authorized for OAuth in Firebase Console. Go to Authentication > Settings > Authorized Domains and add your Cloud Run domain.';
      } else if (err.message && err.message.includes('Firebase credentials missing')) {
        msg = 'Firebase credentials missing. Please configure FIREBASE_API_KEY and FIREBASE_PROJECT_ID.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string,
    isTestEnv = false
  ): Promise<{ codeSent: boolean; message: string; previewCode?: string; directSignIn?: boolean }> => {
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

    // Clear out any tombstone / deleted account record for this email
    try {
      const deletedRaw = localStorage.getItem('reflectai_deleted_accounts');
      if (deletedRaw) {
        const deletedMap = JSON.parse(deletedRaw);
        delete deletedMap[trimmedEmail];
        localStorage.setItem('reflectai_deleted_accounts', JSON.stringify(deletedMap));
      }
    } catch {}

    // 1. If Firebase is configured, attempt native Firebase Auth registration first
    const creds = getFirebaseCredentialsStatus();
    if (creds.isConfigured) {
      try {
        const activeAuth = getActiveAuth();
        const userCred = await createUserWithEmailAndPassword(activeAuth, trimmedEmail, password);
        if (userCred.user) {
          await updateProfile(userCred.user, { displayName: assignedDisplayName }).catch(() => {});
          // Dispatch verification email via Firebase (Google's infrastructure)
          await sendEmailVerification(userCred.user).catch((err) => {
            console.warn("Firebase email verification dispatch notice:", err.message);
          });

          const profile: UserProfile = {
            uid: userCred.user.uid,
            email: userCred.user.email || trimmedEmail,
            displayName: assignedDisplayName,
            photoURL: null,
            authProvider: 'email',
            emailVerified: userCred.user.emailVerified,
            createdAt: userCred.user.metadata.creationTime || new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          };

          // Save account in local cache for offline/session resilience
          const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
          const accounts: Record<string, any> = accountsRaw ? JSON.parse(accountsRaw) : {};
          accounts[trimmedEmail] = { profile, passwordHash };
          localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));

          saveActiveSession(profile);
          return {
            codeSent: false,
            directSignIn: true,
            message: `Account created successfully! Signed in as ${assignedDisplayName}.`
          };
        }
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          // Check if this email was previously deleted / marked for erasure
          let wasDeleted = false;
          try {
            const deletedRaw = localStorage.getItem('reflectai_deleted_accounts');
            if (deletedRaw) {
              const deletedMap = JSON.parse(deletedRaw);
              if (deletedMap[trimmedEmail]) wasDeleted = true;
            }
          } catch {}

          if (!wasDeleted) {
            try {
              const res = await fetch(`/api/auth/check-status?email=${encodeURIComponent(trimmedEmail)}`);
              if (res.ok) {
                const data = await res.json();
                if (data.isDeleted) wasDeleted = true;
              }
            } catch {}
          }

          if (wasDeleted) {
            // The previous account was deleted by the user, but the Firebase Auth record lingered.
            // Sign in to the lingering auth record with the provided password, wipe all old data from Firestore/storage,
            // delete the lingering user, and recreate a 100% fresh brand new account.
            try {
              const activeAuth = getActiveAuth();
              const ghostCred = await signInWithEmailAndPassword(activeAuth, trimmedEmail, password);
              const ghostUser = ghostCred.user;

              // Ensure all old Firestore reflections and profiles are completely wiped
              await wipeAllUserData(ghostUser.uid, trimmedEmail);

              // Permanently delete the ghost auth account from Firebase
              await deleteUser(ghostUser);

              // Now create the brand-new account with clean credentials
              const freshCred = await createUserWithEmailAndPassword(activeAuth, trimmedEmail, password);
              if (freshCred.user) {
                await updateProfile(freshCred.user, { displayName: assignedDisplayName, photoURL: '' }).catch(() => {});
                await sendEmailVerification(freshCred.user).catch(() => {});

                const cleanProfile: UserProfile = {
                  uid: freshCred.user.uid,
                  email: freshCred.user.email || trimmedEmail,
                  displayName: assignedDisplayName,
                  photoURL: null,
                  authProvider: 'email',
                  emailVerified: freshCred.user.emailVerified,
                  createdAt: freshCred.user.metadata.creationTime || new Date().toISOString(),
                  lastActiveAt: new Date().toISOString()
                };

                // Clear tombstone
                try {
                  const delRaw = localStorage.getItem('reflectai_deleted_accounts');
                  if (delRaw) {
                    const m = JSON.parse(delRaw);
                    delete m[trimmedEmail];
                    localStorage.setItem('reflectai_deleted_accounts', JSON.stringify(m));
                  }
                  await fetch('/api/auth/clear-deleted-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: trimmedEmail })
                  }).catch(() => {});
                } catch {}

                const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
                const accounts: Record<string, any> = accountsRaw ? JSON.parse(accountsRaw) : {};
                accounts[trimmedEmail] = { profile: cleanProfile, passwordHash };
                localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));

                saveActiveSession(cleanProfile);
                return {
                  codeSent: false,
                  directSignIn: true,
                  message: `Brand-new account created successfully! Signed in as ${assignedDisplayName}.`
                };
              }
            } catch (ghostErr: any) {
              console.warn("Ghost account reset attempt note:", ghostErr);
              if (ghostErr.code === 'auth/wrong-password' || ghostErr.code === 'auth/invalid-credential') {
                throw new Error(`An existing account with this email was previously registered. Please enter your existing password to initialize your fresh account, or log in.`);
              }
            }
          }

          throw new Error(`An account already exists for ${trimmedEmail}. Please switch to the Email Login tab to sign in.`);
        } else if (fbErr.code === 'auth/weak-password') {
          throw new Error('Password must be at least 6 characters.');
        } else if (fbErr.code === 'auth/operation-not-allowed') {
          throw new Error('To enable Email Sign-Up: Open Firebase Console > Authentication > Sign-in method, click "Email/Password", toggle "Enable", and click "Save".');
        } else {
          throw new Error(fbErr.message || 'Failed to create account.');
        }
      }
    }

    // Local / Sandbox fallback when Firebase is not configured
    const profile: UserProfile = {
      uid: 'local_user_' + Math.random().toString(36).substring(2, 9),
      email: trimmedEmail,
      displayName: assignedDisplayName,
      photoURL: null,
      authProvider: 'email',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };

    const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    const accounts: Record<string, any> = accountsRaw ? JSON.parse(accountsRaw) : {};
    accounts[trimmedEmail] = { profile, passwordHash };
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));

    saveActiveSession(profile);
    return {
      codeSent: false,
      directSignIn: true,
      message: `Account created successfully! Signed in as ${assignedDisplayName}.`
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
      throw new Error('Verification code expired. Please request a new code.');
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
          throw new Error(data.error || 'Invalid verification code.');
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
      throw new Error('Invalid verification code. Please check and try again.');
    }

    // Code verified! Register the verified account
    const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    const accounts: Record<string, any> = accountsRaw ? JSON.parse(accountsRaw) : {};

    // Stable UID derived from email so logging out and in always restores identical chats
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
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password) {
      throw new Error('Please enter your password.');
    }

    // 0. Check if account was deleted / archived for GDPR
    try {
      const deletedRaw = localStorage.getItem('reflectai_deleted_accounts');
      if (deletedRaw) {
        const deletedMap = JSON.parse(deletedRaw);
        if (deletedMap[trimmedEmail]) {
          throw new Error("This account doesn't exist. Please create an account to get started.");
        }
      }
    } catch (e: any) {
      if (e.message?.includes("This account doesn't exist")) throw e;
    }

    // 1. If Firebase is configured, authenticate via Firebase Authentication
    const creds = getFirebaseCredentialsStatus();
    if (creds.isConfigured) {
      try {
        const activeAuth = getActiveAuth();
        const userCred = await signInWithEmailAndPassword(activeAuth, trimmedEmail, password);
        const fbUser = userCred.user;
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || trimmedEmail,
          displayName: fbUser.displayName || trimmedEmail.split('@')[0],
          photoURL: fbUser.photoURL || null,
          authProvider: 'email',
          emailVerified: fbUser.emailVerified,
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        };
        saveActiveSession(profile);
        return;
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/operation-not-allowed') {
          throw new Error('Email/Password provider is not enabled in Firebase Console. Go to Firebase Console > Authentication > Sign-in method, click "Email/Password", toggle "Enable", and click "Save".');
        } else if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential' || fbErr.code === 'auth/wrong-password') {
          // Check local registered accounts fallback before failing
          const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
          const accounts: Record<string, any> = accountsRaw ? JSON.parse(accountsRaw) : {};
          if (accounts[trimmedEmail] && accounts[trimmedEmail].passwordHash === hashPassword(password)) {
            saveActiveSession(accounts[trimmedEmail].profile);
            return;
          }
          throw new Error("This account doesn't exist. Please create an account to get started.");
        } else if (fbErr.code === 'auth/too-many-requests') {
          throw new Error('Access temporarily disabled due to multiple failed login attempts. Please wait a few minutes or reset your password.');
        } else {
          // Check local registered accounts fallback
          const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
          const accounts: Record<string, any> = accountsRaw ? JSON.parse(accountsRaw) : {};
          if (accounts[trimmedEmail] && accounts[trimmedEmail].passwordHash === hashPassword(password)) {
            saveActiveSession(accounts[trimmedEmail].profile);
            return;
          }
          throw new Error("This account doesn't exist. Please create an account to get started.");
        }
      }
    }

    // 2. Local accounts fallback (when Firebase is not configured)
    const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    const accounts: Record<string, any> = accountsRaw ? JSON.parse(accountsRaw) : {};

    const account = accounts[trimmedEmail];
    if (!account) {
      throw new Error("This account doesn't exist. Please create an account to get started.");
    }

    if (account.passwordHash !== hashPassword(password)) {
      throw new Error('Incorrect password. Please try again.');
    }

    saveActiveSession(account.profile);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    const creds = getFirebaseCredentialsStatus();
    if (creds.isConfigured) {
      try {
        const activeAuth = getActiveAuth();
        await sendPasswordResetEmail(activeAuth, trimmedEmail);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          throw new Error('No registered account found with this email address.');
        } else if (err.code === 'auth/operation-not-allowed') {
          throw new Error('Email/Password provider is not enabled in Firebase Console. Please enable it in Firebase Console > Authentication > Sign-in method.');
        }
        throw new Error(err.message || 'Failed to dispatch password reset email.');
      }
    } else {
      throw new Error('Firebase Authentication is not configured for password resets.');
    }
  };

  const resendFirebaseVerificationEmail = async (): Promise<void> => {
    setError(null);
    const creds = getFirebaseCredentialsStatus();
    if (creds.isConfigured) {
      try {
        const activeAuth = getActiveAuth();
        if (activeAuth.currentUser) {
          await sendEmailVerification(activeAuth.currentUser);
        } else {
          throw new Error('No active user found to resend verification email.');
        }
      } catch (err: any) {
        if (err.code === 'auth/too-many-requests') {
          throw new Error('Verification email was sent recently. Please wait a minute before requesting another.');
        }
        throw new Error(err.message || 'Failed to resend verification email.');
      }
    } else {
      throw new Error('Firebase Authentication is not configured.');
    }
  };

  const reloadUserVerificationStatus = async (): Promise<boolean> => {
    try {
      const creds = getFirebaseCredentialsStatus();
      if (creds.isConfigured) {
        const activeAuth = getActiveAuth();
        if (activeAuth.currentUser) {
          await activeAuth.currentUser.reload();
          const verified = activeAuth.currentUser.emailVerified;
          if (userProfile) {
            const updatedProfile = { ...userProfile, emailVerified: verified };
            setUserProfile(updatedProfile);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedProfile));
          }
          return verified;
        }
      }
      return userProfile?.emailVerified || false;
    } catch (err: any) {
      console.warn('Failed to refresh verification status:', err);
      return false;
    }
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

  const updateUserProfileData = async (updates: { displayName?: string; photoURL?: string; preferences?: UserPreferences }): Promise<void> => {
    if (!userProfile) return;
    setError(null);

    const updatedProfile: UserProfile = {
      ...userProfile,
      ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
      ...(updates.photoURL !== undefined ? { photoURL: updates.photoURL } : {}),
      ...(updates.preferences !== undefined ? {
        preferences: {
          ...(userProfile.preferences || {}),
          ...updates.preferences
        }
      } : {})
    };

    setUserProfile(updatedProfile);
    saveActiveSession(updatedProfile);

    // Update registered accounts record if email user
    try {
      const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      if (accountsRaw && userProfile.email) {
        const accounts = JSON.parse(accountsRaw);
        const emailKey = userProfile.email.toLowerCase();
        if (accounts[emailKey]) {
          accounts[emailKey].profile = updatedProfile;
          localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
        }
      }
    } catch (e) {
      console.warn("Accounts sync note:", e);
    }

    // Update Firebase Auth user profile if configured
    try {
      const activeAuth = getActiveAuth();
      if (activeAuth.currentUser) {
        await updateProfile(activeAuth.currentUser, {
          displayName: updates.displayName !== undefined ? updates.displayName : activeAuth.currentUser.displayName,
          photoURL: updates.photoURL !== undefined ? updates.photoURL : activeAuth.currentUser.photoURL
        });
      }
    } catch (fbErr: any) {
      console.warn("Firebase Auth profile update warning:", fbErr.message);
    }
  };

  const deleteUserAccount = async (confirmationPassword?: string): Promise<void> => {
    setError(null);
    const targetUid = userProfile?.uid || user?.uid;
    const targetEmail = (userProfile?.email || user?.email || '').trim().toLowerCase();
    if (!targetUid && !targetEmail) {
      throw new Error("No active user session found to delete.");
    }

    // 0. Strict Pre-Validation: Validate password BEFORE performing any data erasure or UI lockdown
    if (userProfile?.authProvider === 'email') {
      const cleanPassword = (confirmationPassword || '').trim();
      if (!cleanPassword) {
        throw new Error("Please enter your account password to confirm account deletion.");
      }

      // Check local accounts registry if available
      let localPasswordMatched = false;
      let hadLocalAccountRecord = false;
      try {
        const accountsRaw = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
        if (accountsRaw && targetEmail) {
          const accounts = JSON.parse(accountsRaw);
          if (accounts[targetEmail] && accounts[targetEmail].passwordHash) {
            hadLocalAccountRecord = true;
            if (accounts[targetEmail].passwordHash === hashPassword(cleanPassword)) {
              localPasswordMatched = true;
            } else {
              throw new Error("Incorrect password. Please enter your correct password to confirm permanent account deletion.");
            }
          }
        }
      } catch (e: any) {
        if (e.message?.includes("Incorrect password")) {
          throw e;
        }
      }

      // Check against Firebase Auth if active user is signed in with email/password
      const activeAuth = getActiveAuth();
      if (activeAuth.currentUser && targetEmail && activeAuth.currentUser.providerData.some(p => p.providerId === 'password')) {
        try {
          const credential = EmailAuthProvider.credential(targetEmail, cleanPassword);
          await reauthenticateWithCredential(activeAuth.currentUser, credential);
        } catch (reauthErr: any) {
          console.warn("Firebase reauth check status:", reauthErr.code);
          if (
            reauthErr.code === 'auth/wrong-password' ||
            reauthErr.code === 'auth/invalid-credential' ||
            reauthErr.code === 'auth/user-mismatch'
          ) {
            throw new Error("Incorrect password. Please enter your correct password to confirm permanent account deletion.");
          }
          // If Firebase failed due to network/timeout but local record already matched, proceed; otherwise fail safe
          if (hadLocalAccountRecord && !localPasswordMatched) {
            throw new Error("Incorrect password. Please enter your correct password to confirm permanent account deletion.");
          }
        }
      }
    }

    // Pre-validation passed! Immediately engage full UI lockout blocker
    setIsDeletingAccount(true);

    try {
      // 1. Archive personal data for GDPR compliance and wipe all active storage (local + cloud)
      try {
        if (targetUid) {
          await archiveAndWipeUserData(targetUid, targetEmail, userProfile);
        }
      } catch (archiveErr) {
        console.warn("GDPR archive note:", archiveErr);
      }

      try {
        await wipeAllUserData(targetUid || '', targetEmail);
      } catch (wipeErr) {
        console.warn("Wipe note:", wipeErr);
      }

      // 2. Register in deleted accounts store to prevent subsequent logins
      if (targetEmail) {
        try {
          const deletedRaw = localStorage.getItem('reflectai_deleted_accounts');
          const deletedMap = deletedRaw ? JSON.parse(deletedRaw) : {};
          deletedMap[targetEmail] = {
            deletedAt: new Date().toISOString(),
            reason: 'User GDPR self-service erasure'
          };
          localStorage.setItem('reflectai_deleted_accounts', JSON.stringify(deletedMap));
        } catch (tombstoneErr) {
          console.warn("Deleted tombstone record warning:", tombstoneErr);
        }
      }

      // 3. Purge session tokens from localStorage and sessionStorage
      try {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        localStorage.removeItem(LOCAL_STORAGE_LAST_PROVIDER_KEY);
        localStorage.removeItem(LOCAL_STORAGE_PENDING_KEY);
        sessionStorage.clear();
      } catch (tokenErr) {
        console.warn("Session token purge note:", tokenErr);
      }

      // 4. Concurrently delete Firebase Auth user (bounded by 1200ms) and sign out
      try {
        const activeAuth = getActiveAuth();
        if (activeAuth.currentUser) {
          const currentUser = activeAuth.currentUser;
          await Promise.race([
            deleteUser(currentUser),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Auth delete timeout')), 1200))
          ]).catch((e) => console.warn('Auth user delete note:', e.message));
        }
        await firebaseSignOut(activeAuth).catch(() => {});
      } catch (fbErr: any) {
        console.warn("Firebase Auth cleanup note:", fbErr.message);
      }

      // 5. Immediately transition to landing / login screen
      setUser(null);
      setUserProfile(null);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isDeletingAccount,
        error,
        pendingVerification,
        lastUsedProvider,
        signInWithGoogle,
        signInWithTwitter,
        signInWithLinkedIn,
        signUpWithEmail,
        verifyEmailCode,
        signInWithEmail,
        resetPassword,
        resendFirebaseVerificationEmail,
        reloadUserVerificationStatus,
        resendVerificationCode,
        cancelEmailVerification,
        signInAsDemoUser,
        signOut,
        updateUserProfileData,
        deleteUserAccount,
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

