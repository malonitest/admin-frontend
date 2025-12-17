import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketingApi, MarketingOverview, TimeSeries, FunnelAnalysis } from '../../api/marketingApi';
import { format, subMonths } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ==================== TYPES ====================

interface DateRange {
  from: string;
  to: string;
}

// ==================== COLORS ====================

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

// ==================== MAIN COMPONENT ====================

export const Marketing = () => {
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeries[]>([]);
  const [funnel, setFunnel] = useState<FunnelAnalysis[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [dateRange, selectedSources]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        sources: selectedSources.length > 0 ? selectedSources : undefined,
      };

      const [overviewData, timeSeriesData, funnelData] = await Promise.all([
        marketingApi.getOverview(params),
        marketingApi.getTimeSeries(params),
        marketingApi.getFunnel(params),
      ]);

      setOverview(overviewData);
      setTimeSeries(timeSeriesData);
      setFunnel(funnelData);
    } catch (error) {
      console.error('Failed to fetch marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!overview) return;

    const wb = XLSX.utils.book_new();

    // Overview sheet
    const overviewSheet = XLSX.utils.json_to_sheet([
      {
        'Total Leads': overview.totalLeads,
        'Total Conversions': overview.totalConversions,
        'Conversion Rate (%)': overview.overallConversionRate,
        'Total Revenue (CZK)': overview.totalRevenue,
        'Top Source': overview.topPerformingSource,
        'Worst Source': overview.worstPerformingSource,
      },
    ]);
    XLSX.utils.book_append_sheet(wb, overviewSheet, 'Overview');

    // Sources sheet
    const sourcesData = overview.sources.map((s) => ({
      Source: s.source,
      'Total Leads': s.totalLeads,
      'Converted': s.convertedLeads,
      'Declined': s.declinedLeads,
      'In Progress': s.inProgressLeads,
      'Conversion Rate (%)': s.conversionRate,
      'Decline Rate (%)': s.declineRate,
      'Avg Time to Conv. (days)': s.avgTimeToConversion,
      'Avg Lease Value (CZK)': s.avgLeaseValue,
      'Total Revenue (CZK)': s.totalRevenue,
    }));
    const sourcesSheet = XLSX.utils.json_to_sheet(sourcesData);
    XLSX.utils.book_append_sheet(wb, sourcesSheet, 'Sources');

    XLSX.writeFile(wb, `Marketing_Report_${dateRange.from}_${dateRange.to}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading marketing data...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">No data available</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Analytics</h1>
          <p className="text-gray-600">Lead sources, conversions & ROI tracking</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export to Excel
          </button>
          <button
            onClick={() => navigate('/new-reports/marketing-costs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cost Tracking
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date From</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date To</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sources (leave empty for all)</label>
            <input
              type="text"
              placeholder="Facebook, Google Ads..."
              value={selectedSources.join(', ')}
              onChange={(e) =>
                setSelectedSources(
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
          <div className="text-sm opacity-90">Total Leads</div>
          <div className="text-3xl font-bold mt-2">{overview.totalLeads.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
          <div className="text-sm opacity-90">Conversions</div>
          <div className="text-3xl font-bold mt-2">{overview.totalConversions.toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
          <div className="text-sm opacity-90">Conversion Rate</div>
          <div className="text-3xl font-bold mt-2">{overview.overallConversionRate.toFixed(2)}%</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-lg shadow">
          <div className="text-sm opacity-90">Total Revenue</div>
          <div className="text-3xl font-bold mt-2">
            {(overview.totalRevenue / 1000000).toFixed(1)}M CZK
          </div>
        </div>
      </div>

      {/* Charts Row 1: Time Series + Source Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Leads & Conversions Trend</h2>
          {timeSeries.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeries[0]?.timeSeries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#3b82f6" name="Leads" />
                <Line type="monotone" dataKey="conversions" stroke="#10b981" name="Conversions" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Source Distribution Pie */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Lead Distribution by Source</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={overview.sources.map((s) => ({
                  name: s.source,
                  value: s.totalLeads,
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {overview.sources.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source Performance Table */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Source Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Total Leads</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Converted</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Conv. Rate</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Declined</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">In Progress</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Avg Lease</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {overview.sources.map((source) => (
                <tr key={source.source} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{source.source}</td>
                  <td className="px-4 py-3 text-right">{source.totalLeads.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    {source.convertedLeads.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        source.conversionRate >= 20
                          ? 'bg-green-100 text-green-800'
                          : source.conversionRate >= 10
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {source.conversionRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">
                    {source.declinedLeads.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-600">
                    {source.inProgressLeads.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(source.avgLeaseValue / 1000).toFixed(0)}k CZK
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {(source.totalRevenue / 1000000).toFixed(2)}M CZK
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversion Funnel */}
      {funnel.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Conversion Funnel</h2>
          <div className="space-y-6">
            {funnel.map((sourceFunc) => (
              <div key={sourceFunc.source}>
                <h3 className="font-semibold mb-2">{sourceFunc.source}</h3>
                <div className="space-y-2">
                  {sourceFunc.stages.map((stage, index) => (
                    <div key={stage.stage} className="relative">
                      <div className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium">{stage.stage}</div>
                        <div className="flex-1">
                          <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                            <div
                              className="h-full flex items-center justify-center text-white text-sm font-medium transition-all"
                              style={{
                                width: `${stage.percentage}%`,
                                background: `linear-gradient(to right, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})`,
                              }}
                            >
                              {stage.count} ({stage.percentage.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                        {stage.dropOff !== undefined && (
                          <div className="text-sm text-red-600">
                            -{stage.dropOff} ({stage.dropOffRate?.toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top & Worst Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
          <h3 className="text-lg font-bold text-green-800 mb-2">?? Top Performing Source</h3>
          <p className="text-3xl font-bold text-green-900">{overview.topPerformingSource}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-lg border border-red-200">
          <h3 className="text-lg font-bold text-red-800 mb-2">?? Needs Improvement</h3>
          <p className="text-3xl font-bold text-red-900">{overview.worstPerformingSource}</p>
        </div>
      </div>
    </div>
  );
};
