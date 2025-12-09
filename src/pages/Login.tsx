import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { useTranslation } from '@/hooks';
import { Button, Input } from '@/components';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Debug: Log API URL
  useEffect(() => {
    console.log('?? DEBUG: API Base URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('?? DEBUG: All env vars:', import.meta.env);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('?? Attempting login with email:', email);
      await login({ email, password });
      navigate('/');
    } catch (err) {
      console.error('? Login error:', err);
      setError(t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
          <p className="mt-2 text-gray-600">{t('auth.welcomeBack')}</p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label={t('auth.email')}
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label={t('auth.password')}
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              {t('auth.loginButton')}
            </Button>
          </form>
          
          {/* Debug info */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            API: {import.meta.env.VITE_API_BASE_URL || 'Not set'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
