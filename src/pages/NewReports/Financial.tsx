import { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

interface FinancialStats {
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
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  rentPayments: number;
  adminFees: number;
  insuranceFees: number;
  latePaymentFees: number;
  otherRevenue: number;
  totalRevenue: number;
  carPurchases: number;
  carPurchasesCount: number;
  insuranceCosts: number;
  maintenanceCosts: number;
  operationalCosts: number;
  otherCosts: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  activeLeases: number;
  newLeases: number;
  endedLeases: number;
  averageRentPayment: number;
  paymentSuccessRate: number;
}

interface CategoryData {
  type: string;
  amount: number;
  percentage: number;
}

interface FinancialReportData {
  dateFrom: string;
  dateTo: string;
  stats: FinancialStats;
  monthlyData: MonthlyData[];
  revenueByType: CategoryData[];
  costsByType: CategoryData[];
}

const COLORS = {
  revenue: '#10b981', // Green
  costs: '#ef4444', // Red
  profit: '#3b82f6', // Blue
  warning: '#f59e0b', // Amber
  info: '#6366f1', // Indigo
  pieColors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
};

export function NewReportsFinancial() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('year');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [data, setData] = useState<FinancialReportData | null>(null);

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

      const response = await axiosClient.get(`/stats/financial-report?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodaøilo se naèíst data');
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Finanèní Report (P/L)</h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ?? Obnovit
        </button>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Období:</span>
          <div className="flex gap-2">
            {[
              { value: 'day', label: 'Den' },
              { value: 'week', label: 'Týden' },
              { value: 'month', label: 'Mìsíc' },
              { value: 'year', label: 'Rok' },
              { value: 'custom', label: 'Vlastní' }
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value as PeriodType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p.value 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.label}
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
          <p className="mt-2 text-gray-600">Naèítání finanèních dat...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Chyba pøi naèítání dat:</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Celkové pøíjmy</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {formatCurrency(data.stats.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ? mìsíènì: {formatCurrency(data.stats.averageMonthlyRevenue)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Celkové náklady</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {formatCurrency(data.stats.totalCosts)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Odkup aut: {data.stats.totalCarsPurchased}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Èistý zisk</p>
                  <p className={`text-2xl font-bold mt-1 ${data.stats.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(data.stats.totalProfit)}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${data.stats.totalProfit >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                  <svg className={`w-6 h-6 ${data.stats.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Marže: {formatPercent(data.stats.profitMargin)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktivní leasingy</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    {data.stats.activeLeases}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Hodnota: {formatCurrency(data.stats.totalLeaseValue)}
              </p>
            </div>
          </div>

          {/* Revenue vs Costs Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vývoj pøíjmù a nákladù</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalRevenue" 
                  stroke={COLORS.revenue} 
                  strokeWidth={2}
                  name="Pøíjmy"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalCosts" 
                  stroke={COLORS.costs} 
                  strokeWidth={2}
                  name="Náklady"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="netProfit" 
                  stroke={COLORS.profit} 
                  strokeWidth={2}
                  name="Zisk"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue and Cost Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Struktura pøíjmù</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.revenueByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="type"
                  >
                    {data.revenueByType.map((_, index) => (
                      <Cell key={`cell-revenue-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {data.revenueByType.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: COLORS.pieColors[index % COLORS.pieColors.length] }}
                      />
                      <span className="text-gray-700">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      <span className="text-gray-500 ml-2">({formatPercent(item.percentage)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Struktura nákladù</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.costsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="type"
                  >
                    {data.costsByType.map((_, index) => (
                      <Cell key={`cell-cost-${index}`} fill={COLORS.pieColors[index % COLORS.pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {data.costsByType.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: COLORS.pieColors[index % COLORS.pieColors.length] }}
                      />
                      <span className="text-gray-700">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      <span className="text-gray-500 ml-2">({formatPercent(item.percentage)})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mìsíèní pøehled</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mìsíc
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nájem
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin. poplatky
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Celkem pøíjmy
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Odkup aut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Celkem náklady
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zisk
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marže
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktivní
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.monthlyData.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {month.monthLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(month.rentPayments)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(month.adminFees)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                        {formatCurrency(month.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(month.carPurchases)}
                        {month.carPurchasesCount > 0 && (
                          <span className="text-xs text-gray-500 ml-1">({month.carPurchasesCount})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                        {formatCurrency(month.totalCosts)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                        month.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(month.netProfit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatPercent(month.profitMargin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                        {month.activeLeases}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      CELKEM
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(data.monthlyData.reduce((sum, m) => sum + m.rentPayments, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(data.monthlyData.reduce((sum, m) => sum + m.adminFees, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      {formatCurrency(data.stats.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(data.stats.totalCarsPurchasedValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {formatCurrency(data.stats.totalCosts)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                      data.stats.totalProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(data.stats.totalProfit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatPercent(data.stats.profitMargin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {data.stats.activeLeases}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Leases Bar Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vývoj aktivních leasingù</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="activeLeases" fill={COLORS.info} name="Aktivní leasingy" />
                <Bar dataKey="newLeases" fill={COLORS.revenue} name="Nové" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

export default NewReportsFinancial;
