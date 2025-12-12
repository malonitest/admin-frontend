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
  carPurchases?: number;
  insuranceCosts?: number;
  maintenanceCosts?: number;
  operationalCosts?: number;
  otherCosts?: number;
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

interface IInvoiceItem {
  invoiceId: string;
  invoiceNumber: string;
  leaseId: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: string;
  type: string;
  month: string;
}

interface IPaymentItem {
  paymentId: string;
  leaseId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  type: string;
  month: string;
  status: string;
}

interface IFinancialReportData {
  stats: IFinancialStats;
  monthlyData: IFinancialReportItem[];
  revenueByType: Array<{ type: string; amount: number; percentage: number }>;
  costsByType: Array<{ type: string; amount: number; percentage: number }>;
  invoices?: IInvoiceItem[];
  payments?: IPaymentItem[];
}

interface IMonthDetailRevenue {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  leaseId?: string;
  customerId?: string;
  customerName?: string;
}

interface IMonthDetailCost {
  id: string;
  type: string;
  amount: number;
  date: string;
  description: string;
  carId?: string;
  supplierId?: string;
  supplierName?: string;
}

interface IMonthDetailData {
  month: string;
  monthLabel: string;
  revenues: IMonthDetailRevenue[];
  costs: IMonthDetailCost[];
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
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
  
  // Month detail modal
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [monthDetailData, setMonthDetailData] = useState<IMonthDetailData | null>(null);

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
      setError(err instanceof Error ? err.message : 'Chyba pri nacitani dat');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthClick = (month: string) => {
    if (!reportData) return;
    
    setSelectedMonth(month);
    
    // Filter invoices for selected month
    const monthInvoices = reportData.invoices?.filter(inv => inv.month === month) || [];
    
    // Find monthly data for totals
    const monthData = reportData.monthlyData.find(m => m.month === month);
    
    if (!monthData) return;
    
    // Transform invoices to revenues
    const revenues: IMonthDetailRevenue[] = monthInvoices.map(inv => ({
      id: inv.invoiceId,
      type: inv.type,
      amount: inv.amount,
      date: inv.paidDate || inv.dueDate,
      description: `Faktura ${inv.invoiceNumber}`,
      leaseId: inv.leaseId,
      customerId: inv.customerId,
      customerName: inv.customerName,
    }));
    
    // For costs, we'll create entries based on monthly data
    const costs: IMonthDetailCost[] = [];
    
    // Add car purchases as costs
    if (monthData.carPurchasesCount > 0) {
      costs.push({
        id: `car-purchase-${month}`,
        type: 'Odkup aut',
        amount: monthData.carPurchases || 0,
        date: `${month}-15`,
        description: `Odkup vozidel (${monthData.carPurchasesCount} ks)`,
      });
    }
    
    // Add other costs
    if (monthData.insuranceCosts) {
      costs.push({
        id: `insurance-${month}`,
        type: 'Pojisteni',
        amount: monthData.insuranceCosts,
        date: `${month}-01`,
        description: 'Naklady na pojisteni',
      });
    }
    
    if (monthData.maintenanceCosts) {
      costs.push({
        id: `maintenance-${month}`,
        type: 'Udrzba',
        amount: monthData.maintenanceCosts,
        date: `${month}-15`,
        description: 'Naklady na udrzbu vozidel',
      });
    }
    
    if (monthData.operationalCosts) {
      costs.push({
        id: `operational-${month}`,
        type: 'Provozni naklady',
        amount: monthData.operationalCosts,
        date: `${month}-01`,
        description: 'Provozni naklady',
      });
    }
    
    if (monthData.otherCosts) {
      costs.push({
        id: `other-${month}`,
        type: 'Ostatni',
        amount: monthData.otherCosts,
        date: `${month}-30`,
        description: 'Ostatni naklady',
      });
    }
    
    setMonthDetailData({
      month: month,
      monthLabel: monthData.monthLabel,
      revenues,
      costs,
      totalRevenue: monthData.totalRevenue,
      totalCosts: monthData.totalCosts,
      netProfit: monthData.netProfit,
    });
  };

  useEffect(() => { fetchReportData(); }, [period]);

  const getPeriodLabel = () => {
    if (period === 'month') return 'Tento mesic';
    if (period === 'year') return 'Tento rok';
    return customDateFrom + ' - ' + customDateTo;
  };

  const plChartData = useMemo(() => {
    if (!reportData?.monthlyData) return [];
    return reportData.monthlyData.map(item => ({
      name: item.monthLabel,
      prijmy: item.totalRevenue,
      naklady: item.totalCosts,
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
        <h1 className="text-2xl font-bold text-gray-900">Financni Report - P/L Statement</h1>
        <p className="text-sm text-gray-500 mt-1">Kompletni vykaz zisku a ztraty</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Obdobi:</span>
          <div className="flex gap-2">
            {(['month', 'year', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={'px-3 py-1.5 rounded-lg text-sm font-medium ' + (period === p ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700')}
              >
                {p === 'month' ? 'Mesic' : p === 'year' ? 'Rok' : 'Vlastni'}
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
          <span className="text-sm text-gray-500 ml-auto">Obdobi: <strong>{getPeriodLabel()}</strong></span>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600">Celkove prijmy</div>
              <div className="text-2xl font-bold text-green-900">{reportData.stats?.totalRevenue?.toLocaleString('cs-CZ')} Kc</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm font-medium text-red-600">Celkove naklady</div>
              <div className="text-2xl font-bold text-red-900">{reportData.stats?.totalCosts?.toLocaleString('cs-CZ')} Kc</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-600">Cisty zisk</div>
              <div className="text-2xl font-bold text-blue-900">{reportData.stats?.totalProfit?.toLocaleString('cs-CZ')} Kc</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600">Ziskova marze</div>
              <div className="text-2xl font-bold text-purple-900">{reportData.stats?.profitMargin?.toFixed(1)}%</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-600">Odkoupena auta</div>
              <div className="text-2xl font-bold text-orange-900">{reportData.stats?.totalCarsPurchased}</div>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
              <div className="text-sm font-medium text-cyan-600">Aktivni leasingy</div>
              <div className="text-2xl font-bold text-cyan-900">{reportData.stats?.activeLeases}</div>
            </div>
          </div>

          {/* Charts */}
          {plChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">P/L Statement - Mesicni prehled</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={plChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="prijmy" stroke="#10B981" strokeWidth={2} name="Prijmy" />
                  <Line type="monotone" dataKey="naklady" stroke="#EF4444" strokeWidth={2} name="Naklady" />
                  <Line type="monotone" dataKey="zisk" stroke="#3B82F6" strokeWidth={3} name="Zisk" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {revenueChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozpad prijmu</h3>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozpad nakladu</h3>
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

          {/* Monthly Table - now clickable */}
          {reportData.monthlyData && reportData.monthlyData.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Mesicni P/L Statement</h3>
                <p className="text-sm text-gray-500 mt-1">Kliknutim na mesic zobrazite detail prijmu a nakladu</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mesic</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Prijmy</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Naklady</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Zisk</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Marze</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyData.map((month, index) => (
                      <tr 
                        key={month.month} 
                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer transition-colors`}
                        onClick={() => handleMonthClick(month.month)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{month.monthLabel}</td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">{month.totalRevenue.toLocaleString('cs-CZ')} Kc</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 font-semibold">{month.totalCosts.toLocaleString('cs-CZ')} Kc</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">{month.netProfit.toLocaleString('cs-CZ')} Kc</td>
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

      {/* Month Detail Modal */}
      {selectedMonth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Detail mesice: {monthDetailData?.monthLabel || selectedMonth}
                </h3>
                {monthDetailData && (
                  <p className="text-sm text-gray-600 mt-1">
                    Prijmy: <span className="font-semibold text-green-600">{monthDetailData.totalRevenue.toLocaleString('cs-CZ')} Kc</span>
                    {' | '}
                    Naklady: <span className="font-semibold text-red-600">{monthDetailData.totalCosts.toLocaleString('cs-CZ')} Kc</span>
                    {' | '}
                    Zisk: <span className="font-semibold text-blue-600">{monthDetailData.netProfit.toLocaleString('cs-CZ')} Kc</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedMonth(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {!monthDetailData && (
                <div className="flex justify-center py-12">
                  <div className="text-gray-500">Zpracovavam data...</div>
                </div>
              )}

              {monthDetailData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenues Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-green-50 border-b border-green-200 px-4 py-3">
                      <h4 className="text-lg font-semibold text-green-900">
                        Prijmy ({monthDetailData.revenues.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Datum</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Zakaznik</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Typ</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Castka</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {monthDetailData.revenues.map((revenue, index) => (
                            <tr key={revenue.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-3 py-2 text-xs text-gray-900">
                                {new Date(revenue.date).toLocaleDateString('cs-CZ')}
                              </td>
                              <td className="px-3 py-2 text-xs">
                                <div className="font-medium text-gray-900">{revenue.customerName || 'N/A'}</div>
                                {revenue.customerId && (
                                  <div className="text-xs text-gray-500">ID: {revenue.customerId.substring(0, 8)}...</div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-700">{revenue.type}</td>
                              <td className="px-3 py-2 text-xs text-right font-semibold text-green-600">
                                {revenue.amount.toLocaleString('cs-CZ')} Kc
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-green-50">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-sm font-semibold text-gray-900">Celkem</td>
                            <td className="px-3 py-2 text-sm text-right font-bold text-green-700">
                              {monthDetailData.totalRevenue.toLocaleString('cs-CZ')} Kc
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Costs Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-red-50 border-b border-red-200 px-4 py-3">
                      <h4 className="text-lg font-semibold text-red-900">
                        Naklady ({monthDetailData.costs.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Datum</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Typ</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Popis</th>
                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Castka</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {monthDetailData.costs.map((cost, index) => (
                            <tr key={cost.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-3 py-2 text-xs text-gray-900">
                                {new Date(cost.date).toLocaleDateString('cs-CZ')}
                              </td>
                              <td className="px-3 py-2 text-xs font-medium text-gray-900">{cost.type}</td>
                              <td className="px-3 py-2 text-xs text-gray-700">
                                {cost.description}
                                {cost.supplierName && (
                                  <div className="text-xs text-gray-500 mt-0.5">{cost.supplierName}</div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs text-right font-semibold text-red-600">
                                {cost.amount.toLocaleString('cs-CZ')} Kc
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-red-50">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-sm font-semibold text-gray-900">Celkem</td>
                            <td className="px-3 py-2 text-sm text-right font-bold text-red-700">
                              {monthDetailData.totalCosts.toLocaleString('cs-CZ')} Kc
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports2Financial;
