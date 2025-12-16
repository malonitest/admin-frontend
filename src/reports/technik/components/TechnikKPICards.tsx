/**
 * KPI Cards for Funnel Technik Report
 * No Czech diacritics - ASCII only
 */

import React from 'react';
import { IFunnelTechnikStats } from '../../../types/reporting';
import { formatPercentage } from '../utils/formatters';

interface Props {
  stats: IFunnelTechnikStats;
}

const TechnikKPICards: React.FC<Props> = ({ stats }) => {
  const kpiData = [
    {
      label: 'Celkem predano technikovi',
      value: stats.totalHandedToTechnician,
      color: 'blue',
      icon: '??'
    },
    {
      label: 'Schvaleno',
      value: stats.approved,
      color: 'green',
      icon: '?'
    },
    {
      label: 'Zamitnuto',
      value: stats.rejected,
      color: 'red',
      icon: '?'
    },
    {
      label: 'V kontrole',
      value: stats.inProgress,
      color: 'orange',
      icon: '??'
    },
    {
      label: 'Mira schvaleni',
      value: formatPercentage(stats.approvalRate),
      color: stats.approvalRate >= 70 ? 'green' : stats.approvalRate >= 50 ? 'orange' : 'red',
      icon: '??'
    },
    {
      label: 'Mira zamitnuti',
      value: formatPercentage(stats.rejectionRate),
      color: stats.rejectionRate <= 20 ? 'green' : stats.rejectionRate <= 40 ? 'orange' : 'red',
      icon: '??'
    },
    {
      label: 'Prumerny pocet dni',
      value: `${stats.averageDaysInReview} dni`,
      color: stats.averageDaysInReview <= 3 ? 'green' : stats.averageDaysInReview <= 7 ? 'orange' : 'red',
      icon: '??'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      red: 'bg-red-50 border-red-200',
      orange: 'bg-orange-50 border-orange-200',
      gray: 'bg-gray-50 border-gray-200'
    };
    return colors[color] || colors.gray;
  };

  const getTextColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600'
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpiData.map((kpi, index) => (
        <div
          key={index}
          className={`p-6 rounded-lg border-2 ${getColorClasses(kpi.color)} transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{kpi.icon}</span>
          </div>
          <div className={`text-3xl font-bold mb-1 ${getTextColorClasses(kpi.color)}`}>
            {kpi.value}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {kpi.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TechnikKPICards;
