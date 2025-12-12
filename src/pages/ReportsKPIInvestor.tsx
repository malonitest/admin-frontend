import { useMemo, useState } from 'react';
import { useKpiInvestorReport } from '@/hooks';
import type {
  IKPIBreakdownItem,
  IKPIFinancialOverview,
  IKPIHighlight,
  IKPITrendItem,
  KPIReportPeriod,
  KPIValueUnit,
} from '@/types';

const PERIOD_OPTIONS: KPIReportPeriod[] = ['day', 'week', 'month', 'year', 'custom'];

const moneyFormatter = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('cs-CZ', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('cs-CZ');

const dateFormatter = new Intl.DateTimeFormat('cs-CZ', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatValue = (value: number, unit: KPIValueUnit) => {
  if (value === undefined || value === null) {
    return '—';
  }

  switch (unit) {
    case 'czk':
      return moneyFormatter.format(value);
    case 'percentage':
      return `${value.toFixed(1)} %`;
    case 'ratio':
      return percentFormatter.format(value);
    case 'days':
    case 'hours':
      return `${numberFormatter.format(value)} ${unit === 'days' ? 'dnù' : 'hod'}`;
    case 'items':
    case 'count':
    default:
      return numberFormatter.format(value);
  }
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
  items: IKPIBreakdownItem[];
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
  items: IKPITrendItem[] | IKPIHighlight[];
}) => (
  <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
          <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
            {item.label}
            {'helperText' in item && item.helperText ? (
              <span className="text-xs text-gray-400">{item.helperText}</span>
            ) : null}
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatValue(item.value, item.unit)}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <TrendPill value={item.changePercentage} />
            {'description' in item && item.description ? (
              <span className="text-right text-gray-600">{item.description}</span>
            ) : null}
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
  dataset: IKPIFinancialOverview['latestMonth'];
}) => (
  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
    <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
    <p className="text-xl font-semibold text-gray-900 mb-4">{dataset.label}</p>
    <dl className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-gray-500">Pøíjmy</dt>
        <dd className="font-medium">{moneyFormatter.format(dataset.revenue)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-gray-500">Náklady</dt>
        <dd className="font-medium">{moneyFormatter.format(dataset.costs)}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-gray-500">Zisk</dt>
        <dd className="font-medium">{moneyFormatter.format(dataset.netProfit)}</dd>
      </div>
      {typeof dataset.marginPercentage === 'number' && (
        <div className="flex items-center justify-between">
          <dt className="text-gray-500">Marže</dt>
          <dd className="font-medium">{dataset.marginPercentage.toFixed(1)} %</dd>
        </div>
      )}
    </dl>
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

function buildDateTime(dateValue?: string) {
  if (!dateValue) return '—';
  try {
    return dateFormatter.format(new Date(dateValue));
  } catch {
    return dateValue;
  }
}

export default function ReportsKPIInvestor() {
  const [period, setPeriod] = useState<KPIReportPeriod>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const customFilters = useMemo(() => {
    if (period !== 'custom') {
      return { period } as const;
    }

    return {
      period,
      dateFrom: customDateFrom ? new Date(`${customDateFrom}T00:00:00.000Z`).toISOString() : undefined,
      dateTo: customDateTo ? new Date(`${customDateTo}T23:59:59.999Z`).toISOString() : undefined,
    } as const;
  }, [period, customDateFrom, customDateTo]);

  const { data, loading, error, refetch } = useKpiInvestorReport(customFilters);
  const isCustomReady =
    period !== 'custom' || (Boolean(customFilters.dateFrom) && Boolean(customFilters.dateTo));

  const activeRangeLabel = data
    ? `${buildDateTime(data.period.dateFrom)} – ${buildDateTime(data.period.dateTo)}`
    : undefined;

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
          {data?.generatedAt && (
            <p className="text-xs text-gray-500">
              Aktualizováno: {dateFormatter.format(new Date(data.generatedAt))}
            </p>
          )}
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
            <p className="text-xs text-gray-500">
              Vyberte celé období. Data se naètou automaticky po zadání obou dat.
            </p>
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
                { label: 'Pøíjmy', value: moneyFormatter.format(data.financials.totals.revenue) },
                { label: 'Náklady', value: moneyFormatter.format(data.financials.totals.costs) },
                { label: 'Zisk', value: moneyFormatter.format(data.financials.totals.netProfit) },
                {
                  label: 'Marže',
                  value:
                    typeof data.financials.totals.marginPercentage === 'number'
                      ? `${data.financials.totals.marginPercentage.toFixed(1)} %`
                      : '—',
                },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ComparisonCard label="Poslední mìsíc" dataset={data.financials.latestMonth} />
              <ComparisonCard label="Pøedchozí mìsíc" dataset={data.financials.previousMonth} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Pøíjmy podle typu</h3>
                <BreakdownList items={data.financials.revenueByType} emptyLabel="Žádná data o pøíjmech" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Náklady podle typu</h3>
                <BreakdownList items={data.financials.costsByType} emptyLabel="Žádná data o nákladech" />
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
                { label: 'Konverzní pomìr', value: `${data.funnel.conversionRate.toFixed(1)} %` },
                { label: 'Prùmìrná konverze (dny)', value: data.funnel.avgConversionDays.toFixed(1) },
              ]}
            />

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Rozpad podle fází</h3>
              <div className="space-y-3">
                {data.funnel.stageBreakdown.map((stage) => {
                  const stageLabel = stage.label || (stage as { stage?: string }).stage || 'Neznámá fáze';
                  return (
                    <div key={stageLabel} className="p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                        <span>{stageLabel}</span>
                        <span>{stage.count} leadù</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          style={{ width: `${Math.min(stage.percentage ?? 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
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
                { label: 'Celkem kontrol', value: data.technician.totalInspections },
                { label: 'Schváleno', value: data.technician.approved },
                { label: 'Zamítnuto', value: data.technician.declined },
                { label: 'Míra schválení', value: `${data.technician.approvalRate.toFixed(1)} %` },
                { label: 'Prùmìrný èas (h)', value: data.technician.avgInspectionTimeHours.toFixed(1) },
                { label: 'Fronta', value: data.technician.queueSize },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Statusy</h3>
                <BreakdownList items={data.technician.statusBreakdown} emptyLabel="Žádná data o statusech" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Dùvody zamítnutí</h3>
                <BreakdownList items={data.technician.declinedReasons} emptyLabel="Žádná data o dùvodech" />
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
                { label: 'Aktivní auta', value: data.fleet.activeCars },
                { label: 'Hodnota floty', value: moneyFormatter.format(data.fleet.fleetValue) },
                { label: 'Využití', value: `${data.fleet.utilizationRate.toFixed(1)} %` },
                { label: 'Auta v servisu', value: data.fleet.carsInMaintenance },
                { label: 'Prùmìrný nájezd', value: `${numberFormatter.format(data.fleet.avgMileage)} km` },
              ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="overflow-x-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Top znaèky</h3>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium">Znaèka</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Poèet</th>
                      <th className="px-3 py-2 text-right text-gray-500 font-medium">Podíl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.fleet.topBrands.map((brand) => (
                      <tr key={brand.brand} className="border-b last:border-none">
                        <td className="px-3 py-2 font-medium text-gray-800">{brand.brand}</td>
                        <td className="px-3 py-2 text-right">{numberFormatter.format(brand.count)}</td>
                        <td className="px-3 py-2 text-right">
                          {typeof brand.percentage === 'number' ? `${brand.percentage.toFixed(1)} %` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.fleet.topBrands.length === 0 && (
                  <p className="text-sm text-gray-500">Žádná data o znaèkách</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Nájezd vozidel</h3>
                <div className="flex flex-wrap gap-2">
                  {data.fleet.mileageBreakdown.map((bucket) => (
                    <span
                      key={bucket.label}
                      className="px-3 py-1.5 rounded-full border border-gray-200 text-sm bg-gray-50"
                    >
                      {bucket.label}: {bucket.value}
                    </span>
                  ))}
                  {data.fleet.mileageBreakdown.length === 0 && (
                    <p className="text-sm text-gray-500">Žádná data o nájezdech</p>
                  )}
                </div>
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
