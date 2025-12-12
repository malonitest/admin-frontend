import { useState, useEffect, useMemo } from 'react';
import { axiosClient } from '@/api/axiosClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Types based on backend API
interface IKPIMetric {
  label: string;
  value: number;
  unit?: string;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'flat';
  target?: number;
  status?: 'good' | 'warning' | 'critical';
  description?: string;
}

interface IKPIInvestorReportData {
  dateFrom: string;
  dateTo: string;
  summary: IKPIMetric[];
  highlights: IKPIMetric[];
  financial: {
    stats: {
      totalRevenue: number;
      totalCosts: number;
      totalProfit: number;
      averageMonthlyRevenue: number;
      averageMonthlyProfit: number;
      profitMargin: number;
      totalCarsPurchased: number;
      totalCarsPurchasedValue: number;
      activeLeases: number;
      totalLeaseValue: number;
    };
    latestMonth?: {
      month: string;
      totalRevenue: number;
      totalCosts: number;
      netProfit: number;
      profitMargin: number;
      paymentSuccessRate: number;
    };
    previousMonth?: {
      month: string;
      totalRevenue: number;
      totalCosts: number;
      netProfit: number;
      profitMargin: number;
      paymentSuccessRate: number;
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
    averageRequestedAmount: number;
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
    statusBreakdown: Array<{ status: string; count: number; percentage: number }>;
  };
  fleet: {
    stats: {
      totalCars: number;
      totalPurchaseValue: number;
      totalEstimatedValue: number;
      averagePurchasePrice: number;
      averageEstimatedValue: number;
      averageMileage: number;
      averageAge: number;
    };
    topBrands: Array<{ brand: string; count: number; totalValue: number; avgPrice: number; percentage: number }>;
    mileageBreakdown: Array<{ range: string; count: number; percentage: number }>;
  };
  risk: {
    lateLeases: number;
    unpaidInvoices: number;
    debtCollectionCases: number;
    paymentSuccessRate: number;
  };
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function Reports2KPI() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<IKPIInvestorReportData | null>(null);

  // Period filters
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (period === 'custom' && customDateFrom && customDateTo) {
        params.append('dateFrom', customDateFrom);
        params.append('dateTo', customDateTo);
      } else {
        params.append('period', period);
      }

      const response = await axiosClient.get(`/stats/kpi-investor?${params.toString()}`);
      setReportData(response.data);
    } catch (err) {
      console.error('KPI Report API error:', err);
      setError(err instanceof Error ? err.message : 'Nepodaøilo se naèíst data reportu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const handleCustomDateSearch = () => {
    if (customDateFrom && customDateTo) {
      fetchReportData();
    }
  };

  const getPeriodLabel = (): string => {
    switch (period) {
      case 'day': return 'Dnes';
      case 'week': return 'Tento týden';
      case 'month': return 'Tento mìsíc';
      case 'year': return 'Tento rok';
      case 'custom': return `${customDateFrom} - ${customDateTo}`;
      default: return '';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return '??';
    if (trend === 'down') return '??';
    return '?';
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusColor = (status?: 'good' | 'warning' | 'critical') => {
    if (status === 'good') return 'border-green-500 bg-green-50';
    if (status === 'warning') return 'border-yellow-500 bg-yellow-50';
    if (status === 'critical') return 'border-red-500 bg-red-50';
    return 'border-gray-200 bg-white';
  };

  // Prepare chart data
  const revenueChartData = useMemo(() => {
    if (!reportData?.financial?.revenueByType) return [];
    return reportData.financial.revenueByType.map(item => ({
      name: item.type,
      value: item.amount,
      percentage: item.percentage,
    }));
  }, [reportData]);

  const funnelChartData = useMemo(() => {
    if (!reportData?.funnel?.stageBreakdown) return [];
    return reportData.funnel.stageBreakdown.map(item => ({
      name: item.stage,
      count: item.count,
      percentage: item.percentage,
    }));
  }, [reportData]);

  const fleetBrandsData = useMemo(() => {
    if (!reportData?.fleet?.topBrands) return [];
    return reportData.fleet.topBrands.slice(0, 5).map(item => ({
      name: item.brand,
      count: item.count,
      value: item.totalValue,
    }));
  }, [reportData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">?? KPI Investor Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kompletní pøehled klíèových ukazatelù výkonnosti pro investory
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Období:</span>
          <div className="flex gap-2 flex-wrap">
            {(['day', 'week', 'month', 'year', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p === 'day' && 'Den'}
                {p === 'week' && 'Týden'}
                {p === 'month' && 'Mìsíc'}
                {p === 'year' && 'Rok'}
                {p === 'custom' && 'Vlastní'}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleCustomDateSearch}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Zobrazit
              </button>
            </div>
          )}

          <span className="text-sm text-gray-500 ml-auto">
            Vybrané období: <strong>{getPeriodLabel()}</strong>
          </span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Report Content */}
      {!loading && reportData && (
        <>
          {/* Summary KPIs */}
          {reportData.summary && reportData.summary.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {reportData.summary.map((metric, index) => (
                <div
                  key={index}
                  className={`rounded-lg border-l-4 p-4 ${getStatusColor(metric.status)}`}
                >
                  <div className="text-sm font-medium text-gray-600">{metric.label}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {metric.value.toLocaleString('cs-CZ')} {metric.unit}
                  </div>
                  {metric.changePercentage !== undefined && (
                    <div className={`text-sm mt-1 ${getTrendColor(metric.trend)}`}>
                      {getTrendIcon(metric.trend)} {metric.changePercentage > 0 ? '+' : ''}{metric.changePercentage.toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Financial Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">?? Finanèní pøehled</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Celkové pøíjmy</span>
                  <span className="font-semibold text-green-600">
                    {reportData.financial?.stats?.totalRevenue?.toLocaleString('cs-CZ')} Kè
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Celkové náklady</span>
                  <span className="font-semibold text-red-600">
                    {reportData.financial?.stats?.totalCosts?.toLocaleString('cs-CZ')} Kè
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Èistý zisk</span>
                  <span className={`font-bold text-lg ${(reportData.financial?.stats?.totalProfit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reportData.financial?.stats?.totalProfit?.toLocaleString('cs-CZ')} Kè
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Zisková marže</span>
                  <span className="font-semibold">
                    {reportData.financial?.stats?.profitMargin?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Aktivní leasingy</span>
                  <span className="font-semibold text-blue-600">
                    {reportData.financial?.stats?.activeLeases}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown Chart */}
            {revenueChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">?? Struktura pøíjmù</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name }) => name as string}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {revenueChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toLocaleString('cs-CZ')} Kè`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Funnel & Technician Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">?? Funnel pøehled</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600">Celkem leadù</div>
                  <div className="text-2xl font-bold text-blue-900">{reportData.funnel?.totalLeads}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600">Konvertováno</div>
                  <div className="text-2xl font-bold text-green-900">{reportData.funnel?.convertedLeads}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-sm text-red-600">Zamítnuto</div>
                  <div className="text-2xl font-bold text-red-900">{reportData.funnel?.declinedLeads}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm text-purple-600">Konverzní pomìr</div>
                  <div className="text-2xl font-bold text-purple-900">{reportData.funnel?.conversionRate?.toFixed(1)}%</div>
                </div>
              </div>
              {funnelChartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={funnelChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Technician Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">?? Technik - kontroly vozidel</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-600">Celkem pøedáno</div>
                  <div className="text-2xl font-bold text-blue-900">{reportData.technician?.stats?.totalHandedToTechnician}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-green-600">Schváleno</div>
                  <div className="text-2xl font-bold text-green-900">{reportData.technician?.stats?.approved}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-sm text-red-600">Zamítnuto</div>
                  <div className="text-2xl font-bold text-red-900">{reportData.technician?.stats?.rejected}</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-sm text-orange-600">V kontrole</div>
                  <div className="text-2xl font-bold text-orange-900">{reportData.technician?.stats?.inProgress}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Míra schválení</span>
                  <span className="font-semibold text-green-600">{reportData.technician?.stats?.approvalRate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Prùmìrná doba kontroly</span>
                  <span className="font-semibold">{reportData.technician?.stats?.averageDaysInReview} dní</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fleet & Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fleet Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">?? Vozový park</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Celkem aut</div>
                  <div className="text-2xl font-bold text-gray-900">{reportData.fleet?.stats?.totalCars}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Celková hodnota</div>
                  <div className="text-xl font-bold text-gray-900">{reportData.fleet?.stats?.totalPurchaseValue?.toLocaleString('cs-CZ')} Kè</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Prùmìrná cena</div>
                  <div className="text-lg font-bold text-gray-900">{reportData.fleet?.stats?.averagePurchasePrice?.toLocaleString('cs-CZ')} Kè</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Prùmìrný nájezd</div>
                  <div className="text-lg font-bold text-gray-900">{reportData.fleet?.stats?.averageMileage?.toLocaleString('cs-CZ')} km</div>
                </div>
              </div>
              {fleetBrandsData.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Top znaèky</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={fleetBrandsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Risk Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">?? Rizikové ukazatele</h3>
              <div className="space-y-4">
                <div className={`rounded-lg p-4 ${(reportData.risk?.lateLeases ?? 0) > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pozdní leasingy</span>
                    <span className={`text-2xl font-bold ${(reportData.risk?.lateLeases ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {reportData.risk?.lateLeases}
                    </span>
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${(reportData.risk?.unpaidInvoices ?? 0) > 10 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Nezaplacené faktury</span>
                    <span className={`text-2xl font-bold ${(reportData.risk?.unpaidInvoices ?? 0) > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {reportData.risk?.unpaidInvoices}
                    </span>
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${(reportData.risk?.debtCollectionCases ?? 0) > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pøípady v inkasu</span>
                    <span className={`text-2xl font-bold ${(reportData.risk?.debtCollectionCases ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {reportData.risk?.debtCollectionCases}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Úspìšnost plateb</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {reportData.risk?.paymentSuccessRate?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">?? Poznámky k reportu</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Tento report kombinuje data z funnel, technické kontroly, vozového parku a finanèního P/L</li>
              <li>• Data jsou aktuální k vybranému období: <strong>{getPeriodLabel()}</strong></li>
              <li>• Pro detailnìjší analýzu jednotlivých sekcí použijte specializované reporty v menu</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports2KPI;
