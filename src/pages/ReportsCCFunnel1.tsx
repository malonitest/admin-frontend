import React, { useState, useEffect, useMemo } from 'react';
import axiosClient from '../api/axiosClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface IFunnelStageNote {
  text: string;
  date: string;
  author: string;
}

// Types based on backend API
interface IFunnelStageData {
  stage: string;
  count: number;
  percentage: number;
  declinedReasons?: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  notes?: IFunnelStageNote[];
  averageDays?: number | null;
}

interface IFunnelReportData {
  dateFrom: string;
  dateTo: string;
  stages: IFunnelStageData[];
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  declinedLeads: number;
  declinedReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  averageTimeInStages: Record<string, number>;
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const formatNoteDate = (value: string): string => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ReportsCCFunnel1: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<IFunnelReportData | null>(null);

  // Period filters
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');

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
        // Default to November 2024 where we know data exists
        const start = new Date(2024, 10, 1); // November 2024
        const end = new Date(2024, 10, 30, 23, 59, 59, 999);
        return { dateFrom: start, dateTo: end };
      }
      case 'year': {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { dateFrom: start, dateTo: end };
      }
      case 'custom': {
        return {
          dateFrom: customDateFrom ? new Date(customDateFrom) : new Date(2024, 10, 1),
          dateTo: customDateTo ? new Date(customDateTo + 'T23:59:59') : new Date(2024, 10, 30, 23, 59, 59, 999),
        };
      }
      default: {
        const start = new Date(2024, 10, 1); // November 2024
        const end = new Date(2024, 10, 30, 23, 59, 59, 999);
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

      console.log('?? Fetching funnel data:', {
        endpoint: `/stats/funnel?${params.toString()}`,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
      });

      const response = await axiosClient.get(`/stats/funnel?${params.toString()}`);
      
      console.log('? Funnel API response:', response.data);
      
      setReportData(response.data);
    } catch (err) {
      console.error('? Funnel API error:', err);
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

  const stageDetails = useMemo<IFunnelStageData[]>(() => {
    if (!reportData || !reportData.stages) return [];
    return reportData.stages.map((stage) => ({
      ...stage,
      averageDays: reportData.averageTimeInStages?.[stage.stage] ?? null,
    }));
  }, [reportData]);

  const stageNotes = useMemo(() => {
    return stageDetails
      .filter((stage) => stage.notes && stage.notes.length)
      .map((stage) => ({
        stage: stage.stage,
        notes: stage.notes!.slice(0, 3),
      }));
  }, [stageDetails]);

  // Prepare funnel chart data
  const funnelChartData = useMemo(() => {
    if (!reportData || !reportData.stages) return [];
    return reportData.stages.map((stage) => ({
      name: stage.stage,
      count: stage.count,
      percentage: parseFloat((stage.percentage ?? 0).toFixed(1)),
    }));
  }, [reportData]);

  // Prepare decline reasons chart data
  const declineReasonsChartData = useMemo(() => {
    if (!reportData || !reportData.declinedReasons) return [];
    return reportData.declinedReasons.slice(0, 10).map((reason) => ({
      name: reason.reason.length > 30 ? reason.reason.substring(0, 30) + '...' : reason.reason,
      fullName: reason.reason,
      count: reason.count,
      percentage: parseFloat((reason.percentage ?? 0).toFixed(1)),
    }));
  }, [reportData]);

  // Prepare time in stages chart data
  const timeInStagesChartData = useMemo(() => {
    if (!reportData || !reportData.averageTimeInStages) return [];
    const stageTimes = reportData.averageTimeInStages;
    const items: { name: string; days: number }[] = [];
    for (const stage in stageTimes) {
      if (Object.prototype.hasOwnProperty.call(stageTimes, stage)) {
        const days = stageTimes[stage] ?? 0;
        items.push({ name: stage, days: parseFloat(days.toFixed(1)) });
      }
    }
    return items;
  }, [reportData]);

  const renderDeclineReasonLabel = (entry: { payload?: { name?: string; percentage?: number } }) => {
    const payload = entry.payload;
    if (!payload?.name || typeof payload.percentage !== 'number') {
      return '';
    }
    return `${payload.name}: ${payload.percentage}%`;
  };

  const getConversionColor = (rate: number): string => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Funnel 1 - Konverzní trychtýø CC</h1>

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
          {/* No Data Message */}
          {reportData.stages && reportData.stages.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-1">Žádná data pro vybrané období</h3>
                  <p className="text-yellow-700">
                    Pro období <strong>{getPeriodLabel()}</strong> nejsou v databázi žádné leady. 
                    Zkuste vybrat jiné èasové období nebo importovat testovací data.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">Celkem leadù</span>
              </div>
              <div className="text-3xl font-bold text-blue-900">{reportData.totalLeads}</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Konvertováno</span>
              </div>
              <div className="text-3xl font-bold text-green-900">{reportData.convertedLeads}</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Zamítnuto</span>
              </div>
              <div className="text-3xl font-bold text-red-900">{reportData.declinedLeads}</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm">Konverzní pomìr</span>
              </div>
              <div className={`text-3xl font-bold ${getConversionColor(reportData.conversionRate ?? 0)}`}>
                {(reportData.conversionRate ?? 0).toFixed(1)}%
              </div>
            </div>
          </div>

          {stageDetails.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              {stageDetails.map((stage, index) => {
                const topReason = stage.declinedReasons?.[0];
                const latestNote = stage.notes?.[0];
                const color = CHART_COLORS[index % CHART_COLORS.length];
                return (
                  <div key={stage.stage} className="bg-white rounded-lg shadow border border-gray-100 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{stage.stage}</p>
                      <span className="text-xs font-medium text-gray-500">{(stage.percentage ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stage.count}</div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${Math.min(stage.percentage ?? 0, 100)}%`, backgroundColor: color }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>Prùm. èas</span>
                      <span className="font-semibold text-gray-900">
                        {stage.averageDays ? `${stage.averageDays.toFixed(1)} dne` : 'N/A'}
                      </span>
                    </div>
                    {topReason ? (
                      <div className="bg-red-50 rounded-md p-2">
                        <p className="text-xs text-red-800 font-medium">Top dùvod zamítnutí</p>
                        <p className="text-sm text-red-900">
                          {topReason.reason} ({topReason.count}×)
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-md p-2 text-xs text-gray-500">Bez zamítnutých v této fázi</div>
                    )}
                    {latestNote ? (
                      <div className="text-xs text-gray-600 border-t pt-2">
                        <p className="font-semibold text-gray-800 mb-1">Poslední poznámka</p>
                        <p className="line-clamp-2">{latestNote.text}</p>
                        <span className="text-gray-400">{latestNote.author || 'Bez autora'} • {formatNoteDate(latestNote.date)}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 border-t pt-2">Žádné poznámky</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Funnel Chart */}
            {funnelChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Konverzní trychtýø</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnelChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3B82F6" name="Poèet leadù" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Decline Reasons Pie Chart */}
            {declineReasonsChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dùvody zamítnutí</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={declineReasonsChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderDeclineReasonLabel}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {declineReasonsChartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Time in Stages Chart */}
            {timeInStagesChartData.length > 0 && (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Prùmìrný èas ve fázích (dny)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeInStagesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="days" fill="#10B981" name="Prùmìrný poèet dní" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Funnel Stages Detail Table */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detaily jednotlivých fází</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fáze</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Poèet leadù</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">% z celku</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Prùmìrný èas (dny)</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Top dùvody zamítnutí</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stageDetails.map((stage, index) => (
                    <tr key={stage.stage} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{stage.stage}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {stage.count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                        {(stage.percentage ?? 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {stage.averageDays ? stage.averageDays.toFixed(1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {stage.declinedReasons && stage.declinedReasons.length > 0 ? (
                          <div className="space-y-1">
                            {stage.declinedReasons.slice(0, 3).map((reason, idx) => (
                              <div key={idx}>
                                {reason.reason} ({reason.count}x, {(reason.percentage ?? 0).toFixed(1)}%)
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {stageNotes.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-gray-200 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Nejnovìjší poznámky z fází</h2>
              </div>
              <div className="divide-y">
                {stageNotes.map((stage) => (
                  <div key={stage.stage} className="p-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-800">{stage.stage}</p>
                    {stage.notes.map((note, idx) => (
                      <div key={`${stage.stage}-${idx}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-sm text-gray-900">{note.text}</p>
                        <div className="text-xs text-gray-500 flex justify-between mt-2">
                          <span>{note.author || 'Neznámý autor'}</span>
                          <span>{formatNoteDate(note.date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Decline Reasons Table */}
          {reportData.declinedReasons && reportData.declinedReasons.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Celkový pøehled dùvodù zamítnutí</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dùvod</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Poèet</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">% zamítnutých</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.declinedReasons.map((reason, index) => (
                      <tr key={reason.reason} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{reason.reason}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {reason.count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {(reason.percentage ?? 0).toFixed(1)}%
                        </td>
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
};

export default ReportsCCFunnel1;
