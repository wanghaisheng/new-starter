'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/core/hooks/useAuth';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/core/components/ui/card';
import { CustomLink } from '@/core/components/ui/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login('email', { email, password });
      window.location.replace('/mobile/discover');
    } catch (err) {
      // error 由 hook 统一处理
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {t('auto.page.Login')}
          </CardTitle>
          <CardDescription>
            输入您的账号信息以登录
          </CardDescription>
          <div className="mt-2 text-sm text-gray-500">
            演示账号:
            <br />
            邮箱: demo@example.com
            <br />
            密码: password
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t('auto.page.Email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t('auto.page.EmailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {t('auto.page.Password')}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t('auto.page.PasswordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error.message || String(error)}</p>}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
            <div className="text-sm text-center">
              <span className="text-gray-500">
                {t('auto.page.AlreadyHaveAccount') || '已有账号？'}
              </span>
              <CustomLink href="/mobile/auth/register">
                {t('auto.page.RegisterNow') || '立即注册'}
              </CustomLink>
            </div>
            <div className="text-sm text-center">
              <CustomLink href="/mobile/auth/forgot-password">
                {t('auto.page.ForgotPassword') || '忘记密码？'}
              </CustomLink>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}