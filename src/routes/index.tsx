import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { 
  Login, 
  Dashboard, 
  Settings, 
  DriveBot, 
  ReportsCC, 
  ReportsOS, 
  ReportsMarketing, 
  LogsPage, 
  ReportsKPIInvestor, 
  ReportsFinancial, 
  ReportsCollection, 
  Reports3KPI, 
  Reports3Financial, 
  Reports3Funnel, 
  Reports3Cars,
  NewReportsKPIInvestor,
  NewReportsFinancial,
  NewReportsFunnelTechnik,
  NewReportsCarStats,
  NewReportsMarketingCosts
} from '@/pages';
import { ProtectedRoute } from './ProtectedRoute';
import Dealers from '@/pages/Dealers';
import Leads from '@/pages/Leads';
import LeasesAdministration from '@/pages/LeasesAdministration';
import NewLeadV2 from '@/pages/NewLeadV2';
import LeadDetail from '@/pages/LeadDetail';
import LeadDetailV2 from '@/pages/LeadDetailV2';
import InfoDetailLead from '@/pages/InfoDetailLead';
import FinanceDetailLead from '@/pages/FinanceDetailLead';
import ReportsCCFunnel1 from '@/pages/ReportsCCFunnel1';
import ReportsTechnik from '@/pages/ReportsTechnik';
import ReportsCCFunnelTechnik from '@/pages/ReportsCCFunnelTechnik';
import ReportsCars from '@/pages/ReportsCars';
import Reports2KPI from '@/pages/Reports2KPI';
import Reports2Financial from '@/pages/Reports2Financial';
import Reports2FunnelTechnik from '@/pages/Reports2FunnelTechnik';
import Reports2CarStats from '@/pages/Reports2CarStats';
import TimeFunnelNewToDecisionPage from '@/pages/TimeFunnelNewToDecision';
import TimeFunnelAmApprovedToTechnicianPage from '@/pages/TimeFunnelAmApprovedToTechnician';
import TimeFunnelTechnicianToFinancePage from '@/pages/TimeFunnelTechnicianToFinance';
import TimeFunnelFinanceToPaidOutPage from '@/pages/TimeFunnelFinanceToPaidOut';
import { InvestorReport } from '@/reports/investor';
import { FunnelReportPage } from '@/reports/funnel';
import FinancialPL from '@/pages/NewReports/FinancialPL';
import { Marketing } from '../pages/NewReports/Marketing';
import { MarketingCosts } from '../pages/NewReports/MarketingCosts';

// Placeholder komponenty pro chybějící stránky
// eslint-disable-next-line react-refresh/only-export-components
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
      Tato stránka bude brzy k dispozici.
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    // Full-screen pages without AdminLayout
    path: '/leads/new',
    element: (
      <ProtectedRoute>
        <NewLeadV2 />
      </ProtectedRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'time-funnel',
        element: <Navigate to="/time-funnel/new-to-am-approved" replace />,
      },
      {
        path: 'time-funnel/new-to-am-approved',
        element: <TimeFunnelNewToDecisionPage />,
      },
      {
        path: 'time-funnel/am-approved-to-technician',
        element: <TimeFunnelAmApprovedToTechnicianPage />,
      },
      {
        path: 'time-funnel/technician-to-finance',
        element: <TimeFunnelTechnicianToFinancePage />,
      },
      {
        path: 'time-funnel/finance-to-paid-out',
        element: <TimeFunnelFinanceToPaidOutPage />,
      },
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'leases',
        element: <Leads forcedLeadState="CONVERTED" title="Pronájmy" />,
      },
      {
        path: 'leases/administration',
        element: <LeasesAdministration />,
      },
      {
        path: 'leads',
        element: <Leads />,
      },
      {
        path: 'leads/am-approved',
        element: <Leads forcedLeadState="SUPERVISOR_APPROVED" />,
      },
      {
        path: 'leads/call-plan',
        element: <Leads forcedLeadState="SUPERVISOR_APPROVED" forcedSubStatus="CALL_AT_SPECIFIC_TIME" title="Plán hovoru" enableCallPlanReminders />,
      },
      {
        path: 'leads/technician',
        element: <Leads forcedLeadState="UPLOAD_DOCUMENTS" variant="TECHNICIAN" />,
      },
      {
        path: 'leads/finance-payout',
        element: <Leads forcedLeadState="FINAL_APPROVAL" />,
      },
      {
        path: 'leads/:id',
        element: <LeadDetail />,
      },
      {
        path: 'leads/:id/v2',
        element: <LeadDetailV2 />,
      },
      {
        path: 'leads/:id/info',
        element: <InfoDetailLead />,
      },
      {
        path: 'leads/:id/finance',
        element: <FinanceDetailLead />,
      },
      {
        path: 'dealers',
        element: <Dealers />,
      },
      {
        path: 'dealers/:id',
        element: <PlaceholderPage title="Detail obchodníka" />,
      },
      {
        path: 'invoices',
        element: <PlaceholderPage title="Faktury" />,
      },
      {
        path: 'logs',
        element: <LogsPage />,
      },
      {
        path: 'reports',
        element: <PlaceholderPage title="Reporty" />,
      },
      {
        path: 'reports/cc',
        element: <ReportsCC />,
      },
      {
        path: 'reports/cc/funnel1',
        element: <ReportsCCFunnel1 />,
      },
      {
        path: 'reports/os',
        element: <ReportsOS />,
      },
      {
        path: 'reports/marketing',
        element: <ReportsMarketing />,
      },
      {
        path: 'reports/technik',
        element: <ReportsTechnik />,
      },
      {
        path: 'reports/technik/funnel',
        element: <ReportsCCFunnelTechnik />,
      },
      {
        path: 'reports/finance',
        element: <ReportsFinancial />,
      },
      {
        path: 'reports/kpi',
        element: <ReportsKPIInvestor />,
      },
      {
        path: 'reports/cars',
        element: <ReportsCars />,
      },
      {
        path: 'reports/collection',
        element: <ReportsCollection />,
      },
      // Reports2 routes - new report pages
      {
        path: 'reports2/kpi',
        element: <Reports2KPI />,
      },
      {
        path: 'reports2/financial',
        element: <Reports2Financial />,
      },
      {
        path: 'reports2/funnel-technik',
        element: <Reports2FunnelTechnik />,
      },
      {
        path: 'reports2/cars',
        element: <Reports2CarStats />,
      },
      {
        path: 'reports3/kpi',
        element: <Reports3KPI />,
      },
      {
        path: 'reports3/financial',
        element: <Reports3Financial />,
      },
      {
        path: 'reports3/funnel',
        element: <Reports3Funnel />,
      },
      {
        path: 'reports3/cars',
        element: <Reports3Cars />,
      },
      // New Reports routes - based on FRONTEND-REPORTS-AND-DRIVEBOT-GUIDE.md
      {
        path: 'new-reports/kpi',
        element: <NewReportsKPIInvestor />,
      },
      {
        path: 'new-reports/financial',
        element: <NewReportsFinancial />,
      },
      {
        path: 'new-reports/funnel-technik',
        element: <NewReportsFunnelTechnik />,
      },
      {
        path: 'new-reports/car-stats',
        element: <NewReportsCarStats />,
      },
      {
        path: 'new-reports/marketing-costs',
        element: <NewReportsMarketingCosts />,
      },
      {
        path: 'new-reports/admin-dashboard',
        element: <PlaceholderPage title="Admin Dashboard" />,
      },
      {
        path: 'new-reports/cc',
        element: <PlaceholderPage title="CC Report" />,
      },
      {
        path: 'new-reports/marketing',
        element: (
          <ProtectedRoute>
            <AdminLayout>
              <Marketing />
            </AdminLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: 'new-reports/funnel',
        element: <FunnelReportPage />,
      },
      // Investor Report - Professional KPI Report
      {
        path: 'new-reports/investor',
        element: <InvestorReport />,
      },
      // CFO P/L Report - NEW
      {
        path: 'new-reports/financial-pl',
        element: <FinancialPL />,
      },
      {
        path: 'calculator',
        element: <PlaceholderPage title="Kalkulátor splátek" />,
      },
      {
        path: 'contacts',
        element: <PlaceholderPage title="Kontakty" />,
      },
      {
        path: 'drivebot',
        element: <DriveBot />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
