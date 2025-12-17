/**
 * Monthly P/L Statement Table Component
 * No Czech diacritics allowed
 */

import React from 'react';
import { IFinancialReportItem } from '../types';
import { formatCzk, formatPercent, formatCount } from '../utils/formatters';
import { sumBy, avgBy } from '../utils/calculations';

interface MonthlyPLTableProps {
  monthlyData: IFinancialReportItem[];
  onMonthClick?: (month: string) => void;
}

export const MonthlyPLTable: React.FC<MonthlyPLTableProps> = ({
  monthlyData,
  onMonthClick
}) => {
  if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
    return (
      <div className="table-section">
        <h2>Mesicni P/L Statement</h2>
        <p className="no-data">Zadna data k dispozici</p>
      </div>
    );
  }

  // Calculate totals
  const totalRevenue = sumBy(monthlyData, m => m.totalRevenue);
  const totalCosts = sumBy(monthlyData, m => m.totalCosts);
  const totalProfit = sumBy(monthlyData, m => m.netProfit);
  const totalCarPurchases = sumBy(monthlyData, m => m.carPurchasesCount);
  const totalNewLeases = sumBy(monthlyData, m => m.newLeases);
  
  // Calculate averages
  const avgRevenue = avgBy(monthlyData, m => m.totalRevenue);
  const avgCosts = avgBy(monthlyData, m => m.totalCosts);
  const avgProfit = avgBy(monthlyData, m => m.netProfit);
  const avgMargin = avgBy(monthlyData, m => m.profitMargin);
  const avgActiveLeases = avgBy(monthlyData, m => m.activeLeases);
  const avgRentPayment = avgBy(monthlyData, m => m.averageRentPayment);
  const avgPaymentSuccess = avgBy(monthlyData, m => m.paymentSuccessRate);

  return (
    <div className="table-section">
      <h2>Mesicni P/L Statement</h2>
      <div className="table-wrapper">
        <table className="financial-table">
          <thead>
            <tr>
              <th rowSpan={2}>Mesic</th>
              <th colSpan={6} className="group-header">Prijmy (Kc)</th>
              <th colSpan={6} className="group-header">Naklady (Kc)</th>
              <th colSpan={3} className="group-header">Zisk/Ztrata</th>
              <th colSpan={5} className="group-header">Operace</th>
            </tr>
            <tr>
              {/* Revenue columns */}
              <th className="sub-header">Najem</th>
              <th className="sub-header">Admin</th>
              <th className="sub-header">Pojisteni</th>
              <th className="sub-header">Poplatky</th>
              <th className="sub-header">Ostatni</th>
              <th className="sub-header">Celkem</th>
              
              {/* Costs columns */}
              <th className="sub-header">Odkup aut</th>
              <th className="sub-header">Pojisteni</th>
              <th className="sub-header">Udrzba</th>
              <th className="sub-header">Provoz</th>
              <th className="sub-header">Ostatni</th>
              <th className="sub-header">Celkem</th>
              
              {/* Profit columns */}
              <th className="sub-header">Hruby</th>
              <th className="sub-header">Cisty</th>
              <th className="sub-header">Marze %</th>
              
              {/* Operations columns */}
              <th className="sub-header">Aktivni</th>
              <th className="sub-header">Nove</th>
              <th className="sub-header">Vykoupeno</th>
              <th className="sub-header">Prum. najem</th>
              <th className="sub-header">Uspesnost %</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.map((month) => (
              <tr 
                key={month.month}
                className={`data-row ${month.netProfit < 0 ? 'negative-profit' : ''}`}
                onClick={() => onMonthClick?.(month.month)}
                style={{ cursor: onMonthClick ? 'pointer' : 'default' }}
              >
                <td className="month-cell">
                  <strong>{month.monthLabel || month.month}</strong>
                </td>
                
                {/* Revenue */}
                <td className="amount">{formatCzk(month.rentPayments)}</td>
                <td className="amount">{formatCzk(month.adminFees)}</td>
                <td className="amount">{formatCzk(month.insuranceFees)}</td>
                <td className="amount">{formatCzk(month.latePaymentFees)}</td>
                <td className="amount">{formatCzk(month.otherRevenue)}</td>
                <td className="amount strong">{formatCzk(month.totalRevenue)}</td>
                
                {/* Costs */}
                <td className="amount">{formatCzk(month.carPurchases)}</td>
                <td className="amount">{formatCzk(month.insuranceCosts)}</td>
                <td className="amount">{formatCzk(month.maintenanceCosts)}</td>
                <td className="amount">{formatCzk(month.operationalCosts)}</td>
                <td className="amount">{formatCzk(month.otherCosts)}</td>
                <td className="amount strong">{formatCzk(month.totalCosts)}</td>
                
                {/* Profit/Loss */}
                <td className={`amount ${month.grossProfit >= 0 ? 'positive' : 'negative'}`}>
                  {formatCzk(month.grossProfit)}
                </td>
                <td className={`amount strong ${month.netProfit >= 0 ? 'positive' : 'negative'}`}>
                  {formatCzk(month.netProfit)}
                </td>
                <td className={`amount ${month.profitMargin >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercent(month.profitMargin)}
                </td>
                
                {/* Operations */}
                <td className="count">{formatCount(month.activeLeases)}</td>
                <td className="count">{formatCount(month.newLeases)}</td>
                <td className="count">{formatCount(month.carPurchasesCount)}</td>
                <td className="amount">{formatCzk(month.averageRentPayment)}</td>
                <td className={`amount ${month.paymentSuccessRate >= 95 ? 'positive' : 'warning'}`}>
                  {formatPercent(month.paymentSuccessRate)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td><strong>CELKEM</strong></td>
              
              {/* Revenue totals - sum of columns */}
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.rentPayments))}</td>
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.adminFees))}</td>
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.insuranceFees))}</td>
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.latePaymentFees))}</td>
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.otherRevenue))}</td>
              <td className="amount strong">{formatCzk(totalRevenue)}</td>
              
              {/* Costs totals */}
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.carPurchases))}</td>
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.insuranceCosts))}</td>
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.maintenanceCosts))}</td>
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.operationalCosts))}</td>
              <td className="amount strong">{formatCzk(sumBy(monthlyData, m => m.otherCosts))}</td>
              <td className="amount strong">{formatCzk(totalCosts)}</td>
              
              {/* Profit totals */}
              <td className={`amount strong ${sumBy(monthlyData, m => m.grossProfit) >= 0 ? 'positive' : 'negative'}`}>
                {formatCzk(sumBy(monthlyData, m => m.grossProfit))}
              </td>
              <td className={`amount strong ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
                {formatCzk(totalProfit)}
              </td>
              <td className={`amount ${avgMargin >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(avgMargin)}
              </td>
              
              {/* Operations totals/averages */}
              <td className="count">{formatCount(avgActiveLeases)}</td>
              <td className="count strong">{formatCount(totalNewLeases)}</td>
              <td className="count strong">{formatCount(totalCarPurchases)}</td>
              <td className="amount">{formatCzk(avgRentPayment)}</td>
              <td className="amount">{formatPercent(avgPaymentSuccess)}</td>
            </tr>
            <tr className="avg-row">
              <td><strong>PRUMER</strong></td>
              
              {/* Revenue averages */}
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.rentPayments))}</td>
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.adminFees))}</td>
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.insuranceFees))}</td>
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.latePaymentFees))}</td>
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.otherRevenue))}</td>
              <td className="amount strong">{formatCzk(avgRevenue)}</td>
              
              {/* Costs averages */}
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.carPurchases))}</td>
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.insuranceCosts))}</td>
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.maintenanceCosts))}</td>
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.operationalCosts))}</td>
              <td className="amount">{formatCzk(avgBy(monthlyData, m => m.otherCosts))}</td>
              <td className="amount strong">{formatCzk(avgCosts)}</td>
              
              {/* Profit averages */}
              <td className={`amount ${avgBy(monthlyData, m => m.grossProfit) >= 0 ? 'positive' : 'negative'}`}>
                {formatCzk(avgBy(monthlyData, m => m.grossProfit))}
              </td>
              <td className={`amount strong ${avgProfit >= 0 ? 'positive' : 'negative'}`}>
                {formatCzk(avgProfit)}
              </td>
              <td className={`amount ${avgMargin >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(avgMargin)}
              </td>
              
              {/* Operations averages */}
              <td className="count">{formatCount(avgActiveLeases)}</td>
              <td className="count">{formatCount(avgBy(monthlyData, m => m.newLeases))}</td>
              <td className="count">{formatCount(avgBy(monthlyData, m => m.carPurchasesCount))}</td>
              <td className="amount">{formatCzk(avgRentPayment)}</td>
              <td className="amount">{formatPercent(avgPaymentSuccess)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      {onMonthClick && (
        <p className="table-hint no-print">
          ?? Klikni na mesic pro zobrazeni detailu
        </p>
      )}
    </div>
  );
};

export default MonthlyPLTable;
