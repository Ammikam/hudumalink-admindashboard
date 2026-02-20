import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '@/api/axios';
import { Search, Shield, Loader2, AlertCircle, Ban } from 'lucide-react';


interface BackendResponse {
  success: boolean;
  users?: User[];
  pagination?: Pagination;
  error?: string;
}

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
  const [banModal, setBanModal] = useState<{ id: string; banned: boolean; open: boolean }>({
    id: '',
    banned: false,
    open: false,
  });
  const [banReason, setBanReason] = useState('');

  const fetchUsers = async (page = 1) => {
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
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const axiosResponse = await apiRequest('get', `/admin/users?${params}`, token);

      const data: BackendResponse = axiosResponse.data;  

      if (data.success && data.users) {
        setUsers(data.users);
        setPagination(data.pagination || null);
        setCurrentPage(page);
      } else {
        console.error('API error:', data.error || 'Unknown error');
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [search]);

  const handleBanToggle = async () => {
    if (banModal.banned && !banReason.trim()) {
      alert('Please provide a reason for banning');
      return;
    }

    setActionLoading(banModal.id);
    try {
      const token = await getToken();
      if (!token) return;

      const axiosResponse = await apiRequest(
        'patch',
        `/admin/users/${banModal.id}/ban`,
        token,
        {
          banned: banModal.banned,
          reason: banModal.banned ? banReason : undefined,
        }
      );

      const data = axiosResponse.data as BackendResponse;

      if (data.success) {
        setBanModal({ id: '', banned: false, open: false });
        setBanReason('');
        fetchUsers(currentPage);
      } else {
        alert(data.error || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Ban request failed:', err);
      alert('Failed to update user status');
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
      <span
        key={role}
        className={`px-3 py-1 rounded-full text-xs font-medium ${badgeStyles[role] || badgeStyles.client}`}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    ));
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchUsers(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>

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
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-600">
                              {user.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            {user.roles.includes('admin') && (
                              <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                                <Shield className="w-4 h-4" /> Administrator
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-gray-600">{user.email}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {getRoleBadges(user.roles)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {user.banned ? (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            Banned
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() =>
                            setBanModal({
                              id: user._id,
                              banned: !user.banned,
                              open: true,
                            })
                          }
                          disabled={actionLoading === user._id || user.roles.includes('admin')}
                          className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 mx-auto transition ${
                            user.banned
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <Ban className="w-4 h-4" />
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
                  Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
                  {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchUsers(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchUsers(currentPage + 1)}
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

      {/* Ban/Unban Modal */}
      {banModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {banModal.banned ? 'Ban User' : 'Unban User'}
            </h2>
            <p className="text-gray-600 mb-6">
              {banModal.banned
                ? 'This user will no longer be able to access the platform. Please provide a reason.'
                : 'This will restore access to the platform.'}
            </p>

            {banModal.banned && (
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for banning (required)"
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 h-32 resize-none"
              />
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setBanModal({ id: '', banned: false, open: false });
                  setBanReason('');
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBanToggle}
                disabled={actionLoading === banModal.id}
                className={`px-6 py-3 rounded-lg text-white flex items-center gap-2 ${
                  banModal.banned ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {actionLoading === banModal.id && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm {banModal.banned ? 'Ban' : 'Unban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}