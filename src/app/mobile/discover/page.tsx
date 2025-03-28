import { CardStack } from '@/mobile/components/cards/CardStack';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { heartOutline, closeOutline } from 'ionicons/icons';

export default function DiscoverPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>发现</IonTitle>
          <IonButtons slot="end">
            <IonButton>
              <IonIcon icon={closeOutline} />
            </IonButton>
            <IonButton>
              <IonIcon icon={heartOutline} />
            </IonButton>
          </IonButtons>
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