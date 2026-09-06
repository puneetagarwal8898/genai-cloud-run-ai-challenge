import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Global runtime config declaration
declare global {
  interface Window {
    __FIREBASE_CONFIG__?: {
      apiKey?: string;
      authDomain?: string;
      projectId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      appId?: string;
    };
  }
}

// Resolve configuration dynamically to guarantee correct runtime binding
export function getResolvedFirebaseConfig() {
  const runtime = typeof window !== 'undefined' ? window.__FIREBASE_CONFIG__ : undefined;
  const apiKey = runtime?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || "";
  const projectId = runtime?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || "";
  
  return {
    apiKey: apiKey || "UNCONFIGURED_FIREBASE_API_KEY",
    authDomain: runtime?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : "unconfigured.firebaseapp.com"),
    projectId: projectId || "unconfigured-project",
    storageBucket: runtime?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : "unconfigured.appspot.com"),
    messagingSenderId: runtime?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
    appId: runtime?.appId || import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
  };
}

export function getFirebaseCredentialsStatus() {
  const config = getResolvedFirebaseConfig();
  const isValid = Boolean(
    config.apiKey && 
    config.apiKey !== "UNCONFIGURED_FIREBASE_API_KEY" && 
    config.projectId && 
    config.projectId !== "unconfigured-project"
  );
  
  return {
    isConfigured: isValid,
    hasApiKey: Boolean(config.apiKey && config.apiKey !== "UNCONFIGURED_FIREBASE_API_KEY"),
    hasProjectId: Boolean(config.projectId && config.projectId !== "unconfigured-project"),
    apiKey: config.apiKey,
    projectId: config.projectId,
    authDomain: config.authDomain
  };
}

export const isFirebaseConfigured = getFirebaseCredentialsStatus().isConfigured;

function initOrGetApp() {
  const config = getResolvedFirebaseConfig();
  const apps = getApps();
  if (apps.length > 0) {
    const existing = apps[0];
    // If existing app was initialized with unconfigured dummy key but runtime now has the real key, re-init
    if (existing.options.apiKey === "UNCONFIGURED_FIREBASE_API_KEY" && config.apiKey !== "UNCONFIGURED_FIREBASE_API_KEY") {
      try {
        return initializeApp(config, 'reflectai-active');
      } catch (e) {
        return existing;
      }
    }
    return existing;
  }
  return initializeApp(config);
}

export const app = initOrGetApp();
export const auth = getAuth(app);

export function getActiveAuth() {
  const activeApp = initOrGetApp();
  return getAuth(activeApp);
}
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const facebookProvider = new FacebookAuthProvider();
export const linkedInProvider = new OAuthProvider('linkedin.com');

export const db = getFirestore(app);

// Connectivity validation helper as defined in Firebase Skill
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    // Only attempt server probe if real project configured
    if (import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      await getDocFromServer(doc(db, 'test', 'connection'));
    }
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client appears offline. Ensure Firebase project is active.");
    }
    return false;
  }
}
