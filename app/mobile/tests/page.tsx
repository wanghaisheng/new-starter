'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel, IonBadge, IonIcon } from '@ionic/react';
import { timeOutline, checkmarkCircle, hourglassOutline } from 'ionicons/icons';
import type { TestType } from '@/core/lib/db/types';
import { LoadingScreen } from '@/core/components/common/LoadingScreen';
import { ErrorScreen } from '@/core/components/common/ErrorScreen';

// Extended TestType with status field for UI purposes
interface TestTypeWithStatus extends TestType {
  status: 'completed' | 'inProgress' | 'notStarted';
}

export default function TestTypesPage() {
  const router = useRouter();
  const t = useTranslations('test');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [testTypes, setTestTypes] = useState<TestTypeWithStatus[]>([]);

  useEffect(() => {
    async function loadTestTypes() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/tests/types');
        if (!response.ok) {
          throw new Error('Failed to fetch test types');
        }
        
        const types = await response.json();
        setTestTypes(types);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(t('errors.loadFailed')));
      } finally {
        setLoading(false);
      }
    }

    loadTestTypes();
  }, [t]);

  const handleTestSelect = (testId: string) => {
    router.push(`/mobile/tests/${testId}`);
  };

  const getStatusIcon = (status: TestTypeWithStatus['status']) => {
    switch (status) {
      case 'completed':
        return checkmarkCircle;
      case 'inProgress':
        return hourglassOutline;
      default:
        return timeOutline;
    }
  };

  const getStatusColor = (status: TestTypeWithStatus['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'inProgress':
        return 'warning';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return <LoadingScreen message={t('loading')} />;
  }

  if (error) {
    return <ErrorScreen message={error.message} onRetry={() => window.location.reload()} />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('testsTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('availableTests')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {testTypes.map((test) => (
                <IonItem 
                  key={test.id} 
                  button 
                  onClick={() => handleTestSelect(test.id)}
                  detail={true}
                >
                  <IonIcon 
                    icon={getStatusIcon(test.status)} 
                    slot="start"
                    color={getStatusColor(test.status)}
                  />
                  <IonLabel>
                    <h2>{test.title}</h2>
                    <p>{test.description}</p>
                  </IonLabel>
                  <IonBadge slot="end" color={getStatusColor(test.status)}>
                    {t(`status.${test.status}`)}
                  </IonBadge>
                </IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
} 