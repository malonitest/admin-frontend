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
interface IFunnelTechnikLeadNote {
  text: string;
  date: Date;
  author: string;
}

interface IFunnelTechnikLeadItem {
  leadId: string;
  uniqueId: number;
  customerName: string;
  customerPhone: string;
  carBrand: string;
  carModel: string;
  carVIN: string;
  requestedAmount: number;
  handedToTechnicianDate: Date;
  currentStatus: string;
  currentStatusLabel: string;
  declinedReason?: string;
  declinedReasonLabel?: string;
  notes?: IFunnelTechnikLeadNote[];
  daysInTechnicianReview: number;
}

interface IFunnelTechnikStats {
  totalHandedToTechnician: number;
  approved: number;
  rejected: number;
  inProgress: number;
  approvalRate: number;
  rejectionRate: number;
  averageDaysInReview: number;
}

interface IFunnelTechnikReportData {
  dateFrom: Date;
  dateTo: Date;
  stats: IFunnelTechnikStats;
  leads: IFunnelTechnikLeadItem[];
  declinedReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const ReportsCCFunnelTechnik: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<IFunnelTechnikReportData | null>(null);

  // Period filters
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');

  // Notes modal
  const [selectedLeadNotes, setSelectedLeadNotes] = useState<IFunnelTechnikLeadNote[] | null>(null);

  const getDateRange = (): { dateFrom: Date; dateTo: Date } => {
    const now = new Date();

    switch (period) {
      case 'day': {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { dateFrom: start, dateTo: end };
      }
      case 'week': {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const start = new Date(now);
        start.setDate(now.getDate() - diffToMonday);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        return { dateFrom: start, dateTo: end };
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { dateFrom: start, dateTo: end };
      }
      case 'year': {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { dateFrom: start, dateTo: end };
      }
      case 'custom': {
        return {
          dateFrom: customDateFrom ? new Date(customDateFrom) : new Date(now.getFullYear(), now.getMonth(), 1),
          dateTo: customDateTo ? new Date(customDateTo + 'T23:59:59') : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        };
      }
      default: {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { dateFrom: start, dateTo: end };
      }
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { dateFrom, dateTo } = getDateRange();
      
      const params = new URLSearchParams();
      params.append('dateFrom', dateFrom.toISOString());
      params.append('dateTo', dateTo.toISOString());

      const response = await axiosClient.get(`/stats/funnel-technik?${params.toString()}`);
      setReportData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodaøilo se naèíst data reportu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period, customDateFrom, customDateTo]);

  const getPeriodLabel = (): string => {
    const { dateFrom, dateTo } = getDateRange();
    return `${dateFrom.toLocaleDateString('cs-CZ')} - ${dateTo.toLocaleDateString('cs-CZ')}`;
  };

  // Prepare status breakdown chart data
  const statusBreakdownChartData = useMemo(() => {
    if (!reportData) return [];
    return reportData.statusBreakdown.map((item) => ({
      name: item.status,
      count: item.count,
      percentage: parseFloat(item.percentage.toFixed(1)),
    }));
  }, [reportData]);

  // Prepare decline reasons chart data
  const declineReasonsChartData = useMemo(() => {
    if (!reportData) return [];
    return reportData.declinedReasons.map((reason) => ({
      name: reason.reason.length > 30 ? reason.reason.substring(0, 30) + '...' : reason.reason,
      fullName: reason.reason,
      count: reason.count,
      percentage: parseFloat(reason.percentage.toFixed(1)),
    }));
  }, [reportData]);

  const getStatusColor = (status: string): string => {
    if (status.includes('FINAL_APPROVAL') || status.includes('CONVERTED')) return 'bg-green-100 text-green-800';
    if (status.includes('DECLINED')) return 'bg-red-100 text-red-800';
    if (status.includes('UPLOAD_DOCUMENTS')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: Date | string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('cs-CZ');
    } catch {
      return String(dateString);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Funnel Technik - Pøehled kontroly vozidel</h1>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium text-gray-700">Èasové období</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            {(['day', 'week', 'month', 'year', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === p ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
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
            <>
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
            </>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-2">Vybrané období: {getPeriodLabel()}</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{error}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && reportData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">Celkem pøedáno</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{reportData.stats.totalHandedToTechnician}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Schváleno</span>
              </div>
              <div className="text-3xl font-bold text-green-900">{reportData.stats.approved}</div>
              <div className="text-xs text-green-600 mt-1">{reportData.stats.approvalRate.toFixed(1)}%</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Zamítnuto</span>
              </div>
              <div className="text-3xl font-bold text-red-900">{reportData.stats.rejected}</div>
              <div className="text-xs text-red-600 mt-1">{reportData.stats.rejectionRate.toFixed(1)}%</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 text-orange-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">V kontrole</span>
              </div>
              <div className="text-3xl font-bold text-orange-900">{reportData.stats.inProgress}</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Prùmìrná doba</span>
              </div>
              <div className="text-3xl font-bold text-purple-900">{reportData.stats.averageDaysInReview}</div>
              <div className="text-xs text-purple-600 mt-1">dní</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status Breakdown Pie Chart */}
            {statusBreakdownChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rozložení podle statusù</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusBreakdownChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusBreakdownChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Decline Reasons Bar Chart */}
            {declineReasonsChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dùvody zamítnutí</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={declineReasonsChartData} layout="vertical" margin={{ left: 150 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#EF4444" name="Poèet" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Seznam leadù ({reportData.leads.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Zákazník</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vozidlo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Èástka</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Dny</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Poznámky</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.leads.map((lead, index) => (
                    <tr key={lead.leadId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.uniqueId}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
                        <div className="text-xs text-gray-500">{lead.customerPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{lead.carBrand} {lead.carModel}</div>
                        <div className="text-xs text-gray-500">VIN: {lead.carVIN}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {lead.requestedAmount.toLocaleString('cs-CZ')} Kè
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.currentStatus)}`}>
                          {lead.currentStatusLabel}
                        </span>
                        {lead.declinedReasonLabel && (
                          <div className="text-xs text-red-600 mt-1 font-medium">{lead.declinedReasonLabel}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {lead.daysInTechnicianReview}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lead.notes && lead.notes.length > 0 ? (
                          <button
                            onClick={() => setSelectedLeadNotes(lead.notes || [])}
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-xs font-medium transition-colors"
                          >
                            ?? {lead.notes.length}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Notes Modal */}
      {selectedLeadNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Poznámky technika</h3>
              <button
                onClick={() => setSelectedLeadNotes(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {selectedLeadNotes.map((note, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 mb-2">{note.text}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium">{note.author}</span>
                      <span>{formatDate(note.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsCCFunnelTechnik;
