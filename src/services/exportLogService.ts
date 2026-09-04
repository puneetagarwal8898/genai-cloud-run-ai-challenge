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

// Retention duration: 1 full year (365 days)
export const EXPORT_HISTORY_RETENTION_MS = 365 * 24 * 60 * 60 * 1000;

// In-memory cache for fast local responsiveness
const memoryExportCache = new Map<string, ExportDownloadRecord[]>();

/**
 * Validates if an export record is within the 1-year retention window.
 */
function isWithinOneYear(downloadedAt: string): boolean {
  if (!downloadedAt) return false;
  const timestamp = new Date(downloadedAt).getTime();
  if (isNaN(timestamp)) return true; // Keep if unparseable
  return Date.now() - timestamp <= EXPORT_HISTORY_RETENTION_MS;
}

/**
 * Returns the download history for a user from memory/localStorage retained within 1 year.
 */
export function getCachedExportHistory(userId: string): ExportDownloadRecord[] {
  if (!userId) return [];
  if (memoryExportCache.has(userId)) {
    const cached = memoryExportCache.get(userId) || [];
    return cached.filter((item) => isWithinOneYear(item.downloadedAt));
  }
  const key = `${LOCAL_STORAGE_EXPORTS_KEY_PREFIX}${userId}`;
  try {
    const localRaw = localStorage.getItem(key);
    if (localRaw) {
      const parsed: ExportDownloadRecord[] = JSON.parse(localRaw);
      const activeRecords = Array.isArray(parsed)
        ? parsed.filter((item) => isWithinOneYear(item.downloadedAt))
        : [];
      memoryExportCache.set(userId, activeRecords);
      return activeRecords;
    }
  } catch (err) {
    console.warn('Error reading local export cache:', err);
  }
  return [];
}

/**
 * Loads export records from Firestore and synchronizes with local storage,
 * preserving up to 1 year of download history.
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
      const downloadedAt = data.downloadedAt || new Date().toISOString();
      if (isWithinOneYear(downloadedAt)) {
        cloudRecords.push({
          id: docSnap.id,
          fileName: data.fileName || 'ReflectAI-Reflections.pdf',
          filePassword: data.filePassword || undefined,
          downloadedAt,
          entriesCount: typeof data.entriesCount === 'number' ? data.entriesCount : 0,
          fileSizeBytes: data.fileSizeBytes,
          fileSizeFormatted: data.fileSizeFormatted,
          securityMethod: data.securityMethod || 'Standard Encrypted'
        });
      }
    });

    // Merge cloud records and cached records by ID to never lose local entries
    const recordMap = new Map<string, ExportDownloadRecord>();
    cloudRecords.forEach((rec) => recordMap.set(rec.id, rec));
    cached.forEach((rec) => {
      if (!recordMap.has(rec.id)) {
        recordMap.set(rec.id, rec);
      }
    });

    const mergedRecords = Array.from(recordMap.values())
      .filter((rec) => isWithinOneYear(rec.downloadedAt))
      .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());

    memoryExportCache.set(userId, mergedRecords);
    try {
      localStorage.setItem(`${LOCAL_STORAGE_EXPORTS_KEY_PREFIX}${userId}`, JSON.stringify(mergedRecords));
    } catch (e) {
      console.warn('Failed to cache merged exports to localStorage:', e);
    }
    return mergedRecords;
  } catch (err: any) {
    console.warn('Firestore exports fetch note (using local cache):', err.message);
    return cached;
  }
}

/**
 * Records a new PDF export download both locally and in Firestore.
 * Local save and event dispatching are instantaneous; Firestore sync is non-blocking.
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

  // 1. Update local cache immediately
  const existing = getCachedExportHistory(userId);
  const updated = [fullRecord, ...existing.filter((item) => item.id !== recordId)]
    .filter((item) => isWithinOneYear(item.downloadedAt));
  memoryExportCache.set(userId, updated);
  try {
    localStorage.setItem(`${LOCAL_STORAGE_EXPORTS_KEY_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save export to localStorage:', e);
  }

  // 2. Dispatch global event immediately so UI listeners (e.g. ExportDownloadHistory) update instantly
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('reflectai_export_recorded', {
        detail: { userId, record: fullRecord }
      })
    );
  }

  // 3. Persist to Firestore asynchronously in the background with a 3-second safety boundary
  const { isConfigured } = getFirebaseCredentialsStatus();
  if (isConfigured && db) {
    const saveToFirestore = async () => {
      try {
        const exportDocRef = doc(db, 'users', userId, 'exports', recordId);
        const cleanPayload = sanitizePayload(fullRecord);
        await setDoc(exportDocRef, cleanPayload);
      } catch (err: any) {
        console.warn('Firestore export record write background note:', err.message);
      }
    };
    // Fire with safety race so it never halts execution
    Promise.race([
      saveToFirestore(),
      new Promise((resolve) => setTimeout(resolve, 3000))
    ]).catch((e) => console.warn('Firestore background write timeout:', e));
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
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Export wipe timeout (1000ms exceeded)')), 1000)
      );
      const snapshot = await Promise.race([getDocs(exportsRef), timeoutPromise]);
      if (snapshot && !snapshot.empty) {
        const deletePromises = snapshot.docs.map((d) =>
          Promise.race([
            deleteDoc(d.ref),
            new Promise<void>((res) => setTimeout(res, 600))
          ])
        );
        await Promise.all(deletePromises);
        console.log(`[Cloud Wipe] Deleted all export records for ${userId} in Firestore.`);
      }
    } catch (err: any) {
      console.warn('Cloud export history wipe note:', err.message);
    }
  }
}
