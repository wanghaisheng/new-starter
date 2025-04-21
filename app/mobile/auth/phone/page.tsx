import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/core/hooks/useAuth';
import { Button } from '@/core/components/ui/button';
import { Input } from '@/core/components/ui/input';
import { Card } from '@/core/components/ui/card';
import Link from 'next/link';

export default function PhoneAuthPage() {
  const router = useRouter();
  const { login, sendVerificationCode, loading, error } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [localError, setLocalError] = useState('');
  const recaptchaRef = useRef<any>(null);

  // 隐形模式 RecaptchaVerifier 初始化
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).firebase && !recaptchaRef.current) {
      // 若已存在则不重复创建
      recaptchaRef.current = new (window as any).firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          // 用户通过验证，可在此处做日志
        },
        'expired-callback': () => {
          setLocalError('验证码验证已过期，请重新获取');
        }
      });
    }
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!/^1\d{10}$/.test(phone)) {
      setLocalError('请输入有效的手机号（11位数字）');
      return;
    }
    try {
      if (!recaptchaRef.current) {
        setLocalError('安全验证加载失败，请刷新页面');
        return;
      }
      await sendVerificationCode(phone, recaptchaRef.current);
      setStep('verify');
    } catch (err) {
      setLocalError('验证码发送失败，请稍后重试');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!code) {
      setLocalError('请输入验证码');
      return;
    }
    try {
      await login('phone', { phone, code });
      window.location.replace('/mobile/discover');
    } catch (err) {
      setLocalError('登录失败，请检查验证码');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div id="recaptcha-container" />
        <h1 className="text-2xl font-bold text-center mb-6"{t('auto.page.')}/h1>
        {(localError || error) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {localError || (typeof error === 'string' ? error : error?.message)}
          </div>
        )}
        {step === 'input' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                手机号
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="mt-1"
                disabled={loading}
                placeholder={t('auto.page.')}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '发送中...' : '获取验证码'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                验证码
              </label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="mt-1"
                disabled={loading}
                placeholder={t('auto.page.')}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '验证中...' : '登录'}
            </Button>
          </form>
        )}
        <div className="text-sm text-center mt-4">
          <span className="text-gray-500">或</span>
          <Link href="/mobile/auth/login" className="ml-2 text-blue-500"{t('auto.page.')}/Link>
        </div>
      </Card>
    </div>
  );
}