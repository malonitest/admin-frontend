/**
 * PDF Export for CFO P/L Report
 * Uses jsPDF for PDF generation
 * No Czech diacritics allowed
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IFinancialReportData } from '../types';
import { formatCzk, formatPercent, formatDate, formatCount } from '../utils/formatters';

/**
 * Export financial report to PDF
 * @param data - Financial report data
 * @param filename - Output filename (without extension)
 */
export const exportToPDF = async (
  data: IFinancialReportData,
  filename?: string
): Promise<void> => {
  try {
    // Create PDF document (A4, portrait)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    
    // Helper function for page break
    const checkPageBreak = (neededSpace: number) => {
      if (yPosition + neededSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('P/L Report (mesicni) - CFO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Obdobi: ${formatDate(data.dateFrom)} - ${formatDate(data.dateTo)}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 5;
    
    doc.text(
      `Vygenerovano: ${formatDate(new Date())}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 15;
    
    // KPI Summary Section
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CFO Overview', 15, yPosition);
    yPosition += 8;
    
    const kpiData = [
      ['Celkove prijmy', formatCzk(data.stats.totalRevenue)],
      ['Celkove naklady', formatCzk(data.stats.totalCosts)],
      ['Cisty zisk', formatCzk(data.stats.totalProfit)],
      ['Ziskova marze', formatPercent(data.stats.profitMargin)],
      ['Prumerne mesicni prijmy', formatCzk(data.stats.averageMonthlyRevenue)],
      ['Prumerne mesicni zisk', formatCzk(data.stats.averageMonthlyProfit)],
      ['Vykoupena auta', `${formatCount(data.stats.totalCarsPurchased)} (${formatCzk(data.stats.totalCarsPurchasedValue)})`],
      ['Aktivni leasingy', `${formatCount(data.stats.activeLeases)} (${formatCzk(data.stats.totalLeaseValue)})`]
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Metrika', 'Hodnota']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Monthly P/L Statement
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Mesicni P/L Statement', 15, yPosition);
    yPosition += 8;
    
    const monthlyHeaders = [
      'Mesic',
      'Prijmy',
      'Naklady',
      'Zisk',
      'Marze %',
      'Aktivni',
      'Nove',
      'Auta'
    ];
    
    const monthlyData = data.monthlyData.map(m => [
      m.monthLabel || m.month,
      formatCzk(m.totalRevenue),
      formatCzk(m.totalCosts),
      formatCzk(m.netProfit),
      formatPercent(m.profitMargin),
      formatCount(m.activeLeases),
      formatCount(m.newLeases),
      formatCount(m.carPurchasesCount)
    ]);
    
    // Add total row
    monthlyData.push([
      'CELKEM',
      formatCzk(data.stats.totalRevenue),
      formatCzk(data.stats.totalCosts),
      formatCzk(data.stats.totalProfit),
      formatPercent(data.stats.profitMargin),
      formatCount(data.stats.activeLeases),
      '-',
      formatCount(data.stats.totalCarsPurchased)
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [monthlyHeaders],
      body: monthlyData,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 22, halign: 'right' },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 15, halign: 'center' }
      },
      didParseCell: (data: any) => {
        // Highlight negative profit
        if (data.column.index === 3 && data.cell.text[0].includes('-')) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
        // Bold total row
        if (data.row.index === monthlyData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [236, 240, 241];
        }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Revenue Breakdown
    if (data.revenueByType && data.revenueByType.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Struktura prijmu', 15, yPosition);
      yPosition += 8;
      
      const revenueData = data.revenueByType.map(r => [
        r.type,
        formatCzk(r.amount),
        formatPercent(r.percentage)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Typ', 'Castka', 'Podil %']],
        body: revenueData,
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' }
        }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Costs Breakdown
    if (data.costsByType && data.costsByType.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Struktura nakladu', 15, yPosition);
      yPosition += 8;
      
      const costsData = data.costsByType.map(c => [
        c.type,
        formatCzk(c.amount),
        formatPercent(c.percentage)
      ]);
      
      autoTable(doc, {
        startY: yPosition,
        head: [['Typ', 'Castka', 'Podil %']],
        body: costsData,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 30, halign: 'right' }
        }
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }
    
    // Footer on every page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'CFO P/L Report - Confidential',
        15,
        pageHeight - 10
      );
      doc.text(
        `Strana ${i} / ${pageCount}`,
        pageWidth - 15,
        pageHeight - 10,
        { align: 'right' }
      );
    }
    
    // Generate filename
    const dateFrom = formatDate(data.dateFrom).replace(/\./g, '-');
    const dateTo = formatDate(data.dateTo).replace(/\./g, '-');
    const finalFilename = filename || `PL_CFO_${dateFrom}_to_${dateTo}.pdf`;
    
    // Save PDF
    doc.save(finalFilename);
    
    console.log(`PDF file exported: ${finalFilename}`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export PDF file');
  }
};
