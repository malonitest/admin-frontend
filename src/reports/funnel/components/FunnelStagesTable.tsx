/**
 * Funnel Stages Table Component
 * Detailni tabulka s casovymi metrikami
 * Bez cestiny diakritiky
 */

import type { IFunnelStageData } from '@/types/reporting';
import { formatNumber, formatPercent, computeDropOff } from '../utils/formatters';

interface FunnelStagesTableProps {
  stages: IFunnelStageData[];
  averageTimeInStages: Record<string, number>;
}

export function FunnelStagesTable({ stages, averageTimeInStages }: FunnelStagesTableProps) {
  const dropOffs = computeDropOff(stages);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Stages Detail</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pocet
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                % z Celku
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prumerne Dny
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Drop-off (Pocet)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Drop-off (%)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stages.map((stage, index) => {
              const dropOff = dropOffs[index];
              const avgDays = averageTimeInStages[stage.stage] || 0;
              
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stage.stage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 font-semibold">
                    {formatNumber(stage.count)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                    {formatPercent(stage.percentage)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                    {avgDays > 0 ? avgDays.toFixed(1) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                    {dropOff ? formatNumber(dropOff.dropCount) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                    {dropOff ? (
                      <span className={dropOff.dropRate > 50 ? 'text-red-600 font-bold' : ''}>
                        {formatPercent(dropOff.dropRate, 1)}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
