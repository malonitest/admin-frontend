import { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

interface KPIMetric {
  label: string;
  value: number;
  unit?: string;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'flat';
  target?: number;
  status?: 'good' | 'warning' | 'critical';
  description?: string;
}

interface KPIReportData {
  dateFrom: string;
  dateTo: string;
  summary: KPIMetric[];
  highlights: KPIMetric[];
  financial: {
    stats: {
      totalRevenue: number;
      totalCosts: number;
      totalProfit: number;
      profitMargin: number;
      totalCarsPurchased: number;
      totalCarsPurchasedValue: number;
      activeLeases: number;
      totalLeaseValue: number;
    };
    revenueByType: Array<{ type: string; amount: number; percentage: number }>;
    costsByType: Array<{ type: string; amount: number; percentage: number }>;
  };
  funnel: {
    totalLeads: number;
    convertedLeads: number;
    declinedLeads: number;
    conversionRate: number;
    avgConversionDays: number;
    stageBreakdown: Array<{ stage: string; count: number; percentage: number }>;
  };
  technician: {
    stats: {
      totalHandedToTechnician: number;
      approved: number;
      rejected: number;
      inProgress: number;
      approvalRate: number;
      rejectionRate: number;
      averageDaysInReview: number;
    };
    declinedReasons: Array<{ reason: string; count: number; percentage: number }>;
  };
  fleet: {
    stats: {
      totalCars: number;
      totalPurchaseValue: number;
      averagePurchasePrice: number;
      averageMileage: number;
      averageAge: number;
    };
    topBrands: Array<{ brand: string; count: number; totalValue: number; percentage: number }>;
    mileageBreakdown: Array<{ range: string; count: number; percentage: number }>;
  };
  risk: {
    lateLeases: number;
    unpaidInvoices: number;
    debtCollectionCases: number;
    paymentSuccessRate: number;
  };
}

const COLORS = ['#C41E3A', '#8B1A1A', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626'];

export function NewReportsKPIInvestor() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [data, setData] = useState<KPIReportData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (period === 'custom' && customDateFrom && customDateTo) {
        params.append('dateFrom', customDateFrom);
        params.append('dateTo', customDateTo);
      } else if (period !== 'custom') {
        params.append('period', period);
      }

      const response = await axiosClient.get(`/stats/kpi-report?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo se nactit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchData();
    }
  }, [period]);

  const handleCustomDateSearch = () => {
    if (customDateFrom && customDateTo) {
      fetchData();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('cs-CZ').format(value);
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return '?';
    if (trend === 'down') return '?';
    return '?';
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  const getStatusColor = (status?: 'good' | 'warning' | 'critical') => {
    if (status === 'good') return 'border-green-500 bg-green-50';
    if (status === 'warning') return 'border-yellow-500 bg-yellow-50';
    if (status === 'critical') return 'border-red-500 bg-red-50';
    return 'border-gray-200 bg-white';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">KPI Investor Report</h1>
      <p className="text-sm text-gray-600 mb-6">Executive dashboard s klicovymi ukazateli pro investory</p>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Obdobi:</span>
          <div className="flex gap-2">
            {(['day', 'week', 'month', 'year', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'day' && 'Den'}
                {p === 'week' && 'Tyden'}
                {p === 'month' && 'Mesic'}
                {p === 'year' && 'Rok'}
                {p === 'custom' && 'Vlastni'}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleCustomDateSearch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Hledat
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">Nacitani...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Chyba pri nacteni dat:</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Hlavni KPI</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.summary.map((metric, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-2 p-4 ${getStatusColor(metric.status)}`}
                >
                  <div className="text-sm font-medium text-gray-600 mb-1">{metric.label}</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.unit === 'Kc' ? formatCurrency(metric.value) : formatNumber(metric.value)}
                      {metric.unit && metric.unit !== 'Kc' && ` ${metric.unit}`}
                    </span>
                    {metric.changePercentage !== undefined && (
                      <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                        {getTrendIcon(metric.trend)} {metric.changePercentage > 0 ? '+' : ''}
                        {metric.changePercentage.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {metric.description && (
                    <div className="text-xs text-gray-500 mt-1">{metric.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Highlights */}
          {data.highlights && data.highlights.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Dulezite ukazatele</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.highlights.map((metric, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600">{metric.label}</div>
                    <div className="text-xl font-bold text-gray-900 mt-1">
                      {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}
                      {metric.unit && ` ${metric.unit}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Financni prehled</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Celkove prijmy</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.financial.stats.totalRevenue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Celkove naklady</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.financial.stats.totalCosts)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Celkovy zisk</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.financial.stats.totalProfit)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Marze</div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.financial.stats.profitMargin.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue by Type */}
              <div>
                <h3 className="text-lg font-medium mb-3">Prijmy podle typu</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.financial.revenueByType}
                      dataKey="amount"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {data.financial.revenueByType.map((_, index) => (
                        <Cell key={`cell-revenue-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Costs by Type */}
              <div>
                <h3 className="text-lg font-medium mb-3">Naklady podle typu</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.financial.costsByType}
                      dataKey="amount"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {data.financial.costsByType.map((_, index) => (
                        <Cell key={`cell-costs-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Funnel Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Lead Funnel</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Celkem leadu</div>
                <div className="text-2xl font-bold text-gray-900">{data.funnel.totalLeads}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Konvertovano</div>
                <div className="text-2xl font-bold text-green-600">{data.funnel.convertedLeads}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Konverzni pomer</div>
                <div className="text-2xl font-bold text-gray-900">{data.funnel.conversionRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Prumerna doba konverze</div>
                <div className="text-2xl font-bold text-gray-900">{data.funnel.avgConversionDays.toFixed(0)} dni</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.funnel.stageBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#C41E3A" name="Pocet leadu" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Technician Review */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Technicka kontrola</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Predano technikovi</div>
                <div className="text-2xl font-bold text-gray-900">{data.technician.stats.totalHandedToTechnician}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Schvaleno</div>
                <div className="text-2xl font-bold text-green-600">{data.technician.stats.approved}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Mira schvaleni</div>
                <div className="text-2xl font-bold text-gray-900">{data.technician.stats.approvalRate.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Prumerna doba kontroly</div>
                <div className="text-2xl font-bold text-gray-900">{data.technician.stats.averageDaysInReview.toFixed(0)} dni</div>
              </div>
            </div>

            {data.technician.declinedReasons.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Duvody zamitnuti</h3>
                <div className="space-y-2">
                  {data.technician.declinedReasons.map((reason, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{reason.reason}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {reason.count} ({reason.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fleet Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Vozovy park</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Celkem vozidel</div>
                <div className="text-2xl font-bold text-gray-900">{data.fleet.stats.totalCars}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Celkova hodnota</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.fleet.stats.totalPurchaseValue)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Prumerny najezd</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(data.fleet.stats.averageMileage)} km
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Prumerne stari</div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.fleet.stats.averageAge.toFixed(1)} let
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Brands */}
              <div>
                <h3 className="text-lg font-medium mb-3">Top znacky</h3>
                <div className="space-y-2">
                  {data.fleet.topBrands.slice(0, 5).map((brand, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{brand.brand}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {brand.count} ks ({brand.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mileage Breakdown */}
              <div>
                <h3 className="text-lg font-medium mb-3">Rozlozeni podle najezdu</h3>
                <div className="space-y-2">
                  {data.fleet.mileageBreakdown.map((range, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{range.range} km</span>
                      <span className="text-sm font-medium text-gray-900">
                        {range.count} ({range.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Rizikove ukazatele</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${data.risk.lateLeases > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                <div className="text-sm text-gray-600">Pozdni leasingy</div>
                <div className={`text-2xl font-bold ${data.risk.lateLeases > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {data.risk.lateLeases}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${data.risk.unpaidInvoices > 10 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                <div className="text-sm text-gray-600">Nezaplacene faktury</div>
                <div className={`text-2xl font-bold ${data.risk.unpaidInvoices > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {data.risk.unpaidInvoices}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${data.risk.debtCollectionCases > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className="text-sm text-gray-600">Pripady v inkasu</div>
                <div className={`text-2xl font-bold ${data.risk.debtCollectionCases > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {data.risk.debtCollectionCases}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-blue-50">
                <div className="text-sm text-gray-600">Uspesnost plateb</div>
                <div className="text-2xl font-bold text-blue-600">
                  {data.risk.paymentSuccessRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewReportsKPIInvestor;
