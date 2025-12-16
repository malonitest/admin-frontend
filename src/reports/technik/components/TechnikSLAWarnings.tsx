/**
 * SLA Warnings for Funnel Technik Report
 * No Czech diacritics - ASCII only
 */

import React from 'react';
import { IFunnelTechnikLeadItem } from '../../../types/reporting';
import { computeSlaBuckets } from '../utils/calculations';
import { formatDate, getSLAColor } from '../utils/formatters';

interface SLABucket {
  label: string;
  threshold: number;
  count: number;
  leads: IFunnelTechnikLeadItem[];
}

interface Props {
  leads: IFunnelTechnikLeadItem[];
  thresholds?: number[];
}

const TechnikSLAWarnings: React.FC<Props> = ({ leads, thresholds = [3, 7] }) => {
  const buckets = computeSlaBuckets(leads, thresholds);

  // Get total leads over threshold
  const totalOverThreshold = buckets.reduce((sum: number, bucket: SLABucket) => sum + bucket.count, 0);

  const handleUniqueIdClick = (lead: IFunnelTechnikLeadItem) => {
    // Navigate to lead detail page
    window.location.href = `/leads/${lead.leadId}`;
  };

  if (totalOverThreshold === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-center">
          <span className="text-2xl mr-3">?</span>
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              SLA v poradku
            </h3>
            <p className="text-sm text-green-700">
              Vsechny leady v kontrole jsou zpracovany vcas
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          ?? SLA Upozorneni
        </h3>
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          {totalOverThreshold} leadu vyžaduje pozornost
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {buckets.map((bucket: SLABucket, index: number) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${
              bucket.count > 0
                ? 'bg-orange-50 border-orange-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">{bucket.label}</div>
                <div
                  className={`text-3xl font-bold ${
                    bucket.count > 0 ? 'text-orange-600' : 'text-gray-400'
                  }`}
                >
                  {bucket.count}
                </div>
              </div>
              <div className="text-4xl">
                {bucket.count > 0 ? '??' : '?'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {totalOverThreshold > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            ?? Doporuceni
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {buckets[1]?.count > 0 && (
              <li>• Prioritizuj leady nad 7 dnu - riziko ztráty zakaznika</li>
            )}
            {buckets[0]?.count > 0 && (
              <li>• Zkontroluj leady nad 3 dny - preventivni akce</li>
            )}
            <li>• Komunikuj s technikem o prubehu kontroly</li>
            <li>• Zvaž eskalaci u dlouho cekajiich leadu</li>
          </ul>
        </div>
      )}

      {/* Detailed List */}
      {buckets.map((bucket: SLABucket, bucketIndex: number) => {
        if (bucket.count === 0) return null;

        return (
          <div key={bucketIndex} className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Leady {bucket.label}
            </h4>
            <div className="overflow-x-auto;">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      UniqueID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Zakaznik
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Auto
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Datum predani
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Dny v kontrole
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bucket.leads.slice(0, 10).map((lead: IFunnelTechnikLeadItem, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button
                          onClick={() => handleUniqueIdClick(lead)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          #{lead.uniqueId}
                        </button>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lead.customerName}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-gray-900">
                          {lead.carBrand} {lead.carModel}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(lead.handedToTechnicianDate)}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            getSLAColor(lead.daysInTechnicianReview || 0) === 'red'
                              ? 'bg-red-100 text-red-800'
                              : getSLAColor(lead.daysInTechnicianReview || 0) === 'orange'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {lead.daysInTechnicianReview || 0} dni
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-gray-600">
                          {lead.currentStatusLabel || lead.currentStatus}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bucket.leads.length > 10 && (
                <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600 text-center">
                  ... a dalsich {bucket.leads.length - 10} leadu
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TechnikSLAWarnings;
