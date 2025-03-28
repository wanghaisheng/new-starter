import React from 'react';
import { render as rtlRender } from '@testing-library/react';

// Mock window and document if they don't exist
if (typeof window === 'undefined') {
  (global as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

if (typeof document === 'undefined') {
  (global as any).document = {
    body: {},
    createElement: () => ({}),
    createTextNode: () => ({}),
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

// Mock Ionic components
const mockIonicComponents = {
  IonCard: ({ children }: any) => <div>{children}</div>,
  IonCardContent: ({ children }: any) => <div>{children}</div>,
  IonImg: ({ src }: any) => <img src={src} alt="" />,
  IonChip: ({ children }: any) => <div>{children}</div>,
  IonLabel: ({ children }: any) => <span>{children}</span>,
  IonButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  IonIcon: () => null,
  IonSpinner: () => null,
  IonToast: () => null,
  createGesture: () => ({
    enable: () => {},
    destroy: () => {},
    on: () => {},
  }),
};

// Mock jest.mock if it doesn't exist
if (typeof jest === 'undefined') {
  (global as any).jest = {
    mock: (path: string, factory: () => any) => {
      const module = factory();
      (global as any)[path] = module;
      return module;
    },
    fn: () => {
      const mockFn = (...args: any[]) => {
        mockFn.mock.calls.push(args);
        return mockFn.mockReturnValue;
      };
      mockFn.mock = { calls: [] };
      mockFn.mockReturnValue = undefined;
      mockFn.mockImplementation = (impl: (...args: any[]) => any) => {
        mockFn.mockReturnValue = impl;
        return mockFn;
      };
      return mockFn;
    },
  };
}

// Mock Ionic components
jest.mock('@ionic/react', () => mockIonicComponents);

// Custom render function
function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, { ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { render }; 