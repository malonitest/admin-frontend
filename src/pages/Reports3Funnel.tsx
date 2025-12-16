import { useEffect, useState } from 'react';
import { Card } from '@/components';
import { reportingApi } from '@/api/reportingApi';
import type { LeadsAnalytics } from '@/types/reporting';

type Period = '30d' | '90d' | 'year';

const periodLabels: Record<Period, string> = {
  '30d': 'Posledních 30 dní',
  '90d': 'Posledních 90 dní',
  year: 'Poslední rok',
};

const statusLabels: Record<string, string> = {
  NEW: 'Nový',
  SUPERVISOR_APPROVED: 'Schváleno supervisorem',
  CUSTOMER_APPROVED: 'Schváleno zákazníkem',
  ASSIGNED: 'Pøiøazeno',
  SALES_APPROVED: 'Schváleno sales',
  SENT_TO_OZ: 'Pøedáno OS',
  CONVERTED: 'Konvertováno',
  DECLINED: 'Zamítnuto',
};

const sourceLabels: Record<string, string> = {
  WEB: 'Web',
  APP: 'Aplikace',
  SALES: 'Sales tým',
  OS: 'Obchodní zástupce',
  RECOMMENDATION: 'Doporuèení',
};

export default function Reports3Funnel() {
  const [data, setData] = useState<LeadsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('30d');

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await reportingApi.getLeadsAnalytics({ period, groupBy: ['status', 'source'] });
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

  const statusBreakdown = data.aggregations?.status ?? [];
  const sourceBreakdown = data.aggregations?.source ?? [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Funnel Report</h1>
        <p className="text-gray-600">Cesta leadu od NEW po CONVERTED</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-sm text-gray-600">Celkem leadù</div>
          <div className="text-3xl font-bold text-gray-900">{data.summary.totalLeads}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Konvertováno</div>
          <div className="text-3xl font-bold text-green-600">{data.summary.convertedLeads}</div>
          <div className="text-sm text-gray-500">{data.summary.conversionRate.toFixed(1)} % míra</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-600">Zamítnuto</div>
          <div className="text-3xl font-bold text-red-600">{data.summary.declinedLeads}</div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Funnel podle statusu</h2>
        <div className="space-y-3">
          {statusBreakdown.map((item) => {
            const percentage = data.summary.totalLeads
              ? (item.count / data.summary.totalLeads) * 100
              : 0;
            return (
              <div key={item.value}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{statusLabels[item.value] || item.value}</span>
                  <span className="text-sm text-gray-600">
                    {item.count} ({percentage.toFixed(1)} %)
                    {item.conversionRate !== undefined && ` • ${item.conversionRate.toFixed(1)} % konverze`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className="bg-red-600 h-6 rounded-full flex items-center px-2"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Rozdìlení podle zdroje</h2>
        <div className="space-y-4">
          {sourceBreakdown.map((item) => (
            <div key={item.value} className="border-b border-gray-200 pb-3 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">{sourceLabels[item.value] || item.value}</div>
                {item.conversionRate !== undefined && (
                  <div className="text-sm text-gray-600">{item.conversionRate.toFixed(1)} % konverze</div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Celkem</div>
                  <div className="font-medium">{item.count}</div>
                </div>
                <div>
                  <div className="text-gray-500">Konvertováno</div>
                  <div className="font-medium text-green-600">{item.converted ?? 0}</div>
                </div>
                <div>
                  <div className="text-gray-500">Zamítnuto</div>
                  <div className="font-medium text-red-600">{item.declined ?? 0}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
