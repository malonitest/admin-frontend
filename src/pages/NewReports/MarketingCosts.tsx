/**
 * Marketing Costs Management Page
 * Manage monthly marketing expenses and view ROI
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingCostApi, MarketingCost, ROIResult } from '../../api/marketingApi';
import MarketingCostForm from '../../components/MarketingCostForm';

const MarketingCosts: React.FC = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<MarketingCost | null>(null);
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSource, setSelectedSource] = useState<string>('');

  // Fetch costs
  const { data: costsData, isLoading: costsLoading } = useQuery({
    queryKey: ['marketing-costs', dateFrom, dateTo, selectedSource],
    queryFn: () =>
      marketingCostApi.getCosts({
        dateFrom,
        dateTo,
        source: selectedSource || undefined,
        sortBy: 'month:desc',
        limit: 100,
      }),
  });

  // Fetch ROI
  const { data: roiData, isLoading: roiLoading } = useQuery({
    queryKey: ['marketing-roi', dateFrom, dateTo],
    queryFn: () => marketingCostApi.calculateROI({ dateFrom, dateTo }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (costId: string) => marketingCostApi.deleteCost(costId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-costs'] });
      queryClient.invalidateQueries({ queryKey: ['marketing-roi'] });
    },
  });

  const handleEdit = (cost: MarketingCost) => {
    setEditingCost(cost);
    setIsFormOpen(true);
  };

  const handleDelete = async (costId: string) => {
    if (window.confirm('Opravdu chcete smazat tento zaznam?')) {
      await deleteMutation.mutateAsync(costId);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCost(null);
    queryClient.invalidateQueries({ queryKey: ['marketing-costs'] });
    queryClient.invalidateQueries({ queryKey: ['marketing-roi'] });
  };

  const sources = ['Google Ads', 'Facebook', 'Instagram', 'Seznam', 'Ostatni'];

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(amount);

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long' });
  };

  const getROIColor = (roi: number) => {
    if (roi >= 300) return 'text-green-600';
    if (roi >= 100) return 'text-blue-600';
    if (roi >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketingov� n�klady</h1>
          <p className="mt-1 text-sm text-gray-600">
            Sprava mesicnich vydaju za marketing a vypocet ROI
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCost(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Pridat naklad
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Od</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Do</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zdroj</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Vsechny zdroje</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ROI Overview */}
      {roiData && !roiLoading && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ROI prehled</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Zdroj</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Naklady</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Prijmy</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">ROI</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">ROAS</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">CPL</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">CPA</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Konverze</th>
                </tr>
              </thead>
              <tbody>
                {roiData.map((roi: ROIResult) => (
                  <tr key={roi.source} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{roi.source}</td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatCurrency(roi.totalCost)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatCurrency(roi.totalRevenue)}
                    </td>
                    <td className={`text-right py-3 px-4 font-semibold ${getROIColor(roi.roi)}`}>
                      {roi.roi.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">{roi.roas.toFixed(2)}x</td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatCurrency(roi.cpl)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {formatCurrency(roi.cpa)}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {roi.conversions}/{roi.leads} ({roi.conversionRate.toFixed(1)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Costs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Mesicni naklady</h2>
        </div>
        <div className="overflow-x-auto">
          {costsLoading ? (
            <div className="p-6 text-center text-gray-500">Nacitani...</div>
          ) : costsData && costsData.results.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Mesic</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Zdroj</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Naklad</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Poznamka</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Akce</th>
                </tr>
              </thead>
              <tbody>
                {costsData.results.map((cost: MarketingCost) => (
                  <tr key={cost.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{formatMonth(cost.month)}</td>
                    <td className="py-3 px-4 text-gray-900">{cost.source}</td>
                    <td className="text-right py-3 px-4 font-medium text-gray-900">
                      {formatCurrency(cost.cost)}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {cost.notes || '-'}
                    </td>
                    <td className="text-right py-3 px-4">
                      <button
                        onClick={() => handleEdit(cost)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Upravit
                      </button>
                      <button
                        onClick={() => handleDelete(cost.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Smazat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Zadna data pro vybrane obdobi
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <MarketingCostForm
          cost={editingCost}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCost(null);
          }}
        />
      )}
    </div>
  );
};

export default MarketingCosts;
