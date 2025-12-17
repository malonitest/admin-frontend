/**
 * KPI Cards Component for CFO P/L Report
 * No Czech diacritics allowed
 */

import React from 'react';
import { IFinancialStats } from '../types';
import { formatCzk, formatPercent, formatCount } from '../utils/formatters';

interface KPICardsProps {
  stats: IFinancialStats;
}

export const KPICards: React.FC<KPICardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Celkove prijmy',
      value: formatCzk(stats.totalRevenue),
      subtitle: `Prumer mesicne: ${formatCzk(stats.averageMonthlyRevenue)}`,
      icon: '??',
      color: 'green',
      className: 'kpi-revenue'
    },
    {
      title: 'Celkove naklady',
      value: formatCzk(stats.totalCosts),
      subtitle: `Vykoupeno aut: ${formatCount(stats.totalCarsPurchased)}`,
      icon: '??',
      color: 'orange',
      className: 'kpi-costs'
    },
    {
      title: 'Cisty zisk',
      value: formatCzk(stats.totalProfit),
      subtitle: `Prumer mesicne: ${formatCzk(stats.averageMonthlyProfit)}`,
      icon: stats.totalProfit >= 0 ? '??' : '??',
      color: stats.totalProfit >= 0 ? 'green' : 'red',
      className: 'kpi-profit'
    },
    {
      title: 'Ziskova marze',
      value: formatPercent(stats.profitMargin),
      subtitle: stats.profitMargin >= 0 ? 'Pozitivni' : 'Negativni',
      icon: '??',
      color: stats.profitMargin >= 0 ? 'green' : 'red',
      className: 'kpi-margin'
    },
    {
      title: 'Investice do aut',
      value: formatCzk(stats.totalCarsPurchasedValue),
      subtitle: `Pocet: ${formatCount(stats.totalCarsPurchased)} aut`,
      icon: '??',
      color: 'blue',
      className: 'kpi-cars'
    },
    {
      title: 'Aktivni leasingy',
      value: formatCount(stats.activeLeases),
      subtitle: `Hodnota: ${formatCzk(stats.totalLeaseValue)}`,
      icon: '??',
      color: 'purple',
      className: 'kpi-leases'
    }
  ];

  return (
    <div className="kpi-cards-grid no-print-hide">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`kpi-card ${card.color} ${card.className}`}
        >
          <div className="kpi-icon">{card.icon}</div>
          <h3 className="kpi-title">{card.title}</h3>
          <div className="kpi-value">{card.value}</div>
          {card.subtitle && (
            <div className="kpi-subtitle">{card.subtitle}</div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPICards;
