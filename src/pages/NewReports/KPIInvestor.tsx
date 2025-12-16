import { useState, useEffect } from 'react';
import { axiosClient } from '@/api/axiosClient';

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

export function NewReportsKPIInvestor() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (period === 'custom' && customDateFrom && customDateTo) {
        params.append('dateFrom', customDateFrom);
        params.append('dateTo', customDateTo);
      } else if (period !== 'custom') {
        params.append('period', period);
      }

      const response = await axiosClient.get(`/stats/kpi-investor?${params.toString()}`);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodaøilo se naèíst data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchData();
    }
  }, [period]);

  const handleCustomDateSearch = () => {
    if (customDateFrom && customDateTo) {
      fetchData();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">KPI Investor Report</h1>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Období:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'day' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Den
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'week' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Týden
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'month' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mìsíc
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'year' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rok
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'custom' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Vlastní
            </button>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
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
              <button
                onClick={handleCustomDateSearch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Hledat
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">Naèítání...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Chyba pøi naèítání dat:</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">KPI Data</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default NewReportsKPIInvestor;
