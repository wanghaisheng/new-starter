import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Basic DOM mocking
(global as any).document = {
  body: {},
  createElement: () => ({}),
  createTextNode: () => ({}),
};

(global as any).window = {};

// Mock Ionic components
jest.mock('@ionic/react', () => ({
  IonToast: () => null,
  IonButton: () => null,
  IonIcon: () => null,
  IonChip: () => null,
  IonLabel: () => null,
  IonSpinner: () => null,
})); 