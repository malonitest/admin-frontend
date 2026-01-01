import logoSvg from '@/assets/logo.svg';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';

interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: Array<{ 
    name: string; 
    href: string; 
    external?: boolean;
    children?: Array<{ name: string; href: string }>;
  }>;
}

// Menu položky podle vzoru
const navigation: NavItem[] = [
  { name: 'Statistiky', href: '/', icon: StatsIcon },
  { name: 'Pronájmy', href: '/leases', icon: LeaseIcon },
  {
    name: 'Leady',
    href: '/leads',
    icon: LeadIcon,
    children: [
      { name: 'Všechny leady', href: '/leads?reset=1' },
      { name: 'Schválen AM', href: '/leads/am-approved' },
      { name: 'Technik', href: '/leads/technician' },
      { name: 'FŘ - k vyplacení', href: '/leads/finance-payout' },
    ],
  },
  { name: 'Obchodníci', href: '/dealers', icon: DealersIcon },
  { name: 'Faktury', href: '/invoices', icon: InvoiceIcon },
  { name: 'Logy', href: '/logs', icon: LogIcon },
  {
    name: 'Časový funnel',
    href: '/time-funnel',
    icon: StatsIcon,
    children: [
      { name: 'New->Schválen AM', href: '/time-funnel/new-to-am-approved' },
      { name: 'SchválenAM->Technik', href: '/time-funnel/am-approved-to-technician' },
      { name: 'Technik->FŘ', href: '/time-funnel/technician-to-finance' },
    ],
  },
  { 
    name: 'Nové Reporty', 
    href: '/new-reports', 
    icon: ReportsIcon,
    children: [
      { name: 'Investor Report', href: '/new-reports/investor' },
      { name: 'KPI Investor', href: '/new-reports/kpi' },
      { name: 'Financial P/L', href: '/new-reports/financial' },
      { name: 'CFO P/L Report', href: '/new-reports/financial-pl' },
      { name: 'Funnel Technik', href: '/new-reports/funnel-technik' },
      { name: 'Car Stats', href: '/new-reports/car-stats' },
      { name: 'Admin Dashboard', href: '/new-reports/admin-dashboard' },
      { name: 'CC Report', href: '/new-reports/cc' },
      { name: 'Marketing Report', href: '/new-reports/marketing' },
      { name: 'Funnel General', href: '/new-reports/funnel' },
    ]
  },
  { name: 'Kalkulátor splátek', href: '/calculator', icon: CalculatorIcon },
  { name: 'DriveBot - Carvex', href: '/drivebot', icon: DriveBotIcon },
  { name: 'Kontakty', href: '/contacts', icon: ContactIcon },
];

function StatsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function LeaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function LeadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

function DealersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function InvoiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function LogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CalculatorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
    </svg>
  );
}

function ContactIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function DriveBotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const toggleSubmenu = (name: string) => {
    setExpandedMenus(prev => 
      prev.includes(name) 
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const isSubmenuExpanded = (name: string) => expandedMenus.includes(name);

  // Získání jména uživatele
  const userName = user?.name || user?.email?.split('@')[0] || 'Admin';

  const renderNavItem = (item: NavItem, mobile: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = item.icon ? isActive(item.href) : false;
    const isExpanded = isSubmenuExpanded(item.name);

    if (hasChildren && item.icon) {
      // Top-level menu with icon (e.g., "Reporty")
      return (
        <div key={item.href}>
          <button
            onClick={() => toggleSubmenu(item.name)}
            className={`w-full flex items-center justify-between px-3 py-2.5 mb-0.5 rounded text-sm transition-colors ${
              isItemActive
                ? 'bg-white/20 text-white'
                : 'text-white/90 hover:bg-white/10'
            } ${sidebarCollapsed && !mobile ? 'justify-center' : ''}`}
          >
            <div className="flex items-center">
              <item.icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed && !mobile ? '' : 'mr-3'}`} />
              {(!sidebarCollapsed || mobile) && <span>{item.name}</span>}
            </div>
            {(!sidebarCollapsed || mobile) && (
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            )}
          </button>
          {isExpanded && (!sidebarCollapsed || mobile) && (
            <div className="ml-4 pl-4 border-l border-white/20">
              {item.children!.map((child) => {
                const childHasChildren = child.children && child.children.length > 0;
                const childExpanded = isSubmenuExpanded(`${item.name}-${child.name}`);
                
                if (childHasChildren) {
                  // Second-level submenu (e.g., "CC" with "Funnel 1")
                  return (
                    <div key={child.href}>
                      <button
                        onClick={() => toggleSubmenu(`${item.name}-${child.name}`)}
                        className="w-full flex items-center justify-between px-3 py-2 mb-0.5 rounded text-sm transition-colors text-white/80 hover:bg-white/10"
                      >
                        <span>{child.name}</span>
                        <ChevronDownIcon className={`w-3 h-3 transition-transform ${childExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      {childExpanded && (
                        <div className="ml-4 pl-3 border-l border-white/10">
                          {child.children!.map((subChild) => (
                            <Link
                              key={subChild.href}
                              to={subChild.href}
                              onClick={mobile ? () => setSidebarOpen(false) : undefined}
                              className={`flex items-center px-3 py-1.5 mb-0.5 rounded text-xs transition-colors ${
                                location.pathname === subChild.href
                                  ? 'bg-white/20 text-white'
                                  : 'text-white/70 hover:bg-white/10'
                              }`}
                            >
                              {subChild.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                // Regular second-level item
                if (child.external) {
                  return (
                    <a
                      key={child.href}
                      href={child.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={mobile ? () => setSidebarOpen(false) : undefined}
                      className="flex items-center px-3 py-2 mb-0.5 rounded text-sm transition-colors text-white/80 hover:bg-white/10"
                    >
                      {child.name}
                      <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  );
                }

                return (
                  <Link
                    key={child.href}
                    to={child.href}
                    onClick={mobile ? () => setSidebarOpen(false) : undefined}
                    className={`flex items-center px-3 py-2 mb-0.5 rounded text-sm transition-colors ${
                      location.pathname === child.href
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {child.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Regular menu item without children
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={mobile ? () => setSidebarOpen(false) : undefined}
        title={sidebarCollapsed && !mobile ? item.name : undefined}
        className={`flex items-center px-3 py-2.5 mb-0.5 rounded text-sm transition-colors ${
          isItemActive
            ? 'bg-white/20 text-white'
            : 'text-white/90 hover:bg-white/10'
        } ${sidebarCollapsed && !mobile ? 'justify-center' : ''}`}
      >
        {item.icon && <item.icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed && !mobile ? '' : 'mr-3'}`} />}
        {(!sidebarCollapsed || mobile) && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#8B1A1A] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#8B1A1A]">
          <div>
            <div className="text-white text-sm font-medium">CashNdrive</div>
            <div className="text-white/80 text-xs">Admin: {userName}</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-white hover:bg-white/10 rounded"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 mt-2 px-2 overflow-y-auto">
          {navigation.map((item) => renderNavItem(item, true))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div 
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-56'
        }`}
      >
        <div className="flex flex-col flex-grow min-h-0 bg-[#8B1A1A]">
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className={sidebarCollapsed ? 'hidden' : ''}>
              <div className="text-white text-sm font-medium">CashNdrive</div>
              <div className="text-white/80 text-xs">Admin: {userName}</div>
            </div>
            {/* Hamburger toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-white hover:bg-white/10 rounded transition-colors"
              title={sidebarCollapsed ? 'Rozbalit menu' : 'Sbalit menu'}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="w-5 h-5" />
              ) : (
                <ChevronLeftIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 min-h-0 mt-2 px-2 overflow-y-auto">
            {navigation.map((item) => renderNavItem(item, false))}
          </nav>
        </div
      ></div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#C41E3A] shadow-sm">
          <div className="flex items-center justify-between h-14 px-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-white hover:bg-white/10 rounded lg:hidden"
            >
              <MenuIcon className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex-1 flex justify-center">
              <img src={logoSvg} alt="Cash n Drive" className="h-8" />
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-3">
              <span className="text-white/90 text-sm hidden md:block">{user?.email}</span>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Odhlásit se
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
