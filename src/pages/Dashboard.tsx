import { useTranslation } from '@/hooks';
import { Card } from '@/components';

export function Dashboard() {
  const { t } = useTranslation();

  const stats = [
    { label: t('dashboard.totalUsers'), value: '1,234', change: '+12%' },
    { label: t('dashboard.activeUsers'), value: '856', change: '+5%' },
    { label: t('dashboard.newToday'), value: '24', change: '+18%' },
    { label: t('dashboard.revenue'), value: '125 000 Kč', change: '+8%' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('dashboard.title')}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </span>
              <span className="text-sm text-green-600">{stat.change}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card title={t('dashboard.welcome')}>
        <p className="text-gray-600">
          Toto je placeholder pro dashboard. Zde budou zobrazeny důležité informace a statistiky.
        </p>
      </Card>
    </div>
  );
}

export default Dashboard;
