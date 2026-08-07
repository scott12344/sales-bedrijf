/**
 * Opslag in de browser (IndexedDB). Alles blijft op het apparaat: er gaat geen
 * enkel gegeven naar een server. Foto's worden als blob bewaard, de rest als
 * één toestandsobject.
 */

import type { AppState, MediaRecord } from '../types';

const DB_NAAM = 'kozijn-marketing';
const DB_VERSIE = 1;
const STORE_STAAT = 'staat';
const STORE_MEDIA = 'media';

let dbBelofte: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbBelofte) return dbBelofte;
  dbBelofte = new Promise((resolve, reject) => {
    const verzoek = indexedDB.open(DB_NAAM, DB_VERSIE);
    verzoek.onupgradeneeded = () => {
      const db = verzoek.result;
      if (!db.objectStoreNames.contains(STORE_STAAT)) db.createObjectStore(STORE_STAAT);
      if (!db.objectStoreNames.contains(STORE_MEDIA)) db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
    };
    verzoek.onsuccess = () => resolve(verzoek.result);
    verzoek.onerror = () => reject(verzoek.error);
  });
  return dbBelofte;
}

function transactie<T>(store: string, modus: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, modus);
        const verzoek = fn(tx.objectStore(store));
        verzoek.onsuccess = () => resolve(verzoek.result);
        verzoek.onerror = () => reject(verzoek.error);
      }),
  );
}

export const bewaarStaat = (staat: AppState): Promise<IDBValidKey> =>
  transactie(STORE_STAAT, 'readwrite', (s) => s.put(staat, 'huidig'));

export const laadStaat = (): Promise<AppState | undefined> =>
  transactie<AppState | undefined>(STORE_STAAT, 'readonly', (s) => s.get('huidig'));

export const bewaarMedia = (media: MediaRecord): Promise<IDBValidKey> =>
  transactie(STORE_MEDIA, 'readwrite', (s) => s.put(media));

export const laadMedia = (id: string): Promise<MediaRecord | undefined> =>
  transactie<MediaRecord | undefined>(STORE_MEDIA, 'readonly', (s) => s.get(id));

export const alleMedia = (): Promise<MediaRecord[]> =>
  transactie<MediaRecord[]>(STORE_MEDIA, 'readonly', (s) => s.getAll());

export const verwijderMedia = (id: string): Promise<undefined> =>
  transactie<undefined>(STORE_MEDIA, 'readwrite', (s) => s.delete(id));

/** Beschikbaarheid controleren — in privémodus kan IndexedDB geblokkeerd zijn. */
export async function opslagWerkt(): Promise<boolean> {
  try {
    await open();
    return true;
  } catch {
    return false;
  }
}
