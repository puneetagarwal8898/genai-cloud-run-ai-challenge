import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Default project configuration fallback (can be overridden by VITE_FIREBASE_* env vars)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyDemoForDevelopmentModeOnly12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "reflectai-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "reflectai-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "reflectai-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
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
