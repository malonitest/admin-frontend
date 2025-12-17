/**
 * CFO P/L Report Module Exports
 * No Czech diacritics allowed
 */

// Main component
export { CfoPLReportPage } from './CfoPLReportPage';
export { default } from './CfoPLReportPage';

// Components
export { KPICards } from './components/KPICards';
export { MonthlyPLTable } from './components/MonthlyPLTable';
export { TrendCharts } from './components/TrendCharts';
export { CFOInsights } from './components/CFOInsights';
export { InvoicesSection } from './components/InvoicesSection';
export { PaymentsSection } from './components/PaymentsSection';
export { MonthDetailModal } from './components/MonthDetailModal';

// Utilities
export * from './utils/formatters';
export * from './utils/calculations';
export * from './utils/validation';

// Export functions
export * from './export/excel';
export * from './export/pdf';

// Types
export * from './types';
