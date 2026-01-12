import { useEffect, useMemo, useState } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { Table } from '@/components/Table';

type PeriodType = 'day' | 'month' | 'year' | 'custom';

interface Dealer {
  _id: string;
  name?: string;
  email?: string;
  user?: { name?: string; email?: string };
  team?: string;
}

interface CCActivityRow {
  id: string;
  day: string; // YYYY-MM-DD (Europe/Prague)
  dealerId: string;
  dealerName: string;
  notesCount: number;
  statusChangesCount: number;
  subStatusChangesCount: number;
}

interface CCActivityResponse {
  dateFrom: string;
  dateTo: string;
  rows: CCActivityRow[];
}

export default function NewReportsCCReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [selectedDealerId, setSelectedDealerId] = useState<string>('');

  const [data, setData] = useState<CCActivityResponse | null>(null);

  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const res = await axiosClient.get('/dealers', { params: { team: 'CC', limit: 200 } });
        setDealers(res.data?.results ?? []);
      } catch (e) {
        // Non-blocking
        console.error('Failed to fetch dealers', e);
      }
    };

    fetchDealers();
  }, []);

  const fetchReport = async () => {
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

      if (selectedDealerId) {
        params.append('dealerId', selectedDealerId);
      }

      const res = await axiosClient.get(`/stats/cc-activity-report?${params.toString()}`);
      setData(res.data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Nepodařilo se načíst data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedDealerId]);

  const handleCustomSearch = () => {
    if (customDateFrom && customDateTo) {
      fetchReport();
    }
  };

  const dealerOptions = useMemo(() => {
    return dealers
      .map((d) => ({
        id: d._id,
        label: d.name || d.user?.name || d.email || d.user?.email || 'Neznámý',
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'cs'));
  }, [dealers]);

  const rows = data?.rows ?? [];

  const tableRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      // YYYY-MM-DD -> lexicographic sort works
      if (a.day !== b.day) return b.day.localeCompare(a.day);
      return a.dealerName.localeCompare(b.dealerName, 'cs');
    });
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">CC Report – aktivita obchodníků</h1>
        <button
          onClick={fetchReport}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Obnovit
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Období:</span>
          <div className="flex gap-2">
            {[
              { value: 'day', label: 'Den' },
              { value: 'month', label: 'Měsíc' },
              { value: 'year', label: 'Rok' },
              { value: 'custom', label: 'Vlastní' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value as PeriodType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p.value ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="min-w-[260px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Obchodník</label>
            <select
              value={selectedDealerId}
              onChange={(e) => setSelectedDealerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Všichni obchodníci</option>
              {dealerOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {period === 'custom' && (
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Od</label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Do</label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <button
                onClick={handleCustomSearch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                disabled={!customDateFrom || !customDateTo}
              >
                Vyhledat
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Výsledky</h2>
          <p className="text-sm text-gray-500">
            Počty za den (časová zóna: Europe/Prague)
          </p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-gray-500">Načítám…</div>
          ) : (
            <Table<CCActivityRow>
              data={tableRows}
              emptyMessage="Žádná data pro vybrané filtry"
              columns={[
                { key: 'day', header: 'Datum' },
                { key: 'dealerName', header: 'Obchodník' },
                { key: 'notesCount', header: 'Poznámky' },
                {
                  key: 'totalChanges',
                  header: 'Změny celkem',
                  render: (r) => String((r.statusChangesCount ?? 0) + (r.subStatusChangesCount ?? 0)),
                },
                { key: 'statusChangesCount', header: 'Změny statusu' },
                { key: 'subStatusChangesCount', header: 'Změny substatusu' },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
