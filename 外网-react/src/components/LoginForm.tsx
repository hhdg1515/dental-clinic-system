import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: FC<LoginFormProps> = ({ onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const isZh = currentLanguage === 'zh';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!email) {
      errors.push(isZh ? '请填写邮箱地址' : 'Please enter email address');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(isZh ? '请输入有效的邮箱地址' : 'Please enter a valid email address');
    }

    if (!password) {
      errors.push(isZh ? '请填写密码' : 'Please enter password');
    } else if (isRegisterMode && password.length < 6) {
      errors.push(isZh ? '密码至少需要 6 个字符' : 'Password must be at least 6 characters');
    }

    return errors;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('，'));
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        await signUp(email, password, { registrationSource: 'landing_page' });
        setSuccessMessage(
          isZh ? '注册成功！欢迎加入我们的家庭' : 'Registration successful! Welcome to our family'
        );
      } else {
        await signIn(email, password);
        setSuccessMessage(isZh ? '登录成功！' : 'Login successful!');
      }

      onSuccess?.();
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('Authentication error:', err);
      }

      const errorWithCode =
        typeof err === 'object' && err !== null && 'code' in err
          ? (err as { code?: string; message?: string })
          : undefined;

      let errorMessage = '';
      switch (errorWithCode?.code) {
        case 'auth/user-not-found':
          errorMessage = isZh
            ? '未找到该用户，请确认邮箱或注册新账户'
            : 'User not found. Please check your email or register a new account';
          break;
        case 'auth/wrong-password':
          errorMessage = isZh ? '密码错误，请重试' : 'Incorrect password. Please try again';
          break;
        case 'auth/email-already-in-use':
          errorMessage = isZh
            ? '该邮箱已注册，请使用其他邮箱或直接登录'
            : 'Email already in use. Please use a different email or sign in';
          break;
        case 'auth/weak-password':
          errorMessage = isZh
            ? '密码强度过低，请至少使用 6 位字符'
            : 'Password is too weak. Please use at least 6 characters';
          break;
        case 'auth/invalid-email':
          errorMessage = isZh ? '邮箱格式不正确' : 'Invalid email format';
          break;
        case 'auth/too-many-requests':
          errorMessage = isZh ? '尝试次数过多，请稍后再试' : 'Too many requests. Please try again later';
          break;
        default:
          errorMessage = isZh ? '认证失败，请稍后重试' : 'Authentication failed, please try again';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegisterMode((prev) => !prev);
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="card-surface w-full space-y-6 text-left">
      <header className="text-left">
        <h2 className="font-display text-lg text-neutral-900 md:text-xl">
          {isRegisterMode
            ? isZh
              ? '创建新账户'
              : 'Create New Account'
            : t('form-title')}
        </h2>
      </header>

      {error && (
        <div className="alert-error">
          <i className="fas fa-exclamation-circle mt-1 text-base" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert-success">
          <i className="fas fa-check-circle mt-1 text-base" />
          <span>{successMessage}</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="email" className="form-label">
            {t('form-email')}
          </label>
          <input
            id="email"
            type="email"
            className="form-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="JOEMARK@GMAIL.COM"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="form-label">
            {t('form-password')}
          </label>
          <input
            id="password"
            type="password"
            className="form-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="*************"
            autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" />
              {isZh ? ' 处理中...' : ' Processing...'}
            </>
          ) : isRegisterMode ? (
            isZh ? '创建账户' : 'Create Account'
          ) : (
            t('form-login')
          )}
        </button>
      </form>

      <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
        <span>
          {isRegisterMode
            ? isZh
              ? '已经拥有账户？'
              : 'Already have an account?'
            : t('form-no-account')}
        </span>
        <button
          type="button"
          onClick={switchMode}
          className="font-semibold uppercase tracking-[0.28em] text-brand-primary transition hover:text-brand-primaryDark"
        >
          {isRegisterMode ? (isZh ? '点击登录' : 'Sign in here') : t('form-link')}
        </button>
      </div>
    </div>
  );
};
