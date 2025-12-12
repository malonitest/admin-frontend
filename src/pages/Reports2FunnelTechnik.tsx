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
interface IFunnelTechnikLeadItem {
  leadId: string;
  uniqueId?: number;
  customerName: string;
  customerPhone: string;
  carBrand: string;
  carModel: string;
  carYear?: string;
  carVIN?: string;
  requestedAmount?: number;
  submittedAt: string;
  technicianName?: string;
  status: string;
  daysInReview: number;
  declinedReason?: string;
  notes?: Array<{ text: string; date: string; author: string }>;
}

interface IFunnelTechnikSummary {
  totalSubmitted: number;
  approved: number;
  rejected: number;
  inReview: number;
  approvalRate: number;
  rejectionRate: number;
  avgReviewTime: number;
}

interface IRejectionReason {
  reason: string;
  count: number;
  percentage: number;
}

interface IFunnelTechnikReportData {
  dateFrom?: string;
  dateTo?: string;
  summary: IFunnelTechnikSummary;
  leadsInReview?: IFunnelTechnikLeadItem[];
  rejectionReasons?: IRejectionReason[];
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

const CHART_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

export function Reports2FunnelTechnik() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<IFunnelTechnikReportData | null>(null);

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

      const response = await axiosClient.get(`/stats/funnel-technik?${params.toString()}`);
      setReportData(response.data);
    } catch (err) {
      console.error('Funnel Technik API error:', err);
      setError(err instanceof Error ? err.message : 'Nepodarilo se nacist data reportu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period]);

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

  // Prepare chart data
  const statusChartData = useMemo(() => {
    if (!reportData?.summary) return [];
    const { approved, rejected, inReview } = reportData.summary;
    return [
      { name: 'Schvaleno', value: approved },
      { name: 'Zamitnuto', value: rejected },
      { name: 'V kontrole', value: inReview },
    ].filter(item => item.value > 0);
  }, [reportData]);

  const rejectionChartData = useMemo(() => {
    if (!reportData?.rejectionReasons) return [];
    return reportData.rejectionReasons.map(item => ({
      name: item.reason,
      count: item.count,
      percentage: item.percentage,
    }));
  }, [reportData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funnel Technik Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prehled kontroly vozidel - leady predane technikovi
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
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-600">Celkem predano</div>
              <div className="text-3xl font-bold text-blue-900 mt-1">
                {reportData.summary?.totalSubmitted || 0}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600">Schvaleno</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {reportData.summary?.approved || 0}
                <span className="text-sm font-normal ml-2">
                  {reportData.summary?.approvalRate?.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm font-medium text-red-600">Zamitnuto</div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {reportData.summary?.rejected || 0}
                <span className="text-sm font-normal ml-2">
                  {reportData.summary?.rejectionRate?.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-600">V kontrole</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">
                {reportData.summary?.inReview || 0}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600">Prumerna doba kontroly</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">
                {reportData.summary?.avgReviewTime || 0}
                <span className="text-sm font-normal ml-1">dni</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            {statusChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozlozeni podle statusu</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ value }) => `${value}`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {statusChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejection Reasons */}
            {rejectionChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Duvody zamitnuti</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={rejectionChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Leads in Review Table */}
          {reportData.leadsInReview && reportData.leadsInReview.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Leady v kontrole ({reportData.leadsInReview.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Zakaznik</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Auto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Technik</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Predano</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Doba kontroly</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.leadsInReview.map((lead, index) => (
                      <tr key={lead.leadId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">#{lead.leadId}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
                          <div className="text-xs text-gray-500">{lead.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{lead.carBrand} {lead.carModel}</div>
                          <div className="text-xs text-gray-500">{lead.carYear || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{lead.technicianName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(lead.submittedAt).toLocaleDateString('cs-CZ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{lead.daysInReview} dni</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            lead.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rejection Reasons Detail Table */}
          {reportData.rejectionReasons && reportData.rejectionReasons.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Detaily duvodu zamitnuti</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duvod</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Pocet</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Podil</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.rejectionReasons.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.reason}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{item.count}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{item.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Poznamky k reportu</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Zahrnuje pouze leady predane technikovi</li>
              <li>• Prumerna doba kontroly je pocitana od data predani technikovi</li>
              <li>• Data jsou aktualni k obdobi: <strong>{getPeriodLabel()}</strong></li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports2FunnelTechnik;
