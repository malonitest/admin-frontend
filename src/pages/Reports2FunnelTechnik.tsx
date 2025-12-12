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
  uniqueId: number;
  customerName: string;
  customerPhone: string;
  carBrand: string;
  carModel: string;
  carVIN: string;
  requestedAmount: number;
  handedToTechnicianDate: string;
  currentStatus: string;
  currentStatusLabel: string;
  declinedReason?: string;
  declinedReasonLabel?: string;
  notes?: Array<{ text: string; date: string; author: string }>;
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
  dateFrom: string;
  dateTo: string;
  stats: IFunnelTechnikStats;
  leads: IFunnelTechnikLeadItem[];
  declinedReasons?: Array<{ reason: string; count: number; percentage: number }>;
  statusBreakdown?: Array<{ status: string; count: number; percentage: number }>;
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

const CHART_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

export function Reports2FunnelTechnik() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<IFunnelTechnikReportData | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

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

  const getStatusBadgeColor = (status: string) => {
    if (status === 'FINAL_APPROVAL' || status === 'CONVERTED') return 'bg-green-100 text-green-800';
    if (status === 'DECLINED') return 'bg-red-100 text-red-800';
    if (status === 'UPLOAD_DOCUMENTS') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Prepare chart data
  const statusChartData = useMemo(() => {
    if (!reportData?.statusBreakdown) return [];
    return reportData.statusBreakdown.map(item => ({
      name: item.status,
      value: item.count,
      percentage: item.percentage,
    }));
  }, [reportData]);

  const declinedReasonsData = useMemo(() => {
    if (!reportData?.declinedReasons) return [];
    return reportData.declinedReasons.map(item => ({
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
          <h1 className="text-2xl font-bold text-gray-900">?? Funnel Technik Report</h1>
          <p className="text-sm text-gray-500 mt-1">
            Pøehled kontroly vozidel - leady pøedané technikovi
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
                    ? 'bg-orange-600 text-white'
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
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      )}

      {/* Report Content */}
      {!loading && reportData && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm font-medium text-blue-600">?? Celkem pøedáno</div>
              <div className="text-3xl font-bold text-blue-900 mt-1">
                {reportData.stats?.totalHandedToTechnician}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600">? Schváleno</div>
              <div className="text-3xl font-bold text-green-900 mt-1">
                {reportData.stats?.approved}
              </div>
              <div className="text-sm text-green-600 mt-1">
                {reportData.stats?.approvalRate?.toFixed(1)}%
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm font-medium text-red-600">? Zamítnuto</div>
              <div className="text-3xl font-bold text-red-900 mt-1">
                {reportData.stats?.rejected}
              </div>
              <div className="text-sm text-red-600 mt-1">
                {reportData.stats?.rejectionRate?.toFixed(1)}%
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="text-sm font-medium text-orange-600">? V kontrole</div>
              <div className="text-3xl font-bold text-orange-900 mt-1">
                {reportData.stats?.inProgress}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="text-sm font-medium text-purple-600">?? Prùmìrná doba kontroly</div>
              <div className="text-3xl font-bold text-purple-900 mt-1">
                {reportData.stats?.averageDaysInReview}
              </div>
              <div className="text-sm text-purple-600 mt-1">dní</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            {statusChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">?? Rozložení podle statusu</h3>
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
                      {statusChartData.map((_, index) => (
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
                      <span className="font-semibold">{item.value} ({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Declined Reasons */}
            {declinedReasonsData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">? Dùvody zamítnutí</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={declinedReasonsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Leads Table */}
          {reportData.leads && reportData.leads.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">?? Seznam leadù ({reportData.leads.length})</h3>
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
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Dny v kontrole</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Poznámky</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.leads.map((lead) => (
                      <>
                        <tr key={lead.leadId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.uniqueId}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{lead.customerName}</div>
                            <div className="text-xs text-gray-500">{lead.customerPhone}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{lead.carBrand} {lead.carModel}</div>
                            <div className="text-xs text-gray-500 font-mono">{lead.carVIN}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            {lead.requestedAmount?.toLocaleString('cs-CZ')} Kè
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(lead.currentStatus)}`}>
                              {lead.currentStatusLabel}
                            </span>
                            {lead.declinedReasonLabel && (
                              <div className="text-xs text-red-600 mt-1">{lead.declinedReasonLabel}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className={`font-semibold ${lead.daysInTechnicianReview > 5 ? 'text-red-600' : 'text-gray-900'}`}>
                              {lead.daysInTechnicianReview}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lead.notes && lead.notes.length > 0 && (
                              <button
                                onClick={() => setExpandedNotes(expandedNotes === lead.leadId ? null : lead.leadId)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                ?? {lead.notes.length}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expandedNotes === lead.leadId && lead.notes && (
                          <tr>
                            <td colSpan={7} className="px-4 py-3 bg-gray-50">
                              <div className="space-y-2">
                                <div className="text-sm font-semibold text-gray-700">Poznámky:</div>
                                {lead.notes.map((note, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-800">{note.text}</p>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {note.author} • {new Date(note.date).toLocaleString('cs-CZ')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">?? Poznámky k reportu</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Zobrazuje všechny leady ve fázi technické kontroly vozidel</li>
              <li>• <strong>Schváleno</strong> - vozidla prošla kontrolou a pokraèují dál</li>
              <li>• <strong>Zamítnuto</strong> - vozidla nesplnila technické požadavky</li>
              <li>• <strong>V kontrole</strong> - aktuálnì probíhá technická kontrola</li>
              <li>• Data jsou aktuální k vybranému období: <strong>{getPeriodLabel()}</strong></li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports2FunnelTechnik;
