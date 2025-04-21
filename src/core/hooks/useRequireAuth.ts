import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './useUser';

/**
 * 页面调用后自动实现登录态受保护跳转。
 * 用法：
 *   useRequireAuth();
 */
export function useRequireAuth() {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/mobile/auth/login');
    }
  }, [loading, user, router]);
}
