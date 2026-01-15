import { useAuth, SignedIn, useUser } from '@clerk/clerk-react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  UserCheck, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminApi } from '@/api/Admin'; // Make sure this path is correct

export default function AdminLayout() {
  const { signOut, isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = checking

  // Check if user is admin by trying a protected API call
useEffect(() => {
  if (!isLoaded) return;

  if (!isSignedIn) {
    setIsAdmin(false);
    return;
  }

  const checkAdminStatus = async () => {
    try {
      const token = await getToken();
      console.log('Token for admin check:', token ? 'Got token' : 'No token'); // Debug

      if (!token) {
        setIsAdmin(false);
        return;
      }

      const response = await adminApi.getStats(token);
      console.log('Admin stats response:', response); // Should log real stats for admin

      if (response && response.success) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (err: any) {
      console.error('Admin check error:', err);
      console.error('Status:', err?.response?.status);
      console.error('Data:', err?.response?.data);

      // Only treat 403 as "not admin" — other errors (network, 500) could be temporary
      if (err?.response?.status === 403) {
        setIsAdmin(false);
      } else {
        // Temporary error — don't lock out, retry or show loading
        setIsAdmin(false); // Safe default
      }
    }
  };

  checkAdminStatus();
}, [isLoaded, isSignedIn, getToken]);

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/pending-designers', label: 'Pending Designers', icon: UserCheck },
    { path: '/admin/designers', label: 'All Designers', icon: Users },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/projects', label: 'Projects', icon: Briefcase },
  ];

  // Loading or checking admin status
  if (!isLoaded || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-medium text-gray-700">Loading admin panel...</div>
      </div>
    );
  }

  // Not signed in → redirect to sign-in
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // Not admin → show access denied
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

  // === ADMIN CONFIRMED → Show full layout (your original code unchanged) ===
  return (
    <SignedIn>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile Sidebar Overlay */}
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
              <h1 className="text-2xl font-bold text-indigo-600">HudumaLink Admin</h1>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="h-16 bg-white shadow-sm border-b flex items-center justify-between px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'}
            </h2>
            <div className="w-10" /> {/* Spacer */}
          </header>

          <main className="flex-1 p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SignedIn>
  );
}