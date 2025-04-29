'use client';

import { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonToggle,
  IonReorderGroup, IonReorder, IonButton, IonChip, IonBadge, IonModal, IonIcon
} from '@ionic/react';
import { star } from 'ionicons/icons';
import { fetchMatchAlgorithms, fetchUserMatchPreference, fetchUserStatus, saveUserMatchPreference } from './api';

export default function MatchPreferencePage() {
  const [algorithms, setAlgorithms] = useState<any[]>([]);
  const [user, setUser] = useState<any>({});
  const [algoOrder, setAlgoOrder] = useState<string[]>([]);
  const [disabledAlgos, setDisabledAlgos] = useState<string[]>([]);
  const [showVipModal, setShowVipModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [algos, pref, userStatus] = await Promise.all([
          fetchMatchAlgorithms(),
          fetchUserMatchPreference(),
          fetchUserStatus()
        ]);
        setAlgorithms(algos);
        setAlgoOrder(pref.algoOrder || algos.map((a: any) => a.key));
        setDisabledAlgos(pref.disableAlgos || []);
        setUser(userStatus);
      } catch (e: any) {
        setSaveError(e.message || '加载失败');
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  const handleReorder = (event: CustomEvent) => {
    const from = event.detail.from;
    const to = event.detail.to;
    const newOrder = [...algoOrder];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, moved);
    setAlgoOrder(newOrder);
    event.detail.complete(true);
  };

  const handleToggle = (key: string) => {
    setDisabledAlgos(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveUserMatchPreference({ algoOrder, disableAlgos });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (e: any) {
      setSaveError(e.message || '保存失败');
    }
    setSaving(false);
  };

  if (loading) {
    return <IonPage><IonContent>加载中...</IonContent></IonPage>;
  }
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>匹配推荐偏好设置</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {saveError && <div style={{color:'red',padding:12}}>{saveError}</div>}
        {saveSuccess && <div style={{color:'green',padding:12}}>保存成功</div>}
        <IonList>
          <IonReorderGroup disabled={false} onIonItemReorder={handleReorder}>
            {algoOrder.map((key, idx) => {
              const algo = algorithms.find((a: any) => a.key === key);
              if (!algo) return null;
              const needTest = algo.needTest && !user[algo.testFlag!];
              const isVip = algo.vipOnly;
              const isMember = user.isVip;
              const disabled = needTest || (isVip && !isMember);
              return (
                <IonItem key={algo.key} disabled={disabled}>
                  <IonLabel>{algo.name}</IonLabel>
                  {isVip && <IonBadge color="warning" slot="end"><IonIcon icon={star}/> VIP</IonBadge>}
                  {needTest && (
                    <IonButton slot="end" size="small" color="medium" onClick={() => window.location.href = algo.testUrl!}>
                      去测试
                    </IonButton>
                  )}
                  {isVip && !isMember && (
                    <IonButton slot="end" size="small" color="warning" onClick={() => setShowVipModal(true)}>
                      会员专属
                    </IonButton>
                  )}
                  <IonToggle
                    checked={!disabledAlgos.includes(algo.key)}
                    disabled={disabled}
                    onIonChange={() => handleToggle(algo.key)}
                  />
                  <IonReorder slot="end" />
                </IonItem>
              );
            })}
          </IonReorderGroup>
        </IonList>
        <IonButton expand="block" color="primary" style={{marginTop: 16}} onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </IonButton>
        <IonButton expand="block" fill="clear" onClick={() => window.location.reload()}>恢复默认</IonButton>
        <IonModal isOpen={showVipModal} onDidDismiss={() => setShowVipModal(false)}>
          <div style={{ padding: 24 }}>
            <h2>会员专属特权</h2>
            <p>八字/五行人格等高级匹配算法仅对会员开放，开通后可享受更精准推荐！</p>
            <IonButton expand="block" color="primary" onClick={() => window.location.href='/vip'}>立即开通会员</IonButton>
            <IonButton expand="block" fill="clear" onClick={() => setShowVipModal(false)}>取消</IonButton>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
