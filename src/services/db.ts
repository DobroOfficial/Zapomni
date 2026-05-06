import { openDB, IDBPDatabase } from 'idb';
import { Capture, MapData } from '../types';

const DB_NAME = 'ZapomniDB';
const DB_VERSION = 1;

interface ZapomniDB extends IDBPDatabase {
  captures: Capture;
  maps: MapData;
}

let db: IDBPDatabase<ZapomniDB>;

export const initDB = async () => {
  if (db) return db;
  db = await openDB<ZapomniDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('captures', { keyPath: 'id' });
      db.createObjectStore('maps', { keyPath: 'id' });
    },
  });
  return db;
};

export const getAllCaptures = async () => (await initDB()).getAll('captures');
export const addCapture = async (capture: Capture) => (await initDB()).put('captures', capture);
export const deleteCapture = async (id: string) => (await initDB()).delete('captures', id);
export const getAllMaps = async () => (await initDB()).getAll('maps');
export const addMap = async (map: MapData) => (await initDB()).put('maps', map);
export const deleteMap = async (id: string) => (await initDB()).delete('maps', id);

export const deleteCapturesByMapId = async (mapId: string) => {
  const db = await initDB();
  const tx = db.transaction('captures', 'readwrite');
  const store = tx.objectStore('captures');
  const allCaptures = await store.getAll();
  const toDelete = allCaptures.filter(c => c.mapId === mapId);
  for (const capture of toDelete) {
    await store.delete(capture.id);
  }
  await tx.done;
};

export const unassignCapturesByMapId = async (mapId: string) => {
  const db = await initDB();
  const tx = db.transaction('captures', 'readwrite');
  const store = tx.objectStore('captures');
  const allCaptures = await store.getAll();
  const toUpdate = allCaptures.filter(c => c.mapId === mapId);
  for (const capture of toUpdate) {
    capture.mapId = 'unassigned';
    await store.put(capture);
  }
  await tx.done;
};

export const clearAllData = async () => {
  const db = await initDB();
  const tx = db.transaction(['captures', 'maps'], 'readwrite');
  await tx.objectStore('captures').clear();
  await tx.objectStore('maps').clear();
  await tx.done;
};
