import { useAuth, SignedIn } from '@clerk/clerk-react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  UserCheck, 
  LogOut,
  Menu,
  X,
  DollarSign,
} from 'lucide-react';
import { useState, useEffect } from 'react';


export default function AdminLayout() {
  const { signOut, isLoaded, isSignedIn, getToken } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setIsAdmin(false);
      return;
    }

const checkAdminStatus = async () => {
  try {
    const token = await getToken();
    if (!token) { setIsAdmin(false); return; }

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    setIsAdmin(!!(data.success && data.user?.roles?.includes('admin')));
  } catch (err) {
    console.error('Admin check error:', err);
    setIsAdmin(false);
  }
};

    checkAdminStatus();
  }, [isLoaded, isSignedIn, getToken]);

  const menuItems = [
    { path: '/admin',                   label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/admin/pending-designers', label: 'Pending Designers', icon: UserCheck       },
    { path: '/admin/designers',         label: 'All Designers',     icon: Users           },
    { path: '/admin/users',             label: 'Users',             icon: Users           },
    { path: '/admin/projects',          label: 'Projects',          icon: Briefcase       },
    { path: '/admin/transactions',      label: 'Transactions',      icon: DollarSign      },
  ];

  if (!isLoaded || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-medium text-gray-700">Loading admin panel...</div>
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-xl bg-white p-10 text-center shadow-xl">
          <h1 className="mb-4 text-3xl font-bold text-red-600">Access Denied</h1>
          <p className="mb-8 text-lg text-gray-700">
            You do not have administrator privileges.
          </p>
          <button
            onClick={() => signOut()}
            className="rounded-lg bg-indigo-600 px-8 py-3 text-white hover:bg-indigo-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <SignedIn>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-full flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b">
              <h1 className="text-xl font-bold text-indigo-600">HudumaLink Admin</h1>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                // Exact match for dashboard, startsWith for the rest
                const isActive = item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t">
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-white shadow-sm border-b flex items-center justify-between px-6 flex-shrink-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {menuItems.find(item =>
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path)
              )?.label || 'Admin Panel'}
            </h2>
            <div className="w-10" />
          </header>

          <main className="flex-1 p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SignedIn>
  );
}