/**
 * Funnel KPI Cards Component
 * Zobrazeni souhrnenych metrik funnelu
 * Bez cestiny diakritiky
 */

import type { IFunnelReportData } from '@/types/reporting';
import { formatNumber, formatPercent } from '../utils/formatters.js';

interface FunnelKPICardsProps {
  data: IFunnelReportData;
}

export function FunnelKPICards({ data }: FunnelKPICardsProps) {
  const kpis = [
    {
      label: 'Celkem leadu',
      value: formatNumber(data.totalLeads),
      color: 'blue',
      icon: '??',
    },
    {
      label: 'Konvertovano',
      value: formatNumber(data.convertedLeads),
      color: 'green',
      icon: '?',
    },
    {
      label: 'Zamitnuto',
      value: formatNumber(data.declinedLeads),
      color: 'red',
      icon: '?',
    },
    {
      label: 'Conversion Rate',
      value: formatPercent(data.conversionRate),
      color: data.conversionRate >= 30 ? 'green' : data.conversionRate >= 20 ? 'orange' : 'red',
      icon: '??',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
}

interface KPICardProps {
  label: string;
  value: string;
  color: string;
  icon: string;
}

function KPICard({ label, value, color, icon }: KPICardProps) {
  const colorClasses = {
    blue: 'border-l-blue-600 bg-blue-50',
    green: 'border-l-green-600 bg-green-50',
    red: 'border-l-red-600 bg-red-50',
    orange: 'border-l-orange-600 bg-orange-50',
  };

  const textColorClasses = {
    blue: 'text-blue-700',
    green: 'text-green-700',
    red: 'text-red-700',
    orange: 'text-orange-700',
  };

  return (
    <div className={`bg-white rounded-lg border-l-4 p-6 shadow-sm ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${textColorClasses[color as keyof typeof textColorClasses] || textColorClasses.blue}`}>
        {value}
      </div>
    </div>
  );
}
