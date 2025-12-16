import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportingApi } from '@/api/reportingApi';
import type { DailySummaryResponse, LeadsAnalytics } from '@/types/reporting';

export default function Reports3KPI() {
  const navigate = useNavigate();
  const [data, setData] = useState<DailySummaryResponse | null>(null);
  const [leadsData, setLeadsData] = useState<LeadsAnalytics | null>(null);
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
      } else if (period === 'year') {
        dateFrom.setFullYear(dateTo.getFullYear() - 1);
      }

      const dateFromStr = dateFrom.toISOString().split('T')[0];
      const dateToStr = dateTo.toISOString().split('T')[0];

      // Naèteme daily summary pro KPI karty
      const summaryResponse = await reportingApi.getDailySummary({
        dateFrom: dateFromStr,
        dateTo: dateToStr,
      });

      // Naèteme leads analytics pro tabulku s topItems
      const leadsResponse = await reportingApi.getLeadsAnalytics({
        dateFrom: dateFromStr,
        dateTo: dateToStr,
        groupBy: ['status'],
      });

      setData(summaryResponse);
      setLeadsData(leadsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba pøi naèítání dat');
    } finally {
      setLoading(false);
    }
  };

  // ? ZMÌNA: Navigate pomocí uniqueId (6-digit number) místo leadId (ObjectId)
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
        <h1 className="text-2xl font-bold text-gray-900">KPI Investor</h1>
        <p className="text-gray-600">
          Reporting databáze - rychlé pøedpoèítané metriky (PRIMARY KEY: uniqueId)
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Nové Leady</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.totals.newLeads)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {data.period.days} dní
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Konverze</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.totals.convertedLeads)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.averages.conversionRate.toFixed(1)}% míra konverze
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Aktivní Leasy</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.averages.activeLeases)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            prùmìr za období
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Celkový Pøíjem</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.totals.totalRevenue)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {formatCurrency(data.averages.dailyRevenue)} / den
          </div>
        </div>
      </div>

      {/* Time series chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Vývoj v èase</h2>
        <div className="space-y-4">
          {data.timeSeries.map((day) => (
            <div key={day.date} className="border-b border-gray-200 pb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium">
                  {new Date(day.date).toLocaleDateString('cs-CZ')}
                </div>
                <div className="text-sm text-gray-600">
                  {day.conversionRate.toFixed(1)}% konverze
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Leady</div>
                  <div className="font-medium">{day.newLeads}</div>
                </div>
                <div>
                  <div className="text-gray-600">Konverze</div>
                  <div className="font-medium">{day.convertedLeads}</div>
                </div>
                <div>
                  <div className="text-gray-600">Aktivní</div>
                  <div className="font-medium">{day.activeLeases}</div>
                </div>
                <div>
                  <div className="text-gray-600">Pøíjem</div>
                  <div className="font-medium">{formatCurrency(day.totalRevenue)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real Leads Table with topItems from LeadsAnalytics API */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Top 10 nejnovìjších leadù (PRIMARY KEY: uniqueId)</h2>
        {leadsData && leadsData.topItems && leadsData.topItems.length > 0 ? (
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
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Èástka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zdroj
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leadsData.topItems.map((lead) => (
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(lead.createdAt).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lead.timeToConversion ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(lead.requestedAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lead.source}
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
