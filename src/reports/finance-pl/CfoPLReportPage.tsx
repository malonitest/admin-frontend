/**
 * CFO P/L Report Main Page
 * Professional financial report with drill-down, validation, and exports
 * No Czech diacritics allowed
 */

import React, { useState, useEffect } from 'react';
import { IFinancialReportData, ViewMode } from './types';
import { KPICards } from './components/KPICards';
import { MonthlyPLTable } from './components/MonthlyPLTable';
import { TrendCharts } from './components/TrendCharts';
import { CFOInsights } from './components/CFOInsights';
import { InvoicesSection } from './components/InvoicesSection';
import { PaymentsSection } from './components/PaymentsSection';
import { MonthDetailModal } from './components/MonthDetailModal';
import { validateFinancialData } from './utils/validation';
import { exportToExcel, exportToCSV } from './export/excel';
import { exportToPDF } from './export/pdf';
import { formatDate } from './utils/formatters';
import './styles/print.css';
import './styles/report.css';

interface CfoPLReportPageProps {
  data: IFinancialReportData;
  loading?: boolean;
  error?: Error | null;
  onRefresh?: () => void;
}

export const CfoPLReportPage: React.FC<CfoPLReportPageProps> = ({
  data,
  loading = false,
  error = null,
  onRefresh
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);
  
  // Validate data on mount and when data changes
  useEffect(() => {
    if (data) {
      const issues = validateFinancialData(data);
      setValidationIssues(issues);
    }
  }, [data]);
  
  // Handle Excel export
  const handleExportExcel = () => {
    if (!data) return;
    
    try {
      exportToExcel(data);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export selhal. Zkuste znovu.');
    }
  };
  
  // Handle CSV export
  const handleExportCSV = () => {
    if (!data) return;
    
    try {
      exportToCSV(data);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export selhal. Zkuste znovu.');
    }
  };
  
  // Handle PDF export
  const handleExportPDF = async () => {
    if (!data) return;
    
    try {
      await exportToPDF(data);
    } catch (err) {
      console.error('Export failed:', err);
      alert('PDF export selhal. Zkuste znovu.');
    }
  };
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Handle month drill-down
  const handleMonthClick = (month: string) => {
    setSelectedMonth(month);
  };
  
  // Close modal
  const handleCloseModal = () => {
    setSelectedMonth(null);
  };
  
  // Get selected month data
  const selectedMonthData = selectedMonth
    ? data?.monthlyData.find(m => m.month === selectedMonth)
    : null;
  
  // Loading state
  if (loading) {
    return (
      <div className="cfo-pl-report loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Nacitam financni data...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="cfo-pl-report error">
        <div className="error-message">
          <h2>Chyba pri nacitani dat</h2>
          <p>{error.message}</p>
          {onRefresh && (
            <button onClick={onRefresh} className="btn-refresh">
              Zkusit znovu
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // No data state
  if (!data) {
    return (
      <div className="cfo-pl-report no-data">
        <div className="no-data-message">
          <h2>Zadna data</h2>
          <p>Financni report neni k dispozici.</p>
        </div>
      </div>
    );
  }
  
  const { stats, monthlyData, dateFrom, dateTo } = data;
  
  return (
    <div className="cfo-pl-report">
      {/* Report Header */}
      <div className="report-header no-print-hide">
        <div className="header-content">
          <h1>P/L Report (mesicni) - CFO</h1>
          <div className="report-meta">
            <div className="report-period">
              Obdobi: {formatDate(dateFrom)} - {formatDate(dateTo)}
            </div>
            <div className="report-generated">
              Vygenerovano: {formatDate(new Date())}
            </div>
            <div className="report-version">
              Verze: 1.0
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters and Controls */}
      <div className="filter-section no-print">
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'summary' ? 'active' : ''}
            onClick={() => setViewMode('summary')}
          >
            Souhrn
          </button>
          <button
            className={viewMode === 'detailed' ? 'active' : ''}
            onClick={() => setViewMode('detailed')}
          >
            Detailni
          </button>
          <button
            className={viewMode === 'audit' ? 'active' : ''}
            onClick={() => setViewMode('audit')}
          >
            Audit
          </button>
        </div>
        
        <div className="export-buttons">
          <button onClick={handleExportExcel} className="btn-export">
            ?? Excel
          </button>
          <button onClick={handleExportCSV} className="btn-export">
            ?? CSV
          </button>
          <button onClick={handleExportPDF} className="btn-export">
            ?? PDF
          </button>
          <button onClick={handlePrint} className="btn-export">
            ??? Tisk
          </button>
        </div>
      </div>
      
      {/* Validation Warnings */}
      {validationIssues.length > 0 && (
        <div className="validation-warning">
          <h3>?? Data Inconsistency</h3>
          <ul>
            {validationIssues.map((issue, index) => (
              <li key={index} className={`issue-${issue.severity}`}>
                <strong>[{issue.severity}]</strong> {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Report Content */}
      <div className="report-content">
        {/* KPI Summary Cards */}
        <section className="kpi-section">
          <h2 className="section-title">CFO Overview</h2>
          <KPICards stats={stats} />
        </section>
        
        {/* Monthly P/L Statement */}
        {(viewMode === 'detailed' || viewMode === 'audit') && (
          <section className="pl-statement-section">
            <MonthlyPLTable
              monthlyData={monthlyData}
              onMonthClick={handleMonthClick}
            />
          </section>
        )}
        
        {/* Trend Charts */}
        {viewMode === 'detailed' && (
          <section className="charts-section">
            <TrendCharts monthlyData={monthlyData} />
          </section>
        )}
        
        {/* Revenue & Costs Breakdown */}
        {viewMode === 'detailed' && data.revenueByType && data.costsByType && (
          <section className="breakdown-section">
            <div className="breakdown-card">
              <h3>Struktura prijmu</h3>
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Typ</th>
                    <th className="text-right">Castka (Kc)</th>
                    <th className="text-right">Podil %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenueByType.map((item, index) => (
                    <tr key={index}>
                      <td>{item.type}</td>
                      <td className="text-right">
                        {item.amount.toLocaleString('cs-CZ')}
                      </td>
                      <td className="text-right">
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="breakdown-card">
              <h3>Struktura nakladu</h3>
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Typ</th>
                    <th className="text-right">Castka (Kc)</th>
                    <th className="text-right">Podil %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.costsByType.map((item, index) => (
                    <tr key={index}>
                      <td>{item.type}</td>
                      <td className="text-right">
                        {item.amount.toLocaleString('cs-CZ')}
                      </td>
                      <td className="text-right">
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        
        {/* CFO Insights */}
        {(viewMode === 'detailed' || viewMode === 'audit') && (
          <CFOInsights data={data} />
        )}
        
        {/* Invoices Section */}
        {viewMode === 'audit' && data.invoices && data.invoices.length > 0 && (
          <InvoicesSection invoices={data.invoices} />
        )}
        
        {/* Payments Section */}
        {viewMode === 'audit' && data.payments && data.payments.length > 0 && (
          <PaymentsSection 
            payments={data.payments} 
            monthlyData={monthlyData}
          />
        )}
      </div>
      
      {/* Month Detail Modal */}
      {selectedMonthData && (
        <MonthDetailModal
          month={selectedMonthData}
          invoices={data?.invoices || []}
          payments={data?.payments || []}
          onClose={handleCloseModal}
        />
      )}
      
      {/* Report Footer */}
      <div className="report-footer">
        <div>
          CFO P/L Report - Confidential
        </div>
        <div>
          Generated: {new Date().toLocaleString('cs-CZ')}
        </div>
      </div>
    </div>
  );
};

export default CfoPLReportPage;
