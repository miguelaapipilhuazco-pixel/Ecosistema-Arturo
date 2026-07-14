import { auth } from './auth';
import { readDb, writeDb } from './store';
import { getSyncDeviceDisplayName } from './autoSync';

export interface DeviceDataPackage {
  version: 1;
  exportedAt: number;
  sourceDeviceId: string;
  sourceDeviceName?: string;
  account: {
    uid: string;
    email: string;
    displayName: string;
  } | null;
  data: Record<string, Record<string, any>>;
}

const DEVICE_ID_KEY = 'ecosystem_oss_device_id';

function getOrCreateDeviceId(): string {
  const current = localStorage.getItem(DEVICE_ID_KEY);
  if (current) return current;
  const created = `device_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export function exportDataPackage(): DeviceDataPackage {
  const currentUser = auth.currentUser;

  return {
    version: 1,
    exportedAt: Date.now(),
    sourceDeviceId: getOrCreateDeviceId(),
    sourceDeviceName: getSyncDeviceDisplayName(),
    account: currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
        }
      : null,
    data: readDb(),
  };
}

export function stringifyDataPackage(pkg: DeviceDataPackage): string {
  return JSON.stringify(pkg, null, 2);
}

export function parseDataPackage(content: string): DeviceDataPackage {
  const parsed = JSON.parse(content);
  if (!parsed || parsed.version !== 1 || !parsed.data) {
    throw new Error('Paquete invalido.');
  }
  return parsed as DeviceDataPackage;
}

export function importDataPackage(pkg: DeviceDataPackage, mode: 'merge' | 'replace' = 'merge') {
  const current = readDb();
  const next = mode === 'replace' ? {} : { ...current };

  Object.entries(pkg.data).forEach(([collectionName, docs]) => {
    const existing = mode === 'replace' ? {} : next[collectionName] || {};
    next[collectionName] = {
      ...existing,
      ...docs,
    };
  });

  const currentUser = auth.currentUser;
  if (currentUser) {
    const links = next.device_links || {};
    const linkId = `link_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    links[linkId] = {
      deviceId: getOrCreateDeviceId(),
      importedFromDeviceId: pkg.sourceDeviceId,
      importedFromDeviceName: pkg.sourceDeviceName || null,
      userId: currentUser.uid,
      importedAt: Date.now(),
      mode,
      autoImportedAll: mode === 'replace',
    };
    next.device_links = links;
  }

  writeDb(next, Object.keys(next));
}
