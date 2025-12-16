/**
 * Status Breakdown for Funnel Technik Report
 * No Czech diacritics - ASCII only
 */

import React from 'react';
import { IFunnelTechnikLeadItem } from '../../../types/reporting';
import { computeStatusBreakdown, StatusBreakdownItem } from '../utils/calculations';
import { formatPercentage } from '../utils/formatters';

interface Props {
  statusBreakdown?: StatusBreakdownItem[];
  leads: IFunnelTechnikLeadItem[];
}

const TechnikStatusBreakdown: React.FC<Props> = ({ statusBreakdown, leads }) => {
  // Use provided breakdown or compute from leads
  const breakdown = statusBreakdown && statusBreakdown.length > 0
    ? statusBreakdown
    : computeStatusBreakdown(leads);

  if (breakdown.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Rozdeleni podle statusu</h3>
        <p className="text-gray-500">Nejsou k dispozici zadna data</p>
      </div>
    );
  }

  const total = breakdown.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Rozdeleni podle statusu</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
            {breakdown.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.status}
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
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-6 py-3 text-sm font-bold text-gray-900">
                Celkem
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

export default TechnikStatusBreakdown;
