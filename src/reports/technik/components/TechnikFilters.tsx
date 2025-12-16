/**
 * Filters for Funnel Technik Report
 * No Czech diacritics - ASCII only
 */

import React from 'react';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  selectedDeclinedReason: string | null;
  onDeclinedReasonChange: (reason: string | null) => void;
  statusOptions: string[];
  declinedReasonOptions: string[];
}

const TechnikFilters: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedDeclinedReason,
  onDeclinedReasonChange,
  statusOptions,
  declinedReasonOptions
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Filtry</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hledat (UniqueID, jmeno, VIN, auto)
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Zadej hledany vyraz..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ?
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={selectedStatus || 'all'}
            onChange={(e) => onStatusChange(e.target.value === 'all' ? null : e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Vsechny statusy</option>
            {statusOptions.map((status, index) => (
              <option key={index} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Declined Reason Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duvod zamitnuti
          </label>
          <select
            value={selectedDeclinedReason || 'all'}
            onChange={(e) =>
              onDeclinedReasonChange(e.target.value === 'all' ? null : e.target.value)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Vsechny duvody</option>
            {declinedReasonOptions.map((reason, index) => (
              <option key={index} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(searchQuery || selectedStatus || selectedDeclinedReason) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Aktivni filtry:</span>
          
          {searchQuery && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Hledani: "{searchQuery}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-2 hover:text-blue-900"
              >
                ?
              </button>
            </span>
          )}

          {selectedStatus && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Status: {selectedStatus}
              <button
                onClick={() => onStatusChange(null)}
                className="ml-2 hover:text-green-900"
              >
                ?
              </button>
            </span>
          )}

          {selectedDeclinedReason && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
              Duvod: {selectedDeclinedReason}
              <button
                onClick={() => onDeclinedReasonChange(null)}
                className="ml-2 hover:text-red-900"
              >
                ?
              </button>
            </span>
          )}

          <button
            onClick={() => {
              onSearchChange('');
              onStatusChange(null);
              onDeclinedReasonChange(null);
            }}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Vymazat vsechny filtry
          </button>
        </div>
      )}
    </div>
  );
};

export default TechnikFilters;
