import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonSlides,
  IonSlide,
  IonFooter,
} from '@ionic/react';

const steps = [
  {
    title: '遇见更好的自己',
    desc: '基于八字、性格、兴趣的智能推荐，开启你的专属缘分之旅',
    image: '/assets/onboard-1.png',
  },
  {
    title: '安全真实的社区',
    desc: '实名认证+专业审核，保护你的每一次心动',
    image: '/assets/onboard-2.png',
  },
  {
    title: '高效精准的匹配',
    desc: '多维画像，科学算法，帮你找到最合适的TA',
    image: '/assets/onboard-3.png',
  },
];

export default function Onboard() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else router.replace('/mobile/subscribe');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>欢迎加入</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-[#0f172a] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center h-full w-full">
          <img src={steps[step].image} alt="onboard" className="w-3/4 max-w-xs mb-8 rounded-xl shadow-lg" />
          <h2 className="text-2xl font-bold text-white mb-4 text-center">{steps[step].title}</h2>
          <p className="text-base text-blue-100 mb-8 text-center">{steps[step].desc}</p>
          <div className="flex gap-2 mb-8">
            {steps.map((_, i) => (
              <span key={i} className={`w-3 h-3 rounded-full ${step === i ? 'bg-yellow-400' : 'bg-slate-600'}`}></span>
            ))}
          </div>
        </div>
      </IonContent>
      <IonFooter className="ion-padding ion-text-center">
        <IonButton expand="block" color="warning" onClick={next}>
          {step < steps.length - 1 ? '下一步' : '立即体验'}
        </IonButton>
      </IonFooter>
    </IonPage>
  );
}
