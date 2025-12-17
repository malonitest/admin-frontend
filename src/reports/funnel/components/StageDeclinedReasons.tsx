/**
 * Stage Declined Reasons Component
 * Duvody zamitnuti podle jednotlivych stagu
 * Bez cestiny diakritiky
 */

import type { IFunnelStageData } from '@/types/reporting';
import { formatNumber, formatPercent } from '../utils/formatters.js';

interface StageDeclinedReasonsProps {
  stages: IFunnelStageData[];
}

export function StageDeclinedReasons({ stages }: StageDeclinedReasonsProps) {
  // Pouze stages s decline reasons
  const stagesWithReasons = stages.filter(
    stage => stage.declinedReasons && stage.declinedReasons.length > 0
  );

  if (stagesWithReasons.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Duvody zamitnuti podle Stage
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stagesWithReasons.map((stage, index) => (
          <StageReasonCard key={index} stage={stage} />
        ))}
      </div>
    </div>
  );
}

interface StageReasonCardProps {
  stage: IFunnelStageData;
}

function StageReasonCard({ stage }: StageReasonCardProps) {
  const top3Reasons = (stage.declinedReasons || []).slice(0, 3);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-lg text-gray-900 mb-3">{stage.stage}</h3>
      
      {top3Reasons.length === 0 ? (
        <p className="text-sm text-gray-500 italic">Nejsou dostupna data</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 uppercase">
                Duvod
              </th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">
                Pocet
              </th>
              <th className="text-right py-2 px-2 text-xs font-medium text-gray-500 uppercase">
                %
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {top3Reasons.map((reason, idx) => (
              <tr key={idx}>
                <td className="py-2 px-2 text-gray-900">{reason.reason}</td>
                <td className="py-2 px-2 text-right text-gray-700 font-semibold">
                  {formatNumber(reason.count)}
                </td>
                <td className="py-2 px-2 text-right text-gray-700">
                  {formatPercent(reason.percentage, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
