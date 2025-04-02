'use client';

import { usePathname, useRouter } from 'next/navigation';
import { 
  IonIcon
} from '@ionic/react';
import { 
  homeOutline, 
  heartOutline,
  searchOutline,
  chatbubbleOutline, 
  personCircleOutline, 
  settingsOutline 
} from 'ionicons/icons';

export default function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const isActive = (path: string) => pathname?.startsWith(path);

  // 使用自定义导航函数代替链接
  const navigateTo = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止默认行为
    e.stopPropagation(); // 阻止事件冒泡
    
    // 使用Next.js的Router安全导航
    if (path) {
      router.push(path);
    }
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full z-10">
      <div className="bg-[#1a2234] border-t border-gray-800 h-16 w-full flex justify-between items-center">
        <button 
          onClick={navigateTo('/mobile/home')}
          className={`flex-1 h-full flex flex-col items-center justify-center ${isActive('/mobile/home') ? 'text-secondary-500' : 'text-gray-400'}`}
        >
          <IonIcon 
            icon={homeOutline} 
            className="text-xl mb-0.5" 
          />
          <div className="text-[10px] font-medium">
            Home
          </div>
        </button>
        
        <button 
          onClick={navigateTo('/mobile/discover')}
          className={`flex-1 h-full flex flex-col items-center justify-center ${isActive('/mobile/discover') ? 'text-secondary-500' : 'text-gray-400'}`}
        >
          <IonIcon 
            icon={searchOutline} 
            className="text-xl mb-0.5" 
          />
          <div className="text-[10px] font-medium">
            Discover
          </div>
        </button>
        
        <button 
          onClick={navigateTo('/mobile/matches')}
          className={`flex-1 h-full flex flex-col items-center justify-center ${isActive('/mobile/matches') && !isActive('/mobile/matches/messages') && !isActive('/mobile/matches/chat') ? 'text-secondary-500' : 'text-gray-400'}`}
        >
          <IonIcon 
            icon={heartOutline} 
            className="text-xl mb-0.5" 
          />
          <div className="text-[10px] font-medium">
            Matches
          </div>
        </button>
        
        <button 
          onClick={navigateTo('/mobile/matches/messages')}
          className={`flex-1 h-full flex flex-col items-center justify-center ${isActive('/mobile/matches/messages') || isActive('/mobile/matches/chat') ? 'text-secondary-500' : 'text-gray-400'}`}
        >
          <IonIcon 
            icon={chatbubbleOutline} 
            className="text-xl mb-0.5" 
          />
          <div className="text-[10px] font-medium">
            Messages
          </div>
        </button>
        
        <button 
          onClick={navigateTo('/mobile/profile')}
          className={`flex-1 h-full flex flex-col items-center justify-center ${isActive('/mobile/profile') ? 'text-secondary-500' : 'text-gray-400'}`}
        >
          <IonIcon 
            icon={personCircleOutline} 
            className="text-xl mb-0.5" 
          />
          <div className="text-[10px] font-medium">
            Profile
          </div>
        </button>
        
        <button 
          onClick={navigateTo('/mobile/settings')}
          className={`flex-1 h-full flex flex-col items-center justify-center ${isActive('/mobile/settings') ? 'text-secondary-500' : 'text-gray-400'}`}
        >
          <IonIcon 
            icon={settingsOutline} 
            className="text-xl mb-0.5" 
          />
          <div className="text-[10px] font-medium">
            Settings
          </div>
        </button>
      </div>
    </div>
  );
} 