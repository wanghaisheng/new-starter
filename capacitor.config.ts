import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'Capacitor Next.js App',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;
