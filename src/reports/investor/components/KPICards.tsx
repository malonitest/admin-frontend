/**
 * KPI Cards Component
 * Zobrazuje metriky s trendy a zmìnami
 * Bez cestiny diakritiky
 */

import type { IKPIMetric } from '@/types/reporting';
import { formatCzk, formatNumber, formatPercent } from '../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardsProps {
  metrics: IKPIMetric[];
  title?: string;
}

export function KPICards({ metrics, title }: KPICardsProps) {
  return (
    <div className="mb-8">
      {title && <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <KPICard key={index} metric={metric} />
        ))}
      </div>
    </div>
  );
}

interface KPICardProps {
  metric: IKPIMetric;
}

function KPICard({ metric }: KPICardProps) {
  const formattedValue = formatMetricValue(metric.value, metric.unit);
  const trendIcon = getTrendIcon(metric.trend);
  const trendColor = getTrendColor(metric.trend);
  const hasChange = metric.changePercentage !== undefined;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow print:break-inside-avoid">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{metric.label}</h3>
        {metric.trend && trendIcon && (
          <div className={`${trendColor}`}>{trendIcon}</div>
        )}
      </div>
      
      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-900">{formattedValue}</div>
      </div>
      
      {hasChange && (
        <div className={`text-sm font-medium ${trendColor}`}>
          {metric.changePercentage! > 0 ? '+' : ''}
          {formatPercent(metric.changePercentage!)} vs. predchozi obdobi
        </div>
      )}
      
      {metric.description && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{metric.description}</p>
      )}
    </div>
  );
}

function formatMetricValue(value: number, unit?: string): string {
  if (unit === 'Kc') {
    return formatCzk(value);
  } else if (unit === '%') {
    return formatPercent(value);
  } else {
    // Cisla > 1000 s mezerami tisicu
    return formatNumber(value, 0);
  }
}

function getTrendIcon(trend?: 'up' | 'down' | 'flat') {
  if (!trend) return null;
  
  switch (trend) {
    case 'up':
      return <TrendingUp className="w-5 h-5" />;
    case 'down':
      return <TrendingDown className="w-5 h-5" />;
    case 'flat':
      return <Minus className="w-5 h-5" />;
    default:
      return null;
  }
}

function getTrendColor(trend?: 'up' | 'down' | 'flat'): string {
  if (!trend) return 'text-gray-500';
  
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    case 'flat':
      return 'text-gray-400';
    default:
      return 'text-gray-500';
  }
}
