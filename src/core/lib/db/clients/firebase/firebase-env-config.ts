/**
 * Firebase 环境配置
 * 
 * 根据当前环境提供适当的 Firebase 配置信息。
 * 此文件从 src/core/config/firebase.ts 移动至此，以保持与其他 Firebase 相关代码的一致性。
 */
import { StorageConfig } from '@/core/services/storage-service';
import { configService } from '@/core/services/infrastructure/config';

const developmentConfig: StorageConfig = {
  firebase: {
    apiKey: configService.get('NEXT_PUBLIC_FIREBASE_API_KEY') || '',
    authDomain: configService.get('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') || '',
    projectId: configService.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || '',
    storageBucket: configService.get('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') || '',
    messagingSenderId: configService.get('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || '',
    appId: configService.get('NEXT_PUBLIC_FIREBASE_APP_ID') || ''
  }
};

const productionConfig: StorageConfig = {
  firebase: {
    apiKey: configService.get('NEXT_PUBLIC_FIREBASE_API_KEY') || '',
    authDomain: configService.get('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN') || '',
    projectId: configService.get('NEXT_PUBLIC_FIREBASE_PROJECT_ID') || '',
    storageBucket: configService.get('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET') || '',
    messagingSenderId: configService.get('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || '',
    appId: configService.get('NEXT_PUBLIC_FIREBASE_APP_ID') || ''
  }
};

/**
 * 获取当前环境的 Firebase 配置
 * @returns 适用于当前环境的 Firebase 配置
 */
export const getFirebaseConfig = (): StorageConfig => {
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  return isDevelopment ? developmentConfig : productionConfig;
}; 