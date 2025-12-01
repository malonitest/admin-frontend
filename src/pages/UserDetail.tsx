import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks';
import { Card, Button } from '@/components';
import { UserDetail as UserDetailType } from '@/types';

// Mock data
const mockUsers: Record<string, UserDetailType> = {
  '1': { id: '1', name: 'Jan Novák', email: 'jan.novak@example.com', role: 'ADMIN', createdAt: '2024-01-15', updatedAt: '2024-11-20', isActive: true, phone: '+420 123 456 789', address: 'Praha 1, Václavské náměstí 1' },
  '2': { id: '2', name: 'Marie Svobodová', email: 'marie.svobodova@example.com', role: 'SALES', createdAt: '2024-02-20', updatedAt: '2024-10-15', isActive: true, phone: '+420 987 654 321', address: 'Brno, Masarykova 10' },
  '3': { id: '3', name: 'Petr Dvořák', email: 'petr.dvorak@example.com', role: 'SUPERVISOR', createdAt: '2024-03-10', updatedAt: '2024-09-05', isActive: false, phone: '+420 555 666 777', address: 'Ostrava, Hlavní 5' },
  '4': { id: '4', name: 'Eva Černá', email: 'eva.cerna@example.com', role: 'SALES', createdAt: '2024-04-05', updatedAt: '2024-08-30', isActive: true, phone: '+420 111 222 333', address: 'Plzeň, Náměstí Republiky 3' },
  '5': { id: '5', name: 'Tomáš Procházka', email: 'tomas.prochazka@example.com', role: 'OS', createdAt: '2024-05-12', updatedAt: '2024-07-25', isActive: true, phone: '+420 444 555 666', address: 'Liberec, Pražská 15' },
};

export function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const user = id ? mockUsers[id] : null;

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('errors.notFound')}</p>
        <Button onClick={() => navigate('/users')} className="mt-4">
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('users.detail')}
        </h1>
        <Button variant="secondary" onClick={() => navigate('/users')}>
          {t('common.back')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Základní informace">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-gray-500">{t('users.name')}</dt>
              <dd className="mt-1 text-gray-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t('users.email')}</dt>
              <dd className="mt-1 text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t('users.role')}</dt>
              <dd className="mt-1 text-gray-900">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t('users.status')}</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.isActive ? t('users.active') : t('users.inactive')}
                </span>
              </dd>
            </div>
          </dl>
        </Card>

        <Card title="Kontaktní údaje">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-gray-500">Telefon</dt>
              <dd className="mt-1 text-gray-900">{user.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Adresa</dt>
              <dd className="mt-1 text-gray-900">{user.address || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">{t('users.createdAt')}</dt>
              <dd className="mt-1 text-gray-900">{user.createdAt}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Poslední aktualizace</dt>
              <dd className="mt-1 text-gray-900">{user.updatedAt}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}

export default UserDetail;
