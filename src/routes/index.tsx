import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts';
import { Login, Dashboard, Settings } from '@/pages';
import { ProtectedRoute } from './ProtectedRoute';
import Dealers from '@/pages/Dealers';
import Leads from '@/pages/Leads';
import NewLead from '@/pages/NewLead';
import LeadDetail from '@/pages/LeadDetail';

// Placeholder komponenty pro chybějící stránky
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
        element: <PlaceholderPage title="Logy" />,
      },
      {
        path: 'reports',
        element: <PlaceholderPage title="Reporty" />,
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
