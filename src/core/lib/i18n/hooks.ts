import { useRouter } from 'next/navigation';
import { useLocale as useIntlLocale } from 'next-intl';

/**
 * useLocale hook
 * 获取当前语言(locale)和切换语言的方法(setLocale)。
 * 用法：const { locale, setLocale } = useLocale();
 */
export function useLocale() {
  const locale = useIntlLocale();
  const router = useRouter();
  const setLocale = (newLocale: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      router.refresh(); // 触发页面刷新，应用新语言
    }
  };
  return { locale, setLocale };
}
