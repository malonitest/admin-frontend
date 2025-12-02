import { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';

// Types
interface SessionData {
  loginAt: string;
  logoutAt: string | null;
  duration: number | null;
}

interface DealerSessionStats {
  dealerId: string;
  dealerName: string;
  sessions: SessionData[];
  totalSessions: number;
  totalDuration: number;
}

interface SessionStats {
  byDealer: DealerSessionStats[];
  totalSessions: number;
  totalDuration: number;
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

const LogsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);

  // Period filters
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');

  // Selected dealer for detail view
  const [selectedDealer, setSelectedDealer] = useState<string>('');

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

  const fetchSessionStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const { dateFrom, dateTo } = getDateRange();

      const params = new URLSearchParams();
      params.append('dateFrom', dateFrom.toISOString());
      params.append('dateTo', dateTo.toISOString());

      const response = await axiosClient.get(`/sessions/stats?${params.toString()}`);
      setSessionStats(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  useEffect(() => {
    fetchSessionStats();
  }, [period, customDateFrom, customDateTo]);

  const getPeriodLabel = (): string => {
    const { dateFrom, dateTo } = getDateRange();
    return `${dateFrom.toLocaleDateString('cs-CZ')} - ${dateTo.toLocaleDateString('cs-CZ')}`;
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = (minutes: number | null): string => {
    if (minutes === null || minutes === undefined) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatTotalDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} minut`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours} hodin ${mins} minut`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} dní ${remainingHours}h ${mins}min`;
  };

  // Filter data by selected dealer
  const filteredData = sessionStats?.byDealer.filter(
    (dealer) => !selectedDealer || dealer.dealerId === selectedDealer
  ) || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Logy přihlášení obchodníků</h1>

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

          <button
            onClick={fetchSessionStats}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Aktualizovat
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-2">Vybrané období: {getPeriodLabel()}</p>
      </div>

      {/* Summary Cards */}
      {sessionStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm">Aktivních obchodníků</span>
            </div>
            <div className="text-3xl font-bold text-blue-900">{sessionStats.byDealer.length}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm">Celkem přihlášení</span>
            </div>
            <div className="text-3xl font-bold text-green-900">{sessionStats.totalSessions}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 mb-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">Celkový čas v systému</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{formatTotalDuration(sessionStats.totalDuration)}</div>
          </div>
        </div>
      )}

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

      {/* Data Table */}
      {!loading && sessionStats && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Přehled přihlášení obchodníků</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jméno obchodníka</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Čas přihlášení</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Čas odhlášení</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Délka session</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Celkový čas</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Počet přihlášení</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Žádná data pro vybrané období. Záznamy se začnou zobrazovat po přihlášení obchodníků.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((dealer) => (
                    <>
                      {/* Main dealer row with totals */}
                      <tr key={dealer.dealerId} className="bg-blue-50 font-medium">
                        <td className="px-4 py-3 text-sm text-gray-900">{dealer.dealerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">-</td>
                        <td className="px-4 py-3 text-sm text-gray-600">-</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">-</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {formatTotalDuration(dealer.totalDuration)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {dealer.totalSessions}×
                          </span>
                        </td>
                      </tr>
                      {/* Individual sessions */}
                      {dealer.sessions.slice(0, 10).map((session, idx) => (
                        <tr key={`${dealer.dealerId}-${idx}`} className="bg-white hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-400 pl-8">└─</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{formatDateTime(session.loginAt)}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {session.logoutAt ? (
                              formatDateTime(session.logoutAt)
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                Aktivní
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">
                            {formatDuration(session.duration)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-400">-</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-400">-</td>
                        </tr>
                      ))}
                      {dealer.sessions.length > 10 && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-2 text-sm text-gray-500 text-center">
                            ... a dalších {dealer.sessions.length - 10} přihlášení
                          </td>
                        </tr>
                      )}
                    </>
                  ))
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
          <h2 className="text-lg font-semibold text-gray-900">Poznámky k logům přihlášení</h2>
        </div>

        <ul className="space-y-2 text-sm text-gray-700 mb-4">
          <li><strong>Jméno obchodníka</strong> - Identifikace obchodníka (modré řádky zobrazují souhrn)</li>
          <li><strong>Čas přihlášení</strong> - Datum a čas kdy se obchodník přihlásil do systému</li>
          <li><strong>Čas odhlášení</strong> - Datum a čas odhlášení (zelená značka "Aktivní" = stále přihlášen)</li>
          <li><strong>Délka session</strong> - Doba trvání jednotlivého přihlášení</li>
          <li><strong>Celkový čas</strong> - Součet všech session za vybrané období (pouze v souhrnném řádku)</li>
          <li><strong>Počet přihlášení</strong> - Kolikrát se obchodník přihlásil za vybrané období</li>
        </ul>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">💡 Jak používat tyto logy:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Vyberte časové období pro analýzu aktivity obchodníků</li>
            <li>Použijte filtr obchodníka pro zobrazení detailu konkrétní osoby</li>
            <li>Modré řádky zobrazují celkový souhrn za obchodníka</li>
            <li>Bílé řádky pod nimi zobrazují jednotlivá přihlášení (max. 10 posledních)</li>
            <li>Zelená značka "Aktivní" znamená, že session stále běží (obchodník je přihlášen)</li>
          </ol>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mt-4">
          <h3 className="font-medium text-yellow-900 mb-2">⚠️ Poznámka:</h3>
          <p className="text-sm text-yellow-800">
            Logy přihlášení se začnou zaznamenávat od aktivace této funkce. Historická data před aktivací nejsou k dispozici.
            Čas odhlášení se zaznamenává pouze při explicitním odhlášení - pokud uživatel pouze zavře prohlížeč, session zůstane označená jako "Aktivní".
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
