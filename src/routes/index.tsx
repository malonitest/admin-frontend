import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Login, Dashboard, Settings, DriveBot, ReportsCC, ReportsOS, ReportsMarketing, LogsPage, ReportsKPIInvestor, ReportsFinancial, ReportsCollection } from '@/pages';
import { ProtectedRoute } from './ProtectedRoute';
import Dealers from '@/pages/Dealers';
import Leads from '@/pages/Leads';
import NewLead from '@/pages/NewLead';
import LeadDetail from '@/pages/LeadDetail';
import ReportsCCFunnel1 from '@/pages/ReportsCCFunnel1';
import ReportsTechnik from '@/pages/ReportsTechnik';
import ReportsCCFunnelTechnik from '@/pages/ReportsCCFunnelTechnik';
import ReportsCars from '@/pages/ReportsCars';

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
        <NewLead />
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
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'leases',
        element: <PlaceholderPage title="Pronájmy" />,
      },
      {
        path: 'leads',
        element: <Leads />,
      },
      {
        path: 'leads/:id',
        element: <LeadDetail />,
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
