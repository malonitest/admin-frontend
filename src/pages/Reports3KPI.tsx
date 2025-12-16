import { useEffect, useState } from 'react';
import { Card } from '@/components';
import { reportingApi } from '@/api/reportingApi';
import type { DailySummaryResponse } from '@/types/reporting';

type Period = '30d' | '90d' | 'year';

const periodLabels: Record<Period, string> = {
  '30d': 'Posledních 30 dní',
  '90d': 'Posledních 90 dní',
  year: 'Poslední rok',
};

export default function Reports3KPI() {
  const [data, setData] = useState<DailySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('30d');

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const dateTo = new Date();
        const dateFrom = new Date(dateTo);

        if (period === '30d') {
          dateFrom.setDate(dateTo.getDate() - 30);
        } else if (period === '90d') {
          dateFrom.setDate(dateTo.getDate() - 90);
        } else {
          dateFrom.setFullYear(dateTo.getFullYear() - 1);
        }

        const response = await reportingApi.getDailySummary({
          dateFrom: dateFrom.toISOString().split('T')[0],
          dateTo: dateTo.toISOString().split('T')[0],
        });

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

  const formatNumber = (value: number) => new Intl.NumberFormat('cs-CZ').format(Math.round(value));
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KPI Investor</h1>
        <p className="text-gray-600">Reporting databáze • pøedpoèítané metriky</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="text-sm text-gray-600">Nové leady</div>
          <div className="text-3xl font-bold text-gray-900">{formatNumber(data.totals.newLeads)}</div>
          <div className="text-sm text-gray-500">{data.period.days} dní</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Konverze</div>
          <div className="text-3xl font-bold text-gray-900">{formatNumber(data.totals.convertedLeads)}</div>
          <div className="text-sm text-gray-500">{data.averages.conversionRate.toFixed(1)} % míra</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Aktivní leasù</div>
          <div className="text-3xl font-bold text-gray-900">{formatNumber(data.averages.activeLeases)}</div>
          <div className="text-sm text-gray-500">prùmìr za období</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Celkový pøíjem</div>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.totals.totalRevenue)}</div>
          <div className="text-sm text-green-600">{formatCurrency(data.averages.dailyRevenue)} / den</div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Vývoj v èase</h2>
        <div className="space-y-4">
          {data.timeSeries.map((day) => (
            <div key={day.date} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">{new Date(day.date).toLocaleDateString('cs-CZ')}</div>
                <div className="text-sm text-gray-600">{day.conversionRate.toFixed(1)} % konverze</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Leady</div>
                  <div className="font-medium">{formatNumber(day.newLeads)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Konverze</div>
                  <div className="font-medium">{formatNumber(day.convertedLeads)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Aktivní</div>
                  <div className="font-medium">{formatNumber(day.activeLeases)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Pøíjem</div>
                  <div className="font-medium">{formatCurrency(day.totalRevenue)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
