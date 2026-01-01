import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'recharts';

// Types
interface ReportData {
  byStatus: Record<string, number>;
  bySubStatus: Record<string, number>;
  byDealer: Array<{ dealer: string; dealerId: string; count: number }>;
  bySource: Record<string, number>;
  byDay: Array<{ date: string; count: number }>;
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
  // Nedovoláno varianty
  NOT_REACHED: 'Nedovoláno',
  NOT_REACHED_1: 'Nedovoláno 1x',
  NOT_REACHED_2: 'Nedovoláno 2x',
  NOT_REACHED_3: 'Nedovoláno 3x',
  // Obecné
  CALLBACK: 'Zpětné volání',
  INTERESTED: 'Zájem',
  DUPLICATE: 'Duplicita',
  WAITING_FOR_DOCUMENTS: 'Čeká na dokumenty',
  AWAITING_DOCUMENTS: 'Čeká na dokumenty',
  MEETING_SCHEDULED: 'Naplánovaná schůzka',
  NEGOTIATING: 'Vyjednávání',
  ASSIGNED_TO_TECHNICIAN: 'Přiděleno technikovi',
  // Důvody zamítnutí - auto
  CAR_OLD: 'Stáří vozu',
  CAR_LOW_VALUE: 'Nízká hodnota auta',
  CAR_NOT_OWNED: 'Auto nevlastní',
  CAR_LEASED: 'Auto na leasing',
  CAR_BAD_TECHNICAL_STATE: 'Špatný technický stav',
  CAR_HIGH_MILEAGE: 'Vysoký nájezd',
  CAR_BURDENED: 'Vozidlo je již pod zástavou (CarDetect)',
  CAR_LOSS_RISK: 'Riziko ztráty vozu',
  CAR_DENIED_BY_TECHNICIAN: 'Zamítnuto technikem',
  // Důvody zamítnutí - klient
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
  // Ostatní
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

// Chart colors
const CHART_COLORS = [
  '#C41E3A', '#8B1A1A', '#2563EB', '#059669', '#D97706', 
  '#7C3AED', '#DC2626', '#0891B2', '#65A30D', '#EA580C',
  '#4F46E5', '#0D9488', '#CA8A04', '#BE185D', '#7C2D12'
];

export function ReportsCC() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  
  // Filters
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedSubStatus, setSelectedSubStatus] = useState<string>('');
  const [selectedDealer, setSelectedDealer] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');

  // Fetch dealers for filter
  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const res = await axiosClient.get('/dealers?team=CC&limit=100');
        setDealers(res.data.results || []);
      } catch (error) {
        console.error('Failed to fetch dealers:', error);
      }
    };
    fetchDealers();
  }, []);

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('team', 'CC');
      
      if (period === 'custom' && customDateFrom && customDateTo) {
        params.append('dateFrom', customDateFrom);
        params.append('dateTo', customDateTo);
      } else {
        params.append('period', period);
      }
      
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedSubStatus) params.append('subStatus', selectedSubStatus);
      if (selectedDealer) params.append('dealer', selectedDealer);
      if (selectedSource) params.append('source', selectedSource);

      const res = await axiosClient.get(`/stats/cc-report?${params.toString()}`);
      setReportData(res.data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchReportData();
    }
  }, [period, selectedStatus, selectedSubStatus, selectedDealer, selectedSource]);

  const handleCustomDateSearch = () => {
    if (customDateFrom && customDateTo) {
      fetchReportData();
    }
  };

  // Prepare chart data
  const statusChartData = useMemo(() => {
    if (!reportData?.byStatus) return [];
    return Object.entries(reportData.byStatus)
      .map(([key, value]) => ({
        name: STATUS_LABELS[key] || key,
        počet: value,
        originalKey: key,
      }))
      .sort((a, b) => b.počet - a.počet);
  }, [reportData]);

  const subStatusChartData = useMemo(() => {
    if (!reportData?.bySubStatus) return [];
    return Object.entries(reportData.bySubStatus)
      .map(([key, value]) => ({
        name: SUBSTATUS_LABELS[key] || key,
        počet: value,
        originalKey: key,
      }))
      .filter(item => item.počet > 0)
      .sort((a, b) => b.počet - a.počet);
  }, [reportData]);

  const dealerChartData = useMemo(() => {
    if (!reportData?.byDealer) return [];
    return reportData.byDealer
      .map(item => ({
        name: item.dealer || 'Neznámý',
        počet: item.count,
      }))
      .sort((a, b) => b.počet - a.počet)
      .slice(0, 10);
  }, [reportData]);

  const sourceChartData = useMemo(() => {
    if (!reportData?.bySource) return [];
    return Object.entries(reportData.bySource)
      .map(([key, value]) => ({
        name: SOURCE_LABELS[key] || key,
        počet: value,
        originalKey: key,
      }))
      .filter(item => item.počet > 0)
      .sort((a, b) => b.počet - a.počet);
  }, [reportData]);

  const timelineChartData = useMemo(() => {
    if (!reportData?.byDay) return [];
    return reportData.byDay.map(item => ({
      date: new Date(item.date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' }),
      počet: item.count,
    }));
  }, [reportData]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'dnes';
      case 'week': return 'tento týden';
      case 'month': return 'tento měsíc';
      case 'year': return 'tento rok';
      case 'custom': return 'vlastní období';
      default: return '';
    }
  };

  // Available statuses and substatuses from data
  const availableStatuses = Object.keys(STATUS_LABELS);
  const availableSubStatuses = Object.keys(SUBSTATUS_LABELS);
  const availableSources = Object.keys(SOURCE_LABELS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporty CC (Call Centrum)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Statistiky a přehledy pro tým Call Centra
          </p>
        </div>
        <button
          onClick={() => navigate('/reports/cc/funnel1')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Funnel 1 - Konverzní trychtýř
        </button>
      </div>

      {/* Info Box - How to use */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">📊 Jak používat reporty CC</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Funnel 1</strong> - Detailní analýza konverzního trychtýře s důvody zamítnutí a průměrným časem ve fázích</li>
          <li>• <strong>Časový filtr</strong> - Vyberte období pro které chcete zobrazit data (den, týden, měsíc, rok nebo vlastní rozsah)</li>
          <li>• <strong>Filtr Status</strong> - Zobrazí leady pouze v konkrétním stavu (např. Nový, Schváleno AM, Konvertováno)</li>
          <li>• <strong>Filtr Substatus</strong> - Detailnější filtrování podle podstavu (např. Nedovoláno, Zpětné volání)</li>
          <li>• <strong>Filtr Obchodník</strong> - Zobrazí leady konkrétního obchodníka z CC týmu</li>
          <li>• <strong>Filtr Zdroj</strong> - Filtruje podle zdroje leadu (Web, Aplikace, Obchodník atd.)</li>
          <li>• Grafy se automaticky aktualizují po změně filtrů</li>
        </ul>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Filtry</h3>
        
        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <span className="text-sm font-medium text-gray-700">Období:</span>
          <div className="flex gap-2 flex-wrap">
            {(['day', 'week', 'month', 'year', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Zobrazit
              </button>
            </div>
          )}
        </div>

        {/* Additional Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Všechny statusy</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {/* SubStatus Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Substatus</label>
            <select
              value={selectedSubStatus}
              onChange={(e) => setSelectedSubStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Všechny substatusy</option>
              {availableSubStatuses.map((subStatus) => (
                <option key={subStatus} value={subStatus}>
                  {SUBSTATUS_LABELS[subStatus]}
                </option>
              ))}
            </select>
          </div>

          {/* Dealer Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Obchodník</label>
            <select
              value={selectedDealer}
              onChange={(e) => setSelectedDealer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Všichni obchodníci</option>
              {dealers.map((dealer) => (
                <option key={dealer._id} value={dealer._id}>
                  {dealer.name || dealer.email || dealer.user?.name || dealer.user?.email || 'Neznámý'}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zdroj</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Všechny zdroje</option>
              {availableSources.map((source) => (
                <option key={source} value={source}>
                  {SOURCE_LABELS[source]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedStatus || selectedSubStatus || selectedDealer || selectedSource) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">Aktivní filtry:</span>
            {selectedStatus && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Status: {STATUS_LABELS[selectedStatus]}
                <button onClick={() => setSelectedStatus('')} className="ml-1 hover:text-red-600">×</button>
              </span>
            )}
            {selectedSubStatus && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Substatus: {SUBSTATUS_LABELS[selectedSubStatus]}
                <button onClick={() => setSelectedSubStatus('')} className="ml-1 hover:text-blue-600">×</button>
              </span>
            )}
            {selectedDealer && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Obchodník: {dealers.find(d => d._id === selectedDealer)?.name || dealers.find(d => d._id === selectedDealer)?.user?.name || 'Vybraný'}
                <button onClick={() => setSelectedDealer('')} className="ml-1 hover:text-green-600">×</button>
              </span>
            )}
            {selectedSource && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Zdroj: {SOURCE_LABELS[selectedSource]}
                <button onClick={() => setSelectedSource('')} className="ml-1 hover:text-purple-600">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedStatus('');
                setSelectedSubStatus('');
                setSelectedDealer('');
                setSelectedSource('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Zrušit vše
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      ) : reportData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Celkem leadů</div>
              <div className="text-2xl font-bold text-gray-900">{reportData.totalLeads.toLocaleString('cs-CZ')}</div>
              <div className="text-xs text-gray-400 mt-1">{getPeriodLabel()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Konvertováno</div>
              <div className="text-2xl font-bold text-green-600">{reportData.convertedLeads.toLocaleString('cs-CZ')}</div>
              <div className="text-xs text-gray-400 mt-1">{getPeriodLabel()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Zamítnuto</div>
              <div className="text-2xl font-bold text-red-600">{reportData.declinedLeads.toLocaleString('cs-CZ')}</div>
              <div className="text-xs text-gray-400 mt-1">{getPeriodLabel()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-500">Míra konverze</div>
              <div className="text-2xl font-bold text-blue-600">{reportData.conversionRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1">{getPeriodLabel()}</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leady podle statusu</h3>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusChartData} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="počet" fill="#C41E3A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Žádná data pro zobrazení
                </div>
              )}
            </div>

            {/* SubStatus Chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leady podle substatusu</h3>
              {subStatusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subStatusChartData} layout="vertical" margin={{ left: 120 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="počet" fill="#2563EB" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Žádná data pro zobrazení
                </div>
              )}
            </div>

            {/* Dealer Performance Chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 obchodníků podle počtu leadů</h3>
              {dealerChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dealerChartData} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="počet" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Žádná data pro zobrazení
                </div>
              )}
            </div>

            {/* Source Chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leady podle zdroje</h3>
              {sourceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sourceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="počet"
                    >
                      {sourceChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Žádná data pro zobrazení
                </div>
              )}
            </div>
          </div>

          {/* Timeline Chart - Full Width */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vývoj počtu leadů v čase</h3>
            {timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="počet" fill="#C41E3A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                Žádná data pro zobrazení
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">📝 Poznámky k reportům</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Míra konverze</strong> = (Konvertované leady / Celkem leadů) × 100</li>
              <li>• Data zobrazují pouze leady týmu <strong>CC (Call Centrum)</strong></li>
              <li>• Graf "Top 10 obchodníků" zobrazuje pouze prvních 10 obchodníků s nejvíce leady</li>
              <li>• Pro detailnější analýzu kombinujte různé filtry</li>
              <li>• Data se aktualizují v reálném čase při změně filtrů</li>
            </ul>
          </div>
        </>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Nepodařilo se načíst data. Zkuste to prosím znovu.
        </div>
      )}
    </div>
  );
}

export default ReportsCC;
