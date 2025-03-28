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

// Mock @ionic/react module
(global as any).require = (module: string) => {
  if (module === '@ionic/react') {
    return {
      IonCard: ({ children }: any) => children,
      IonCardContent: ({ children }: any) => children,
      IonImg: ({ src }: any) => ({ src }),
      IonChip: ({ children }: any) => children,
      IonLabel: ({ children }: any) => children,
      IonButton: ({ children, onClick }: any) => ({ children, onClick }),
      IonIcon: () => null,
      IonSpinner: () => null,
      IonToast: () => null,
      createGesture: () => ({
        enable: () => {},
        destroy: () => {},
        on: () => {},
      }),
    };
  }
  return {};
}; 