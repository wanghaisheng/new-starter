import { useState } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonFooter, IonIcon, IonImg
} from '@ionic/react';
import { cameraOutline, trashOutline } from 'ionicons/icons';

export default function ProfileSetupPhotos() {
  const [photos, setPhotos] = useState<string[]>([]);
  const handleAddPhoto = () => {
    // TODO: 调用图片选择/上传逻辑
    const url = window.prompt('请输入图片URL（模拟上传）');
    if (url) setPhotos([...photos, url]);
  };
  const handleRemove = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>上传照片</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gradient-to-br from-slate-900 to-slate-800 min-h-screen">
        <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-auto mt-10">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-2">展示最好的自己</h2>
            <p className="text-slate-400">请上传至少2张照片</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            {photos.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-800 shadow-lg">
                <IonImg src={url} className="object-cover w-full h-full" />
                <IonButton fill="clear" color="danger" size="small" className="absolute top-1 right-1 z-10" onClick={() => handleRemove(i)}>
                  <IonIcon icon={trashOutline} />
                </IonButton>
              </div>
            ))}
            {photos.length < 6 && (
              <IonButton fill="outline" color="light" className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-slate-500" onClick={handleAddPhoto}>
                <IonIcon icon={cameraOutline} />
              </IonButton>
            )}
          </div>
        </div>
      </IonContent>
      <IonFooter className="ion-padding ion-text-center">
        <IonButton expand="block" color="warning" disabled={photos.length < 2}>
          下一步
        </IonButton>
      </IonFooter>
    </IonPage>
  );
}
