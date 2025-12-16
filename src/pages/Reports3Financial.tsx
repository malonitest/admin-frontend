import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportingApi } from '@/api/reportingApi';
import type { FinancialAnalytics } from '@/types/reporting';

export default function Reports3Financial() {
  const navigate = useNavigate();
  const [data, setData] = useState<FinancialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'year'>('year');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const dateTo = new Date();
      const dateFrom = new Date();
      
      if (period === 'month') {
        dateFrom.setMonth(dateTo.getMonth() - 1);
      } else {
        dateFrom.setFullYear(dateTo.getFullYear() - 1);
      }

      const response = await reportingApi.getFinancialAnalytics({
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
        groupBy: ['type'],
      });

      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba pøi naèítání dat');
    } finally {
      setLoading(false);
    }
  };

  // ? ZMÌNA: Navigate pomocí leadUniqueId (6-digit number) místo leadId (ObjectId)
  const handleLeadClick = (leadUniqueId?: number) => {
    if (leadUniqueId) {
      navigate(`/leads/${leadUniqueId}`);
    }
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

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('cs-CZ').format(Math.round(num));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finanèní P/L Report</h1>
        <p className="text-gray-600">
          Reporting databáze - finanèní pøehled (FOREIGN KEY: leadUniqueId)
        </p>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setPeriod('month')}
          className={`px-4 py-2 rounded-md ${
            period === 'month'
              ? 'bg-red-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Poslední mìsíc
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
          <div className="text-sm text-gray-600 mb-1">Celkové Transakce</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.totalTransactions)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            úspìšné + neúspìšné
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Celkový Objem</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.totalAmount)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {data.successRate.toFixed(1)}% úspìšnost
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Úspìšné Transakce</div>
          <div className="text-3xl font-bold text-green-600">
            {formatNumber(data.successfulTransactions)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            z {formatNumber(data.totalTransactions)} celkem
          </div>
        </div>
      </div>

      {/* Breakdown by Type */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Rozdìlení podle typu</h2>
        <div className="space-y-4">
          {data.breakdown.map((item) => (
            <div key={item._id || 'unknown'} className="border-b border-gray-200 pb-3">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-lg">{item._id || 'Nezaøazeno'}</div>
                <div className="text-sm text-gray-600">
                  {((item.count / data.totalTransactions) * 100).toFixed(1)}% transakcí
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Poèet</div>
                  <div className="text-xl font-bold">{formatNumber(item.count)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Celková èástka</div>
                  <div className="text-xl font-bold">{formatCurrency(item.totalAmount)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Prùmìr</div>
                  <div className="text-xl font-bold">{formatCurrency(item.avgAmount)}</div>
                </div>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${(item.count / data.totalTransactions) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real Transactions Table with topItems from API */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Poslední transakce (FOREIGN KEY: leadUniqueId)</h2>
        {data.topItems && data.topItems.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead UniqueID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zákazník
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Èástka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datum
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topItems.map((txn) => (
                    <tr key={txn.transactionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {txn.leadUniqueId ? (
                          <button
                            onClick={() => handleLeadClick(txn.leadUniqueId)}
                            className="text-red-600 hover:text-red-900 font-medium hover:underline"
                          >
                            {txn.leadUniqueId}
                          </button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {txn.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {txn.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          txn.isSuccessful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {txn.isSuccessful ? 'Úspìšné' : 'Neúspìšné'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(txn.createdAt).toLocaleDateString('cs-CZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ?? Kliknìte na leadUniqueId (6-digit) pro zobrazení detailu souvisejícího leadu
            </p>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Žádné transakce k zobrazení pro vybrané období
          </div>
        )}
      </div>
    </div>
  );
}
