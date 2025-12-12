import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { useFinancialReport } from '@/hooks';
import type {
  IFinancialBreakdownItem,
  IFinancialCategoryItem,
  KPIReportPeriod,
} from '@/types';

const PERIOD_OPTIONS: KPIReportPeriod[] = ['day', 'week', 'month', 'year', 'custom'];

const moneyFormatter = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('cs-CZ');

const dateFormatter = new Intl.DateTimeFormat('cs-CZ', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
}

function formatCurrency(amount: number) {
  return moneyFormatter.format(amount ?? 0);
}

function formatPercentage(value: number) {
  return `${(value ?? 0).toFixed(1)} %`;
}

const SummaryCard = ({ label, value, helper }: { label: string; value: string; helper?: string }) => (
  <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
    {helper && <p className="text-xs text-gray-400 mt-1">{helper}</p>}
  </div>
);

const CategoryList = ({ title, icon, items }: { title: string; icon: string; items: IFinancialCategoryItem[] }) => (
  <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xl" aria-hidden>{icon}</span>
      <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
    </div>
    {items.length === 0 ? (
      <p className="text-sm text-gray-500">Bez dat pro zvolené období.</p>
    ) : (
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.type} className="flex items-center justify-between text-sm">
            <div>
              <p className="font-medium text-gray-900">{item.label}</p>
              {item.count !== undefined && (
                <p className="text-xs text-gray-500">Poèet: {numberFormatter.format(item.count)}</p>
              )}
              {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
              {typeof item.percentage === 'number' && (
                <p className="text-xs text-gray-500">{item.percentage.toFixed(1)} %</p>
              )}
            </div>
          </li>
        ))}

      </ul>
    )}
  </div>
);

const BreakdownList = ({ title, items }: { title: string; items: IFinancialBreakdownItem[] }) => (
  <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
    {items.length === 0 ? (
      <p className="text-sm text-gray-500">Bez dat</p>
    ) : (
      <ul className="space-y-3 text-sm">
        {items.map((item) => (
          <li key={item.type}>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{item.label}</span>
              <span className="text-gray-700">{formatCurrency(item.amount)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <div className="flex-1 h-2 rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
              <span>{item.percentage.toFixed(1)} %</span>
            </div>
          </li>
        ))}

      </ul>
    )}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status.toUpperCase();
  const variants: Record<string, string> = {
    PAID: 'bg-green-100 text-green-800',
    UNPAID: 'bg-yellow-100 text-yellow-800',
    OVERDUE: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    FAILED: 'bg-red-100 text-red-800',
  };
  const cls = variants[normalized] || 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{normalized}</span>;
};

const Table = ( {
  title,
  columns,
  rows,
  emptyLabel,
}: {
  title: string;
  columns: { key: string; label: string; width?: string; align?: 'left' | 'right' }[];
  rows: Record<string, string | number | JSX.Element>[];
  emptyLabel: string;
} ) => (
  <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
    {rows.length === 0 ? (
      <p className="text-sm text-gray-500">{emptyLabel}</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={`px-3 py-2 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>{col.label}</th>
              ))}

            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id as string} className="text-gray-700">
                {columns.map((col) => (
                  <td
                    key={`${row.id as string}-${col.key}`}
                    className={`px-3 py-2 ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {row[col.key] as JSX.Element | string | number}
                  </td>
                ))}

              </tr>
            ))}

          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default function ReportsFinancial() {
  const [period, setPeriod] = useState<KPIReportPeriod>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const queryFilters = useMemo(
    () => {
      if (period !== 'custom') {
        return { period } as const;
      }
      return {
        period,
        dateFrom: customDateFrom ? new Date(`${customDateFrom}T00:00:00.000Z`).toISOString() : undefined,
        dateTo: customDateTo ? new Date(`${customDateTo}T23:59:59.999Z`).toISOString() : undefined,
      } as const;
    },
    [ period, customDateFrom, customDateTo ],
  );

  const { data, loading, error, refetch } = useFinancialReport(queryFilters);
  const isCustomReady =
    period !== 'custom' || (Boolean(queryFilters.dateFrom) && Boolean(queryFilters.dateTo));

  const activeRangeLabel = data
    ? `${formatDate(data.period.dateFrom)} – ${formatDate(data.period.dateTo)}`
    : undefined;

  const invoiceRows = (data?.invoices ?? []).map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    amount: formatCurrency(invoice.amount),
    dueDate: formatDate(invoice.dueDate),
    paidDate: formatDate(invoice.paidDate || undefined),
    status: <StatusBadge status={invoice.status} />,
    type: invoice.type,
  }));

  const paymentRows = (data?.payments ?? []).map((payment) => ({
    id: payment.id,
    leaseId: payment.leaseId,
    customerName: payment.customerName,
    amount: formatCurrency(payment.amount),
    paidAt: formatDate(payment.paidAt),
    type: payment.type,
    status: <StatusBadge status={payment.status} />,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kompletní finanèní report (P/L)</h1>
            <p className="text-sm text-gray-600">
              Pøehled pøíjmù, nákladù a zisku. {activeRangeLabel && `Období: ${activeRangeLabel}.`}
            </p>
          </div>
          {data?.generatedAt && (
            <p className="text-xs text-gray-500">Aktualizováno {formatDate(data.generatedAt)}</p>
          )}
        </div>
      </header>

      <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">Èasové období:</span>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => {
                  setPeriod(option);
                  if (option !== 'custom') {
                    setCustomDateFrom('');
                    setCustomDateTo('');
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  period === option
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option === 'day' && 'Den'}
                {option === 'week' && 'Týden'}
                {option === 'month' && 'Mìsíc'}
                {option === 'year' && 'Rok'}
                {option === 'custom' && 'Vlastní'}
              </button>
            ))}
          </div>
        </div>

        {period === 'custom' && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDateFrom}
                onChange={(event) => setCustomDateFrom(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-gray-500">–</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(event) => setCustomDateTo(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-xs text-gray-500">Vyberte datum od/do. Naètení probìhne automaticky.</p>
          </div>
        )}
      </section>

      {!isCustomReady && period === 'custom' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          Pro vlastní období nejprve zadejte obì data.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={refetch}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-700 hover:text-white"
          >
            Opakovat
          </button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`financial-skeleton-${idx}`} className="p-4 rounded-xl border border-gray-100 bg-white animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <SummaryCard label="Celkové pøíjmy" value={formatCurrency(data.totals.revenue)} />
            <SummaryCard label="Celkové náklady" value={formatCurrency(data.totals.costs)} />
            <SummaryCard label="Hrubý zisk" value={formatCurrency(data.totals.grossProfit)} />
            <SummaryCard label="Èistý zisk" value={formatCurrency(data.totals.netProfit)} />
            <SummaryCard label="Zisková marže" value={formatPercentage(data.totals.profitMarginPercentage)} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CategoryList title="Pøíjmy" icon="??" items={data.monthlyOverview.revenue} />
            <CategoryList title="Náklady" icon="??" items={data.monthlyOverview.costs} />
            <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Zisk / Ztráta</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span>Hrubý zisk</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(data.monthlyOverview.profit.grossProfit)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Èistý zisk</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(data.monthlyOverview.profit.netProfit)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Zisková marže</span>
                  <span className="font-semibold text-gray-900">{formatPercentage(data.monthlyOverview.profit.profitMarginPercentage)}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Odkup aut</span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{numberFormatter.format(data.totals.carBuyoutsCount)} ks</p>
                    <p className="text-xs text-gray-500">{formatCurrency(data.totals.carBuyoutsAmount)}</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard label="Aktivní leasingy" value={numberFormatter.format(data.stats.activeLeases)} />
            <SummaryCard label="Nové leasingy" value={numberFormatter.format(data.stats.newLeases)} />
            <SummaryCard label="Ukonèené leasingy" value={numberFormatter.format(data.stats.completedLeases)} />
            <SummaryCard label="Prùmìrná splátka" value={formatCurrency(data.stats.averageInstallment)} />
            <SummaryCard label="Úspìšnost plateb" value={formatPercentage(data.stats.paymentSuccessRate)} />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BreakdownList title="Rozpad pøíjmù" items={data.revenueBreakdown} />
            <BreakdownList title="Rozpad nákladù" items={data.costBreakdown} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Table
              title="Faktury"
              emptyLabel="Žádné faktury v tomto období"
              columns={[
                { key: 'invoiceNumber', label: 'Èíslo' },
                { key: 'customerName', label: 'Zákazník' },
                { key: 'amount', label: 'Èástka', align: 'right' },
                { key: 'dueDate', label: 'Splatnost' },
                { key: 'paidDate', label: 'Zaplaceno' },
                { key: 'status', label: 'Status' },
                { key: 'type', label: 'Typ' },
              ]}
              rows={invoiceRows}
            />
            <Table
              title="Platby"
              emptyLabel="Žádné platby v tomto období"
              columns={[
                { key: 'leaseId', label: 'Leasing' },
                { key: 'customerName', label: 'Zákazník' },
                { key: 'amount', label: 'Èástka', align: 'right' },
                { key: 'paidAt', label: 'Datum' },
                { key: 'type', label: 'Typ' },
                { key: 'status', label: 'Status' },
              ]}
              rows={paymentRows}
            />
          </section>
        </>
      )}
    </div>
  );
}
