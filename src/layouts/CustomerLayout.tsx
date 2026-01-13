import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`;

export function CustomerLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-gray-900">Cash&amp;Drive</div>
            <div className="text-xs text-gray-500">Zákaznický účet</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">{user?.name || user?.email}</div>
            <button
              onClick={() => logout()}
              className="px-3 py-2 rounded-md text-sm font-medium bg-gray-900 text-white hover:bg-gray-800"
            >
              Odhlásit
            </button>
          </div>
        </div>

        <nav className="border-t bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex gap-2 flex-wrap">
            <NavLink to="/customer/lead" className={navLinkClass}>
              Detail leadu
            </NavLink>
            <NavLink to="/customer/gallery" className={navLinkClass}>
              Fotogalerie
            </NavLink>
            <NavLink to="/customer/info" className={navLinkClass}>
              Lead informace
            </NavLink>
            <NavLink to="/customer/invoices" className={navLinkClass}>
              Faktury
            </NavLink>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default CustomerLayout;
