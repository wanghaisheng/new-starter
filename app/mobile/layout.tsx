'use client';

import React from 'react';
import { IonPage, IonContent } from '@ionic/react';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <IonPage>
      <IonContent>
        {children}
      </IonContent>
    </IonPage>
  );
}