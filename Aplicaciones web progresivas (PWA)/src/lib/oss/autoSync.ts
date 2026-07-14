import { auth } from './auth';
import { readDb, writeDb } from './store';

const BACKEND_URL_KEY = 'ecosync_backend_url';
const DEVICE_ID_KEY = 'ecosystem_oss_device_id';
const LEGACY_DEVICE_ID_KEY = 'arturo_device_id';
const DEVICE_NAME_KEY = 'ecosync_device_name';
const PAIRING_KEY_KEY = 'ecosync_pairing_key';
const SYNC_SCOPE_KEY = 'ecosync_sync_scope_v1';

export interface SyncScopeConfig {
  mode: 'all' | 'custom';
  collections: string[];
}

function normalizeCollections(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter((value) => value.length > 0)
    )
  );
}

export function getOrCreateSyncDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  // Migrate the previous device key used by some views to keep identity stable.
  const legacy = localStorage.getItem(LEGACY_DEVICE_ID_KEY);
  if (legacy) {
    localStorage.setItem(DEVICE_ID_KEY, legacy);
    return legacy;
  }

  const created = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEVICE_ID_KEY, created);
  localStorage.setItem(LEGACY_DEVICE_ID_KEY, created);
  return created;
}

function inferDeviceDisplayName(): string {
  const ua = window.navigator.userAgent;
  let deviceName = 'Equipo';

  if (/android/i.test(ua)) {
    const match = ua.match(/;\s+([^;)]+)\s+Build\//i) || ua.match(/\bAndroid[^;]*;\s+([^;)]+)/i);
    if (match && match[1]) {
      deviceName = match[1].trim();
    } else {
      deviceName = 'Dispositivo Android';
    }
  } else if (/ipad|iphone|ipod/i.test(ua)) {
    if (/iphone/i.test(ua)) deviceName = 'iPhone';
    else if (/ipad/i.test(ua)) deviceName = 'iPad';
    else deviceName = 'Apple Device';
  } else if (/macintosh/i.test(ua)) {
    deviceName = 'Mac';
  } else if (/windows/i.test(ua)) {
    deviceName = 'PC Windows';
  } else if (/linux/i.test(ua)) {
    deviceName = 'PC Linux';
  }

  const deviceIdSuffix = getOrCreateSyncDeviceId().slice(-4).toUpperCase();
  return `${deviceName} [${deviceIdSuffix}]`;
}

export function getSyncDeviceDisplayName(): string {
  const saved = (localStorage.getItem(DEVICE_NAME_KEY) || '').trim();
  if (saved) {
    return saved;
  }

  const inferred = inferDeviceDisplayName();
  localStorage.setItem(DEVICE_NAME_KEY, inferred);
  return inferred;
}

export function setSyncDeviceDisplayName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    localStorage.removeItem(DEVICE_NAME_KEY);
    return;
  }
  localStorage.setItem(DEVICE_NAME_KEY, trimmed);
}

export function getSyncScopeConfig(): SyncScopeConfig {
  const raw = localStorage.getItem(SYNC_SCOPE_KEY);
  if (!raw) {
    return { mode: 'all', collections: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SyncScopeConfig>;
    const mode = parsed.mode === 'custom' ? 'custom' : 'all';
    return {
      mode,
      collections: normalizeCollections(parsed.collections),
    };
  } catch {
    return { mode: 'all', collections: [] };
  }
}

export function setSyncScopeConfig(config: SyncScopeConfig) {
  const payload: SyncScopeConfig = {
    mode: config.mode === 'custom' ? 'custom' : 'all',
    collections: normalizeCollections(config.collections),
  };
  localStorage.setItem(SYNC_SCOPE_KEY, JSON.stringify(payload));
}

function pickCollections(data: Record<string, Record<string, any>>, scope: SyncScopeConfig): Record<string, Record<string, any>> {
  if (scope.mode === 'all') {
    return data;
  }

  const selected = new Set(scope.collections);
  const filtered: Record<string, Record<string, any>> = {};

  Object.entries(data).forEach(([collectionName, docs]) => {
    if (selected.has(collectionName)) {
      filtered[collectionName] = docs;
    }
  });

  return filtered;
}

export function getSyncBackendUrl(): string {
  const saved = localStorage.getItem(BACKEND_URL_KEY)?.trim();
  if (saved) {
    return saved;
  }
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://proyecto.loca.lt';
  }
  return window.location.origin;
}

export function setSyncBackendUrl(url: string) {
  localStorage.setItem(BACKEND_URL_KEY, url.trim());
}

export function getSyncPairingKey(): string {
  return (localStorage.getItem(PAIRING_KEY_KEY) || '').trim();
}

export function setSyncPairingKey(value: string) {
  localStorage.setItem(PAIRING_KEY_KEY, value.trim());
}

function getTokenStorageKey(backendUrl: string, accountId: string, deviceId: string): string {
  return `ecosync_token_${btoa(`${backendUrl}|${accountId}|${deviceId}`)}`;
}

async function ensureSessionToken(backendUrl: string, accountId: string, deviceId: string): Promise<string> {
  const tokenKey = getTokenStorageKey(backendUrl, accountId, deviceId);
  const existing = (localStorage.getItem(tokenKey) || '').trim();
  if (existing) {
    return existing;
  }

  const pairingKey = getSyncPairingKey();
  if (!pairingKey) {
    throw new Error('Falta clave de emparejamiento para sincronizacion segura.');
  }

  const endpoint = `${backendUrl.replace(/\/$/, '')}/api/oss-sync/session`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, deviceId, pairingKey }),
  });

  if (!response.ok) {
    throw new Error(`No se pudo crear sesion segura (${response.status})`);
  }

  const body = await response.json();
  const token = String(body?.token || '').trim();
  if (!token) {
    throw new Error('Sesion invalida: token ausente.');
  }

  localStorage.setItem(tokenKey, token);
  return token;
}

function mergeSnapshot(localDb: Record<string, Record<string, any>>, remoteDb: Record<string, Record<string, any>>) {
  const merged: Record<string, Record<string, any>> = { ...localDb };
  const collections = new Set<string>([...Object.keys(localDb), ...Object.keys(remoteDb)]);

  collections.forEach((collectionName) => {
    const localCollection = localDb[collectionName] || {};
    const remoteCollection = remoteDb[collectionName] || {};
    const resultCollection: Record<string, any> = { ...localCollection };

    Object.entries(remoteCollection).forEach(([id, remoteDoc]) => {
      const localDoc = resultCollection[id];
      const localTs = Number(localDoc?.__updatedAt || 0);
      const remoteTs = Number((remoteDoc as any)?.__updatedAt || 0);
      if (!localDoc || remoteTs >= localTs) {
        resultCollection[id] = remoteDoc;
      }
    });

    merged[collectionName] = resultCollection;
  });

  return merged;
}

async function pushAndPull() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return;
  }

  const backendUrl = getSyncBackendUrl();
  const deviceId = getOrCreateSyncDeviceId();
  const scope = getSyncScopeConfig();
  if (scope.mode === 'custom' && scope.collections.length === 0) {
    return;
  }
  const token = await ensureSessionToken(backendUrl, currentUser.uid, deviceId);
  const endpoint = `${backendUrl.replace(/\/$/, '')}/api/oss-sync/push`;
  const localData = readDb();
  const scopedData = pickCollections(localData, scope);

  const payload = {
    accountId: currentUser.uid,
    deviceId,
    deviceName: getSyncDeviceDisplayName(),
    generatedAt: Date.now(),
    data: scopedData,
  };

  let response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    const tokenKey = getTokenStorageKey(backendUrl, currentUser.uid, deviceId);
    localStorage.removeItem(tokenKey);
    const renewedToken = await ensureSessionToken(backendUrl, currentUser.uid, deviceId);
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${renewedToken}`,
        'X-Device-Id': deviceId,
      },
      body: JSON.stringify(payload),
    });
  }

  if (!response.ok) {
    throw new Error(`Sync push failed (${response.status})`);
  }

  const body = await response.json();
  const remoteData = (body?.data || {}) as Record<string, Record<string, any>>;
  const scopedRemote = pickCollections(remoteData, scope);
  const merged = mergeSnapshot(localData, scopedRemote);
  writeDb(merged, Object.keys(scopedRemote));
}

export function startAutoSync(intervalMs = 5000): () => void {
  let running = false;
  let timerId: number | null = null;

  const run = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      await pushAndPull();
    } catch (error) {
      console.warn('Auto sync warning:', error);
    } finally {
      running = false;
    }
  };

  void run();
  timerId = window.setInterval(() => {
    void run();
  }, Math.max(2500, intervalMs));

  return () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
    }
  };
}
