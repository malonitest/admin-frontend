import { useState, useEffect, useMemo } from 'react';
import { axiosClient } from '@/api/axiosClient';
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
  LineChart,
  Line,
} from 'recharts';

// Types
interface ReportData {
  byStatus: Record<string, number>;
  bySubStatus: Record<string, number>;
  byDealer: Array<{ dealer: string; dealerId: string; count: number }>;
  bySource: Record<string, number>;
  byReferralURL: Array<{ url: string; count: number; converted: number; conversionRate: number }>;
  byDay: Array<{ date: string; count: number; converted: number }>;
  totalLeads: number;
  convertedLeads: number;
  declinedLeads: number;
  conversionRate: number;
}

interface Dealer {
  _id: string;
  name?: string;
  email?: string;
  user?: { name: string; email: string };
  dealerType: string;
  team: string;
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

// Status translations
const STATUS_LABELS: Record<string, string> = {
  CONCEPT: 'Koncept',
  NEW: 'Nový',
  SUPERVISOR_APPROVED: 'Schváleno AM',
  CUSTOMER_APPROVED: 'Schváleno klientem',
  ASSIGNED: 'Přiřazeno',
  SENT_TO_OZ: 'Odesláno OZ',
  SALES_APPROVED: 'Schváleno OZ',
  UPLOAD_DOCUMENTS: 'Nahrávání dokumentů',
  FINAL_APPROVAL: 'Předáno k vyplacení',
  CONVERTED: 'Konvertováno',
  DECLINED: 'Zamítnuto',
  RETURNED_TO_SALES: 'Vráceno obchodníkovi',
};

const SUBSTATUS_LABELS: Record<string, string> = {
  NOT_REACHED: 'Nedovoláno',
  NOT_REACHED_1: 'Nedovoláno 1x',
  NOT_REACHED_2: 'Nedovoláno 2x',
  NOT_REACHED_3: 'Nedovoláno 3x',
  CALLBACK: 'Zpětné volání',
  INTERESTED: 'Zájem',
  DUPLICATE: 'Duplicita',
  WAITING_FOR_DOCUMENTS: 'Čeká na dokumenty',
  AWAITING_DOCUMENTS: 'Čeká na dokumenty',
  MEETING_SCHEDULED: 'Naplánovaná schůzka',
  NEGOTIATING: 'Vyjednávání',
  ASSIGNED_TO_TECHNICIAN: 'Přiděleno technikovi',
  CAR_OLD: 'Stáří vozu',
  CAR_LOW_VALUE: 'Nízká hodnota auta',
  CAR_NOT_OWNED: 'Auto nevlastní',
  CAR_LEASED: 'Auto na leasing',
  CAR_BAD_TECHNICAL_STATE: 'Špatný technický stav',
  CAR_HIGH_MILEAGE: 'Vysoký nájezd',
  CAR_BURDENED: 'Vozidlo je již pod zástavou (CarDetect)',
  CAR_LOSS_RISK: 'Riziko ztráty vozu',
  CAR_DENIED_BY_TECHNICIAN: 'Zamítnuto technikem',
  CUSTOMER_NOT_INTERESTED_BUY: 'Nechce odkup vozu',
  CUSTOMER_NOT_ELIGIBLE: 'Nesplňuje podmínky',
  CUSTOMER_PRICE_DISADVANTAGEOUS: 'Nevýhodná cena',
  CUSTOMER_SOLVED_ELSEWHERE: 'Vyřešeno jinak',
  HIGH_INSTALLMENTS: 'Vysoké splátky',
  EXECUTION: 'Exekuce',
  WANTS_SHORTER_CONTRACT_DURATION: 'Chce kratší dobu smlouvy',
  DISAGREES_PURCHASE_CONTRACT: 'Nesouhlasí s kupní smlouvou',
  DISAGREES_RENT_CONTRACT: 'Nesouhlasí s nájemní smlouvou',
  PARTNER_DISAGREES: 'Nesouhlasí partner',
  TEST: 'Test',
  INSOLVENCY: 'Insolvence',
  NOT_INTERESTED: 'Nemá zájem',
  OTHER: 'Ostatní',
};

const SOURCE_LABELS: Record<string, string> = {
  WEB: 'Web',
  APP: 'Aplikace',
  SALES: 'Obchodník',
  OS: 'Obchodní zástupce',
  AFFILIATE: 'Affiliate',
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const ReportsMarketing: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);

  // Period filters
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');

  // Data filters
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSubStatus, setSelectedSubStatus] = useState<string>('');
  const [selectedDealer, setSelectedDealer] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedReferralURL, setSelectedReferralURL] = useState<string>('');

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

  const fetchDealers = async () => {
    try {
      const response = await axiosClient.get('/dealers?limit=100');
      setDealers(response.data.results || []);
    } catch (err) {
      console.error('Failed to fetch dealers:', err);
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

      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedSubStatus) params.append('subStatus', selectedSubStatus);
      if (selectedDealer) params.append('dealer', selectedDealer);
      if (selectedSource) params.append('source', selectedSource);
      if (selectedReferralURL) params.append('referralURL', selectedReferralURL);

      const response = await axiosClient.get(`/stats/marketing-report?${params.toString()}`);
      setReportData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data reportu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [period, customDateFrom, customDateTo, selectedStatus, selectedSubStatus, selectedDealer, selectedSource, selectedReferralURL]);

  const getPeriodLabel = (): string => {
    const { dateFrom, dateTo } = getDateRange();
    return `${dateFrom.toLocaleDateString('cs-CZ')} - ${dateTo.toLocaleDateString('cs-CZ')}`;
  };

  // Prepare chart data
  const statusChartData = useMemo(() => {
    if (!reportData) return [];
    return Object.entries(reportData.byStatus).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      count,
    }));
  }, [reportData]);

  const sourceChartData = useMemo(() => {
    if (!reportData) return [];
    return Object.entries(reportData.bySource).map(([source, count]) => ({
      name: SOURCE_LABELS[source] || source,
      count,
    }));
  }, [reportData]);

  const referralChartData = useMemo(() => {
    if (!reportData) return [];
    return reportData.byReferralURL.slice(0, 10).map((item) => ({
      name: item.url.length > 30 ? item.url.substring(0, 30) + '...' : item.url,
      fullUrl: item.url,
      leady: item.count,
      konverze: item.converted,
      'konverzní %': parseFloat(item.conversionRate.toFixed(1)),
    }));
  }, [reportData]);

  const timelineChartData = useMemo(() => {
    if (!reportData) return [];
    return reportData.byDay.map((item) => ({
      date: new Date(item.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }),
      leady: item.count,
      konverze: item.converted,
    }));
  }, [reportData]);

  const getConversionColor = (rate: number): string => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reporty Marketing</h1>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium text-gray-700">Časové období</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            {(['day', 'week', 'month', 'year', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {p === 'day' && 'Den'}
                {p === 'week' && 'Týden'}
                {p === 'month' && 'Měsíc'}
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

      {/* Data Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-medium text-gray-700">Filtry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Všechny statusy</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={selectedSubStatus}
            onChange={(e) => setSelectedSubStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Všechny substatusy</option>
            {Object.entries(SUBSTATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={selectedDealer}
            onChange={(e) => setSelectedDealer(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Všichni obchodníci</option>
            {dealers.map((dealer) => (
              <option key={dealer._id} value={dealer._id}>
                {dealer.name || dealer.email || dealer.user?.name || dealer.user?.email || 'Neznámý'}
              </option>
            ))}
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Všechny zdroje</option>
            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filtr URL kampaně..."
            value={selectedReferralURL}
            onChange={(e) => setSelectedReferralURL(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {(selectedStatus || selectedSubStatus || selectedDealer || selectedSource || selectedReferralURL) && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm text-gray-500">Aktivní filtry:</span>
            {selectedStatus && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Status: {STATUS_LABELS[selectedStatus]}
                <button onClick={() => setSelectedStatus('')} className="ml-1 hover:text-blue-600">×</button>
              </span>
            )}
            {selectedSubStatus && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                Substatus: {SUBSTATUS_LABELS[selectedSubStatus]}
                <button onClick={() => setSelectedSubStatus('')} className="ml-1 hover:text-purple-600">×</button>
              </span>
            )}
            {selectedDealer && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Obchodník: {dealers.find(d => d._id === selectedDealer)?.name || 'Vybraný'}
                <button onClick={() => setSelectedDealer('')} className="ml-1 hover:text-green-600">×</button>
              </span>
            )}
            {selectedSource && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                Zdroj: {SOURCE_LABELS[selectedSource]}
                <button onClick={() => setSelectedSource('')} className="ml-1 hover:text-orange-600">×</button>
              </span>
            )}
            {selectedReferralURL && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-800">
                URL: {selectedReferralURL}
                <button onClick={() => setSelectedReferralURL('')} className="ml-1 hover:text-pink-600">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{error}</div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Celkem leadů</span>
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
              <span className="text-sm">Konverzní poměr</span>
            </div>
            <div className={`text-3xl font-bold ${getConversionColor(reportData.conversionRate)}`}>
              {reportData.conversionRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* URL Campaigns Table - Main Marketing Focus */}
      {!loading && reportData && reportData.byReferralURL.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Přehled URL kampaní
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">URL Kampaně</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Počet leadů</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Konverze</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Konverzní %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.byReferralURL.map((item, index) => (
                  <tr key={item.url} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-gray-900" title={item.url}>
                        {item.url.length > 60 ? item.url.substring(0, 60) + '...' : item.url}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.converted > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.converted}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-bold ${getConversionColor(item.conversionRate)}`}>
                      {item.conversionRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      {!loading && reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* URL Campaign Chart */}
          {referralChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 URL kampaní</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={referralChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leady" fill="#3B82F6" name="Leady" />
                  <Bar dataKey="konverze" fill="#10B981" name="Konverze" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Source Pie Chart */}
          {sourceChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leady podle zdroje</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {sourceChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Timeline Chart */}
          {timelineChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vývoj v čase</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leady" stroke="#3B82F6" name="Leady" strokeWidth={2} />
                  <Line type="monotone" dataKey="konverze" stroke="#10B981" name="Konverze" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Status Chart */}
          {statusChartData.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leady podle statusu</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" name="Počet" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Help / Notes Section */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Poznámky k marketingovým reportům</h2>
        </div>

        <ul className="space-y-2 text-sm text-gray-700 mb-4">
          <li><strong>Přehled URL kampaní</strong> - Hlavní tabulka zobrazuje výkonnost jednotlivých marketingových kampaní podle referral URL</li>
          <li><strong>Počet leadů</strong> - Celkový počet leadů přijatých z dané URL kampaně</li>
          <li><strong>Konverze</strong> - Počet leadů, které byly úspěšně konvertovány na smlouvu</li>
          <li><strong>Konverzní %</strong> - Procentuální úspěšnost kampaně (zelená ≥20% = výborná, oranžová 10-20% = průměrná, červená &lt;10% = slabá)</li>
          <li><strong>Filtr URL</strong> - Zadejte část URL pro vyhledání konkrétní kampaně (např. "facebook", "google", "utm_campaign")</li>
        </ul>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">💡 Jak používat tyto reporty:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Vyberte časové období pro analýzu (doporučujeme měsíc nebo delší pro relevantní data)</li>
            <li>Použijte filtr URL pro vyhledání konkrétní kampaně nebo skupiny kampaní</li>
            <li>Sledujte konverzní poměr jednotlivých kampaní - pomůže identifikovat nejefektivnější kanály</li>
            <li>Graf "Vývoj v čase" ukazuje trendy - hledejte vzory po spuštění kampaní</li>
            <li>Kombinujte filtry (např. zdroj + URL) pro detailní analýzu konkrétních kampaní</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ReportsMarketing;
