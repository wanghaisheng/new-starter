import React from 'react';
import { useRouter } from 'next/navigation';
import { IonButton } from '@ionic/react';
import { SettingsOutline } from 'react-ionicons';

export const MatchPreferenceButton: React.FC = () => {
  const router = useRouter();
  return (
    <IonButton
      color="primary"
      expand="block"
      onClick={() => router.push('/mobile/match-preference')}
      style={{ margin: '8px 0' }}
    >
      <SettingsOutline style={{ verticalAlign: 'middle', marginRight: 8 }} />
      匹配优先项设置
    </IonButton>
  );
};
