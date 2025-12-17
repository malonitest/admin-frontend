/**
 * Action Items Component
 * Automaticky generovane doporuceni
 * Bez cestiny diakritiky
 */

import type { IFunnelReportData } from '@/types/reporting';
import { computeDropOff, getLargestDropOff, generateActionItems } from '../utils/formatters.js';

interface ActionItemsProps {
  data: IFunnelReportData;
}

export function ActionItems({ data }: ActionItemsProps) {
  const dropOffs = computeDropOff(data.stages);
  const largestDropOff = getLargestDropOff(dropOffs);
  const actions = generateActionItems(largestDropOff, data.averageTimeInStages);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Doporuceni / Akcni Kroky
      </h2>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <ActionItem key={index} number={index + 1} text={action} />
        ))}
      </div>

      {largestDropOff && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">?? Priorita:</h3>
          <p className="text-sm text-yellow-800">
            Nejvetsi drop-off je mezi <strong>{largestDropOff.from}</strong> a <strong>{largestDropOff.to}</strong>.
            Toto je hlavni oblast pro zlepseni konverze.
          </p>
        </div>
      )}
    </div>
  );
}

interface ActionItemProps {
  number: number;
  text: string;
}

function ActionItem({ number, text }: ActionItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <p className="flex-1 text-sm text-gray-800 pt-1">{text}</p>
    </div>
  );
}
