import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Button, Input } from '@/components';

export function CustomerLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('cashndrive');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ phone, password });
      navigate('/customer/lead');
    } catch (err: any) {
      console.error('Customer login error:', err);
      setError(err.response?.data?.message || 'Přihlášení se nezdařilo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Zákaznický účet</h1>
          <p className="mt-2 text-gray-600">Přihlaste se telefonem</p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Telefon"
              type="tel"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />

            <Input
              label="Heslo"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && <div className="text-sm text-red-600 text-center">{error}</div>}

            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Přihlásit
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin;
