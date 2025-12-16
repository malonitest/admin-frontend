import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportingApi } from '@/api/reportingApi';
import type { LeasesAnalytics } from '@/types/reporting';

export default function Reports3Cars() {
  const navigate = useNavigate();
  const [data, setData] = useState<LeasesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'30d' | '90d' | 'year'>('year');

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

      const response = await reportingApi.getLeasesAnalytics({
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
        groupBy: ['status'],
      });

      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba pøi naèítání dat');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadClick = (leadUniqueId: number) => {
    navigate(`/leads/${leadUniqueId}`);
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
        <h1 className="text-2xl font-bold text-gray-900">Statistiky aut</h1>
        <p className="text-gray-600">
          Reporting databáze - pøehled vozového parku (FOREIGN KEY: leadUniqueId)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Celkem Leasù</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(data.totalLeases)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            za vybrané období
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Aktivní Leasy</div>
          <div className="text-3xl font-bold text-green-600">
            {formatNumber(data.activeLeases)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {((data.activeLeases / data.totalLeases) * 100).toFixed(1)}% všech
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Celková hodnota</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(data.totalValue)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            suma všech leasù
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Zaplaceno celkem</div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(data.totalPaid)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {((data.totalPaid / data.totalValue) * 100).toFixed(1)}% hodnoty
          </div>
        </div>
      </div>

      {/* Breakdown by Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Rozdìlení podle statusu</h2>
        <div className="space-y-4">
          {data.breakdown.map((item) => {
            const percentage = (item.count / data.totalLeases) * 100;
            const statusColors: Record<string, string> = {
              OPEN: 'bg-green-600',
              LATE: 'bg-red-600',
              PAIDBACK: 'bg-blue-600',
              AWAITS_PAYOUT: 'bg-yellow-600',
              AWAITS_PAYMENT_METHOD: 'bg-orange-600',
            };
            const color = statusColors[item._id || ''] || 'bg-gray-600';

            return (
              <div key={item._id || 'unknown'} className="border-b border-gray-200 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-lg">{item._id || 'Nezaøazeno'}</div>
                  <div className="text-sm text-gray-600">
                    {percentage.toFixed(1)}% všech leasù
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <div className="text-sm text-gray-600">Poèet</div>
                    <div className="text-xl font-bold">{formatNumber(item.count)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Celková hodnota</div>
                    <div className="text-xl font-bold">{formatCurrency(item.totalValue)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Zaplaceno</div>
                    <div className="text-xl font-bold">{formatCurrency(item.totalPaid)}</div>
                  </div>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Active Leases Table with topItems from API */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Aktivní leasy (FOREIGN KEY: leadUniqueId)</h2>
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
                      Lease ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zákazník
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hodnota leasingu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zaplaceno
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zbývá
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.topItems.map((lease) => {
                    return (
                      <tr key={lease.uniqueId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleLeadClick(lease.leadUniqueId)}
                            className="text-red-600 hover:text-red-900 font-medium hover:underline"
                          >
                            {lease.leadUniqueId}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lease.uniqueId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lease.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {lease.carBrand} {lease.carModel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            lease.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                            lease.status === 'LATE' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {lease.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(lease.leaseAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                          {formatCurrency(lease.totalPaid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(lease.remainingBalance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ?? Kliknìte na leadUniqueId (6-digit) pro zobrazení detailu souvisejícího leadu
            </p>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Žádné aktivní leasy k zobrazení pro vybrané období
          </div>
        )}
      </div>
    </div>
  );
}
