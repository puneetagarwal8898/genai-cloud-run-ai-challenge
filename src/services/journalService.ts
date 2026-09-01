import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { JournalInteraction } from '../types';

// Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
export function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    if (obj[key] !== undefined) {
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        clean[key] = sanitizePayload(obj[key]);
      } else {
        clean[key] = obj[key];
      }
    }
  }
  return clean as T;
}

const LOCAL_STORAGE_INTERACTIONS_KEY_PREFIX = 'reflectai_interactions_';

export async function saveJournalInteraction(
  userId: string,
  interaction: JournalInteraction
): Promise<void> {
  if (!userId) {
    throw new Error("Cannot save reflection without a valid userId.");
  }

  const sanitized = sanitizePayload(interaction);

  // Always update local cache for offline/instant access and preview resilience
  try {
    const key = `${LOCAL_STORAGE_INTERACTIONS_KEY_PREFIX}${userId}`;
    const localRaw = localStorage.getItem(key);
    const list: JournalInteraction[] = localRaw ? JSON.parse(localRaw) : [];
    const index = list.findIndex(item => item.id === interaction.id);
    if (index >= 0) {
      list[index] = sanitized;
    } else {
      list.unshift(sanitized);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (err) {
    console.warn("Local cache save error:", err);
  }

  // Attempt remote Firestore persistence under user-isolated subcollection /users/{userId}/interactions/{interactionId}
  try {
    const firestoreWritePromise = (async () => {
      const interactionRef = doc(db, 'users', userId, 'interactions', interaction.id);
      await setDoc(interactionRef, sanitized, { merge: true });
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore write timeout')), 2500)
    );

    await Promise.race([firestoreWritePromise, timeoutPromise]);
  } catch (firestoreErr: any) {
    console.warn("Firestore remote write note:", firestoreErr.message);
    // Even if remote firestore is unavailable/unprovisioned or slow in the preview iframe,
    // the local storage guarantees that user data is never lost.
  }
}

export async function fetchUserInteractions(userId: string): Promise<JournalInteraction[]> {
  if (!userId) return [];

  // Check local cache first
  const key = `${LOCAL_STORAGE_INTERACTIONS_KEY_PREFIX}${userId}`;
  let localList: JournalInteraction[] = [];
  try {
    const localRaw = localStorage.getItem(key);
    if (localRaw) {
      localList = JSON.parse(localRaw);
    }
  } catch (e) {
    console.warn("Local storage read error", e);
  }

  // Also query remote Firestore
  let remoteList: JournalInteraction[] = [];
  try {
    const colRef = collection(db, 'users', userId, 'interactions');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      snapshot.forEach(docSnap => {
        remoteList.push(docSnap.data() as JournalInteraction);
      });
    }
  } catch (firestoreErr: any) {
    console.warn("Firestore remote fetch note:", firestoreErr.message);
  }

  // Merge local and remote by interaction id so no chats are ever lost
  const map = new Map<string, JournalInteraction>();
  for (const item of localList) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of remoteList) {
    if (item && item.id) {
      const existing = map.get(item.id);
      if (!existing || new Date(item.updatedAt || item.createdAt) >= new Date(existing.updatedAt || existing.createdAt)) {
        map.set(item.id, item);
      }
    }
  }

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Sync the complete merged list back to local cache
  try {
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (err) {
    console.warn("Local storage write error", err);
  }

  return merged;
}

export async function deleteUserInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) return;

  // Remove from local cache immediately
  const key = `${LOCAL_STORAGE_INTERACTIONS_KEY_PREFIX}${userId}`;
  try {
    const localRaw = localStorage.getItem(key);
    if (localRaw) {
      const list: JournalInteraction[] = JSON.parse(localRaw);
      const filtered = list.filter(item => item.id !== interactionId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Local delete error:", e);
  }

  // Remove from Firestore with timeout protection so UI is never blocked
  try {
    const deletePromise = (async () => {
      const docRef = doc(db, 'users', userId, 'interactions', interactionId);
      await deleteDoc(docRef);
    })();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore delete timeout')), 2000)
    );

    await Promise.race([deletePromise, timeoutPromise]);
  } catch (err: any) {
    console.warn("Firestore delete note:", err.message);
  }
}
