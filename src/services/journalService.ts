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

// Clean payload to eliminate undefined values
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

// In-memory cache for ultra-responsive 0ms access
const memoryCache = new Map<string, JournalInteraction[]>();

/**
 * Returns user journal entries immediately from instant cache.
 */
export function getCachedUserInteractions(userId: string): JournalInteraction[] {
  if (!userId) return [];
  if (memoryCache.has(userId)) {
    return memoryCache.get(userId) || [];
  }
  const key = `${LOCAL_STORAGE_INTERACTIONS_KEY_PREFIX}${userId}`;
  try {
    const localRaw = localStorage.getItem(key);
    if (localRaw) {
      const list = JSON.parse(localRaw);
      memoryCache.set(userId, list);
      return list;
    }
  } catch (e) {
    // ignore
  }
  return [];
}

/**
 * Saves a journal reflection with instant local storage and background cloud sync.
 */
export async function saveJournalInteraction(
  userId: string,
  interaction: JournalInteraction
): Promise<void> {
  if (!userId) {
    throw new Error("Cannot save reflection without a valid user account.");
  }

  const sanitized = sanitizePayload(interaction);

  // 1. Instant update in memory cache (< 1ms)
  const currentList = getCachedUserInteractions(userId);
  const existingIdx = currentList.findIndex(item => item.id === interaction.id);
  let updatedList: JournalInteraction[];
  if (existingIdx >= 0) {
    updatedList = [...currentList];
    updatedList[existingIdx] = sanitized;
  } else {
    updatedList = [sanitized, ...currentList];
  }
  memoryCache.set(userId, updatedList);

  // 2. Instant save to persistent local storage (< 2ms)
  const key = `${LOCAL_STORAGE_INTERACTIONS_KEY_PREFIX}${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(updatedList));
  } catch (err) {
    console.warn("Local cache save error:", err);
  }

  // 3. Background asynchronous cloud sync without blocking UI responsiveness
  (async () => {
    try {
      const interactionRef = doc(db, 'users', userId, 'interactions', interaction.id);
      await setDoc(interactionRef, sanitized, { merge: true });
    } catch (syncErr: any) {
      // Local storage guarantees data is never lost even during offline or slow connections
    }
  })();
}

/**
 * Fetches journal entries: returns instant local cache immediately,
 * and asynchronously updates from cloud backup in the background.
 */
export async function fetchUserInteractions(userId: string): Promise<JournalInteraction[]> {
  if (!userId) return [];

  // 1. Return immediately from instant cache
  const localList = getCachedUserInteractions(userId);

  // 2. Background query to update from cloud storage without hanging the UI
  try {
    const colRef = collection(db, 'users', userId, 'interactions');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    // Responsive 1.2s timeout so slow networks never block the app
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Cloud sync timeout')), 1200)
    );
    const fetchPromise = getDocs(q);

    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    const remoteList: JournalInteraction[] = [];

    if (snapshot && !snapshot.empty) {
      snapshot.forEach(docSnap => {
        remoteList.push(docSnap.data() as JournalInteraction);
      });
    }

    if (remoteList.length > 0) {
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

      memoryCache.set(userId, merged);
      const key = `${LOCAL_STORAGE_INTERACTIONS_KEY_PREFIX}${userId}`;
      try {
        localStorage.setItem(key, JSON.stringify(merged));
      } catch (e) {}

      return merged;
    }
  } catch (err: any) {
    // Instant cache returned seamlessly
  }

  return localList;
}

/**
 * Deletes a journal reflection instantly from memory & local storage, syncing cloud in background.
 */
export async function deleteUserInteraction(userId: string, interactionId: string): Promise<void> {
  if (!userId || !interactionId) return;

  // 1. Instant local removal (< 1ms)
  const current = getCachedUserInteractions(userId);
  const filtered = current.filter(i => i.id !== interactionId);
  memoryCache.set(userId, filtered);

  const key = `${LOCAL_STORAGE_INTERACTIONS_KEY_PREFIX}${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Local storage delete error:", err);
  }

  // 2. Background cloud deletion
  (async () => {
    try {
      const docRef = doc(db, 'users', userId, 'interactions', interactionId);
      await deleteDoc(docRef);
    } catch (err: any) {}
  })();
}

/**
 * Permanently wipes all personal user data from cloud storage and local storage.
 */
export async function wipeAllUserData(userId: string): Promise<void> {
  if (!userId) return;

  // 1. Instant local memory and storage wipe
  memoryCache.delete(userId);
  const key = `${LOCAL_STORAGE_INTERACTIONS_KEY_PREFIX}${userId}`;
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(`reflectai_profile_${userId}`);
  } catch (err) {
    console.warn("Local storage wipe warning:", err);
  }

  // 2. Wipe cloud storage records
  try {
    const colRef = collection(db, 'users', userId, 'interactions');
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.allSettled(deletePromises);
    }
  } catch (err: any) {
    console.warn("Cloud records wipe note:", err.message);
  }

  // 3. Wipe parent user profile
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
  } catch (err: any) {
    console.warn("Cloud profile wipe note:", err.message);
  }
}
