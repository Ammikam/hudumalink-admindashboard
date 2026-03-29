import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '@/api/axios';
import { Search, Shield, Loader2, AlertCircle, Ban, CheckCircle } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  roles: string[];
  createdAt: string;
  banned?: boolean;
  banReason?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function UsersPage() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banModal, setBanModal] = useState<{ user: User | null; open: boolean }>({
    user: null,
    open: false,
  });
  const [banReason, setBanReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async (page = 1, searchTerm = search) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await apiRequest('get', `/admin/users?${params}`, token);
      const data = res.data;

      if (data.success && data.users) {
        setUsers(data.users);
        setPagination(data.pagination || null);
        setCurrentPage(page);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, search]);

  // Initial load
  useEffect(() => {
    fetchUsers(1);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1, search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBanToggle = async () => {
    const user = banModal.user;
    if (!user) return;

    const isBanning = !user.banned;
    if (isBanning && !banReason.trim()) {
      showToast('Please provide a reason for banning', 'error');
      return;
    }

    setActionLoading(user._id);
    try {
      const token = await getToken();
      if (!token) return;

      const res = await apiRequest('patch', `/admin/users/${user._id}/ban`, token, {
        banned: isBanning,
        reason: isBanning ? banReason : undefined,
      });

      if (res.data.success) {
        showToast(isBanning ? `${user.name} has been banned` : `${user.name} has been unbanned`, 'success');
        setBanModal({ user: null, open: false });
        setBanReason('');
        fetchUsers(currentPage);
      } else {
        showToast(res.data.error || 'Action failed', 'error');
      }
    } catch (err) {
      showToast('Failed to update user status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadges = (roles: string[]) => {
    const badgeStyles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      designer: 'bg-indigo-100 text-indigo-800',
      client: 'bg-gray-100 text-gray-800',
    };
    return roles.map((role) => (
      <span key={role} className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeStyles[role] || badgeStyles.client}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg text-white transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-1">{pagination.total} total users</p>
          )}
        </div>
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Roles</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Joined</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className={`hover:bg-gray-50 ${user.banned ? 'bg-red-50/40' : ''}`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-gray-600">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            {user.roles.includes('admin') && (
                              <p className="text-xs text-purple-600 flex items-center gap-1 mt-0.5">
                                <Shield className="w-3 h-3" /> Administrator
                              </p>
                            )}
                            {user.banned && user.banReason && (
                              <p className="text-xs text-red-500 mt-0.5 max-w-[160px] truncate" title={user.banReason}>
                                Reason: {user.banReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-gray-600 text-sm">{user.email}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1">{getRoleBadges(user.roles)}</div>
                      </td>
                      <td className="px-6 py-5">
                        {user.banned ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Banned</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-gray-500 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => setBanModal({ user, open: true })}
                          disabled={actionLoading === user._id || user.roles.includes('admin')}
                          title={user.roles.includes('admin') ? 'Cannot ban an admin' : ''}
                          className={`px-4 py-2 rounded-lg text-white text-sm flex items-center gap-2 mx-auto transition ${
                            user.banned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {actionLoading === user._id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Ban className="w-4 h-4" />
                          }
                          {user.banned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pagination.limit + 1}–
                  {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => fetchUsers(currentPage - 1)} disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    Previous
                  </button>
                  <button onClick={() => fetchUsers(currentPage + 1)} disabled={currentPage === pagination.pages}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ban / Unban Modal */}
      {banModal.open && banModal.user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                banModal.user.banned ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Ban className={`w-5 h-5 ${banModal.user.banned ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {banModal.user.banned ? 'Unban' : 'Ban'} {banModal.user.name}
                </h2>
                <p className="text-sm text-gray-500">{banModal.user.email}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-5 text-sm">
              {banModal.user.banned
                ? 'This will restore full platform access for this user.'
                : 'This user will immediately lose access to the platform.'}
            </p>

            {!banModal.user.banned && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for ban <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Explain why this user is being banned..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 h-28 resize-none text-sm"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setBanModal({ user: null, open: false }); setBanReason(''); }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBanToggle}
                disabled={actionLoading === banModal.user._id}
                className={`px-5 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2 ${
                  banModal.user.banned ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {actionLoading === banModal.user._id && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm {banModal.user.banned ? 'Unban' : 'Ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}