import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosClient } from '@/api/axiosClient';

type CollectionLeadRow = {
  id: string;
  uniqueId?: number;
  customerName?: string;
  daysOverdue?: number | null;
  currentDebt?: number;
  notes?: string | null;
};

const formatMoneyCz = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return `${new Intl.NumberFormat('cs-CZ').format(value)} Kč`;
};

export default function Collection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<CollectionLeadRow[]>([]);

  const fetchRows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get<CollectionLeadRow[]>('/leads/collection', { params: { limit: 500 } });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Failed to load collection leads:', e);
      setError('Nepodařilo se načíst collection');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const da = typeof a.daysOverdue === 'number' ? a.daysOverdue : -1;
      const db = typeof b.daysOverdue === 'number' ? b.daysOverdue : -1;
      return db - da;
    });
    return copy;
  }, [rows]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Collection</h1>
        <button
          type="button"
          onClick={fetchRows}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
          disabled={loading}
        >
          Obnovit
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow">
        <div className="text-sm text-gray-600">Leady po splatnosti (řazeno dle nejvyššího počtu dní od poslední přijaté platby).</div>
      </div>

      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow">
        {loading ? (
          <div className="text-sm text-gray-700">Načítám…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : sorted.length === 0 ? (
          <div className="text-sm text-gray-600">Žádné leady k vymáhání.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2 pr-4">Unique ID</th>
                  <th className="py-2 pr-4">Jméno</th>
                  <th className="py-2 pr-4">Dní po splatnosti</th>
                  <th className="py-2 pr-4">Celkový dluh</th>
                  <th className="py-2 pr-4">Poznámky</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-4">
                      <Link to={`/leads/${row.id}/v2`} className="text-blue-600 hover:underline">
                        #{row.uniqueId ?? '-'}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{row.customerName ?? '-'}</td>
                    <td className="py-2 pr-4">{typeof row.daysOverdue === 'number' ? row.daysOverdue : '-'}</td>
                    <td className="py-2 pr-4">{formatMoneyCz(row.currentDebt)}</td>
                    <td className="py-2 pr-4 max-w-[520px] truncate" title={row.notes ?? undefined}>
                      {row.notes ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
