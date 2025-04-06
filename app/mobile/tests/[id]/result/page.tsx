'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonProgressBar, IonList, IonItem, IonLabel } from '@ionic/react';
import { arrowBack, share } from 'ionicons/icons';
import { TestService } from '@/core/services/test-service';
import type { TestResult, TestType } from '@/core/lib/db/types';
import { LoadingScreen } from '@/core/components/common/LoadingScreen';
import { ErrorScreen } from '@/core/components/common/ErrorScreen';

export default function TestResultPage() {
  const params = useParams();
  const t = useTranslations('test');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [testType, setTestType] = useState<TestType | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    async function loadResult() {
      try {
        const service = TestService.getInstance();
        const testId = params.id as string;
        const [loadedTestType, loadedResult] = await Promise.all([
          service.getTestType(testId),
          service.getTestResult('current-user', testId) // TODO: Replace with actual user ID
        ]);

        if (!loadedTestType) {
          throw new Error('Test type not found');
        }

        if (!loadedResult) {
          throw new Error('Test result not found');
        }

        setTestType(loadedTestType);
        setResult(loadedResult);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(t('errors.loadFailed')));
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [params.id, t]);

  const handleShare = async () => {
    try {
      if (!testType || !result) return;

      const text = t('shareText', {
        testName: testType.title,
        score: result.score,
        traits: result.traits.map(trait => `${trait.name}: ${trait.score}%`).join(', ')
      });

      if (navigator.share) {
        await navigator.share({
          title: t('shareTitle'),
          text: text
        });
      } else {
        await navigator.clipboard.writeText(text);
        // TODO: Show toast message
      }
    } catch (err) {
      console.error('Error sharing result:', err);
    }
  };

  if (loading) {
    return <LoadingScreen message={t('loading')} />;
  }

  if (error) {
    return <ErrorScreen message={error.message} onRetry={() => window.location.reload()} />;
  }

  if (!testType || !result) {
    return <ErrorScreen message={t('errors.notFound')} />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => window.history.back()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>{t('resultTitle')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleShare}>
              <IonIcon icon={share} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{testType.title}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="text-center mb-4">
              <div className="text-2xl font-bold mb-2">
                {result.score}%
              </div>
              <IonProgressBar value={result.score / 100} />
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{t('traits')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              {result.traits.map((trait, index) => (
                <IonItem key={index}>
                  <IonLabel>
                    <h2>{trait.name}</h2>
                    <p>{trait.description}</p>
                  </IonLabel>
                  <div slot="end" className="text-right">
                    <div className="font-bold">{trait.score}%</div>
                    <IonProgressBar 
                      value={trait.score / 100}
                      className="w-24"
                    />
                  </div>
                </IonItem>
              ))}
            </IonList>
          </IonCardContent>
        </IonCard>

        {result.traits.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{t('suggestions')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {result.traits.map((trait, index) => (
                  <IonItem key={index}>
                    <IonLabel className="ion-text-wrap">
                      {t(`suggestions.${testType.type}.${trait.name}`, {
                        score: trait.score
                      })}
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
} 