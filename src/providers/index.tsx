'use client';

import { PropsWithChildren } from 'react';

import { DatabaseProvider } from './database';
import { IonicProvider } from './ionic';

export function Providers({ children }: PropsWithChildren) {
  return (
    <IonicProvider>
      <DatabaseProvider>
        {children}
      </DatabaseProvider>
    </IonicProvider>
  );
}
