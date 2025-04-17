import { useRouter, useSearchParams } from 'next/navigation';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonAvatar, IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/react';

const mockProfile = {
  name: 'Alice',
  age: 25,
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  bio: '喜欢音乐、旅行和美食，期待遇见有趣的你！',
  photos: [
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
  ],
  interests: ['旅行', '美食', '运动'],
};

export default function ProfileView() {
  const router = useRouter();
  const params = useSearchParams();
  // TODO: 根据 params.get('id') 拉取对应用户数据
  const user = mockProfile;
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>个人资料</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gradient-to-br from-purple-600 to-pink-600 min-h-screen">
        <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-auto mt-10">
          <div className="flex flex-col items-center mb-6">
            <IonAvatar className="w-24 h-24 mb-4 shadow-lg border-4 border-white">
              <img src={user.avatar} alt={user.name} />
            </IonAvatar>
            <h2 className="text-2xl font-bold text-white mb-1">{user.name} <span className="text-base font-normal">{user.age}</span></h2>
            <p className="text-slate-200 mb-4">{user.bio}</p>
            <div className="flex gap-2 mb-4">
              {user.interests.map(i => <span key={i} className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs">{i}</span>)}
            </div>
          </div>
          <IonCard className="w-full max-w-md mx-auto mt-4 glass-card">
            <IonCardHeader>
              <IonCardTitle>照片墙</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="flex gap-2 flex-wrap">
                {user.photos.map((url, i) => (
                  <img key={i} src={url} alt="照片" className="w-20 h-20 object-cover rounded-lg shadow-md" />
                ))}
              </div>
            </IonCardContent>
          </IonCard>
          <IonButton expand="block" color="warning" className="mt-8 rounded-full" onClick={() => router.back()}>
            返回
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
