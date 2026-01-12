import { useEffect, useState } from 'react';
import { useAuth, SignOutButton } from '@clerk/clerk-react';
import { adminApi } from '@/api/Admin';

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const data = await adminApi.getStats();
        setStats(data.stats);
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setForbidden(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <p>Loading admin dashboard...</p>;
  }

  if (forbidden) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Access denied</h1>
        <p>You are signed in, but you are not an admin.</p>
        <SignOutButton />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
