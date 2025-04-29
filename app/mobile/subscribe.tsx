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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonLoading,
  IonFooter,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useSubscribe } from '@/core/hooks/useSubscribe';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';
import { useLocale } from '@/core/lib/i18n/hooks';
import { useTranslations } from '@/core/hooks/useTranslations';

const plans = [
  {
    id: 'monthly',
    titleKey: 'subscribe.monthly.title',
    descKey: 'subscribe.monthly.desc',
    price: '¥29/月',
    features: ['无限喜欢', '查看谁喜欢你', '专属身份标识', '优先推荐'],
    best: false,
  },
  {
    id: 'quarterly',
    titleKey: 'subscribe.quarterly.title',
    descKey: 'subscribe.quarterly.desc',
    price: '¥69/季',
    features: ['无限喜欢', '查看谁喜欢你', '专属身份标识', '优先推荐'],
    best: true,
  },
  {
    id: 'yearly',
    titleKey: 'subscribe.yearly.title',
    descKey: 'subscribe.yearly.desc',
    price: '¥199/年',
    features: ['无限喜欢', '查看谁喜欢你', '专属身份标识', '优先推荐'],
    best: false,
  },
];

export default function SubscribePage() {
  useRequireAuth();
  const router = useRouter();
  const [selected, setSelected] = useState('quarterly');
  const { subscribe, loading, error } = useSubscribe();
  const { locale, setLocale } = useLocale();
  const keys = [
    'subscribe.title',
    'subscribe.popular',
    'subscribe.subscribing',
    'subscribe.subscribe_now',
    'subscribe.loading',
    'subscribe.error',
    'subscribe.privileges',
    'subscribe.view_my_member',
    ...plans.flatMap(p => [p.titleKey, p.descKey]),
  ];
  const { get } = useTranslations(keys, locale);

  const handleSubscribe = async () => {
    try {
      await subscribe(selected);
      router.replace('/mobile/member-center');
    } catch (e) {
      // 错误已由 hook 内 triggerToast 处理，这里可选处理
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonButton onClick={() => router.back()}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{get('subscribe.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-[#0f172a]">
        <IonLoading isOpen={loading} message={get('subscribe.loading')} />
        {plans.map(plan => (
          <IonCard key={plan.id} color={selected === plan.id ? 'warning' : 'light'} onClick={() => setSelected(plan.id)} className={`mb-4 ${plan.best ? 'border-2 border-yellow-400' : ''}`}>
            <IonCardHeader>
              <IonCardTitle>{get(plan.titleKey)} <span className="text-blue-400 font-bold">{plan.price}</span></IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="mb-2 text-slate-700">{get(plan.descKey)}</div>
              <ul className="mb-2 text-xs text-slate-500">
                {plan.features.map(f => <li key={f}>• {f}</li>)}
              </ul>
              {plan.best && <span className="bg-yellow-400 text-slate-900 px-2 py-1 rounded text-xs font-bold">{get('subscribe.popular')}</span>}
            </IonCardContent>
          </IonCard>
        ))}
        <IonButton expand="block" color="warning" onClick={handleSubscribe} disabled={loading} className="mt-6">
          {loading ? get('subscribe.subscribing') : get('subscribe.subscribe_now')}
        </IonButton>
        {error && <div className="text-red-500 text-center text-xs mt-2">{error.message}</div>}
        <div className="text-center text-xs text-slate-400 mt-4">{get('subscribe.privileges')}</div>
      </IonContent>
      <IonFooter className="ion-padding ion-text-center">
        <IonButton fill="clear" color="light" onClick={() => router.push('/mobile/member-center')}>{get('subscribe.view_my_member')}</IonButton>
      </IonFooter>
    </IonPage>
  );
}
