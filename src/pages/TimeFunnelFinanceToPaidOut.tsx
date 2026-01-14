import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';
import { formatDateTimePrague, tryParseApiDate } from '@/utils/dateTime';

interface Dealer {
  _id: string;
  name?: string;
  email?: string;
  user?: { name: string; email: string };
}

interface TimeFunnelRow {
  leadId: string;
  uniqueId: number;
  createdAt: string;
  financeAt: string;
  paidOutAt?: string | null;
  paidOutBy?: { _id: string; name?: string; email?: string } | null;
  durationMinutes?: number | null;
  ageMinutes?: number | null;
}

interface PaginatedResponse<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

const toDateInputValue = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return '-';
  const d = tryParseApiDate(dateString);
  if (!d) return String(dateString);
  return formatDateTimePrague(d);
};

const formatDuration = (minutes?: number | null): string => {
  if (minutes === null || minutes === undefined) return '-';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}min`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h ${mins}min`;
};

export default function TimeFunnelFinanceToPaidOutPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dateFrom, setDateFrom] = useState<string>(() => toDateInputValue(monthStart));
  const [dateTo, setDateTo] = useState<string>(() => toDateInputValue(now));
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedResponse<TimeFunnelRow> | null>(null);

  const fetchDealers = async () => {
    try {
      const response = await axiosClient.get('/dealers', { params: { limit: 100 } });
      setDealers(response.data.results || []);
    } catch (e) {
      console.error('Failed to fetch dealers:', e);
    }
  };

  const fetchRows = async () => {
    setLoading(true);
    setError(null);

    try {
      const dateFromIso = dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : undefined;
      const dateToIso = dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined;

      const response = await axiosClient.get<PaginatedResponse<TimeFunnelRow>>('/leads/timeFunnel/financeToPaidOut', {
        params: {
          dateFrom: dateFromIso,
          dateTo: dateToIso,
          dealerId: selectedDealerId || undefined,
          limit: 200,
          page: 1,
          sortBy: 'financeAt:desc',
        },
      });

      setData(response.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nepodařilo se načíst data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  useEffect(() => {
    fetchRows();
  }, [dateFrom, dateTo, selectedDealerId]);

  const summary = useMemo(() => {
    const rows = data?.results ?? [];
    const durations = rows
      .map((r) => r.durationMinutes)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
      .sort((a, b) => a - b);

    const count = durations.length;
    const avg = count ? Math.round(durations.reduce((a, b) => a + b, 0) / count) : null;
    const median = count ? durations[Math.floor((count - 1) / 2)] : null;

    return { count, avg, median };
  }, [data]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Časový funnel – FŘ → Vyplaceno</h1>
      <p className="text-sm text-gray-600 mt-1">
        Jak číst: každý řádek je lead, který měl status „Předáno k vyplacení“ (FINAL_APPROVAL) v zvoleném období. “Doba” je čas od
        prvního „Předáno k vyplacení“ po první “Konvertováno / Vyplaceno” (CONVERTED). Pokud ještě není vyplaceno, zobrazuje se stáří od
        “Předáno k vyplacení” do teď.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Od (FŘ)</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Do (FŘ)</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Obchodník (kdo vyplatil)</label>
          <select
            value={selectedDealerId}
            onChange={(e) => setSelectedDealerId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Všichni</option>
            {dealers.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name || d.user?.name || d.email || d.user?.email || d._id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-700">
        <span className="mr-4">
          Dokončeno (Vyplaceno): <span className="font-semibold">{summary.count}</span>
        </span>
        <span className="mr-4">
          Průměrná doba: <span className="font-semibold">{formatDuration(summary.avg)}</span>
        </span>
        <span>
          Medián: <span className="font-semibold">{formatDuration(summary.median)}</span>
        </span>
      </div>

      <div className="mt-6">
        {loading && <div className="text-gray-600">Načítám…</div>}
        {error && <div className="text-red-600">{error}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unikátní ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vyplatil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vytvořeno</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Předáno k vyplacení</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vyplaceno</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doba</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(data?.results ?? []).map((row) => (
                  <tr key={row.leadId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <Link to={`/leads/${row.leadId}/v2`} className="text-blue-600 hover:underline">
                        {row.uniqueId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{row.paidOutBy?.name || row.paidOutBy?.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(row.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(row.financeAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(row.paidOutAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatDuration(row.durationMinutes ?? row.ageMinutes)}</td>
                  </tr>
                ))}

                {(data?.results?.length ?? 0) === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-sm text-gray-600" colSpan={6}>
                      V tomto období nejsou žádné leady pro funnel FŘ → Vyplaceno.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
