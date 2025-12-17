/**
 * Payments Section Component
 * Shows payment list with reconciliation
 * No Czech diacritics allowed
 */

import React, { useState } from 'react';
import { IPaymentItem, IFinancialReportItem } from '../types';
import { formatCzk, formatDate } from '../utils/formatters';
import { calculateReconciliation } from '../utils/calculations';

interface PaymentsSectionProps {
  payments: IPaymentItem[];
  monthlyData: IFinancialReportItem[];
}

export const PaymentsSection: React.FC<PaymentsSectionProps> = ({
  payments,
  monthlyData
}) => {
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [monthFilter, setMonthFilter] = useState<string>('ALL');
  
  if (!Array.isArray(payments) || payments.length === 0) {
    return (
      <div className="payments-section">
        <h2>Platby</h2>
        <p className="no-data">Zadne platby k zobrazeni</p>
      </div>
    );
  }
  
  // Filter payments
  let filteredPayments = payments;
  
  if (typeFilter !== 'ALL') {
    filteredPayments = filteredPayments.filter(pmt => pmt.type === typeFilter);
  }
  
  if (monthFilter !== 'ALL') {
    filteredPayments = filteredPayments.filter(pmt => pmt.month === monthFilter);
  }
  
  // Calculate reconciliation
  const reconciliation = calculateReconciliation(payments, monthlyData);
  
  // Check for significant differences
  const significantDiffs = reconciliation.filter(r => Math.abs(r.diffPct) > 5);
  
  // Get unique months for filter
  const uniqueMonths = Array.from(new Set(payments.map(p => p.month))).sort();
  
  return (
    <div className="payments-section page-break">
      <h2>Platby - cashflow view</h2>
      
      {/* Reconciliation Warnings */}
      {significantDiffs.length > 0 && (
        <div className="reconciliation-warnings">
          <h3>?? Reconciliation - Rozdily &gt; 5%</h3>
          <table className="reconciliation-table">
            <thead>
              <tr>
                <th>Mesic</th>
                <th>Typ</th>
                <th className="text-right">Ocekavano</th>
                <th className="text-right">Skutecnost</th>
                <th className="text-right">Rozdil</th>
                <th className="text-right">Rozdil %</th>
              </tr>
            </thead>
            <tbody>
              {significantDiffs.map((rec, index) => (
                <tr key={index} className="warning-row">
                  <td>{rec.month}</td>
                  <td>{rec.type}</td>
                  <td className="text-right">{formatCzk(rec.expected)}</td>
                  <td className="text-right">{formatCzk(rec.actual)}</td>
                  <td className={`text-right ${rec.diff >= 0 ? 'positive' : 'negative'}`}>
                    {formatCzk(rec.diff)}
                  </td>
                  <td className={`text-right ${rec.diffPct >= 0 ? 'positive' : 'negative'}`}>
                    {rec.diffPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="warning-note">
            Upozorneni: Rozdily mezi ocekavanym a skutecnym inkasem. 
            Zkontrolujte data v accounting systemu.
          </p>
        </div>
      )}
      
      {/* Filters */}
      <div className="payment-filters no-print">
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="ALL">Vsechny typy</option>
          <option value="RENT">Najem</option>
          <option value="ADMIN_FEE">Admin poplatek</option>
          <option value="INSURANCE">Pojisteni</option>
          <option value="LATE_FEE">Poplatek za prodleni</option>
        </select>
        
        <select 
          value={monthFilter} 
          onChange={(e) => setMonthFilter(e.target.value)}
          className="filter-select"
        >
          <option value="ALL">Vsechny mesice</option>
          {uniqueMonths.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
      
      {/* Payments Table */}
      <table className="payments-table">
        <thead>
          <tr>
            <th>Payment ID</th>
            <th>Zakaznik</th>
            <th className="text-right">Castka</th>
            <th>Datum platby</th>
            <th>Typ</th>
            <th>Status</th>
            <th>Mesic</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayments.slice(0, 100).map((payment) => (
            <tr key={payment.paymentId}>
              <td>
                <a 
                  href={`#payment-${payment.paymentId}`}
                  className="payment-link"
                  title={payment.paymentId}
                >
                  {payment.paymentId.substring(0, 8)}...
                </a>
              </td>
              <td>
                <a 
                  href={`#customer-${payment.customerId}`}
                  className="customer-link"
                >
                  {payment.customerName}
                </a>
              </td>
              <td className="text-right amount">
                {formatCzk(payment.amount)}
              </td>
              <td>{formatDate(payment.paymentDate)}</td>
              <td>{payment.type}</td>
              <td>
                <span className={`status-badge ${payment.status.toLowerCase()}`}>
                  {payment.status}
                </span>
              </td>
              <td>{payment.month}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td colSpan={2}><strong>Celkem ({filteredPayments.length})</strong></td>
            <td className="text-right amount">
              <strong>
                {formatCzk(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
              </strong>
            </td>
            <td colSpan={4}></td>
          </tr>
        </tfoot>
      </table>
      
      {filteredPayments.length > 100 && (
        <p className="table-note">
          Zobrazeno prvnich 100 z {filteredPayments.length} plateb
        </p>
      )}
    </div>
  );
};

export default PaymentsSection;
