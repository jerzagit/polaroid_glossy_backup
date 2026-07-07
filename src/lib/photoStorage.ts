const DB_NAME = 'polaroid_photo_store';
const DB_VERSION = 1;
const STORE_NAME = 'cart_photos';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface StoredPhoto {
  id: string;
  fileName: string;
  fileType: string;
  fileBuffer: ArrayBuffer;
  preview: string;
  customText?: string;
  uploading?: boolean;
}

export async function saveCartPhotos(cartId: string, photos: Array<{
  id: string;
  file?: File;
  preview?: string;
  customText?: string;
  uploading?: boolean;
}>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const serialised = photos
      .filter(p => p.file)
      .map(p => ({
        id: p.id,
        fileName: p.file!.name,
        fileType: p.file!.type,
        fileBuffer: p.file!,
        preview: p.preview || '',
        customText: p.customText,
        uploading: p.uploading,
      }));

    if (serialised.length > 0) {
      store.put(serialised, cartId);
    } else {
      store.delete(cartId);
    }

    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadCartPhotos(cartId: string): Promise<Map<string, { file: File; preview: string }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(cartId);

    request.onsuccess = () => {
      db.close();
      const result = new Map<string, { file: File; preview: string }>();
      const data = request.result as StoredPhoto[] | undefined;
      if (Array.isArray(data)) {
        for (const item of data) {
          const file = new File([item.fileBuffer], item.fileName, { type: item.fileType });
          result.set(item.id, { file, preview: item.preview });
        }
      }
      resolve(result);
    };

    request.onerror = () => { db.close(); reject(request.error); };
  });
}

export async function removeCartPhotos(cartId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(cartId);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function clearAllCartPhotos(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
