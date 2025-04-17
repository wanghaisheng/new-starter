import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLoading,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { PaymentService } from '@/core/services-update/business/payment/service/payment-service';

export default function MemberCenter() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const paymentService = new PaymentService('revenuecat');
    paymentService.getActiveSubscriptions().then(setSubs).finally(() => setLoading(false));
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => router.back()}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>我的会员</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-[#0f172a]">
        <IonLoading isOpen={loading} message="加载中..." />
        {!loading && (
          subs.length === 0 ? (
            <IonCard color="warning">
              <IonCardHeader>
                <IonCardTitle>您还不是会员</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>快去开通享受特权吧！</IonCardContent>
            </IonCard>
          ) : (
            <IonList>
              {subs.map(sub => (
                <IonItem key={sub.id} color="light">
                  <IonLabel>
                    <h2>{sub.productId}</h2>
                    <p>状态：{sub.status === 'active' ? '已开通' : '已过期'}</p>
                    {sub.expiresAt && <p>到期时间：{sub.expiresAt}</p>}
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )
        )}
        <IonButton expand="block" color="warning" onClick={() => router.push('/mobile/subscribe')} className="mt-6">
          前往续费/升级
        </IonButton>
      </IonContent>
    </IonPage>
  );
}
