import { useState, useEffect, useMemo } from 'react';
import { axiosClient } from '@/api/axiosClient';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

interface IFinancialReportItem {
  month: string;
  monthLabel: string;
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  activeLeases: number;
  newLeases: number;
  carPurchasesCount: number;
}

interface IFinancialStats {
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  profitMargin: number;
  totalCarsPurchased: number;
  totalCarsPurchasedValue: number;
  activeLeases: number;
}

interface IFinancialReportData {
  stats: IFinancialStats;
  monthlyData: IFinancialReportItem[];
  revenueByType: Array<{ type: string; amount: number; percentage: number }>;
  costsByType: Array<{ type: string; amount: number; percentage: number }>;
}

type PeriodType = 'month' | 'year' | 'custom';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function Reports2Financial() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<IFinancialReportData | null>(null);
  const [period, setPeriod] = useState<PeriodType>('year');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

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
      const response = await axiosClient.get('/stats/financial-report?' + params.toString());
      setReportData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba pøi naèítání dat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReportData(); }, [period]);

  const getPeriodLabel = () => {
    if (period === 'month') return 'Tento mìsíc';
    if (period === 'year') return 'Tento rok';
    return customDateFrom + ' - ' + customDateTo;
  };

  const plChartData = useMemo(() => {
    if (!reportData?.monthlyData) return [];
    return reportData.monthlyData.map(item => ({
      name: item.monthLabel,
      pøíjmy: item.totalRevenue,
      náklady: item.totalCosts,
      zisk: item.netProfit,
    }));
  }, [reportData]);

  const revenueChartData = useMemo(() => {
    if (!reportData?.revenueByType) return [];
    return reportData.revenueByType.map(item => ({
      name: item.type,
      value: item.amount,
      percentage: item.percentage,
    }));
  }, [reportData]);

  const costsChartData = useMemo(() => {
    if (!reportData?.costsByType) return [];
    return reportData.costsByType.map(item => ({
      name: item.type,
      value: item.amount,
    }));
  }, [reportData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finanèní Report - P/L Statement</h1>
        <p className="text-sm text-gray-500 mt-1">Kompletní výkaz zisku a ztráty</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Období:</span>
          <div className="flex gap-2">
            {(['month', 'year', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={'px-3 py-1.5 rounded-lg text-sm font-medium ' + (period === p ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700')}
              >
                {p === 'month' ? 'Mìsíc' : p === 'year' ? 'Rok' : 'Vlastní'}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
              <span>-</span>
              <input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
              <button onClick={fetchReportData} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">Zobrazit</button>
            </div>
          )}
          <span className="text-sm text-gray-500 ml-auto">Období: <strong>{getPeriodLabel()}</strong></span>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      )}

      {!loading && reportData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600">Celkové pøíjmy</div>
              <div className="text-2xl font-bold text-green-900">{reportData.stats?.totalRevenue?.toLocaleString('cs-CZ')} Kè</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm font-medium text-red-600">Celkové náklady</div>
              <div className="text-2xl font-bold text-red-900">{reportData.stats?.totalCosts?.toLocaleString('cs-CZ')} Kè</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-600">Èistý zisk</div>
              <div className="text-2xl font-bold text-blue-900">{reportData.stats?.totalProfit?.toLocaleString('cs-CZ')} Kè</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600">Zisková marže</div>
              <div className="text-2xl font-bold text-purple-900">{reportData.stats?.profitMargin?.toFixed(1)}%</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-600">Odkoupená auta</div>
              <div className="text-2xl font-bold text-orange-900">{reportData.stats?.totalCarsPurchased}</div>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
              <div className="text-sm font-medium text-cyan-600">Aktivní leasingy</div>
              <div className="text-2xl font-bold text-cyan-900">{reportData.stats?.activeLeases}</div>
            </div>
          </div>

          {plChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">P/L Statement - Mìsíèní pøehled</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={plChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="pøíjmy" stroke="#10B981" strokeWidth={2} name="Pøíjmy" />
                  <Line type="monotone" dataKey="náklady" stroke="#EF4444" strokeWidth={2} name="Náklady" />
                  <Line type="monotone" dataKey="zisk" stroke="#3B82F6" strokeWidth={3} name="Zisk" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {revenueChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozpad pøíjmù</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={revenueChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                      {revenueChartData.map((_, index) => (
                        <Cell key={'cell-' + index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {costsChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozpad nákladù</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={costsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {reportData.monthlyData && reportData.monthlyData.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Mìsíèní P/L Statement</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mìsíc</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Pøíjmy</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Náklady</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Zisk</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Marže</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyData.map((month, index) => (
                      <tr key={month.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.monthLabel}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">{month.totalRevenue.toLocaleString('cs-CZ')} Kè</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 font-semibold">{month.totalCosts.toLocaleString('cs-CZ')} Kè</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">{month.netProfit.toLocaleString('cs-CZ')} Kè</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{month.profitMargin.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Reports2Financial;
