import { useMemo, useState } from 'react';
import { useKpiInvestorReport } from '@/hooks';
import type {
  IKPIFinancialReportItem,
  IKPIFinancialBreakdownItem,
  IKPIMetric,
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

const monthFormatter = new Intl.DateTimeFormat('cs-CZ', {
  month: 'long',
  year: 'numeric',
});

const formatMetricValue = (value: number, unit?: string) => {
  if (value === undefined || value === null) {
    return '—';
  }

  if (!unit) {
    return numberFormatter.format(value);
  }

  const normalized = unit.toLowerCase();

  if (normalized.includes('kè') || normalized === 'czk') {
    return moneyFormatter.format(value);
  }

  if (normalized.includes('%') || normalized === 'percent' || normalized === 'percentage') {
    return `${value.toFixed(1)} %`;
  }

  if (normalized.includes('den')) {
    return `${value.toFixed(1)} dnù`;
  }

  if (normalized.includes('hod')) {
    return `${value.toFixed(1)} hod`;
  }

  return `${numberFormatter.format(value)}${unit.trim() ? ` ${unit}` : ''}`.trim();
};

const TrendPill = ({ value }: { value?: number }) => {
  if (value === undefined || value === null) {
    return null;
  }

  const isPositive = value >= 0;
  const color = isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100';
  const iconPath = isPositive
    ? 'M4.5 15.75l7.5-7.5 7.5 7.5'
    : 'M19.5 8.25l-7.5 7.5-7.5-7.5';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
      </svg>
      {value.toFixed(1)}%
    </span>
  );
};

const BreakdownList = ({
  items,
  emptyLabel,
}: {
  items: Array<{ label: string; value: number; percentage?: number }>;
  emptyLabel: string;
}) => {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-center justify-between text-sm text-gray-700">
            <span>{item.label}</span>
            <span className="font-medium">{numberFormatter.format(item.value)}</span>
          </div>
          {typeof item.percentage === 'number' && (
            <div className="mt-1 h-2 rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

const SummaryGrid = ({
  title,
  items,
}: {
  title: string;
  items: IKPIMetric[];
}) => (
  <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
          <p className="text-sm font-medium text-gray-500">{item.label}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatMetricValue(item.value, item.unit)}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <TrendPill value={item.changePercentage} />
            {item.description && <span className="text-right text-gray-600">{item.description}</span>}
          </div>
        </div>
      ))}
    </div>
  </section>
);

const ComparisonCard = ({
  label,
  dataset,
}: {
  label: string;
  dataset?: IKPIFinancialReportItem;
}) => (
  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    {dataset ? (
      <>
        <p className="text-xl font-semibold text-gray-900 mb-4">{formatMonthLabel(dataset.month)}</p>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Pøíjmy</dt>
            <dd className="font-medium">{moneyFormatter.format(dataset.totalRevenue)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Náklady</dt>
            <dd className="font-medium">{moneyFormatter.format(dataset.totalCosts)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Zisk</dt>
            <dd className="font-medium">{moneyFormatter.format(dataset.netProfit)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Marže</dt>
            <dd className="font-medium">{dataset.profitMargin.toFixed(1)} %</dd>
          </div>
          {typeof dataset.paymentSuccessRate === 'number' && (
            <div className="flex items-center justify-between">
              <dt className="text-gray-500">Úspìšnost plateb</dt>
              <dd className="font-medium">{dataset.paymentSuccessRate.toFixed(1)} %</dd>
            </div>
          )}
        </dl>
      </>
    ) : (
      <p className="text-sm text-gray-500">Žádná dostupná data</p>
    )}
  </div>
);

const MetricsGrid = ({
  metrics,
}: {
  metrics: Array<{ label: string; value: string | number }>;
}) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {metrics.map((metric) => (
      <div key={metric.label} className="p-4 rounded-lg border border-gray-200 bg-white">
        <p className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">
          {typeof metric.value === 'number' ? numberFormatter.format(metric.value) : metric.value}
        </p>
      </div>
    ))}
  </div>
);

function mapFinancialBreakdown(items: IKPIFinancialBreakdownItem[] = []) {
  return items.map((item) => ({
    label: item.type,
    value: item.amount,
    percentage: item.percentage,
  }));
}

function formatMonthLabel(month?: string) {
  if (!month) {
    return '—';
  }

  try {
    const normalized = month.length === 7 ? `${month}-01T00:00:00.000Z` : month;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return month;
    }
    return monthFormatter.format(date);
  } catch {
    return month;
  }
}

function buildDateTime(value?: string) {
  if (!value) {
    return '—';
  }
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
}

export default function ReportsKPIInvestor() {
  const [period, setPeriod] = useState<KPIReportPeriod>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const filters = useMemo(() => {
    if (period !== 'custom') {
      return { period } as const;
    }

    return {
      period,
      dateFrom: customDateFrom ? new Date(`${customDateFrom}T00:00:00.000Z`).toISOString() : undefined,
      dateTo: customDateTo ? new Date(`${customDateTo}T23:59:59.999Z`).toISOString() : undefined,
    } as const;
  }, [period, customDateFrom, customDateTo]);

  const { data, loading, error, refetch } = useKpiInvestorReport(filters);
  const isCustomReady = period !== 'custom' || (Boolean(filters.dateFrom) && Boolean(filters.dateTo));
  const activeRangeLabel = data ? `${buildDateTime(data.dateFrom)} – ${buildDateTime(data.dateTo)}` : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KPI Investor Report</h1>
            <p className="text-sm text-gray-600">
              Kompletní pøehled výkonu firmy pro investory. {activeRangeLabel && `Období: ${activeRangeLabel}.`}
            </p>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Èasové období:</span>
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
                    ? 'bg-red-600 text-white shadow'
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
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <span className="text-gray-500">–</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(event) => setCustomDateTo(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <p className="text-xs text-gray-500">Vyberte celé období. Data se naètou automaticky po zadání obou dat.</p>
          </div>
        )}
      </section>

      {!isCustomReady && period === 'custom' && (
        <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          Pro vlastní období prosím vyberte datum od/do.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            onClick={refetch}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white rounded-lg border border-red-200 hover:bg-red-700 hover:text-white transition-colors"
          >
            Zkusit znovu
          </button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="p-4 rounded-lg border border-gray-100 bg-white animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          <SummaryGrid title="Souhrnné KPI" items={data.summary} />
          <SummaryGrid title="Highlights" items={data.highlights} />

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Finanèní pøehled</h2>
                <p className="text-sm text-gray-500">Poslední období vs. trend</p>
              </div>
            </div>

            <MetricsGrid
              metrics={[
                { label: 'Celkové pøíjmy', value: moneyFormatter.format(data.financial.stats.totalRevenue) },
                { label: 'Celkové náklady', value: moneyFormatter.format(data.financial.stats.totalCosts) },
                { label: 'Celkový zisk', value: moneyFormatter.format(data.financial.stats.totalProfit) },
                { label: 'Zisková marže', value: `${data.financial.stats.profitMargin.toFixed(1)} %` },
                { label: 'Aktivní leasingy', value: data.financial.stats.activeLeases },
                { label: 'Hodnota leasingù', value: moneyFormatter.format(data.financial.stats.totalLeaseValue) },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ComparisonCard label="Poslední mìsíc" dataset={data.financial.latestMonth} />
              <ComparisonCard label="Pøedchozí mìsíc" dataset={data.financial.previousMonth} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Pøíjmy podle typu</h3>
                <BreakdownList
                  items={mapFinancialBreakdown(data.financial.revenueByType)}
                  emptyLabel="Žádná data o pøíjmech"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Náklady podle typu</h3>
                <BreakdownList
                  items={mapFinancialBreakdown(data.financial.costsByType)}
                  emptyLabel="Žádná data o nákladech"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Funnel výkon</h2>
                <p className="text-sm text-gray-500">Leady napøíè pipeline</p>
              </div>
            </div>

            <MetricsGrid
              metrics={[
                { label: 'Celkem leadù', value: data.funnel.totalLeads },
                { label: 'Konvertováno', value: data.funnel.convertedLeads },
                { label: 'Zamítnuto', value: data.funnel.declinedLeads },
                { label: 'Konverzní pomìr', value: `${data.funnel.conversionRate.toFixed(1)} %` },
                { label: 'Prùmìrná konverze (dny)', value: data.funnel.avgConversionDays.toFixed(1) },
                { label: 'Prùmìrná požadovaná èástka', value: moneyFormatter.format(data.funnel.averageRequestedAmount) },
              ]}
            />

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Rozpad podle fází</h3>
              <div className="space-y-3">
                {data.funnel.stageBreakdown.map((stage) => (
                  <div key={stage.stage} className="p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                      <span>{stage.stage}</span>
                      <span>{numberFormatter.format(stage.count)} leadù</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${Math.min(stage.percentage ?? 0, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {data.funnel.stageBreakdown.length === 0 && (
                  <p className="text-sm text-gray-500">Žádná data o fázích</p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Technická kontrola</h2>
                <p className="text-sm text-gray-500">Výkon inspekèního týmu</p>
              </div>
            </div>

            <MetricsGrid
              metrics={[
                { label: 'Pøedáno technikùm', value: data.technician.stats.totalHandedToTechnician },
                { label: 'Schváleno', value: data.technician.stats.approved },
                { label: 'Zamítnuto', value: data.technician.stats.rejected },
                { label: 'V procesu', value: data.technician.stats.inProgress },
                { label: 'Míra schválení', value: `${data.technician.stats.approvalRate.toFixed(1)} %` },
                { label: 'Prùmìrná doba (dny)', value: data.technician.stats.averageDaysInReview.toFixed(1) },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Statusy</h3>
                <BreakdownList
                  items={data.technician.statusBreakdown.map((item) => ({
                    label: item.status,
                    value: item.count,
                    percentage: item.percentage,
                  }))}
                  emptyLabel="Žádná data o statusech"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Dùvody zamítnutí</h3>
                <BreakdownList
                  items={data.technician.declinedReasons.map((item) => ({
                    label: item.reason,
                    value: item.count,
                    percentage: item.percentage,
                  }))}
                  emptyLabel="Žádná data o dùvodech"
                />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Vozový park</h2>
                <p className="text-sm text-gray-500">Aktivní auta a znaèky</p>
              </div>
            </div>

            <MetricsGrid
              metrics={[
                { label: 'Celkem vozù', value: data.fleet.stats.totalCars },
                { label: 'Nákupní hodnota', value: moneyFormatter.format(data.fleet.stats.totalPurchaseValue) },
                { label: 'Odhadní hodnota', value: moneyFormatter.format(data.fleet.stats.totalEstimatedValue) },
                { label: 'Prùmìrná poøiz. cena', value: moneyFormatter.format(data.fleet.stats.averagePurchasePrice) },
                { label: 'Prùmìrná odhadní hodnota', value: moneyFormatter.format(data.fleet.stats.averageEstimatedValue) },
                { label: 'Prùmìrný nájezd', value: `${numberFormatter.format(Math.round(data.fleet.stats.averageMileage))} km` },
                { label: 'Prùmìrné stáøí', value: `${data.fleet.stats.averageAge.toFixed(1)} roku` },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="overflow-x-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Top znaèky</h3>
                {data.fleet.topBrands.length === 0 ? (
                  <p className="text-sm text-gray-500">Žádná data o znaèkách</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">Znaèka</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">Poèet</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">Hodnota</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">Podíl</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.fleet.topBrands.map((brand) => (
                        <tr key={brand.brand} className="border-b last:border-none">
                          <td className="px-3 py-2 font-medium text-gray-800">{brand.brand}</td>
                          <td className="px-3 py-2 text-right">{numberFormatter.format(brand.count)}</td>
                          <td className="px-3 py-2 text-right">{moneyFormatter.format(brand.totalValue)}</td>
                          <td className="px-3 py-2 text-right">{brand.percentage.toFixed(1)} %</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Nájezd vozidel</h3>
                {data.fleet.mileageBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-500">Žádná data o nájezdech</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.fleet.mileageBreakdown.map((bucket) => (
                      <span
                        key={bucket.range}
                        className="px-3 py-1.5 rounded-full border border-gray-200 text-sm bg-gray-50"
                      >
                        {bucket.range}: {numberFormatter.format(bucket.count)} ({bucket.percentage.toFixed(1)} %)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Rizikové metriky</h2>
                <p className="text-sm text-gray-500">Monitoring cash-flow rizik</p>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase">Pozdní leasingy</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {numberFormatter.format(data.risk.lateLeases)}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase">Nezaplacené faktury</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {numberFormatter.format(data.risk.unpaidInvoices)}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase">Inkaso</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {numberFormatter.format(data.risk.debtCollectionCases)}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 uppercase">Úspìšnost plateb</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {data.risk.paymentSuccessRate.toFixed(1)} %
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
