/**
 * Month Detail Modal Component
 * Drill-down view for specific month
 * No Czech diacritics allowed
 */

import React from 'react';
import { IFinancialReportItem, IInvoiceItem, IPaymentItem } from '../types';
import { formatCzk, formatPercent, formatCount, formatDate } from '../utils/formatters';

interface MonthDetailModalProps {
  month: IFinancialReportItem | null;
  invoices: IInvoiceItem[];
  payments: IPaymentItem[];
  onClose: () => void;
}

export const MonthDetailModal: React.FC<MonthDetailModalProps> = ({
  month,
  invoices,
  payments,
  onClose
}) => {
  if (!month) return null;
  
  // Filter invoices and payments for this month
  const monthInvoices = invoices.filter(inv => inv.month === month.month);
  const monthPayments = payments.filter(pmt => pmt.month === month.month);
  
  // Calculate invoice stats
  const paidInvoices = monthInvoices.filter(inv => inv.status === 'PAID');
  const unpaidInvoices = monthInvoices.filter(inv => inv.status === 'UNPAID');
  const overdueInvoices = monthInvoices.filter(inv => inv.status === 'OVERDUE');
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content month-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{month.monthLabel || month.month} - Detailni prehled</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="modal-body">
          {/* KPI Summary */}
          <div className="month-detail-kpis">
            <div className="kpi-row">
              <div className="kpi-item">
                <span className="kpi-label">Celkove prijmy</span>
                <span className="kpi-value">{formatCzk(month.totalRevenue)}</span>
              </div>
              <div className="kpi-item">
                <span className="kpi-label">Celkove naklady</span>
                <span className="kpi-value">{formatCzk(month.totalCosts)}</span>
              </div>
              <div className={`kpi-item ${month.netProfit >= 0 ? 'positive' : 'negative'}`}>
                <span className="kpi-label">Cisty zisk</span>
                <span className="kpi-value">{formatCzk(month.netProfit)}</span>
              </div>
              <div className={`kpi-item ${month.profitMargin >= 0 ? 'positive' : 'negative'}`}>
                <span className="kpi-label">Ziskova marze</span>
                <span className="kpi-value">{formatPercent(month.profitMargin)}</span>
              </div>
            </div>
          </div>
          
          {/* Revenue Breakdown */}
          <div className="detail-section">
            <h3>Prijmy</h3>
            <table className="detail-table">
              <tbody>
                <tr>
                  <td>Najem</td>
                  <td className="text-right">{formatCzk(month.rentPayments)}</td>
                </tr>
                <tr>
                  <td>Admin. poplatky</td>
                  <td className="text-right">{formatCzk(month.adminFees)}</td>
                </tr>
                <tr>
                  <td>Pojisteni</td>
                  <td className="text-right">{formatCzk(month.insuranceFees)}</td>
                </tr>
                <tr>
                  <td>Poplatky za prodleni</td>
                  <td className="text-right">{formatCzk(month.latePaymentFees)}</td>
                </tr>
                <tr>
                  <td>Ostatni</td>
                  <td className="text-right">{formatCzk(month.otherRevenue)}</td>
                </tr>
                <tr className="total-row">
                  <td><strong>Celkem</strong></td>
                  <td className="text-right"><strong>{formatCzk(month.totalRevenue)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Costs Breakdown */}
          <div className="detail-section">
            <h3>Naklady</h3>
            <table className="detail-table">
              <tbody>
                <tr>
                  <td>Odkup aut ({formatCount(month.carPurchasesCount)})</td>
                  <td className="text-right">{formatCzk(month.carPurchases)}</td>
                </tr>
                <tr>
                  <td>Pojisteni</td>
                  <td className="text-right">{formatCzk(month.insuranceCosts)}</td>
                </tr>
                <tr>
                  <td>Udrzba</td>
                  <td className="text-right">{formatCzk(month.maintenanceCosts)}</td>
                </tr>
                <tr>
                  <td>Provozni naklady</td>
                  <td className="text-right">{formatCzk(month.operationalCosts)}</td>
                </tr>
                <tr>
                  <td>Ostatni</td>
                  <td className="text-right">{formatCzk(month.otherCosts)}</td>
                </tr>
                <tr className="total-row">
                  <td><strong>Celkem</strong></td>
                  <td className="text-right"><strong>{formatCzk(month.totalCosts)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Operations Stats */}
          <div className="detail-section">
            <h3>Operace</h3>
            <div className="operations-grid">
              <div className="op-item">
                <span className="op-label">Aktivni leasingy</span>
                <span className="op-value">{formatCount(month.activeLeases)}</span>
              </div>
              <div className="op-item">
                <span className="op-label">Nove leasingy</span>
                <span className="op-value">{formatCount(month.newLeases)}</span>
              </div>
              <div className="op-item">
                <span className="op-label">Ukoncene leasingy</span>
                <span className="op-value">{formatCount(month.endedLeases)}</span>
              </div>
              <div className="op-item">
                <span className="op-label">Prumerna splatka</span>
                <span className="op-value">{formatCzk(month.averageRentPayment)}</span>
              </div>
              <div className="op-item">
                <span className="op-label">Uspesnost plateb</span>
                <span className="op-value">{formatPercent(month.paymentSuccessRate)}</span>
              </div>
            </div>
          </div>
          
          {/* Invoices */}
          {monthInvoices.length > 0 && (
            <div className="detail-section">
              <h3>Faktury ({monthInvoices.length})</h3>
              <div className="invoice-summary">
                <span>Zaplaceno: {paidInvoices.length}</span>
                <span>Nezaplaceno: {unpaidInvoices.length}</span>
                <span>Po splatnosti: {overdueInvoices.length}</span>
              </div>
              <table className="detail-table small">
                <thead>
                  <tr>
                    <th>Cislo</th>
                    <th>Zakaznik</th>
                    <th className="text-right">Castka</th>
                    <th>Status</th>
                    <th>Typ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthInvoices.slice(0, 10).map(inv => (
                    <tr key={inv.invoiceId}>
                      <td>{inv.invoiceNumber}</td>
                      <td>{inv.customerName}</td>
                      <td className="text-right">{formatCzk(inv.amount)}</td>
                      <td>
                        <span className={`status-badge ${inv.status.toLowerCase()}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>{inv.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {monthInvoices.length > 10 && (
                <p className="table-note">Zobrazeno prvnich 10 z {monthInvoices.length}</p>
              )}
            </div>
          )}
          
          {/* Payments */}
          {monthPayments.length > 0 && (
            <div className="detail-section">
              <h3>Platby ({monthPayments.length})</h3>
              <p className="detail-summary">
                Celkova castka: {formatCzk(monthPayments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
              <table className="detail-table small">
                <thead>
                  <tr>
                    <th>Zakaznik</th>
                    <th className="text-right">Castka</th>
                    <th>Datum</th>
                    <th>Typ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthPayments.slice(0, 10).map(pmt => (
                    <tr key={pmt.paymentId}>
                      <td>{pmt.customerName}</td>
                      <td className="text-right">{formatCzk(pmt.amount)}</td>
                      <td>{formatDate(pmt.paymentDate)}</td>
                      <td>{pmt.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {monthPayments.length > 10 && (
                <p className="table-note">Zobrazeno prvnich 10 z {monthPayments.length}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Zavrit
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthDetailModal;
