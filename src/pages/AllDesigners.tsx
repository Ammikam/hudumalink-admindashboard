import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '@/api/axios';
import {
  Loader2,
  AlertCircle,
  UserCheck,
  UserX,
  UserMinus,
  Shield,
  ShieldCheck,
  Search as SearchIcon, // ← Renamed to avoid conflict
} from 'lucide-react';

interface Designer {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  designerProfile: {
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    verified: boolean;
    superVerified: boolean;
    rejectionReason?: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AllDesigners() {
  const { getToken } = useAuth();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // ← Renamed from 'search'
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDesigners = async (page = 1) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (verifiedFilter !== 'all') params.append('verified', verifiedFilter);

      const res = await apiRequest('get', `/admin/designers?${params}`, token);

      if (res.data.success) {
        setDesigners(res.data.designers || []);
        setPagination(res.data.pagination || null);
        setCurrentPage(page);
      } else {
        console.error('API error:', res.data.error);
        setDesigners([]);
      }
    } catch (err) {
      console.error('Failed to fetch designers:', err);
      setDesigners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigners(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDesigners(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, verifiedFilter, getToken]);

  const handleAction = async (id: string, action: string, value?: boolean | string) => {
    setActionLoading(id);
    try {
      const token = await getToken();
      if (!token) return;

      let endpoint = '';
      let body: any = {};

      switch (action) {
        case 'approve':
          endpoint = `/admin/designers/${id}/approve`;
          break;
        case 'reject':
          endpoint = `/admin/designers/${id}/reject`;
          body = { reason: value || 'Rejected by admin' };
          break;
        case 'suspend':
          endpoint = `/admin/designers/${id}/suspend`;
          body = { suspended: value, reason: value ? 'Suspended by admin' : undefined };
          break;
        case 'verify':
          endpoint = `/admin/designers/${id}/verify`;
          body = { verified: value };
          break;
        case 'super-verify':
          endpoint = `/admin/designers/${id}/super-verify`;
          body = { superVerified: value };
          break;
      }

      await apiRequest('patch', endpoint, token, body);
      fetchDesigners(currentPage);
    } catch (err) {
      alert(`Failed to ${action} designer`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          styles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">All Designers</h1>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <SearchIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Verification</option>
            <option value="true">Verified</option>
            <option value="false">Not Verified</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading designers...</p>
          </div>
        ) : designers.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No designers found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Designer</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Verification</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Joined</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {designers.map((designer) => (
                    <tr key={designer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-600">
                              {designer.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">{designer.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-gray-600">{designer.email}</td>
                      <td className="px-6 py-5">{getStatusBadge(designer.designerProfile.status)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {designer.designerProfile.verified && (
                            <Shield className="w-5 h-5 text-indigo-600" />
                          )}
                          {designer.designerProfile.superVerified && (
                            <ShieldCheck className="w-5 h-5 text-purple-600" />
                          )}
                          <span className="text-sm text-gray-600">
                            {designer.designerProfile.superVerified
                              ? 'Super Verified'
                              : designer.designerProfile.verified
                              ? 'Verified'
                              : 'Not Verified'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-gray-600">
                        {new Date(designer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {designer.designerProfile.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAction(designer._id, 'approve')}
                                disabled={actionLoading === designer._id}
                                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                <UserCheck className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(designer._id, 'reject', 'Incomplete profile')}
                                disabled={actionLoading === designer._id}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                <UserX className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                          {designer.designerProfile.status === 'approved' && (
                            <button
                              onClick={() => handleAction(designer._id, 'suspend', true)}
                              disabled={actionLoading === designer._id}
                              className="px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <UserMinus className="w-4 h-4" />
                              Suspend
                            </button>
                          )}
                          {designer.designerProfile.status === 'suspended' && (
                            <button
                              onClick={() => handleAction(designer._id, 'suspend', false)}
                              disabled={actionLoading === designer._id}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              Unsuspend
                            </button>
                          )}
                          {!designer.designerProfile.verified && (
                            <button
                              onClick={() => handleAction(designer._id, 'verify', true)}
                              disabled={actionLoading === designer._id}
                              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Shield className="w-4 h-4" />
                              Verify
                            </button>
                          )}
                          {designer.designerProfile.verified && !designer.designerProfile.superVerified && (
                            <button
                              onClick={() => handleAction(designer._id, 'super-verify', true)}
                              disabled={actionLoading === designer._id}
                              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Super Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
                  {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total}{' '}
                  designers
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchDesigners(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchDesigners(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}