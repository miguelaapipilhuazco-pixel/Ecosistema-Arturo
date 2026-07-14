import { readDb, removeDoc, subscribeDb, upsertDoc } from './store';

export type QueryConstraint =
  | { kind: 'where'; field: string; op: '=='; value: any }
  | { kind: 'limit'; value: number }
  | { kind: 'orderBy'; field: string; direction: 'asc' | 'desc' };

export interface CollectionReference {
  kind: 'collection';
  name: string;
}

export interface DocumentReference {
  kind: 'document';
  collectionName: string;
  id: string;
}

export interface QueryReference {
  kind: 'query';
  collectionName: string;
  constraints: QueryConstraint[];
}

interface SnapshotDoc {
  id: string;
  data: () => any;
}

interface QuerySnapshot {
  docs: SnapshotDoc[];
  size: number;
}

interface DocumentSnapshot {
  id: string;
  exists: () => boolean;
  data: () => any;
}

export const db = {
  provider: 'ecosystem-open-source-local',
};

const SERVER_TIMESTAMP = '__server_timestamp_marker__';

export const serverTimestamp = () => ({ __marker: SERVER_TIMESTAMP });
export const arrayUnion = (...values: any[]) => ({ __arrayUnion: values });

function createId() {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function deepResolve(value: any): any {
  if (value && typeof value === 'object') {
    if (value.__marker === SERVER_TIMESTAMP) {
      return Date.now();
    }

    if (value.__arrayUnion) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((v) => deepResolve(v));
    }

    const out: Record<string, any> = {};
    Object.keys(value).forEach((k) => {
      out[k] = deepResolve(value[k]);
    });
    return out;
  }

  return value;
}

function applyArrayUnion(target: any, source: any): any {
  const out = { ...(target || {}) };

  Object.keys(source).forEach((key) => {
    const nextValue = source[key];

    if (nextValue && typeof nextValue === 'object' && nextValue.__arrayUnion) {
      const current = Array.isArray(out[key]) ? out[key] : [];
      const merged = [...current];
      nextValue.__arrayUnion.forEach((item: any) => {
        if (!merged.some((existing) => JSON.stringify(existing) === JSON.stringify(item))) {
          merged.push(item);
        }
      });
      out[key] = merged;
      return;
    }

    if (
      nextValue &&
      typeof nextValue === 'object' &&
      !Array.isArray(nextValue) &&
      out[key] &&
      typeof out[key] === 'object' &&
      !Array.isArray(out[key])
    ) {
      out[key] = applyArrayUnion(out[key], nextValue);
      return;
    }

    out[key] = nextValue;
  });

  return out;
}

export function collection(_db: any, name: string): CollectionReference {
  return { kind: 'collection', name };
}

export function doc(_dbOrCollection: any, maybeCollection: string, maybeId?: string): DocumentReference {
  if (_dbOrCollection && _dbOrCollection.kind === 'collection') {
    return {
      kind: 'document',
      collectionName: _dbOrCollection.name,
      id: maybeCollection,
    };
  }

  return {
    kind: 'document',
    collectionName: maybeCollection,
    id: maybeId || createId(),
  };
}

export function where(field: string, op: '==', value: any): QueryConstraint {
  return { kind: 'where', field, op, value };
}

export function limit(value: number): QueryConstraint {
  return { kind: 'limit', value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { kind: 'orderBy', field, direction };
}

export function query(collectionRef: CollectionReference, ...constraints: QueryConstraint[]): QueryReference {
  return {
    kind: 'query',
    collectionName: collectionRef.name,
    constraints,
  };
}

function runQuery(ref: QueryReference): QuerySnapshot {
  const dbMap = readDb();
  const collectionData = dbMap[ref.collectionName] || {};

  let rows = Object.entries(collectionData).map(([id, data]) => ({
    id,
    data,
  })).filter((row) => !row.data?.__deleted);

  const whereConstraints = ref.constraints.filter((c) => c.kind === 'where') as Extract<QueryConstraint, { kind: 'where' }>[];
  whereConstraints.forEach((constraint) => {
    rows = rows.filter((row) => row.data?.[constraint.field] === constraint.value);
  });

  const orderConstraint = ref.constraints.find((c) => c.kind === 'orderBy') as Extract<QueryConstraint, { kind: 'orderBy' }> | undefined;
  if (orderConstraint) {
    const dir = orderConstraint.direction === 'desc' ? -1 : 1;
    rows.sort((a, b) => {
      const av = a.data?.[orderConstraint.field];
      const bv = b.data?.[orderConstraint.field];
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }

  const limitConstraint = ref.constraints.find((c) => c.kind === 'limit') as Extract<QueryConstraint, { kind: 'limit' }> | undefined;
  if (limitConstraint) {
    rows = rows.slice(0, Math.max(0, limitConstraint.value));
  }

  const docs = rows.map((row) => ({
    id: row.id,
    data: () => row.data,
  }));

  return { docs, size: docs.length };
}

function toQueryRef(ref: QueryReference | CollectionReference): QueryReference {
  if ((ref as QueryReference).kind === 'query') {
    return ref as QueryReference;
  }

  const collectionRef = ref as CollectionReference;
  return query(collectionRef);
}

export function onSnapshot(
  queryOrCollection: QueryReference | CollectionReference,
  onNext: (snapshot: QuerySnapshot) => void,
  onError?: (error: any) => void
): () => void {
  const q = toQueryRef(queryOrCollection);

  const emit = () => {
    try {
      onNext(runQuery(q));
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  emit();

  return subscribeDb((changedCollections) => {
    if (!changedCollections || changedCollections.length === 0 || changedCollections.includes(q.collectionName)) {
      emit();
    }
  });
}

export async function addDoc(collectionRef: CollectionReference, payload: any): Promise<DocumentReference> {
  const id = createId();
  const resolvedPayload = deepResolve(payload);
  upsertDoc(collectionRef.name, id, resolvedPayload);
  return doc(collectionRef, id);
}

export async function updateDoc(docRef: DocumentReference, payload: any): Promise<void> {
  const dbMap = readDb();
  const current = dbMap[docRef.collectionName]?.[docRef.id] || {};
  const next = applyArrayUnion(current, deepResolve(payload));
  upsertDoc(docRef.collectionName, docRef.id, next);
}

export async function setDoc(docRef: DocumentReference, payload: any, options?: { merge?: boolean }): Promise<void> {
  const dbMap = readDb();
  const current = dbMap[docRef.collectionName]?.[docRef.id] || {};
  const resolved = deepResolve(payload);
  const next = options?.merge ? applyArrayUnion(current, resolved) : resolved;
  upsertDoc(docRef.collectionName, docRef.id, next);
}

export async function deleteDoc(docRef: DocumentReference): Promise<void> {
  removeDoc(docRef.collectionName, docRef.id);
}

export async function getDoc(docRef: DocumentReference): Promise<DocumentSnapshot> {
  const dbMap = readDb();
  const data = dbMap[docRef.collectionName]?.[docRef.id];
  const visibleData = data?.__deleted ? undefined : data;

  return {
    id: docRef.id,
    exists: () => typeof visibleData !== 'undefined',
    data: () => visibleData,
  };
}

export async function getDocs(queryRef: QueryReference | CollectionReference): Promise<QuerySnapshot> {
  return runQuery(toQueryRef(queryRef));
}
