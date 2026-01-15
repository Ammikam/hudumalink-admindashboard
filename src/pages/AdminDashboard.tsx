import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { adminApi } from '@/api/Admin';
import { Users, UserCheck, Briefcase, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Stats {
  users: {
    total: number;
    clients: number;
    designers: number;
    pendingDesigners: number;
    approvedDesigners: number;
    verifiedDesigners: number;
    superVerifiedDesigners: number;
  };
  projects: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
  };
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await adminApi.getStats(token);
        setStats(data.stats);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getToken]);

  const statCards = [
    { label: 'Total Users', value: stats?.users.total ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Clients', value: stats?.users.clients ?? 0, icon: Users, color: 'bg-green-500' },
    { label: 'Total Designers', value: stats?.users.designers ?? 0, icon: UserCheck, color: 'bg-purple-500' },
    { label: 'Pending Approval', value: stats?.users.pendingDesigners ?? 0, icon: AlertCircle, color: 'bg-yellow-500' },
    { label: 'Verified Designers', value: stats?.users.verifiedDesigners ?? 0, icon: CheckCircle, color: 'bg-indigo-500' },
    { label: 'Total Projects', value: stats?.projects.total ?? 0, icon: Briefcase, color: 'bg-pink-500' },
    { label: 'Open Projects', value: stats?.projects.open ?? 0, icon: Clock, color: 'bg-orange-500' },
    { label: 'Completed Projects', value: stats?.projects.completed ?? 0, icon: CheckCircle, color: 'bg-teal-500' },
  ];

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Admin!</h1>
        <p className="text-gray-600">Here's what's happening on HudumaLink today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-600 font-medium">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Designer Status Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Approval</span>
              <span className="font-bold text-yellow-600">{stats?.users.pendingDesigners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Approved</span>
              <span className="font-bold text-green-600">{stats?.users.approvedDesigners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Verified</span>
              <span className="font-bold text-indigo-600">{stats?.users.verifiedDesigners}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Super Verified</span>
              <span className="font-bold text-purple-600">{stats?.users.superVerifiedDesigners}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Project Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Open</span>
              <span className="font-bold text-orange-600">{stats?.projects.open}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">In Progress</span>
              <span className="font-bold text-blue-600">{stats?.projects.inProgress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed</span>
              <span className="font-bold text-teal-600">{stats?.projects.completed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}