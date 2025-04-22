import { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonFooter, IonIcon, IonImg, IonToast, IonSpinner, IonLabel
} from '@ionic/react';
import { cameraOutline, trashOutline } from 'ionicons/icons';
import { useImageUpload } from '@/core/hooks/useImageUpload';
import { useRequireAuth } from '@/core/hooks/useRequireAuth';

export default function ProfileSetupPhotos() {
  useRequireAuth();
  const { photos, uploadPhoto, removePhoto, loading, error } = useImageUpload();
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleAddPhoto = () => {
    if (photos.length >= 6) return;
    const url = window.prompt('请输入图片URL（模拟上传）');
    if (url) uploadPhoto(url).catch(e => {
      setToastMessage(e?.message || '上传失败，请重试');
      setShowToast(true);
    });
  };

  const handleRemove = (idx: number) => {
    removePhoto(idx).catch(e => {
      setToastMessage(e?.message || '删除失败，请重试');
      setShowToast(true);
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            {t('auto.page.SetupPhotos') || '上传照片'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
        <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-auto mt-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-2">
              {t('auto.page.SetupPhotos') || '上传照片'}
            </h2>
            <p className="text-slate-400">
              {t('auto.setup_photos.2') || '请上传至少两张照片'}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {photos.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-800 shadow-lg">
                <IonImg src={url} className="object-cover w-full h-full" />
                <IonButton fill="clear" color="danger" size="small" className="absolute top-1 right-1 z-10" onClick={() => handleRemove(i)} disabled={loading}>
                  <IonIcon icon={trashOutline} />
                </IonButton>
              </div>
            ))}
            {photos.length < 6 && (
              <IonButton fill="outline" color="light" className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-slate-500" onClick={handleAddPhoto} disabled={loading}>
                <IonIcon icon={cameraOutline} />
                <IonLabel>
                  {t('auto.page.AddPhoto') || '添加照片'}
                </IonLabel>
              </IonButton>
            )}
            {loading && <div className="flex items-center justify-center w-24 h-24"><IonSpinner name="dots" color="light" /></div>}
          </div>
        </div>
      </IonContent>
      <IonFooter className="ion-padding ion-text-center">
        <IonButton expand="block" color="warning" disabled={photos.length < 2 || loading}>
          {t('auto.page.Done') || '完成'}
        </IonButton>
      </IonFooter>
      <IonToast
        isOpen={showToast}
        message={toastMessage}
        duration={2000}
        color="danger"
        onDidDismiss={() => setShowToast(false)}
      />
    </IonPage>
  );
}
