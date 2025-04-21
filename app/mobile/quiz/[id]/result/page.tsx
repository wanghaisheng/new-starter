'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuizResult } from '@/core/hooks/useQuiz';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonProgressBar, IonList, IonItem, IonLabel } from '@ionic/react';
import { arrowBack, share } from 'ionicons/icons';
import { LoadingScreen } from '@/core/components/common/LoadingScreen';
import { ErrorScreen } from '@/core/components/common/ErrorScreen';
import { ErrorDisplay } from '@/core/components/common/ErrorDisplay';

export default function TestResultPage() {
  const params = useParams();
  const t = useTranslations('test');
  // 需替换为实际用户ID
  const userId = 'current-user';
  const quizId = params.id as string;
  const { result, fetchResult, reloadResult, loading, fetchError, updateError, deleteError, empty } = useQuizResult(userId, quizId);

  const handleShare = async () => {
    try {
      if (!result) return;
      const text = t('shareText', {
        testName: result.quiz?.title ?? '',
        score: result.score,
        traits: result.report?.traits?.map((trait: any) => `${trait.name}: ${trait.score}%`).join(', ')
      });
      if (navigator.share) {
        await navigator.share({
          title: result.quiz?.title ?? '',
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert(t('share.copied'));
      }
    } catch (err) {
      alert(t('share.failed'));
    }
  };

  if (fetchError || updateError || deleteError) {
    return (
      <IonPage>
        <IonContent className="bg-[#0f172a]">
          <ErrorDisplay error={(fetchError || updateError || deleteError)?.toString()} />
        </IonContent>
      </IonPage>
    );
  }

  if (loading) {
    return <LoadingScreen message={t('loading')} />;
  }

  if (!result) {
    return <ErrorScreen message={t('errors.notFound')} />;
  }

  // traits 字段不存在于 QuizResult，需从 report 字段兼容获取
  // 假设 report.traits 为数组，结构为 { name, description, score }
  const traits = result?.report?.traits || [];

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
            <IonCardTitle>{result.quiz?.title ?? ''}</IonCardTitle>
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
              {traits.map((trait: any, index: number) => (
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

        {traits.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{t('suggestions')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                {traits.map((trait: any, index: number) => (
                  <IonItem key={index}>
                    <IonLabel className="ion-text-wrap">
                      {t(`suggestions.${result.quiz?.type ?? ''}.${trait.name}`, {
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