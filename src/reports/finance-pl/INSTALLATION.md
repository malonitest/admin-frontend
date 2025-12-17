# CFO P/L Report - Installation Guide

## Installation

The CFO P/L Report module requires additional dependencies for PDF export.

### Install Dependencies

```bash
cd apps/frontend
npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf
```

## Dependencies Added

- **jspdf** (^2.5.1): PDF generation library
- **jspdf-autotable** (^3.8.0): Auto table plugin for jsPDF
- **@types/jspdf** (^2.0.0): TypeScript types for jsPDF

## Verify Installation

After installation, verify that the packages are in `package.json`:

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/jspdf": "^2.0.0"
  }
}
```

## Usage

### Import and Use PDF Export

```typescript
import { exportToPDF } from '@/reports/finance-pl/export/pdf';
import { IFinancialReportData } from '@/reports/finance-pl';

// Export to PDF
const handleExportPDF = async () => {
  try {
    await exportToPDF(data);
  } catch (error) {
    console.error('PDF export failed:', error);
  }
};
```

### Features

? **A4 Portrait Layout**  
? **Multi-page Support** with automatic page breaks  
? **Headers & Footers** on every page  
? **Page Numbers**  
? **KPI Summary** with formatted tables  
? **Monthly P/L Statement** with conditional formatting  
? **Revenue & Costs Breakdown**  
? **Professional Styling** (grid tables, colors, bold totals)  

## File Structure

```
apps/frontend/src/reports/finance-pl/
??? export/
?   ??? excel.ts           # Excel/CSV export
?   ??? pdf.ts             # PDF export (NEW)
??? components/
?   ??? MonthDetailModal.tsx  # Month drill-down modal (NEW)
??? CfoPLReportPage.tsx    # Main page with PDF button
```

## Testing

```bash
npm run dev
```

1. Navigate to Financial P/L Report
2. Click **?? PDF** button
3. PDF file downloads automatically: `PL_CFO_DD-MM-YYYY_to_DD-MM-YYYY.pdf`

## Troubleshooting

### Error: "Module not found: jspdf"

**Solution:**
```bash
cd apps/frontend
npm install jspdf jspdf-autotable
```

### Error: "Cannot find module '@types/jspdf'"

**Solution:**
```bash
cd apps/frontend
npm install --save-dev @types/jspdf
```

### PDF Export Fails

1. Check console for errors
2. Verify data is loaded (not null)
3. Check browser console for jsPDF errors

## Browser Support

- ? Chrome/Edge (v90+)
- ? Firefox (v88+)
- ? Safari (v14+)

## Next Steps

After installation, the CFO P/L Report module is **fully functional** with:
- ? KPI Cards
- ? Monthly P/L Table (20 columns)
- ? Trend Charts
- ? CFO Insights
- ? Invoices & Payments (Audit mode)
- ? Excel Export (.xlsx + CSV)
- ? **PDF Export** (NEW)
- ? **Month Detail Modal** (NEW)
- ? Print-ready CSS
