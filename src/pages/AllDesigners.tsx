import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '@/api/axios';
import {
  Loader2, AlertCircle, UserCheck, UserX, UserMinus,
  Shield, ShieldCheck, Search as SearchIcon, CheckCircle, X,
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

type ModalType = 'suspend' | 'unsuspend' | 'reject' | null;

interface ActionModal {
  type: ModalType;
  designer: Designer | null;
}

export default function AllDesigners() {
  const { getToken } = useAuth();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<ActionModal>({ type: null, designer: null });
  const [reasonInput, setReasonInput] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const closeModal = () => {
    setModal({ type: null, designer: null });
    setReasonInput('');
  };

  const fetchDesigners = useCallback(async (page = 1, search = searchQuery) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (verifiedFilter !== 'all') params.append('verified', verifiedFilter);

      const res = await apiRequest('get', `/admin/designers?${params}`, token);

      if (res.data.success) {
        setDesigners(res.data.designers || []);
        setPagination(res.data.pagination || null);
        setCurrentPage(page);
      } else {
        setDesigners([]);
      }
    } catch (err) {
      console.error('Failed to fetch designers:', err);
      setDesigners([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter, verifiedFilter, searchQuery]);

  // Initial load
  useEffect(() => {
    fetchDesigners(1);
  }, []);

  // Debounced search + filter changes
  useEffect(() => {
    const timer = setTimeout(() => fetchDesigners(1, searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, verifiedFilter]);

  // ─── Direct actions (approve / verify / super-verify) ───────────────────────
  const handleDirectAction = async (id: string, action: string, value?: boolean) => {
    setActionLoading(id);
    try {
      const token = await getToken();
      if (!token) return;

      const endpointMap: Record<string, string> = {
        approve: `/admin/designers/${id}/approve`,
        verify: `/admin/designers/${id}/verify`,
        'super-verify': `/admin/designers/${id}/super-verify`,
      };

      const bodyMap: Record<string, object> = {
        approve: {},
        verify: { verified: value },
        'super-verify': { superVerified: value },
      };

      await apiRequest('patch', endpointMap[action], token, bodyMap[action]);
      showToast(`Designer ${action}d successfully`, 'success');
      fetchDesigners(currentPage);
    } catch {
      showToast(`Failed to ${action} designer`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Modal actions (suspend / unsuspend / reject — need confirmation) ────────
  const handleModalAction = async () => {
    const { type, designer } = modal;
    if (!type || !designer) return;

    if (type === 'suspend' && !reasonInput.trim()) {
      showToast('Please provide a reason for suspension', 'error');
      return;
    }
    if (type === 'reject' && !reasonInput.trim()) {
      showToast('Please provide a reason for rejection', 'error');
      return;
    }

    setActionLoading(designer._id);
    try {
      const token = await getToken();
      if (!token) return;

      if (type === 'suspend') {
        await apiRequest('patch', `/admin/designers/${designer._id}/suspend`, token, {
          suspended: true,
          reason: reasonInput,
        });
        showToast(`${designer.name} has been suspended`, 'success');
      } else if (type === 'unsuspend') {
        await apiRequest('patch', `/admin/designers/${designer._id}/suspend`, token, {
          suspended: false,
        });
        showToast(`${designer.name} has been reinstated`, 'success');
      } else if (type === 'reject') {
        await apiRequest('patch', `/admin/designers/${designer._id}/reject`, token, {
          reason: reasonInput,
        });
        showToast(`${designer.name}'s application has been rejected`, 'success');
      }

      closeModal();
      fetchDesigners(currentPage);
    } catch {
      showToast(`Action failed`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Modal config per action type
  const modalConfig = {
    suspend: {
      title: `Suspend ${modal.designer?.name}`,
      description: 'This designer will lose access to designer features immediately. They can be reinstated at any time.',
      confirmLabel: 'Confirm Suspension',
      confirmClass: 'bg-orange-600 hover:bg-orange-700',
      requiresReason: true,
      reasonPlaceholder: 'Reason for suspension (required)...',
    },
    unsuspend: {
      title: `Reinstate ${modal.designer?.name}`,
      description: 'This will restore full designer access to the platform.',
      confirmLabel: 'Confirm Reinstatement',
      confirmClass: 'bg-green-600 hover:bg-green-700',
      requiresReason: false,
      reasonPlaceholder: '',
    },
    reject: {
      title: `Reject ${modal.designer?.name}`,
      description: 'This application will be rejected and the designer will be notified.',
      confirmLabel: 'Confirm Rejection',
      confirmClass: 'bg-red-600 hover:bg-red-700',
      requiresReason: true,
      reasonPlaceholder: 'Reason for rejection (required)...',
    },
  };

  const currentModalConfig = modal.type ? modalConfig[modal.type] : null;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg text-white transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Designers</h1>
        {pagination && (
          <p className="text-sm text-gray-500 mt-1">{pagination.total} total designers</p>
        )}
      </div>

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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
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
                    <tr key={designer._id} className={`hover:bg-gray-50 ${
                      designer.designerProfile.status === 'suspended' ? 'bg-orange-50/40' : ''
                    }`}>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-gray-600">
                              {designer.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{designer.name}</p>
                            {designer.designerProfile.status === 'suspended' &&
                              designer.designerProfile.rejectionReason && (
                              <p className="text-xs text-orange-500 mt-0.5 max-w-[160px] truncate"
                                title={designer.designerProfile.rejectionReason}>
                                Reason: {designer.designerProfile.rejectionReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-gray-600 text-sm">{designer.email}</td>
                      <td className="px-6 py-5">{getStatusBadge(designer.designerProfile.status)}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          {designer.designerProfile.superVerified ? (
                            <><ShieldCheck className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-purple-700 font-medium">Super Verified</span></>
                          ) : designer.designerProfile.verified ? (
                            <><Shield className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs text-indigo-700 font-medium">Verified</span></>
                          ) : (
                            <span className="text-xs text-gray-400">Not Verified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-gray-500 text-sm">
                        {new Date(designer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap items-center justify-center gap-2">

                          {/* Pending actions */}
                          {designer.designerProfile.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleDirectAction(designer._id, 'approve')}
                                disabled={actionLoading === designer._id}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                {actionLoading === designer._id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <UserCheck className="w-3 h-3" />}
                                Approve
                              </button>
                              <button
                                onClick={() => setModal({ type: 'reject', designer })}
                                disabled={actionLoading === designer._id}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                <UserX className="w-3 h-3" /> Reject
                              </button>
                            </>
                          )}

                          {/* Approved actions */}
                          {designer.designerProfile.status === 'approved' && (
                            <button
                              onClick={() => setModal({ type: 'suspend', designer })}
                              disabled={actionLoading === designer._id}
                              className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <UserMinus className="w-3 h-3" /> Suspend
                            </button>
                          )}

                          {/* Suspended actions */}
                          {designer.designerProfile.status === 'suspended' && (
                            <button
                              onClick={() => setModal({ type: 'unsuspend', designer })}
                              disabled={actionLoading === designer._id}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3" /> Reinstate
                            </button>
                          )}

                          {/* Verification actions */}
                          {!designer.designerProfile.verified && (
                            <button
                              onClick={() => handleDirectAction(designer._id, 'verify', true)}
                              disabled={actionLoading === designer._id}
                              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Shield className="w-3 h-3" /> Verify
                            </button>
                          )}
                          {designer.designerProfile.verified && !designer.designerProfile.superVerified && (
                            <button
                              onClick={() => handleDirectAction(designer._id, 'super-verify', true)}
                              disabled={actionLoading === designer._id}
                              className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" /> Super Verify
                            </button>
                          )}
                        </div>
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
                  {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} designers
                </p>
                <div className="flex gap-2">
                  <button onClick={() => fetchDesigners(currentPage - 1)} disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 text-sm">
                    Previous
                  </button>
                  <button onClick={() => fetchDesigners(currentPage + 1)} disabled={currentPage === pagination.pages}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 text-sm">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {modal.type && modal.designer && currentModalConfig && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  modal.type === 'suspend' ? 'bg-orange-100' :
                  modal.type === 'unsuspend' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {modal.type === 'suspend' && <UserMinus className="w-5 h-5 text-orange-600" />}
                  {modal.type === 'unsuspend' && <UserCheck className="w-5 h-5 text-green-600" />}
                  {modal.type === 'reject' && <UserX className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{currentModalConfig.title}</h2>
                  <p className="text-sm text-gray-500">{modal.designer.email}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-5">{currentModalConfig.description}</p>

            {currentModalConfig.requiresReason && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder={currentModalConfig.reasonPlaceholder}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-28 resize-none text-sm"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={closeModal}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Cancel
              </button>
              <button
                onClick={handleModalAction}
                disabled={actionLoading === modal.designer._id}
                className={`px-5 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2 ${currentModalConfig.confirmClass} disabled:opacity-50`}
              >
                {actionLoading === modal.designer._id && <Loader2 className="w-4 h-4 animate-spin" />}
                {currentModalConfig.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}