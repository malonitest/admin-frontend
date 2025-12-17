/**
 * Marketing Cost Form Modal
 * Form for adding/editing monthly marketing expenses
 */

import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { marketingCostApi, MarketingCost, CreateMarketingCost } from '../api/marketingApi';

interface Props {
  cost: MarketingCost | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const MarketingCostForm: React.FC<Props> = ({ cost, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<CreateMarketingCost>({
    source: cost?.source || 'Google Ads',
    month: cost?.month.split('T')[0] || new Date().toISOString().split('T')[0],
    cost: cost?.cost || 0,
    currency: cost?.currency || 'CZK',
    notes: cost?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: (data: CreateMarketingCost) => marketingCostApi.createCost(data),
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Nepodaøilo se uložit náklad' });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { costId: string; updateData: any }) =>
      marketingCostApi.updateCost(data.costId, data.updateData),
    onSuccess: () => {
      onSuccess();
    },
    onError: (error: any) => {
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'Nepodaøilo se aktualizovat náklad' });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.source) newErrors.source = 'Vyberte zdroj';
    if (!formData.month) newErrors.month = 'Zadejte mìsíc';
    if (formData.cost < 0) newErrors.cost = 'Náklad musí být kladné èíslo';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (cost) {
      // Update existing
      await updateMutation.mutateAsync({
        costId: cost.id,
        updateData: {
          cost: formData.cost,
          notes: formData.notes,
        },
      });
    } else {
      // Create new
      await createMutation.mutateAsync(formData);
    }
  };

  const handleChange = (field: keyof CreateMarketingCost, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const sources = ['Google Ads', 'Facebook', 'Instagram', 'Seznam', 'Ostatní'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {cost ? 'Upravit náklad' : 'Pøidat náklad'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zdroj <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              disabled={!!cost} // Can't change source when editing
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            {errors.source && <p className="mt-1 text-sm text-red-600">{errors.source}</p>}
          </div>

          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mìsíc <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              value={formData.month.substring(0, 7)} // YYYY-MM format
              onChange={(e) => handleChange('month', e.target.value + '-01')}
              disabled={!!cost} // Can't change month when editing
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            {errors.month && <p className="mt-1 text-sm text-red-600">{errors.month}</p>}
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Náklad (Kè) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.cost}
              onChange={(e) => handleChange('cost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="napø. 50000"
            />
            {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poznámka (volitelné)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="napø. Kampaò zimní výprodej"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Ukládání...'
                : cost
                ? 'Uložit'
                : 'Pøidat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarketingCostForm;
