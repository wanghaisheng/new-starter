import React from 'react';

// Mock window and document
(global as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {},
};

(global as any).document = {
  body: {},
  createElement: () => ({}),
  createTextNode: () => ({}),
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
};

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

// Mock @ionic/react module
(global as any).require = (module: string) => {
  if (module === '@ionic/react') {
    return mockIonicComponents;
  }
  return {};
}; 