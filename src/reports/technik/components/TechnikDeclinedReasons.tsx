/**
 * Declined Reasons for Funnel Technik Report
 * No Czech diacritics - ASCII only
 */

import React from 'react';
import { IFunnelTechnikLeadItem } from '../../../types/reporting';
import { computeDeclinedReasons, DeclinedReasonItem } from '../utils/calculations';
import { formatPercentage } from '../utils/formatters';

interface Props {
  declinedReasons?: DeclinedReasonItem[];
  leads: IFunnelTechnikLeadItem[];
}

const TechnikDeclinedReasons: React.FC<Props> = ({ declinedReasons, leads }) => {
  // Use provided reasons or compute from leads
  const reasons = declinedReasons && declinedReasons.length > 0
    ? declinedReasons
    : computeDeclinedReasons(leads);

  if (reasons.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Nejcastejsi duvody zamitnuti</h3>
        <p className="text-gray-500">Nejsou zadne zamitnute leady</p>
      </div>
    );
  }

  const total = reasons.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Nejcastejsi duvody zamitnuti</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-red-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duvod
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pocet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Procento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vizualizace
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reasons.map((item, index) => (
              <tr key={index} className="hover:bg-red-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {item.reason}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.count}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatPercentage(item.percentage)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-red-50">
            <tr>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                Celkem zamitnutych
              </td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                {total}
              </td>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                100.0%
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TechnikDeclinedReasons;
