import { useState, useEffect, useMemo, useCallback } from 'react';
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

interface IKPIInvestorReportData {
  dateFrom: string;
  dateTo: string;
  financial: {
    stats: {
      totalRevenue: number;
      totalCosts: number;
      totalProfit: number;
      profitMargin: number;
      activeLeases: number;
    };
    revenueByType: Array<{ type: string; amount: number; percentage: number }>;
    costsByType: Array<{ type: string; amount: number; percentage: number }>;
  };
  funnel: {
    totalLeads: number;
    convertedLeads: number;
    declinedLeads: number;
    conversionRate: number;
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
    };
  };
  fleet: {
    stats: {
      totalCars: number;
      totalPurchaseValue: number;
      averagePurchasePrice: number;
    };
    topBrands: Array<{ brand: string; count: number; totalValue: number }>;
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
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');

  const fetchReportData = useCallback(async () => {
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
      
      console.log('Fetching KPI data with URL:', `/stats/kpi-investor?${params.toString()}`);
      const response = await axiosClient.get(`/stats/kpi-investor?${params.toString()}`);
      setReportData(response.data);
    } catch (err) {
      console.error('KPI Report API error:', err);
      setError(err instanceof Error ? err.message : 'Nepodarilo se nacist data reportu');
    } finally {
      setLoading(false);
    }
  }, [period, customDateFrom, customDateTo]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const getPeriodLabel = (): string => {
    switch (period) {
      case 'day': return 'Dnes';
      case 'week': return 'Tento tyden';
      case 'month': return 'Tento mesic';
      case 'year': return 'Tento rok';
      case 'custom': return `${customDateFrom} - ${customDateTo}`;
      default: return '';
    }
  };

  const revenueChartData = useMemo(() => {
    if (!reportData?.financial?.revenueByType) return [];
    return reportData.financial.revenueByType.map(item => ({
      name: item.type,
      value: item.amount,
    }));
  }, [reportData]);

  const funnelChartData = useMemo(() => {
    if (!reportData?.funnel?.stageBreakdown) return [];
    return reportData.funnel.stageBreakdown.map(item => ({
      name: item.stage,
      count: item.count,
    }));
  }, [reportData]);

  const fleetBrandsData = useMemo(() => {
    if (!reportData?.fleet?.topBrands) return [];
    return reportData.fleet.topBrands.slice(0, 5).map(item => ({
      name: item.brand,
      count: item.count,
    }));
  }, [reportData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Investor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Komplexni prehled klicovych ukazatelu pro investory
          </p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Obdobi:</span>
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
                {p === 'week' && 'Tyden'}
                {p === 'month' && 'Mesic'}
                {p === 'year' && 'Rok'}
                {p === 'custom' && 'Vlastni'}
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
              <div className="text-sm font-medium text-blue-600">Celkovy obrat</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {reportData.financial?.stats?.totalRevenue?.toLocaleString('cs-CZ')} Kc
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600">Cisty zisk</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {reportData.financial?.stats?.totalProfit?.toLocaleString('cs-CZ')} Kc
                <span className="text-sm font-normal ml-2">({reportData.financial?.stats?.profitMargin?.toFixed(1)}%)</span>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600">Aktivni pronajem</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">{reportData.financial?.stats?.activeLeases || 0}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-600">Konverzni pomer</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">
                {reportData.funnel?.conversionRate?.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Funnel Statistiky</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nove leady</span>
                  <span className="font-semibold">{reportData.funnel?.totalLeads || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Konvertovano</span>
                  <span className="font-semibold text-blue-600">{reportData.funnel?.convertedLeads || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Zamitnuto</span>
                  <span className="font-semibold text-red-600">{reportData.funnel?.declinedLeads || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Technicka kontrola</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">V kontrole</span>
                  <span className="font-semibold">{reportData.technician?.stats?.inProgress || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Schvaleno</span>
                  <span className="font-semibold text-green-600">{reportData.technician?.stats?.approved || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Zamitnuto</span>
                  <span className="font-semibold text-red-600">{reportData.technician?.stats?.rejected || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Vozovy park</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Celkem vozidel</span>
                  <span className="font-semibold">{reportData.fleet?.stats?.totalCars || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Prumerna hodnota</span>
                  <span className="font-semibold">{reportData.fleet?.stats?.averagePurchasePrice?.toLocaleString('cs-CZ')} Kc</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Celkova hodnota</span>
                  <span className="font-semibold text-blue-600">{reportData.fleet?.stats?.totalPurchaseValue?.toLocaleString('cs-CZ')} Kc</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {revenueChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prijmy podle typu</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={revenueChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      {revenueChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {funnelChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Funnel faze</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={funnelChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {fleetBrandsData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 znacek</h3>
                <ResponsiveContainer width="100%" height={250}>
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

          {reportData.risk && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-800 mb-3">Rizikove ukazatele</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-red-600 mb-1">Pozdni leasingy</div>
                  <div className="text-lg font-bold text-red-900">{reportData.risk.lateLeases || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-red-600 mb-1">Neuhrazene faktury</div>
                  <div className="text-lg font-bold text-red-900">{reportData.risk.unpaidInvoices || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-red-600 mb-1">Inkaso pripady</div>
                  <div className="text-lg font-bold text-red-900">{reportData.risk.debtCollectionCases || 0}</div>
                </div>
                <div>
                  <div className="text-xs text-red-600 mb-1">Uspesnost plateb</div>
                  <div className="text-lg font-bold text-red-900">{reportData.risk.paymentSuccessRate?.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Poznamky</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Vsechna financni data jsou v CZK</li>
              <li>• Data jsou aktualni k obdobi: <strong>{getPeriodLabel()}</strong></li>
              <li>• Rizikove ukazatele jsou aktualizovany denne</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports2KPI;
