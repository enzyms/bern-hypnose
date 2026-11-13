/**
 * Keeps the one pending recording of /record/ in IndexedDB until the upload is confirmed,
 * so a reload, a network drop or a closed tab never loses Janine's take.
 */

export type PendingRecording = {
    blob: Blob;
    mimeType: string;
    durationSeconds: number;
    createdAt: string; // ISO timestamp, also the basis of the R2 key
    fileName?: string; // set when the audio came from "Datei wählen"
};

const DB_NAME = 'bh-aufnahme';
const STORE = 'pending';
const KEY = 'current';

function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await open();
    try {
        return await new Promise<T>((resolve, reject) => {
            const transaction = db.transaction(STORE, mode);
            const request = action(transaction.objectStore(STORE));
            transaction.oncomplete = () => resolve(request.result as T);
            transaction.onerror = () => reject(transaction.error);
        });
    } finally {
        db.close();
    }
}

export const savePending = (recording: PendingRecording) => run<void>('readwrite', (s) => s.put(recording, KEY));
export const loadPending = () => run<PendingRecording | undefined>('readonly', (s) => s.get(KEY));
export const clearPending = () => run<void>('readwrite', (s) => s.delete(KEY));
