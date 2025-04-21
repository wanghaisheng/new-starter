// QuizInfoForm: 通用测评信息录入表单
'use client';
import { useState } from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonInput, IonLabel, IonItem, IonRadioGroup, IonRadio, IonToast } from '@ionic/react';

interface QuizInfoFormProps {
  initialInfo?: BaziInfo;
  loading?: boolean;
  error?: string | null;
  onSubmit: (info: BaziInfo) => void;
}

interface BaziInfo {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  gender: 'male' | 'female';
}

export function QuizInfoForm({ initialInfo, loading, error, onSubmit }: QuizInfoFormProps) {
  const [info, setInfo] = useState<BaziInfo>(initialInfo || {
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    gender: 'male',
  });
  const [showToast, setShowToast] = useState(false);

  const handleChange = (field: keyof BaziInfo, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit(info);
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>信息填写</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem>
          <IonLabel position="stacked">出生日期</IonLabel>
          <IonInput value={info.birthDate} onIonChange={e => handleChange('birthDate', e.detail.value!)} placeholder="YYYY-MM-DD" />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">出生时间</IonLabel>
          <IonInput value={info.birthTime} onIonChange={e => handleChange('birthTime', e.detail.value!)} placeholder="HH:mm" />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">出生地</IonLabel>
          <IonInput value={info.birthPlace} onIonChange={e => handleChange('birthPlace', e.detail.value!)} placeholder="城市/省份" />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">性别</IonLabel>
          <IonRadioGroup value={info.gender} onIonChange={e => handleChange('gender', e.detail.value)}>
            <IonItem lines="none">
              <IonLabel>男</IonLabel>
              <IonRadio value="male" />
            </IonItem>
            <IonItem lines="none">
              <IonLabel>女</IonLabel>
              <IonRadio value="female" />
            </IonItem>
          </IonRadioGroup>
        </IonItem>
        <IonButton expand="block" className="mt-6" onClick={handleSubmit} disabled={loading}>提交</IonButton>
        <IonToast isOpen={!!error && showToast} message={error || ''} duration={2000} color="danger" onDidDismiss={() => setShowToast(false)} />
      </IonCardContent>
    </IonCard>
  );
}
