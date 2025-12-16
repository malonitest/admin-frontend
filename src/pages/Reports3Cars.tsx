import { useEffect, useState } from 'react';
import { Card } from '@/components';
import { reportingApi } from '@/api/reportingApi';
import type { LeasesAnalytics } from '@/types/reporting';

type Period = 'month' | 'year';

const periodLabels: Record<Period, string> = {
  month: 'Tento mìsíc',
  year: 'Tento rok',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Aktivní',
  LATE: 'Po splatnosti',
  PAIDBACK: 'Splaceno',
  SELL: 'Prodáno',
  AWAITS_PAYOUT: 'Èeká na výplatu',
  AWAITS_PAYMENT_METHOD: 'Èeká na zpùsob platby',
};

export default function Reports3Cars() {
  const [data, setData] = useState<LeasesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('year');

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await reportingApi.getLeasesAnalytics({ period, groupBy: ['status'] });
        if (!ignore) {
          setData(response);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Chyba pøi naèítání dat');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Naèítám data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const statusBreakdown = data.aggregations?.status ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistiky aut</h1>
        <p className="text-gray-600">Reporting databáze • pøehled vozového parku</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(periodLabels) as Period[]).map((key) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`px-4 py-2 rounded-md transition-colors ${
              period === key ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {periodLabels[key]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-sm text-gray-600">Celkem leasù</div>
          <div className="text-3xl font-bold text-gray-900">{data.summary.totalLeases}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Aktivní</div>
          <div className="text-3xl font-bold text-green-600">{data.summary.activeLeases}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Po splatnosti</div>
          <div className="text-3xl font-bold text-red-600">{data.summary.overdueLeases}</div>
          <div className="text-sm text-gray-500">{data.summary.problemLeases} problémových</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Splaceno</div>
          <div className="text-3xl font-bold text-gray-900">{data.summary.closedLeases}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="text-sm text-gray-600">Celková hodnota leasù</div>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.summary.totalLeaseAmount)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Celkem zaplaceno</div>
          <div className="text-3xl font-bold text-green-600">{formatCurrency(data.summary.totalPaid)}</div>
          <div className="text-sm text-gray-500">{data.summary.avgPaymentSuccessRate.toFixed(1)} % úspìšnost plateb</div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Rozdìlení podle statusu</h2>
        <div className="space-y-4">
          {statusBreakdown.map((item) => (
            <div key={item.value} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">{statusLabels[item.value] || item.value}</div>
                <div className="text-sm text-gray-600">
                  {data.summary.totalLeases ? ((item.count / data.summary.totalLeases) * 100).toFixed(1) : '0.0'} %
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Poèet</div>
                  <div className="font-medium">{item.count}</div>
                </div>
                <div>
                  <div className="text-gray-500">Aktivní</div>
                  <div className="font-medium text-green-600">{item.active ?? 0}</div>
                </div>
                <div>
                  <div className="text-gray-500">Po splatnosti</div>
                  <div className="font-medium text-red-600">{item.overdue ?? 0}</div>
                </div>
                <div>
                  <div className="text-gray-500">Celková èástka</div>
                  <div className="font-medium">{formatCurrency(item.totalAmount)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
