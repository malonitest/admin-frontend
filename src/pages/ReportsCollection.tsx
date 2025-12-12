import { useMemo, useState } from 'react';
import { useCollectionReport } from '@/hooks';
import type { CollectionReportPeriod, ICollectionCustomer, ICollectionKPI } from '@/types';

const PERIOD_OPTIONS: CollectionReportPeriod[] = ['week', 'month', 'year', 'custom'];

const currencyFormatter = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('cs-CZ', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
};

const formatCurrency = (value: number | undefined) => currencyFormatter.format(value ?? 0);

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = (status || '').toUpperCase();
  const colors: Record<string, string> = {
    OVERDUE: 'bg-red-100 text-red-800',
    IN_COLLECTION: 'bg-orange-100 text-orange-800',
    ACTIVE: 'bg-blue-100 text-blue-800',
    PAUSED: 'bg-gray-100 text-gray-800',
    CLOSED: 'bg-green-100 text-green-800',
  };
  const cls = colors[normalized] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {normalized || 'NEZNÁMÝ'}
    </span>
  );
};

const SummaryCard = ({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) => (
  <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
  </div>
);

const CollectionEmptyState = ({ isWaiting }: { isWaiting: boolean }) => (
  <div className="p-6 text-center text-sm text-gray-500">
    {isWaiting ? 'Vyberte prosím datum od/do pro vlastní období.' : 'Žádná data pro zvolené období.'}
  </div>
);

const ReportsCollection = () => {
  const [period, setPeriod] = useState<CollectionReportPeriod>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const { data, loading, error, refetch, isWaitingForRange } = useCollectionReport({
    period,
    dateFrom: period === 'custom' ? customDateFrom : undefined,
    dateTo: period === 'custom' ? customDateTo : undefined,
  });

  const derivedKpi: ICollectionKPI = useMemo(() => {
    if (data?.kpi) {
      return data.kpi;
    }

    const customers = data?.customers ?? [];
    if (customers.length === 0) {
      return {
        totalCustomers: 0,
        totalOverdueAmount: 0,
        averageDaysOverdue: 0,
        maxDaysOverdue: 0,
      };
    }

    const totalAmount = customers.reduce((sum, item) => sum + (item.totalDueAmount ?? 0), 0);
    const totalDays = customers.reduce((sum, item) => sum + (item.daysOverdue ?? 0), 0);
    const maxDays = Math.max(...customers.map((item) => item.daysOverdue ?? 0));

    return {
      totalCustomers: customers.length,
      totalOverdueAmount: totalAmount,
      averageDaysOverdue: customers.length ? totalDays / customers.length : 0,
      maxDaysOverdue: Number.isFinite(maxDays) ? maxDays : 0,
    };
  }, [data]);

  const customers: ICollectionCustomer[] = data?.customers ?? [];

  const dateFrom = data?.dateFrom;
  const dateTo = data?.dateTo;

  const dateRangeLabel = useMemo(() => {
    if (!dateFrom || !dateTo) {
      return '—';
    }
    return `${formatDate(dateFrom)} – ${formatDate(dateTo)}`;
  }, [dateFrom, dateTo]);

  const isCustom = period === 'custom';
  const missingCustomRange = isCustom && (!customDateFrom || !customDateTo);

  const handleRefresh = () => {
    if (missingCustomRange) {
      return;
    }
    refetch();
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Collection Report</h1>
        <p className="text-sm text-gray-500">Pøehled klientù po splatnosti a klíèových metrik inkasa.</p>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Èasové období
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setPeriod(option)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === option ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {option === 'week' && 'Týden'}
                {option === 'month' && 'Mìsíc'}
                {option === 'year' && 'Rok'}
                {option === 'custom' && 'Vlastní'}
              </button>
            ))}
          </div>

          {isCustom && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={customDateFrom}
                onChange={(event) => setCustomDateFrom(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Od"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(event) => setCustomDateTo(event.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Do"
              />
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading || missingCustomRange}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Aktualizovat
          </button>

          <p className="text-sm text-gray-500">Vybrané období: {dateRangeLabel}</p>
        </div>

        {missingCustomRange && (
          <p className="mt-2 text-xs text-red-600">Pro vlastní období vyberte prosím datum od i do.</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Klienti po splatnosti" value={derivedKpi.totalCustomers.toString()} subtitle="Aktivní collection pøípady" />
        <SummaryCard label="Dluh po splatnosti" value={formatCurrency(derivedKpi.totalOverdueAmount)} subtitle="Celková èástka" />
        <SummaryCard label="Prùmìrná doba po splatnosti" value={`${derivedKpi.averageDaysOverdue.toFixed(1)} dnù`} subtitle="Prùmìr v dnech" />
        <SummaryCard label="Nejdelší po splatnosti" value={`${derivedKpi.maxDaysOverdue} dnù`} subtitle="Maximální poèet dnù" />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Klienti v collection</h2>
            <p className="text-sm text-gray-500">Seznam konvertovaných klientù s dluhem po splatnosti.</p>
          </div>
          {loading && <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">ID zákazníka</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">Jméno</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">Datum splatnosti</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">Dny po splatnosti</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">Dluh na nájmu</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">Poznámky</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <CollectionEmptyState isWaiting={isWaitingForRange} />
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id || customer.leaseId || customer.customerId} className="text-gray-700">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{customer.customerId || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{customer.customerName || 'Neznámý zákazník'}</td>
                    <td className="px-4 py-3">{formatDate(customer.dueDate)}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{customer.daysOverdue ?? 0}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(customer.totalDueAmount ?? 0)}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.notes || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={customer.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsCollection;
