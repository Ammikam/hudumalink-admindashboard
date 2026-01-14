import { useEffect, useState } from 'react';
import { useAuth, SignOutButton } from '@clerk/clerk-react';
import { adminApi } from '@/api/Admin';

export default function AdminDashboard() {
  const { isLoaded, userId, getToken } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    const fetchStats = async () => {
      try {
        // FIXED: Removed { template: 'standard' }
        const token = await getToken();
        if (!token) {
          console.error('No token received from Clerk');
          return;
        }

        const data = await adminApi.getStats(token);
        setStats(data);
      } catch (err: any) {
        console.error('Error fetching stats:', err);
        if (err?.response?.status === 403) {
          setForbidden(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isLoaded, userId, getToken]);

  if (loading) {
    return <p>Loading admin dashboard...</p>;
  }

  if (forbidden) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-2">Access denied</h1>
        <p className="mb-4">You are signed in, but you are not an admin.</p>
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
        {JSON.stringify(stats, null, 2)}
      </pre>
    </div>
  );
}