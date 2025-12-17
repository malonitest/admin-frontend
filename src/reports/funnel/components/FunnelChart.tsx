/**
 * Funnel Chart Component
 * Vizualizace funnelu s drop-off
 * Bez cestiny diakritiky
 */

import type { IFunnelStageData, IDropOff } from '@/types/reporting';
import { formatNumber, formatPercent, computeDropOff, getLargestDropOff } from '../utils/formatters';

interface FunnelChartProps {
  stages: IFunnelStageData[];
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const dropOffs = computeDropOff(stages);
  const largestDropOff = getLargestDropOff(dropOffs);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Funnel Vizualizace</h2>
      
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const dropOff = dropOffs[index];
          const isLargestDrop = largestDropOff && dropOff && 
            dropOff.from === largestDropOff.from && 
            dropOff.to === largestDropOff.to;
          
          return (
            <div key={index}>
              <FunnelStageBar stage={stage} />
              {dropOff && (
                <DropOffIndicator dropOff={dropOff} isLargest={isLargestDrop} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FunnelStageBarProps {
  stage: IFunnelStageData;
}

function FunnelStageBar({ stage }: FunnelStageBarProps) {
  const width = Math.max(stage.percentage, 5); // Min 5% pro viditelnost

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
        <span className="text-sm text-gray-600">
          {formatNumber(stage.count)} ({formatPercent(stage.percentage)})
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
          style={{ width: `${width}%` }}
        >
          <span className="text-white text-sm font-semibold">
            {formatPercent(stage.percentage, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface DropOffIndicatorProps {
  dropOff: IDropOff;
  isLargest: boolean;
}

function DropOffIndicator({ dropOff, isLargest }: DropOffIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 py-2 px-4 rounded ${isLargest ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
      <span className="text-gray-500">?</span>
      <span className="text-sm text-gray-700">
        Drop: <strong>{formatNumber(dropOff.dropCount)}</strong> ({formatPercent(dropOff.dropRate, 1)})
      </span>
      {isLargest && (
        <span className="ml-auto px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
          NEJVETSI ZTRATA
        </span>
      )}
    </div>
  );
}
