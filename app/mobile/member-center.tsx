import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner } from '@ionic/react';
import { useMemberCenter } from '@/core/hooks/useMemberCenter';
import { useRestorePurchases } from '@/core/hooks/useRestorePurchases';
import { usePaymentHistory } from '@/core/hooks/usePaymentHistory';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

export default function MemberCenterPage() {
  useRequireAuth();
  const { subscriptions, loading, error, empty, fetchSubscriptions } = useMemberCenter();
  const { restored, loading: restoring, error: restoreError, restore } = useRestorePurchases();
  const { history, loading: historyLoading, error: historyError, fetchHistory } = usePaymentHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            {t('auto.member_center.title') || '会员中心'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h2 className="text-lg font-bold mb-4">
          {t('auto.member_center.title') || '会员中心'}
        </h2>
        {loading ? (
          <div className="flex justify-center my-6"><IonSpinner name="crescent" /></div>
        ) : error ? (
          <div className="text-red-500 text-center my-4">{error.message}</div>
        ) : empty ? (
          <div className="text-gray-400 text-center my-4">
            {t('auto.member_center.empty') || '暂无会员记录'}
          </div>
        ) : (
          subscriptions.map(sub => (
            <IonCard key={sub.id} className="mb-4">
              <IonCardHeader>
                <IonCardTitle>{sub.productId}（{sub.status === 'active' ? '有效' : '已过期'}）</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                到期时间：{sub.expiresAt ? new Date(sub.expiresAt).toLocaleString() : '无限期'}
              </IonCardContent>
            </IonCard>
          ))
        )}
        <IonButton expand="block" color="secondary" onClick={restore} disabled={restoring} className="my-4">
          {restoring ? '恢复中...' : '恢复购买'}
        </IonButton>
        {restoreError && <div className="text-red-500 text-center text-xs mb-2">{restoreError.message}</div>}
        <h2 className="text-lg font-bold mt-8 mb-4">
          {t('auto.member_center.title') || '会员中心'}
        </h2>
        <IonButton expand="block" fill="outline" onClick={fetchHistory} disabled={historyLoading} className="mb-2">
          {historyLoading ? '加载中...' : '刷新支付历史'}
        </IonButton>
        {historyError && <div className="text-red-500 text-center text-xs mb-2">{historyError.message}</div>}
        {historyLoading ? (
          <div className="flex justify-center my-6"><IonSpinner name="crescent" /></div>
        ) : history && history.length > 0 ? (
          history.map(item => (
            <IonCard key={item.transactionId} className="mb-2">
              <IonCardHeader>
                <IonCardTitle>{item.productId}（{item.status === 'success' ? '成功' : item.status === 'pending' ? '待处理' : '失败'}）</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                交易号：{item.transactionId}<br/>
                {item.error && <span className="text-red-400">错误：{item.error}</span>}
              </IonCardContent>
            </IonCard>
          ))
        ) : (
          <div className="text-gray-400 text-center my-4">
            {t('auto.member_center.empty') || '暂无会员记录'}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
