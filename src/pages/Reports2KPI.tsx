import { useState, useEffect, useMemo } from 'react';
import { axiosClient } from '@/api/axiosClient';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
    if (trend === 'up') return '?';
    if (trend === 'down') return '?';
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
          <h1 className="text-2xl font-bold text-gray-900">KPI Investor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Komplexní pøehled klíèových ukazatelù pro investory
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
                    ? 'bg-purple-600 text-white'
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
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Report Content */}
      {!loading && reportData && (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-600">Celkový obrat</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {reportData.financial?.totalRevenue?.toLocaleString('cs-CZ')} Kè
                {reportData.financial?.revenueGrowth !== undefined && (
                  <span className={`text-sm font-normal ml-2 ${reportData.financial.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reportData.financial.revenueGrowth >= 0 ? '?' : '?'} {Math.abs(reportData.financial.revenueGrowth)}%
                  </span>
                )}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600">Èistý zisk</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {reportData.financial?.netProfit?.toLocaleString('cs-CZ')} Kè
                {reportData.financial?.profitMargin !== undefined && (
                  <span className="text-sm font-normal ml-2">({reportData.financial.profitMargin}%)</span>
                )}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600">Aktivní pronájem</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">
                {reportData.operational?.activeLeases || 0}
                {reportData.operational?.leasesGrowth !== undefined && (
                  <span className={`text-sm font-normal ml-2 ${reportData.operational.leasesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {reportData.operational.leasesGrowth >= 0 ? '?' : '?'} {Math.abs(reportData.operational.leasesGrowth)}%
                  </span>
                )}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-600">Konverzní pomìr</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">
                {reportData.funnel?.conversionRate?.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Costs */}
            {monthlyData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Finanèní pøehled</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3B82F6" name="Pøíjmy" />
                    <Bar dataKey="costs" fill="#EF4444" name="Náklady" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Profit Trend */}
            {monthlyData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend zisku</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} name="Zisk" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Funnel & Technical Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Funnel Statistiky</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Nové leady</span>
                    <span className="font-semibold">{reportData.funnel?.totalLeads || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Schváleno</span>
                    <span className="font-semibold text-green-600">{reportData.funnel?.approved || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Konvertováno</span>
                    <span className="font-semibold text-blue-600">{reportData.funnel?.converted || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Technická kontrola</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">V kontrole</span>
                    <span className="font-semibold">{reportData.technical?.inReview || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Schváleno</span>
                    <span className="font-semibold text-green-600">{reportData.technical?.approved || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Zamítnuto</span>
                    <span className="font-semibold text-red-600">{reportData.technical?.rejected || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Vozový park</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Celkem vozidel</span>
                    <span className="font-semibold">{reportData.fleet?.totalCars || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Prùmìrná hodnota</span>
                    <span className="font-semibold">{reportData.fleet?.avgValue?.toLocaleString('cs-CZ')} Kè</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Celková hodnota</span>
                    <span className="font-semibold text-blue-600">{reportData.fleet?.totalValue?.toLocaleString('cs-CZ')} Kè</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Indicators */}
          {reportData.risks && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-800 mb-3">Rizikové ukazatele</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-red-600 mb-1">Splatnost &gt; 30 dní</div>
                  <div className="text-lg font-bold text-red-900">{reportData.risks.overduePayments || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-red-600 mb-1">Pozdé platby</div>
                  <div className="text-lg font-bold text-red-900">{reportData.risks.latePayments || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-red-600 mb-1">Vrácená vozidla</div>
                  <div className="text-lg font-bold text-red-900">{reportData.risks.returnedCars || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-red-600 mb-1">Aktivní pohledávky</div>
                  <div className="text-lg font-bold text-red-900">{reportData.risks.activeCollections || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Poznámky</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Všechna finanèní data jsou v CZK</li>
              <li>• Procentuální zmìny jsou ve srovnání s pøedchozím obdobím</li>
              <li>• Data jsou aktuální k období: <strong>{getPeriodLabel()}</strong></li>
              <li>• Rizikové ukazatele jsou aktualizovány dennì</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports2KPI;
