import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { adminApi } from '@/api/Admin';
import { Search, UserCheck, UserX, Loader2, AlertCircle } from 'lucide-react';

interface Designer {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  designerProfile: {
    status: string;
    rejectionReason?: string;
    // add more fields if needed
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function PendingDesigners() {
  const { getToken } = useAuth();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; open: boolean }>({
    id: '',
    open: false,
  });
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPendingDesigners = async (page = 1, query = '') => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      // Use general designers endpoint with status=pending filter
      const params = new URLSearchParams({
        status: 'pending',
        page: page.toString(),
        limit: '10',
      });
      if (query) params.append('search', query);

      const res = await fetch(`/api/admin/designers?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setDesigners(data.designers);
        setPagination(data.pagination);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch pending designers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDesigners(1, search);
  }, [search]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const token = await getToken();
      if (!token) return;

      await adminApi.approveDesigner(id, token);
      fetchPendingDesigners(currentPage, search);
    } catch (err) {
      alert('Failed to approve designer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setActionLoading(rejectModal.id);
    try {
      const token = await getToken();
      if (!token) return;

      await adminApi.rejectDesigner(rejectModal.id, rejectionReason, token);
      setRejectModal({ id: '', open: false });
      setRejectionReason('');
      fetchPendingDesigners(currentPage, search);
    } catch (err) {
      alert('Failed to reject designer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPendingDesigners(1, search);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Pending Designers</h1>

        <form onSubmit={handleSearch} className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading pending designers...</p>
          </div>
        ) : designers.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No pending designers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Designer</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Email</th>
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
                          {/* You can add avatar img here if available */}
                          <span className="text-xl font-bold text-gray-600">
                            {designer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{designer.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-600">{designer.email}</td>
                    <td className="px-6 py-5 text-gray-600">
                      {new Date(designer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleApprove(designer._id)}
                          disabled={actionLoading === designer._id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <UserCheck className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: designer._id, open: true })}
                          disabled={actionLoading === designer._id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                          <UserX className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
              {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} designers
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchPendingDesigners(currentPage - 1, search)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchPendingDesigners(currentPage + 1, search)}
                disabled={currentPage === pagination.pages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reject Designer</h2>
            <p className="text-gray-600 mb-6">
              Please provide a reason for rejection. This will be visible to the designer.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Incomplete portfolio, missing qualifications..."
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 h-32 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRejectModal({ id: '', open: false });
                  setRejectionReason('');
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === rejectModal.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Reject Designer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}