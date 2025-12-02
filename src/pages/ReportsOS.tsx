import { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';

// Types
interface OSReportItem {
  id: string;
  uniqueId: number;
  receivedDate: string;
  author: string;
  authorId: string;
  totalRequests: number;
  convertedRequests: number;
}

interface OSReportData {
  items: OSReportItem[];
  totalRequests: number;
  totalConverted: number;
  conversionRate: number;
}

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

const ReportsOS: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<OSReportData | null>(null);
  
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

      const response = await axiosClient.get(`/stats/os-report?${params.toString()}`);
      setReportData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data reportu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period, customDateFrom, customDateTo]);

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('cs-CZ');
    } catch {
      return dateString;
    }
  };

  const getPeriodLabel = (): string => {
    const { dateFrom, dateTo } = getDateRange();
    return `${dateFrom.toLocaleDateString('cs-CZ')} - ${dateTo.toLocaleDateString('cs-CZ')}`;
  };

  const getConversionColor = (percent: number): string => {
    if (percent >= 20) return 'text-green-600 font-bold';
    if (percent >= 10) return 'text-orange-500 font-bold';
    return 'text-red-500 font-bold';
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Reporty OS (Obchodní síť)
      </h1>

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
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
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

          <button
            onClick={fetchReportData}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Aktualizovat
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-2">
          Vybrané období: {getPeriodLabel()}
        </p>
      </div>

      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm">Obchodníků OS</span>
            </div>
            <div className="text-3xl font-bold text-blue-900">{reportData.items.length}</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm">Celkem žádostí</span>
            </div>
            <div className="text-3xl font-bold text-orange-900">{reportData.totalRequests}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Konvertováno</span>
            </div>
            <div className="text-3xl font-bold text-green-900">{reportData.totalConverted}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm">Konverzní poměr</span>
            </div>
            <div className="text-3xl font-bold text-purple-900">{reportData.conversionRate.toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Data Table */}
      {!loading && reportData && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Datum přijetí</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Autor (Obchodník)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Počet žádostí</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Konvertováno</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Konverzní %</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Žádná data pro vybrané období
                    </td>
                  </tr>
                ) : (
                  reportData.items.map((item, index) => {
                    const conversionPercent = item.totalRequests > 0 
                      ? (item.convertedRequests / item.totalRequests) * 100
                      : 0;
                    
                    return (
                      <tr 
                        key={item.authorId}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.receivedDate)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.author}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.totalRequests}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.convertedRequests > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.convertedRequests}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right text-sm ${getConversionColor(conversionPercent)}`}>
                          {conversionPercent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Help / Notes Section */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Poznámky k reportům OS</h2>
        </div>
        
        <ul className="space-y-2 text-sm text-gray-700 mb-4">
          <li><strong>ID</strong> - Pořadové číslo obchodníka v reportu (seřazeno podle počtu žádostí)</li>
          <li><strong>Datum přijetí</strong> - Datum první žádosti od daného obchodníka ve vybraném období</li>
          <li><strong>Autor</strong> - Jméno obchodníka z týmu OS (Obchodní síť / terénní obchodníci)</li>
          <li><strong>Počet žádostí</strong> - Celkový počet leadů vytvořených nebo přidělených obchodníkovi</li>
          <li><strong>Konvertováno</strong> - Počet leadů, které byly úspěšně konvertovány na smlouvu</li>
          <li><strong>Konverzní %</strong> - Procentuální úspěšnost konverze (konvertováno / celkem × 100)</li>
        </ul>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">💡 Jak používat tento report:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Vyberte časové období pomocí přepínačů (Den/Týden/Měsíc/Rok) nebo zadejte vlastní rozsah.</li>
            <li>Tabulka zobrazuje výkon jednotlivých obchodníků OS za vybrané období.</li>
            <li>Zelené hodnoty konverzního % (≥20%) značí vynikající výkon, oranžové (10-20%) průměrný, červené (&lt;10%) slabý.</li>
            <li>Obchodníci jsou seřazeni podle celkového počtu žádostí (od nejvíce aktivního).</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ReportsOS;
