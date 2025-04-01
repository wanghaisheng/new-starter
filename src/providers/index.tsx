'use client';

import { PropsWithChildren } from 'react';
import { IonicProvider } from './ionic';
import { DatabaseProvider } from './database';

export function Providers({ children }: PropsWithChildren) {
  return (
    <IonicProvider>
      <DatabaseProvider>
        {children}
      </DatabaseProvider>
    </IonicProvider>
  );
}
