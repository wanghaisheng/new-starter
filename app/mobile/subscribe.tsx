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
import { PaymentService } from '@/core/services-update/business/payment/service/payment-service';

const plans = [
  {
    id: 'monthly',
    title: '月度会员',
    price: '¥29/月',
    desc: '畅享全部高级匹配与无限心动',
    features: ['无限喜欢', '查看谁喜欢你', '专属身份标识', '优先推荐'],
    best: false,
  },
  {
    id: 'quarterly',
    title: '季度会员',
    price: '¥69/季',
    desc: '性价比之选，享受更多权益',
    features: ['无限喜欢', '查看谁喜欢你', '专属身份标识', '优先推荐'],
    best: true,
  },
  {
    id: 'yearly',
    title: '年度会员',
    price: '¥199/年',
    desc: '年度特惠，助你早日脱单',
    features: ['无限喜欢', '查看谁喜欢你', '专属身份标识', '优先推荐'],
    best: false,
  },
];

export default function Subscribe() {
  const router = useRouter();
  const [selected, setSelected] = useState('quarterly');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const paymentService = new PaymentService('revenuecat');
    paymentService.getProducts().then(setProducts).catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const paymentService = new PaymentService('revenuecat');
      const productId = products.find(p => p.id.includes(selected))?.id || selected;
      const result = await paymentService.purchase(productId);
      if (result.status === 'success') {
        router.replace('/mobile/member-center');
      } else {
        alert(result.error || '支付失败，请重试');
      }
    } catch (e: any) {
      alert(e.message || '支付异常，请重试');
    } finally {
      setLoading(false);
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
          <IonTitle>会员订阅</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-[#0f172a]">
        <IonLoading isOpen={loading} message="支付中..." />
        {plans.map(plan => (
          <IonCard key={plan.id} color={selected === plan.id ? 'warning' : 'light'} onClick={() => setSelected(plan.id)} className={`mb-4 ${plan.best ? 'border-2 border-yellow-400' : ''}`}>
            <IonCardHeader>
              <IonCardTitle>{plan.title} <span className="text-blue-400 font-bold">{plan.price}</span></IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="mb-2 text-slate-700">{plan.desc}</div>
              <ul className="mb-2 text-xs text-slate-500">
                {plan.features.map(f => <li key={f}>• {f}</li>)}
              </ul>
              {plan.best && <span className="bg-yellow-400 text-slate-900 px-2 py-1 rounded text-xs font-bold">最受欢迎</span>}
            </IonCardContent>
          </IonCard>
        ))}
        <IonButton expand="block" color="warning" onClick={handleSubscribe} disabled={loading} className="mt-6">
          立即开通
        </IonButton>
        <div className="text-center text-xs text-slate-400 mt-4">开通会员即享高级匹配、无限喜欢、查看访客等特权</div>
      </IonContent>
      <IonFooter className="ion-padding ion-text-center">
        <IonButton fill="clear" color="light" onClick={() => router.push('/mobile/member-center')}>查看我的会员</IonButton>
      </IonFooter>
    </IonPage>
  );
}
