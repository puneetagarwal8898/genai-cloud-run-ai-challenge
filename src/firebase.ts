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

// Resolve configuration from runtime server injection or build-time environment variables
const runtimeConfig = typeof window !== 'undefined' ? window.__FIREBASE_CONFIG__ : undefined;

const firebaseApiKey = runtimeConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || "";
const firebaseProjectId = runtimeConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || "";

export const isFirebaseConfigured = Boolean(firebaseApiKey && firebaseProjectId);

const firebaseConfig = {
  apiKey: firebaseApiKey || "UNCONFIGURED_FIREBASE_API_KEY",
  authDomain: runtimeConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseProjectId ? `${firebaseProjectId}.firebaseapp.com` : "unconfigured.firebaseapp.com"),
  projectId: firebaseProjectId || "unconfigured-project",
  storageBucket: runtimeConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseProjectId ? `${firebaseProjectId}.appspot.com` : "unconfigured.appspot.com"),
  messagingSenderId: runtimeConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: runtimeConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
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
