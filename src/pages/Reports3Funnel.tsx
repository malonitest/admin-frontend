import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportingApi } from '@/api/reportingApi';
import type { LeadsAnalytics } from '@/types/reporting';

export default function Reports3Funnel() {
  const navigate = useNavigate();
  const [data, setData] = useState<LeadsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'30d' | '90d' | 'year'>('30d');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateTo = new Date();
      const dateFrom = new Date();
      
      if (period === '30d') {
        dateFrom.setDate(dateTo.getDate() - 30);
      } else if (period === '90d') {
        dateFrom.setDate(dateTo.getDate() - 90);
      } else {
        dateFrom.setFullYear(dateTo.getFullYear() - 1);
      }

      const response = await reportingApi.getLeadsAnalytics({
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
        groupBy: ['status', 'source'],
      });

      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba pøi naèítání dat');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadClick = (uniqueId: number) => {
    navigate(`/leads/${uniqueId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Naèítám data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('cs-CZ').format(Math.round(num));
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Funnel Report</h1>
        <p className="text-gray-600">
          Reporting databáze - cesta leadu od NEW po CONVERTED (PRIMARY KEY: uniqueId)
        </p>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod('30d')}
          className={`px-4 py-2 rounded-md ${
            period === '30d'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Posledních 30 dní
        </button>
        <button
          onClick={() => setPeriod('90d')}
          className={`px-4 py-2 rounded-md ${
            period === '90d'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Posledních 90 dní
        </button>
        <button
          onClick={() => setPeriod('year')}
          className={`px-4 py-2 rounded-md ${
            period === 'year'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Poslední rok
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Celkem Leadù</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.totalLeads)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            za vybrané období
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Konvertováno</div>
          <div className="text-3xl font-bold text-green-600">
            {formatNumber(data.convertedLeads)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.conversionRate.toFixed(1)}% míra konverze
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Prùmìrný èas konverze</div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.round(data.avgTimeToConversion)} dní
          </div>
          <div className="text-sm text-gray-500 mt-1">
            od vytvoøení po konverzi
          </div>
        </div>
      </div>

      {/* Breakdown by Status (Funnel) */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Funnel podle statusu</h2>
        <div className="space-y-4">
          {data.breakdown.map((item, idx) => {
            const percentage = (item.count / data.totalLeads) * 100;
            return (
              <div key={item._id || idx} className="border-b border-gray-200 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-lg">{item._id || 'Nezaøazeno'}</div>
                  <div className="text-sm text-gray-600">
                    {percentage.toFixed(1)}% všech leadù
                  </div>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <div className="text-2xl font-bold">{formatNumber(item.count)} leadù</div>
                  <div className="text-sm text-gray-500">
                    prùmìr {Math.round(item.avgTimeToConversion)} dní
                  </div>
                </div>
                <div className="bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-600 h-3 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown by Source */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Rozdìlení podle zdroje</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['WEB', 'APP', 'SALES', 'OS'].map((source) => {
            const sourceData = data.breakdown.find((item) => item._id === source);
            const count = sourceData?.count || 0;
            const percentage = (count / data.totalLeads) * 100;
            
            return (
              <div key={source} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{source}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatNumber(count)}
                </div>
                <div className="text-sm text-gray-500">
                  {percentage.toFixed(1)}% leadù
                </div>
                <div className="mt-2 bg-gray-300 rounded-full h-1.5">
                  <div
                    className="bg-red-600 h-1.5 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Leads Table with topItems from API */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Leady v aktuálním funnelu (PRIMARY KEY: uniqueId)</h2>
        {data.topItems && data.topItems.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UniqueID (6-digit)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zákazník
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zdroj
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Èástka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Poèet dnù
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topItems.map((lead) => (
                    <tr key={lead.uniqueId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleLeadClick(lead.uniqueId)}
                          className="text-red-600 hover:text-red-900 font-medium hover:underline"
                        >
                          {lead.uniqueId}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.source}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(lead.requestedAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.timeToConversion ? `${Math.round(lead.timeToConversion)} dní` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ?? Kliknìte na uniqueId (6-digit) pro zobrazení detailu leadu
            </p>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Žádné leady k zobrazení pro vybrané období
          </div>
        )}
      </div>
    </div>
  );
}
