"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonInput, IonItem, IonLabel, IonRadioGroup, IonRadio, IonToast } from "@ionic/react";
import { useQuizService } from '@/core/hooks/useQuizService';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

// 八字信息表单字段类型
interface BaziInfo {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  gender: "male" | "female";
}

export default function TestInfoFormPage() {
  useRequireAuth();
  const router = useRouter();
  const params = useSearchParams();
  const quizId = params.get("id") ?? "";
  const [info, setInfo] = useState<BaziInfo>({
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    gender: "male"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const { quizService } = useQuizService();

  // 判断 quiz 类型，非 bazi 则跳转答题页
  useEffect(() => {
    async function checkQuizType() {
      if (!quizService) return;
      const quiz = await quizService.getQuiz(quizId);
      if (quiz?.type.id !== "bazi") {
        router.replace(`/mobile/quiz/${quizId}`);
      }
    }
    checkQuizType();
  }, [quizId, router, quizService]);

  const handleChange = (field: keyof BaziInfo, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!quizService) throw new Error('服务未初始化');
      await quizService.saveUserInfo(quizId, info); // 需后端支持
      router.push(`/mobile/quiz/${quizId}`);
    } catch (e: any) {
      setError(e.message || "保存失败");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
  {t('auto.info.')}
</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">
  {t('auto.info.')}
</IonLabel>
          <IonInput type="date" value={info.birthDate} onIonChange={e => handleChange("birthDate", e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">
  {t('auto.info.')}
</IonLabel>
          <IonInput type="time" value={info.birthTime} onIonChange={e => handleChange("birthTime", e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">
  {t('auto.info.')}
</IonLabel>
          <IonInput value={info.birthPlace} onIonChange={e => handleChange("birthPlace", e.detail.value!)} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">
  {t('auto.info.')}
</IonLabel>
          <IonRadioGroup value={info.gender} onIonChange={e => handleChange("gender", e.detail.value!)}>
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
        <IonButton expand="block" className="mt-6" onClick={handleSubmit} disabled={loading}>
          {loading ? "提交中..." : "开始测试"}
        </IonButton>
        <IonToast
          isOpen={showToast}
          message={error || ""}
          duration={2000}
          color="danger"
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
}
