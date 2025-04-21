import './globals.css';
import { Metadata } from 'next';
import { Providers } from '@/providers';
import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import { CoreInitializer } from './CoreInitializer';

export const metadata: Metadata = {
  title: 'Capacitor-Next.js 15 + Ionic + Tailwind 全栈启动项目',
  description: '一个集成了Next.js 15、Ionic、Tailwind CSS和Capacitor的全栈移动应用启动项目',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <CoreInitializer />
        <NetworkStatusBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
