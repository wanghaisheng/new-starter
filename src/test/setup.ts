import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock DOM
const createElement = document.createElement.bind(document);
document.createElement = (tagName: string) => {
  if (tagName === 'jeep-sqlite') {
    const element = document.createElement('div');
    element.setAttribute('id', 'jeep-sqlite');
    return element;
  }
  return createElement(tagName);
};

// Mock Ionic components
vi.mock('@ionic/react', () => ({
  IonToast: () => null,
  IonButton: () => null,
  IonContent: () => null,
  IonHeader: () => null,
  IonToolbar: () => null,
  IonTitle: () => null,
  IonPage: () => null,
  IonList: () => null,
  IonItem: () => null,
  IonLabel: () => null,
  IonInput: () => null,
  IonText: () => null,
  IonIcon: () => null,
}));

// Mock SQLite
vi.mock('@capacitor-community/sqlite', () => {
  const mockSQLite = {
    createConnection: vi.fn().mockResolvedValue({
      open: vi.fn().mockResolvedValue(true),
      execute: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
      query: vi.fn().mockResolvedValue({ values: [] }),
      beginTransaction: vi.fn().mockResolvedValue(true),
      commitTransaction: vi.fn().mockResolvedValue(true),
      rollbackTransaction: vi.fn().mockResolvedValue(true),
      executeRawQuery: vi.fn().mockResolvedValue({ values: [] }),
      executeSet: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
    }),
    open: vi.fn().mockResolvedValue(true),
    closeConnection: vi.fn().mockResolvedValue(true),
    execute: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
    query: vi.fn().mockResolvedValue({ values: [] }),
    isDBExists: vi.fn().mockResolvedValue({ result: true }),
    deleteDatabase: vi.fn().mockResolvedValue(true),
    importFromJson: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
    isJsonValid: vi.fn().mockResolvedValue({ result: true }),
    createSyncTable: vi.fn().mockResolvedValue(true),
    setSyncDate: vi.fn().mockResolvedValue(true),
    initWebStore: vi.fn().mockResolvedValue(true),
  };

  return {
    CapacitorSQLite: mockSQLite,
    SQLiteConnection: vi.fn().mockImplementation(() => ({
      checkConnectionsConsistency: vi.fn().mockResolvedValue({ result: true }),
      isConnection: vi.fn().mockResolvedValue({ result: true }),
      retrieveConnection: vi.fn().mockResolvedValue({
        open: vi.fn().mockResolvedValue(true),
        execute: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
        query: vi.fn().mockResolvedValue({ values: [] }),
        beginTransaction: vi.fn().mockResolvedValue(true),
        commitTransaction: vi.fn().mockResolvedValue(true),
        rollbackTransaction: vi.fn().mockResolvedValue(true),
        executeRawQuery: vi.fn().mockResolvedValue({ values: [] }),
        executeSet: vi.fn().mockResolvedValue({ changes: { changes: 1 } }),
      }),
      initWebStore: vi.fn().mockResolvedValue(true),
    })),
  };
});

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDB,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
}); 