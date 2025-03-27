'use client';

import { PropsWithChildren } from 'react';
import { IonicProvider } from './ionic';

export function Providers({ children }: PropsWithChildren) {
  return (
    <IonicProvider>
      {children}
    </IonicProvider>
  );
}
