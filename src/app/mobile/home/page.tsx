'use client';

import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { CardStack } from '@/mobile/components/cards/CardStack';

export default function HomePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>首页</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="h-full max-w-md mx-auto">
          <CardStack />
        </div>
      </IonContent>
    </IonPage>
  );
} 