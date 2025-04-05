/**
 * Firebase 环境配置
 * 
 * 根据当前环境提供适当的 Firebase 配置信息。
 * 此文件从 src/core/config/firebase.ts 移动至此，以保持与其他 Firebase 相关代码的一致性。
 */
import { StorageConfig } from '@/core/services/storage-service';

const developmentConfig: StorageConfig = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  }
};

const productionConfig: StorageConfig = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  }
};

/**
 * 获取当前环境的 Firebase 配置
 * @returns 适用于当前环境的 Firebase 配置
 */
export const getFirebaseConfig = (): StorageConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? developmentConfig : productionConfig;
}; 