'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonItemDivider,
  IonList,
  IonAlert
} from '@ionic/react';
import { getSettingService } from '@/core/services/setting-service';
import { useToast } from '@/core/hooks/useToast';
import { useAsyncAction } from '@/core/hooks/useAsyncAction';
import { FormSaveButton } from '@/core/components/form/FormSaveButton';
import { useAuth } from '@/core/hooks/useAuth';
import { useUser } from '@/core/hooks/useUser';
import { User } from '@/core/lib/db/types/user';
import { LoadingSpinner } from '@/core/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/core/components/ui/ErrorDisplay';
import BottomNavBar from '@/mobile/components/navigation/BottomNavBar';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

export default function AccountSettingsPage() {
  useRequireAuth();
  const router = useRouter();
  const settingService = getSettingService();
  const { triggerToast, showToast, toastMessage, setShowToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载用户数据
  const loadUserData = async () => {
    setIsLoading(true);
    try {
      // 可用 settingService 统一获取用户数据（此处用 mock）
      const currentUser = { id: 'mock-id', email: 'test@example.com', phone: '1234567890' } as User;
      setUser(currentUser);
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
    } catch (err) {
      setError('Failed to load account settings');
      triggerToast('Failed to load account settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line
  }, []);

  // 保存账号信息
  const { run: handleSave, loading: saveLoading } = useAsyncAction(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updated = await settingService.updateAccount({ id: user.id, email, phone });
      setUser(updated);
      triggerToast('Account settings updated successfully');
    } catch (err) {
      setError('Failed to update account settings');
      triggerToast('Failed to update account settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  });

  // 删除账号
  const { run: handleDeleteAccount } = useAsyncAction(async () => {
    // 这里可调用 settingService.deleteAccount(user.id)
    triggerToast('Account deleted (mock)');
    router.push('/');
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>
  {t('auto.page.')}
</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorDisplay error={error} onRetry={loadUserData} />
        ) : (
          <IonList>
            <IonItemDivider>
              <IonLabel>
  {t('auto.page.CONTACT')}
</IonLabel>
            </IonItemDivider>
            <IonItem>
              <IonLabel position="stacked">
  {t('auto.page.Email')}
</IonLabel>
              <IonInput value={email} onIonChange={e => setEmail(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">
  {t('auto.page.PhoneNu')}
</IonLabel>
              <IonInput value={phone} onIonChange={e => setPhone(e.detail.value!)} />
            </IonItem>
            <IonItemDivider>
              <IonLabel>
  {t('auto.page.CHANGEP')}
</IonLabel>
            </IonItemDivider>
            <IonItem>
              <IonLabel position="stacked">
  {t('auto.page.Current')}
</IonLabel>
              <IonInput
                type="password"
                value={currentPassword}
                onIonChange={e => setCurrentPassword(e.detail.value || '')}
                placeholder={t('auto.page.Enteryo')}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">
  {t('auto.page.NewPass')}
</IonLabel>
              <IonInput
                type="password"
                value={newPassword}
                onIonChange={e => setNewPassword(e.detail.value || '')}
                placeholder={t('auto.page.Enteryo')}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">
  {t('auto.page.Confirm')}
</IonLabel>
              <IonInput
                type="password"
                value={confirmPassword}
                onIonChange={e => setConfirmPassword(e.detail.value || '')}
                placeholder={t('auto.page.Confirm')}
              />
            </IonItem>
            <IonItemDivider>
              <IonLabel>
  {t('auto.page.ACCOUNT')}
</IonLabel>
            </IonItemDivider>
            <FormSaveButton loading={isSaving || saveLoading} onClick={handleSave}>
              保存修改
            </FormSaveButton>
            <IonButton color="danger" expand="block" onClick={() => setShowDeleteAlert(true)}>
              删除账号
            </IonButton>
          </IonList>
        )}
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={2000} />
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={t('auto.page.')}
          message={t('auto.page.')}
          buttons={[
            { text: '取消', role: 'cancel' },
            { text: '删除', role: 'destructive', handler: handleDeleteAccount }
          ]}
        />
        <BottomNavBar />
      </IonContent>
    </IonPage>
  );
}