import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/api/Admin';
import {
  Users, UserCheck, Briefcase, Clock,
  CheckCircle, AlertCircle, DollarSign,
  TrendingUp, Banknote, ArrowRight,
} from 'lucide-react';

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

interface PaymentSummary {
  totalRevenue: number;
  totalHeld: number;
  totalReleased: number;
  countHeld: number;
  countReleased: number;
  countPending: number;
  countFailed: number;
}

export default function Dashboard() {
  const { getToken } = useAuth();
  const [stats, setStats]               = useState<Stats | null>(null);
  const [payments, setPayments]         = useState<PaymentSummary | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const [statsData, paymentsRes] = await Promise.all([
          adminApi.getStats(token),
          fetch(`${import.meta.env.VITE_API_URL}/admin/payments?limit=1`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsData.stats) setStats(statsData.stats);

        const paymentsData = await paymentsRes.json();
        if (paymentsData.success && paymentsData.summary) {
          setPayments(paymentsData.summary);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [getToken]);

  const formatKsh = (n: number) => `KSh ${n.toLocaleString()}`;

  const statCards = [
    { label: 'Total Users',       value: stats?.users.total ?? 0,           icon: Users,     color: 'bg-blue-500'   },
    { label: 'Clients',           value: stats?.users.clients ?? 0,         icon: Users,     color: 'bg-green-500'  },
    { label: 'Total Designers',   value: stats?.users.designers ?? 0,       icon: UserCheck, color: 'bg-purple-500' },
    { label: 'Pending Approval',  value: stats?.users.pendingDesigners ?? 0,icon: AlertCircle,color: 'bg-yellow-500'},
    { label: 'Verified Designers',value: stats?.users.verifiedDesigners ?? 0,icon: CheckCircle,color:'bg-indigo-500'},
    { label: 'Total Projects',    value: stats?.projects.total ?? 0,        icon: Briefcase, color: 'bg-pink-500'   },
    { label: 'Open Projects',     value: stats?.projects.open ?? 0,         icon: Clock,     color: 'bg-orange-500' },
    { label: 'Completed Projects',value: stats?.projects.completed ?? 0,    icon: CheckCircle,color:'bg-teal-500'  },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome back, Admin!</h1>
        <p className="text-gray-500">Here's what's happening on HudumaLink today.</p>
      </div>

      {/* ── User & Project stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color} text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-3xl font-bold text-gray-900">
                  {card.value.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-600 font-medium text-sm">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Financial Summary ── */}
      {payments && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Financial Overview
            </h3>
            <Link to="/admin/transactions"
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View all transactions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Platform Revenue',
                value: formatKsh(payments.totalRevenue),
                icon: <TrendingUp className="w-5 h-5 text-green-600" />,
                bg: 'bg-green-50',
                sub: 'Total fees collected',
              },
              {
                label: 'In Escrow',
                value: formatKsh(payments.totalHeld),
                icon: <Banknote className="w-5 h-5 text-blue-600" />,
                bg: 'bg-blue-50',
                sub: `${payments.countHeld} active payments`,
              },
              {
                label: 'Released',
                value: formatKsh(payments.totalReleased),
                icon: <CheckCircle className="w-5 h-5 text-indigo-600" />,
                bg: 'bg-indigo-50',
                sub: `${payments.countReleased} completed`,
              },
              {
                label: 'Needs Attention',
                value: `${payments.countFailed + payments.countPending}`,
                icon: <AlertCircle className="w-5 h-5 text-red-500" />,
                bg: 'bg-red-50',
                sub: `${payments.countFailed} failed · ${payments.countPending} pending`,
              },
            ].map((card) => (
              <div key={card.label} className={`${card.bg} rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-600">{card.label}</p>
                  {card.icon}
                </div>
                <p className="text-lg font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detail Breakdowns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Designer Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Pending Approval',  value: stats?.users.pendingDesigners,   color: 'text-yellow-600' },
              { label: 'Approved',          value: stats?.users.approvedDesigners,  color: 'text-green-600'  },
              { label: 'Verified',          value: stats?.users.verifiedDesigners,  color: 'text-indigo-600' },
              { label: 'Super Verified',    value: stats?.users.superVerifiedDesigners, color: 'text-purple-600' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-600 text-sm">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.value ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Project Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Open',        value: stats?.projects.open,        color: 'text-orange-600' },
              { label: 'In Progress', value: stats?.projects.inProgress,  color: 'text-blue-600'   },
              { label: 'Completed',   value: stats?.projects.completed,   color: 'text-teal-600'   },
              { label: 'Total',       value: stats?.projects.total,       color: 'text-gray-900'   },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-600 text-sm">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.value ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}