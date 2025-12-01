import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks';
import { Card, Table } from '@/components';
import { usersApi, User } from '@/api/usersApi';

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}

export function Users() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await usersApi.getUsers({ limit: 100 });
        const mappedUsers: UserListItem[] = response.results.map((user: User) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: new Date(user.createdAt).toLocaleDateString('cs-CZ'),
          isActive: user.isEmailVerified,
        }));
        setUsers(mappedUsers);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError(t('users.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [t]);

  const columns = [
    { key: 'name' as const, header: t('users.name') },
    { key: 'email' as const, header: t('users.email') },
    { key: 'role' as const, header: t('users.role') },
    {
      key: 'isActive' as const,
      header: t('users.status'),
      render: (user: UserListItem) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            user.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.isActive ? t('users.active') : t('users.inactive')}
        </span>
      ),
    },
    { key: 'createdAt' as const, header: t('users.createdAt') },
  ];

  const handleRowClick = (user: UserListItem) => {
    navigate(`/users/${user.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('users.title')}
      </h1>

      <Card>
        <Table
          columns={columns}
          data={users}
          onRowClick={handleRowClick}
          emptyMessage={t('users.noUsers')}
        />
      </Card>
    </div>
  );
}

export default Users;
