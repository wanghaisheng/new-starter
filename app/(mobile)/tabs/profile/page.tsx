'use client';

import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

export default function ProfilePage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>我的</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 className="text-2xl font-bold mb-4">个人资料</h1>
        <p>这是用户个人资料页面。</p>
      </IonContent>
    </IonPage>
  );
}
