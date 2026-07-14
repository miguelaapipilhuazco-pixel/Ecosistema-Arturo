import { addDoc, collection, db, getDocs, query, where } from './firestore';
import { getSyncDeviceDisplayName } from './autoSync';

type AuthListener = (user: User | null) => void;

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  providerData: Array<{ providerId: string }>;
}

interface ProviderBase {
  providerId: string;
  _params: Record<string, string>;
  setCustomParameters: (params: Record<string, string>) => void;
}

const AUTH_USER_KEY = 'ecosystem_oss_auth_user';
const DEVICE_ID_KEY = 'ecosystem_oss_device_id';

class BaseProvider implements ProviderBase {
  providerId: string;
  _params: Record<string, string> = {};

  constructor(providerId: string) {
    this.providerId = providerId;
  }

  setCustomParameters(params: Record<string, string>) {
    this._params = { ...this._params, ...params };
  }
}

export class GoogleAuthProvider extends BaseProvider {
  constructor() {
    super('google.com');
  }
}

export class OAuthProvider extends BaseProvider {
  constructor(providerId: string) {
    super(providerId);
  }
}

function nowId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getDeviceId() {
  const current = localStorage.getItem(DEVICE_ID_KEY);
  if (current) return current;
  const created = nowId('device');
  localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

function readAuthUser(): User | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveAuthUser(user: User | null) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

const listeners = new Set<AuthListener>();

function notifyAuth(user: User | null) {
  listeners.forEach((listener) => listener(user));
}

function normalizeDisplayName(email: string) {
  const local = email.split('@')[0] || 'usuario';
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function createDeviceBoundUser(providerId: string): User {
  const deviceId = getDeviceId();
  const shortDevice = deviceId.slice(-8);
  const domain = providerId.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const email = `device-${shortDevice}@${domain}.local`;
  return {
    uid: nowId('user'),
    email,
    displayName: getSyncDeviceDisplayName(),
    photoURL: null,
    providerData: [{ providerId }],
  };
}

async function getStoredAccountsByProvider(providerId: string): Promise<User[]> {
  const accountsSnap = await getDocs(
    query(collection(db, 'accounts'), where('providerId', '==', providerId))
  );

  return accountsSnap.docs.map((entry) => {
    const data = entry.data();
    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL || null,
      providerData: [{ providerId }],
    } as User;
  });
}

async function persistAccount(user: User, providerId: string) {
  const existing = await getDocs(query(collection(db, 'accounts'), where('uid', '==', user.uid)));
  if (existing.size === 0) {
    await addDoc(collection(db, 'accounts'), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      providerId,
      createdAt: Date.now(),
    });
  }
}

async function selectAccount(provider: ProviderBase): Promise<User> {
  const promptMode = provider._params.prompt || 'select_account';
  const knownAccounts = await getStoredAccountsByProvider(provider.providerId);

  if (promptMode === 'none') {
    const preferredEmail = localStorage.getItem(`ecosystem_last_account_${provider.providerId}`);
    const matched = knownAccounts.find((acc) => acc.email === preferredEmail) || knownAccounts[0];
    if (!matched) {
      return createDeviceBoundUser(provider.providerId);
    }
    return matched;
  }

  const defaultEmail = knownAccounts[0]?.email || '';
  const emailInput = window.prompt(`Cuenta para ${provider.providerId}`, defaultEmail) || '';
  const email = emailInput.trim().toLowerCase();
  if (!email) {
    throw { code: 'auth/popup-closed-by-user', message: 'Login cancelled by user.' };
  }

  const existing = knownAccounts.find((account) => account.email === email);
  if (existing) {
    return existing;
  }

  const user: User = {
    uid: nowId('user'),
    email,
    displayName: normalizeDisplayName(email),
    photoURL: null,
    providerData: [{ providerId: provider.providerId }],
  };

  return user;
}

export const auth = {
  currentUser: readAuthUser(),
  languageCode: null as string | null,
  useDeviceLanguage() {
    this.languageCode = navigator?.language || 'en';
  },
};

export function onAuthStateChanged(_auth: typeof auth, callback: AuthListener): () => void {
  listeners.add(callback);
  callback(auth.currentUser);
  return () => {
    listeners.delete(callback);
  };
}

export async function signInWithPopup(_auth: typeof auth, provider: ProviderBase): Promise<{ user: User }> {
  const user = await selectAccount(provider);
  auth.currentUser = user;
  saveAuthUser(user);

  localStorage.setItem(`ecosystem_last_account_${provider.providerId}`, user.email);

  await persistAccount(user, provider.providerId);

  await addDoc(collection(db, 'device_links'), {
    deviceId: getDeviceId(),
    userId: user.uid,
    email: user.email,
    providerId: provider.providerId,
    linkedAt: Date.now(),
  });

  notifyAuth(user);
  return { user };
}

export async function signInWithRedirect(authObject: typeof auth, provider: ProviderBase): Promise<void> {
  await signInWithPopup(authObject, provider);
}

export async function signOut(_auth: typeof auth): Promise<void> {
  auth.currentUser = null;
  saveAuthUser(null);
  notifyAuth(null);
}
