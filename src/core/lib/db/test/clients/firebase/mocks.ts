import { vi } from 'vitest';

// Mock Firebase Auth
export const mockAuth = {
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(),
  currentUser: null,
};

// Mock Firestore
export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  batch: vi.fn(),
  settings: vi.fn(),
  enablePersistence: vi.fn(),
  disableNetwork: vi.fn(),
  enableNetwork: vi.fn(),
  terminate: vi.fn(),
  clearPersistence: vi.fn(),
};

// Mock Firebase Performance
export const mockPerformance = {
  trace: vi.fn(),
  recordMetric: vi.fn(),
  setAttribute: vi.fn(),
  stop: vi.fn(),
};

// Mock Firebase Analytics
export const mockAnalytics = {
  logEvent: vi.fn(),
  setUserProperty: vi.fn(),
  setUserId: vi.fn(),
};

// Mock Firebase Remote Config
export const mockRemoteConfig = {
  getValue: vi.fn(),
  setDefaults: vi.fn(),
  fetchAndActivate: vi.fn(),
};

// Test data
export const testUser = {
  uid: 'user1',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
};

export const testDocument = {
  id: 'doc1',
  data: () => ({
    field: 'value',
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  ref: {
    id: 'doc1',
    path: 'documents/doc1',
  },
};

export const testCollection = [
  {
    id: 'doc1',
    data: () => ({
      field: 'value1',
      version: 1,
    }),
  },
  {
    id: 'doc2',
    data: () => ({
      field: 'value2',
      version: 1,
    }),
  },
];

// Mock error creation utility
export const createMockError = (code: string, message: string) => {
  const error = new Error(message);
  (error as any).code = code;
  return error;
};

// Mock snapshot creation utility
export const createMockSnapshot = (data: any) => ({
  data: () => data,
  exists: () => true,
  id: 'doc1',
  ref: {
    id: 'doc1',
    path: 'documents/doc1',
  },
});

// Mock query snapshot creation utility
export const createMockQuerySnapshot = (docs: any[]) => ({
  docs,
  empty: docs.length === 0,
  size: docs.length,
  metadata: {
    hasPendingWrites: false,
    fromCache: false,
  },
}); 