import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message) {
        const lower = message.toLowerCase();
        if (message.includes('管理员') || lower.includes('admin')) {
          setError(t('login.errorAdminOnly'));
        } else {
          setError(message);
        }
      } else {
        setError(t('login.errorDefault'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <i className="fas fa-tooth text-3xl text-admin-primary"></i>
          </div>
          <h1 className="text-2xl font-bold text-white">{t('login.title')}</h1>
          <p className="text-blue-200 mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="form-label">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <i className="fas fa-envelope"></i>
                </span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="admin@firstavedental.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {t('login.signingIn')}
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  {t('login.signIn')}
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('login.adminOnly')}
          </p>
        </div>
      </div>
    </div>
  );
}
