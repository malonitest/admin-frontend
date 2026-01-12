import { useEffect, useMemo, useState } from 'react';
import { axiosClient } from '@/api/axiosClient';
import { Table } from '@/components/Table';
import { formatDateTimePrague } from '@/utils/dateTime';

type PeriodType = 'day' | 'month' | 'year' | 'custom';
type RepoFilter = 'all' | 'car-backrent-monorepo' | 'admin-frontend';

interface ITReleaseCommitItem {
  id: string;
  repo: string;
  sha: string;
  date: string;
  message: string;
  url: string;
  estimatedHours: number | null;
}

interface ITReleaseResponse {
  dateFrom: string;
  dateTo: string;
  repos: string[];
  commits: ITReleaseCommitItem[];
}

const formatRepoLabel = (repo: string): string => {
  const parts = repo.split('/');
  return parts.length === 2 ? parts[1] : repo;
};

export default function NewReportsITRelease() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  const [repo, setRepo] = useState<RepoFilter>('all');

  const [data, setData] = useState<ITReleaseResponse | null>(null);

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

      if (repo && repo !== 'all') {
        params.append('repo', repo);
      } else {
        params.append('repo', 'all');
      }

      const res = await axiosClient.get(`/stats/it-release?${params.toString()}`);
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
  }, [period, repo]);

  const handleCustomSearch = () => {
    if (customDateFrom && customDateTo) {
      fetchReport();
    }
  };

  const tableRows = useMemo(() => {
    const commits = data?.commits ?? [];
    return [...commits].sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">IT release</h1>
        <button
          onClick={fetchReport}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Obnovit
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-1">Období</span>
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
          </div>

          <div className="min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Repo</label>
            <select
              value={repo}
              onChange={(e) => setRepo(e.target.value as RepoFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Všechna</option>
              <option value="car-backrent-monorepo">car-backrent-monorepo</option>
              <option value="admin-frontend">admin-frontend</option>
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

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Commity</h2>
          <p className="text-sm text-gray-500">Časová zóna zobrazení: Europe/Prague</p>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-gray-500">Načítám…</div>
          ) : (
            <Table<ITReleaseCommitItem>
              data={tableRows}
              emptyMessage="Žádná data pro vybrané filtry"
              columns={[
                {
                  key: 'date',
                  header: 'Datum',
                  render: (r) => formatDateTimePrague(r.date),
                },
                {
                  key: 'repo',
                  header: 'Repo',
                  render: (r) => formatRepoLabel(r.repo),
                },
                { key: 'message', header: 'Popisek' },
                {
                  key: 'estimatedHours',
                  header: 'Odhad (h)',
                  render: (r) => (r.estimatedHours == null ? '' : String(r.estimatedHours)),
                },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
