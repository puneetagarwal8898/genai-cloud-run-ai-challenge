import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, getFirebaseCredentialsStatus } from '../firebase';
import { ExportDownloadRecord } from '../types';
import { sanitizePayload } from './journalService';

const LOCAL_STORAGE_EXPORTS_KEY_PREFIX = 'reflectai_exports_';

// In-memory cache for fast local responsiveness
const memoryExportCache = new Map<string, ExportDownloadRecord[]>();

/**
 * Returns the download history for a user from memory/localStorage.
 */
export function getCachedExportHistory(userId: string): ExportDownloadRecord[] {
  if (!userId) return [];
  if (memoryExportCache.has(userId)) {
    return memoryExportCache.get(userId) || [];
  }
  const key = `${LOCAL_STORAGE_EXPORTS_KEY_PREFIX}${userId}`;
  try {
    const localRaw = localStorage.getItem(key);
    if (localRaw) {
      const parsed: ExportDownloadRecord[] = JSON.parse(localRaw);
      memoryExportCache.set(userId, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading local export cache:', err);
  }
  return [];
}

/**
 * Loads export records from Firestore and synchronizes with local storage.
 */
export async function fetchExportHistory(userId: string): Promise<ExportDownloadRecord[]> {
  if (!userId) return [];

  // Instant local load
  const cached = getCachedExportHistory(userId);

  const { isConfigured } = getFirebaseCredentialsStatus();
  if (!isConfigured || !db) {
    return cached;
  }

  try {
    const exportsRef = collection(db, 'users', userId, 'exports');
    const q = query(exportsRef, orderBy('downloadedAt', 'desc'));
    const snapshot = await getDocs(q);

    const cloudRecords: ExportDownloadRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      cloudRecords.push({
        id: docSnap.id,
        fileName: data.fileName || 'ReflectAI-Reflections.pdf',
        filePassword: data.filePassword || undefined,
        downloadedAt: data.downloadedAt || new Date().toISOString(),
        entriesCount: typeof data.entriesCount === 'number' ? data.entriesCount : 0,
        fileSizeBytes: data.fileSizeBytes,
        fileSizeFormatted: data.fileSizeFormatted,
        securityMethod: data.securityMethod || 'Standard Encrypted'
      });
    });

    if (cloudRecords.length > 0) {
      memoryExportCache.set(userId, cloudRecords);
      localStorage.setItem(`${LOCAL_STORAGE_EXPORTS_KEY_PREFIX}${userId}`, JSON.stringify(cloudRecords));
      return cloudRecords;
    }
    return cached;
  } catch (err: any) {
    console.warn('Firestore exports fetch note (using local cache):', err.message);
    return cached;
  }
}

/**
 * Records a new PDF export download both locally and in Firestore.
 */
export async function recordExportDownload(
  userId: string,
  recordData: Omit<ExportDownloadRecord, 'id'>
): Promise<ExportDownloadRecord> {
  const recordId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const fullRecord: ExportDownloadRecord = {
    ...recordData,
    id: recordId
  };

  // 1. Update local cache
  const existing = getCachedExportHistory(userId);
  const updated = [fullRecord, ...existing.filter((item) => item.id !== recordId)];
  memoryExportCache.set(userId, updated);
  try {
    localStorage.setItem(`${LOCAL_STORAGE_EXPORTS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save export to localStorage:', e);
  }

  // 2. Persist to Firestore if online & configured
  const { isConfigured } = getFirebaseCredentialsStatus();
  if (isConfigured && db) {
    try {
      const exportDocRef = doc(db, 'users', userId, 'exports', recordId);
      const cleanPayload = sanitizePayload(fullRecord);
      await setDoc(exportDocRef, cleanPayload);
    } catch (err: any) {
      console.warn('Firestore export record write note:', err.message);
    }
  }

  // 3. Dispatch global event to instantly notify listeners (e.g. ExportDownloadHistory components)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('reflectai_export_recorded', {
        detail: { userId, record: fullRecord }
      })
    );
  }

  return fullRecord;
}

/**
 * Completely purges all export history records for a user from cache, localStorage, and Firestore.
 */
export async function wipeUserExportHistory(userId: string): Promise<void> {
  if (!userId) return;

  // Clear memory and localStorage
  memoryExportCache.delete(userId);
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_EXPORTS_KEY_PREFIX}${userId}`);
  } catch (e) {
    console.warn('Failed to clear export history from localStorage:', e);
  }

  // Clear Firestore exports collection
  const { isConfigured } = getFirebaseCredentialsStatus();
  if (isConfigured && db) {
    try {
      const exportsRef = collection(db, 'users', userId, 'exports');
      const snapshot = await getDocs(exportsRef);
      const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      console.log(`[Cloud Wipe] Deleted all export records for ${userId} in Firestore.`);
    } catch (err: any) {
      console.warn('Cloud export history wipe note:', err.message);
    }
  }
}
