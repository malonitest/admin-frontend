/**
 * Funnel Technik Report Page
 * No Czech diacritics - ASCII only
 */

import { useState, useEffect } from 'react';
import { reportingApi } from '@/api/reportingApi';
import type { FunnelTechnikReportData } from '@/types/reporting';
import TechnikReport from '../../reports/technik/components/TechnikReport';

type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

export function NewReportsFunnelTechnik() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [data, setData] = useState<FunnelTechnikReportData | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = {};
      
      if (period === 'custom' && customDateFrom && customDateTo) {
        filters.dateFrom = customDateFrom;
        filters.dateTo = customDateTo;
      } else if (period !== 'custom') {
        filters.period = period;
      }

      const response = await reportingApi.getFunnelTechnik(filters);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodarilo se nacist data');
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
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Funnel Technik - Prehled kontroly vozidel
      </h1>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Obdobi:</span>
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
              Tyden
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === 'month' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mesic
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
              Vlastni
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Nacitani...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-3xl mr-3">?</span>
            <div>
              <p className="font-medium text-red-800">Chyba pri nacitani dat:</p>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      {!loading && !error && data && (
        <TechnikReport data={data} />
      )}
    </div>
  );
}

export default NewReportsFunnelTechnik;
