type CollectionMap = Record<string, Record<string, any>>;

type Listener = (collections?: string[]) => void;

const DB_KEY = 'ecosystem_oss_db_v1';
const CHANNEL_NAME = 'ecosystem_oss_db_channel';

let listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;

function canUseWindow(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function ensureChannel() {
  if (!canUseWindow() || typeof BroadcastChannel === 'undefined' || channel) {
    return;
  }

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event) => {
    const changed = (event?.data?.changedCollections as string[] | undefined) || [];
    listeners.forEach((listener) => listener(changed));
  };
}

function parseDb(raw: string | null): CollectionMap {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function readDb(): CollectionMap {
  if (!canUseWindow()) {
    return {};
  }
  return parseDb(localStorage.getItem(DB_KEY));
}

export function writeDb(db: CollectionMap, changedCollections: string[] = []) {
  if (!canUseWindow()) {
    return;
  }

  localStorage.setItem(DB_KEY, JSON.stringify(db));

  listeners.forEach((listener) => listener(changedCollections));

  if (channel) {
    channel.postMessage({ changedCollections });
  }
}

export function subscribeDb(listener: Listener): () => void {
  ensureChannel();
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === DB_KEY) {
      listener();
    }
  };

  if (canUseWindow()) {
    window.addEventListener('storage', handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (canUseWindow()) {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

export function upsertDoc(collectionName: string, id: string, payload: any) {
  const db = readDb();
  const collection = db[collectionName] || {};
  collection[id] = {
    ...(payload || {}),
    __updatedAt: Date.now(),
    __deleted: false,
  };
  db[collectionName] = collection;
  writeDb(db, [collectionName]);
}

export function removeDoc(collectionName: string, id: string) {
  const db = readDb();
  const collection = db[collectionName] || {};
  const existing = collection[id] || {};
  collection[id] = {
    ...existing,
    __deleted: true,
    __updatedAt: Date.now(),
  };
  db[collectionName] = collection;
  writeDb(db, [collectionName]);
}
