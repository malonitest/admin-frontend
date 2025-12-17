/**
 * Invoices Section Component
 * Shows invoice list with aging analysis
 * No Czech diacritics allowed
 */

import React, { useState } from 'react';
import { IInvoiceItem } from '../types';
import { formatCzk, formatDate } from '../utils/formatters';
import { buildAgingBuckets, daysBetween } from '../utils/calculations';

interface InvoicesSectionProps {
  invoices: IInvoiceItem[];
}

export const InvoicesSection: React.FC<InvoicesSectionProps> = ({ invoices }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return (
      <div className="invoices-section">
        <h2>Faktury</h2>
        <p className="no-data">Zadne faktury k zobrazeni</p>
      </div>
    );
  }
  
  // Filter invoices
  let filteredInvoices = invoices;
  
  if (statusFilter !== 'ALL') {
    filteredInvoices = filteredInvoices.filter(inv => inv.status === statusFilter);
  }
  
  if (typeFilter !== 'ALL') {
    filteredInvoices = filteredInvoices.filter(inv => inv.type === typeFilter);
  }
  
  // Calculate KPIs
  const unpaidInvoices = invoices.filter(inv => inv.status === 'UNPAID');
  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE');
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  // Calculate aging buckets
  const agingBuckets = buildAgingBuckets(invoices);
  
  // Calculate average delay
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID' && inv.paidDate);
  const avgDelay = paidInvoices.length > 0
    ? paidInvoices.reduce((sum, inv) => {
        const delay = daysBetween(inv.dueDate, inv.paidDate!);
        return sum + Math.max(0, delay);
      }, 0) / paidInvoices.length
    : 0;
  
  return (
    <div className="invoices-section page-break">
      <h2>Faktury - kontrola inkasa</h2>
      
      {/* KPI Cards */}
      <div className="invoice-kpis">
        <div className="invoice-kpi-card">
          <div className="kpi-label">Nezaplacene</div>
          <div className="kpi-value">{unpaidInvoices.length}</div>
          <div className="kpi-amount">{formatCzk(unpaidAmount)}</div>
        </div>
        <div className="invoice-kpi-card warning">
          <div className="kpi-label">Po splatnosti</div>
          <div className="kpi-value">{overdueInvoices.length}</div>
          <div className="kpi-amount">{formatCzk(overdueAmount)}</div>
        </div>
        <div className="invoice-kpi-card">
          <div className="kpi-label">Prumerne zpozdeni</div>
          <div className="kpi-value">{avgDelay.toFixed(0)} dni</div>
        </div>
      </div>
      
      {/* Aging Buckets */}
      {agingBuckets.some(b => b.count > 0) && (
        <div className="aging-section">
          <h3>Aging Analysis - Po splatnosti</h3>
          <div className="aging-buckets">
            {agingBuckets.map((bucket, index) => (
              <div 
                key={index} 
                className={`aging-bucket ${bucket.count > 0 ? 'has-items' : ''}`}
              >
                <div className="bucket-label">{bucket.bucket}</div>
                <div className="bucket-count">{bucket.count} faktur</div>
                <div className="bucket-amount">{formatCzk(bucket.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="invoice-filters no-print">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="ALL">Vsechny statusy</option>
          <option value="PAID">Zaplaceno</option>
          <option value="UNPAID">Nezaplaceno</option>
          <option value="OVERDUE">Po splatnosti</option>
        </select>
        
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
      </div>
      
      {/* Invoices Table */}
      <table className="invoices-table">
        <thead>
          <tr>
            <th>Cislo faktury</th>
            <th>Zakaznik</th>
            <th className="text-right">Castka</th>
            <th>Splatnost</th>
            <th>Zaplaceno</th>
            <th>Status</th>
            <th>Typ</th>
            <th className="text-right">Zpozdeni</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.slice(0, 100).map((invoice) => {
            const delay = invoice.status !== 'PAID' && invoice.dueDate
              ? daysBetween(invoice.dueDate, new Date())
              : invoice.paidDate && invoice.dueDate
              ? daysBetween(invoice.dueDate, invoice.paidDate)
              : 0;
            
            return (
              <tr 
                key={invoice.invoiceId}
                className={invoice.status === 'OVERDUE' ? 'overdue-row' : ''}
              >
                <td>
                  <a 
                    href={`#invoice-${invoice.invoiceId}`}
                    className="invoice-link"
                  >
                    {invoice.invoiceNumber}
                  </a>
                </td>
                <td>
                  <a 
                    href={`#customer-${invoice.customerId}`}
                    className="customer-link"
                  >
                    {invoice.customerName}
                  </a>
                </td>
                <td className="text-right amount">
                  {formatCzk(invoice.amount)}
                </td>
                <td>{formatDate(invoice.dueDate)}</td>
                <td>
                  {invoice.paidDate ? formatDate(invoice.paidDate) : '-'}
                </td>
                <td>
                  <span className={`status-badge ${invoice.status.toLowerCase()}`}>
                    {invoice.status}
                  </span>
                </td>
                <td>{invoice.type}</td>
                <td className={`text-right ${delay > 0 ? 'warning' : ''}`}>
                  {delay > 0 ? `${delay} dni` : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {filteredInvoices.length > 100 && (
        <p className="table-note">
          Zobrazeno prvnich 100 z {filteredInvoices.length} faktur
        </p>
      )}
    </div>
  );
};

export default InvoicesSection;
