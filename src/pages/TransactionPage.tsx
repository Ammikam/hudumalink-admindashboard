import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '@/api/axios';
import {
  Loader2, AlertCircle, CheckCircle, Search, Filter,
  DollarSign, TrendingUp, RefreshCw,
  Flag, ArrowDownCircle, RotateCcw, ChevronDown, X,
  Banknote, ShieldAlert,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Payment {
  _id: string;
  amount: number;
  platformFee: number;
  designerAmount: number;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'failed';
  paymentMethod: string;
  mpesaReceiptNumber?: string;
  mpesaPhoneNumber?: string;
  description: string;
  createdAt: string;
  heldAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  metadata?: any;
  project: { _id: string; title: string };
  client: { _id: string; name: string; email: string };
  designer: { _id: string; name: string; email: string };
}

interface Summary {
  totalRevenue: number;
  totalHeld: number;
  totalReleased: number;
  totalFailed: number;
  countHeld: number;
  countReleased: number;
  countPending: number;
  countFailed: number;
}

interface Pagination {
  page: number; limit: number; total: number; pages: number;
}

type ModalType = 'override' | 'release' | 'refund' | 'flag' | null;

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:  { label: 'Pending',  bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500'  },
  held:     { label: 'In Escrow', bg: 'bg-blue-100',  text: 'text-blue-800',  dot: 'bg-blue-500'    },
  released: { label: 'Released', bg: 'bg-green-100',  text: 'text-green-800', dot: 'bg-green-500'   },
  refunded: { label: 'Refunded', bg: 'bg-purple-100', text: 'text-purple-800',dot: 'bg-purple-500'  },
  failed:   { label: 'Failed',   bg: 'bg-red-100',    text: 'text-red-800',   dot: 'bg-red-500'     },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { getToken } = useAuth();

  const [payments, setPayments]     = useState<Payment[]>([]);
  const [summary, setSummary]       = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [showFilters, setShowFilters]   = useState(false);

  // Modal
  const [modal, setModal] = useState<{ type: ModalType; payment: Payment | null }>({ type: null, payment: null });
  const [modalInput, setModalInput] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('held');

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const closeModal = () => { setModal({ type: null, payment: null }); setModalInput(''); };

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;

      const params = new URLSearchParams({ page: page.toString(), limit: '15' });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim())          params.append('search', search.trim());
      if (dateFrom)               params.append('dateFrom', dateFrom);
      if (dateTo)                 params.append('dateTo', dateTo);

      const res  = await apiRequest('get', `/admin/payments?${params}`, token);
      const data = res.data;

      if (data.success) {
        setPayments(data.payments || []);
        setSummary(data.summary || null);
        setPagination(data.pagination || null);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken, statusFilter, search, dateFrom, dateTo]);

  useEffect(() => { fetchPayments(1); }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => fetchPayments(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handleAction = async () => {
    const { type, payment } = modal;
    if (!type || !payment) return;

    setActionLoading(payment._id);
    try {
      const token = await getToken();
      if (!token) return;

      if (type === 'override') {
        await apiRequest('patch', `/admin/payments/${payment._id}/status`, token, {
          status: overrideStatus,
          note: modalInput,
        });
        showToast(`Payment status updated to ${overrideStatus}`, 'success');
      } else if (type === 'release') {
        await apiRequest('post', `/admin/payments/${payment._id}/release`, token, { note: modalInput });
        showToast(`KSh ${payment.designerAmount.toLocaleString()} released to designer`, 'success');
      } else if (type === 'refund') {
        if (!modalInput.trim()) { showToast('Please provide a refund reason', 'error'); return; }
        await apiRequest('post', `/admin/payments/${payment._id}/refund`, token, { reason: modalInput });
        showToast('Payment marked as refunded. Project reopened.', 'success');
      } else if (type === 'flag') {
        if (!modalInput.trim()) { showToast('Please describe the issue', 'error'); return; }
        await apiRequest('post', `/admin/payments/${payment._id}/flag`, token, { reason: modalInput });
        showToast('Payment flagged for investigation', 'success');
      }

      closeModal();
      fetchPayments(currentPage);
    } catch (err) {
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const formatAmount = (n: number) => `KSh ${n.toLocaleString()}`;

  const isDisputed = (p: Payment) => !!p.metadata?.dispute?.flagged;

  // ─── Modal config ────────────────────────────────────────────────────────────
  const MODAL_CONFIG = {
    override: {
      title: 'Override Payment Status',
      icon: <RefreshCw className="w-5 h-5 text-indigo-600" />,
      iconBg: 'bg-indigo-100',
      confirmLabel: 'Apply Override',
      confirmClass: 'bg-indigo-600 hover:bg-indigo-700',
      requiresInput: false,
      inputLabel: 'Note (optional)',
      inputPlaceholder: 'Reason for override...',
    },
    release: {
      title: 'Release Payment to Designer',
      icon: <ArrowDownCircle className="w-5 h-5 text-green-600" />,
      iconBg: 'bg-green-100',
      confirmLabel: 'Confirm Release',
      confirmClass: 'bg-green-600 hover:bg-green-700',
      requiresInput: false,
      inputLabel: 'Note (optional)',
      inputPlaceholder: 'Reason for admin release...',
    },
    refund: {
      title: 'Issue Refund to Client',
      icon: <RotateCcw className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-100',
      confirmLabel: 'Confirm Refund',
      confirmClass: 'bg-purple-600 hover:bg-purple-700',
      requiresInput: true,
      inputLabel: 'Reason for refund *',
      inputPlaceholder: 'Explain why this payment is being refunded...',
    },
    flag: {
      title: 'Flag as Disputed',
      icon: <Flag className="w-5 h-5 text-orange-600" />,
      iconBg: 'bg-orange-100',
      confirmLabel: 'Flag Payment',
      confirmClass: 'bg-orange-600 hover:bg-orange-700',
      requiresInput: true,
      inputLabel: 'Describe the issue *',
      inputPlaceholder: 'What is the dispute or issue with this payment?',
    },
  };

  const currentModal = modal.type ? MODAL_CONFIG[modal.type] : null;

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          {pagination && <p className="text-sm text-gray-500 mt-1">{pagination.total} total payments</p>}
        </div>
        <button onClick={() => fetchPayments(currentPage)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Platform Revenue',  value: formatAmount(summary.totalRevenue),  icon: <TrendingUp className="w-5 h-5 text-green-600" />,  bg: 'bg-green-50',  sub: 'From held + released' },
            { label: 'In Escrow',         value: formatAmount(summary.totalHeld),     icon: <Banknote className="w-5 h-5 text-blue-600" />,     bg: 'bg-blue-50',   sub: `${summary.countHeld} payments` },
            { label: 'Released',          value: formatAmount(summary.totalReleased), icon: <CheckCircle className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50', sub: `${summary.countReleased} payments` },
            { label: 'Failed / Pending',  value: `${summary.countFailed + summary.countPending}`, icon: <ShieldAlert className="w-5 h-5 text-red-600" />, bg: 'bg-red-50', sub: `${summary.countFailed} failed · ${summary.countPending} pending` },
          ].map((card) => (
            <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-white`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-600">{card.label}</p>
                {card.icon}
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {/* Status tabs */}
          {(['all', 'pending', 'held', 'released', 'refunded', 'failed'] as const).map((s) => (
            <button key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {/* Search by receipt */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt no..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48" />
          </div>

          {/* Date filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition ${
              showFilters || dateFrom || dateTo ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'hover:bg-gray-50'
            }`}>
            <Filter className="w-4 h-4" /> Date
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date range inputs */}
      {showFilters && (
        <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-xl border">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700">
              <X className="w-4 h-4" /> Clear dates
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Project</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Client</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Designer</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Receipt</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                    <th className="px-5 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((payment) => {
                    const cfg = STATUS_CONFIG[payment.status];
                    const disputed = isDisputed(payment);

                    return (
                      <tr key={payment._id} className={`hover:bg-gray-50 ${disputed ? 'bg-orange-50/40' : ''}`}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900 text-sm max-w-[160px] truncate">
                            {payment.project?.title ?? '—'}
                          </p>
                          {disputed && (
                            <span className="inline-flex items-center gap-1 text-xs text-orange-600 mt-0.5">
                              <Flag className="w-3 h-3" /> Disputed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">{payment.client?.name ?? '—'}</p>
                          <p className="text-xs text-gray-500">{payment.client?.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">{payment.designer?.name ?? '—'}</p>
                          <p className="text-xs text-gray-500">{payment.designer?.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-gray-900">{formatAmount(payment.amount)}</p>
                          <p className="text-xs text-gray-500">Fee: {formatAmount(payment.platformFee)}</p>
                          <p className="text-xs text-green-600">→ {formatAmount(payment.designerAmount)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-mono text-gray-600">
                            {payment.mpesaReceiptNumber || '—'}
                          </p>
                          <p className="text-xs text-gray-400">{payment.mpesaPhoneNumber || ''}</p>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          <p>{formatDate(payment.createdAt)}</p>
                          {payment.heldAt     && <p className="text-blue-500">Held: {formatDate(payment.heldAt)}</p>}
                          {payment.releasedAt && <p className="text-green-500">Released: {formatDate(payment.releasedAt)}</p>}
                          {payment.refundedAt && <p className="text-purple-500">Refunded: {formatDate(payment.refundedAt)}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1">
                            {/* Release — only for held */}
                            {payment.status === 'held' && (
                              <button title="Release to designer"
                                onClick={() => setModal({ type: 'release', payment })}
                                className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition">
                                <ArrowDownCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Refund — for held or pending */}
                            {['held', 'pending'].includes(payment.status) && (
                              <button title="Issue refund"
                                onClick={() => setModal({ type: 'refund', payment })}
                                className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Flag — all statuses except refunded */}
                            {payment.status !== 'refunded' && !disputed && (
                              <button title="Flag as disputed"
                                onClick={() => setModal({ type: 'flag', payment })}
                                className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition">
                                <Flag className="w-4 h-4" />
                              </button>
                            )}

                            {/* Override — for stuck pending or any manual fix */}
                            <button title="Override status"
                              onClick={() => { setOverrideStatus('held'); setModal({ type: 'override', payment }); }}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
                  <button onClick={() => fetchPayments(currentPage - 1)} disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 text-sm">Previous</button>
                  <button onClick={() => fetchPayments(currentPage + 1)} disabled={currentPage === pagination.pages}
                    className="px-4 py-2 border rounded-lg hover:bg-white disabled:opacity-50 text-sm">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Modal */}
      {modal.type && modal.payment && currentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentModal.iconBg}`}>
                  {currentModal.icon}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{currentModal.title}</h2>
                  <p className="text-sm text-gray-500">{modal.payment.project?.title}</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Payment info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Amount</span>
                <span className="font-semibold">{formatAmount(modal.payment.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform Fee</span>
                <span>{formatAmount(modal.payment.platformFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Designer Gets</span>
                <span className="text-green-600 font-semibold">{formatAmount(modal.payment.designerAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Status</span>
                <span className={`font-medium ${STATUS_CONFIG[modal.payment.status].text}`}>
                  {STATUS_CONFIG[modal.payment.status].label}
                </span>
              </div>
            </div>

            {/* Override: status selector */}
            {modal.type === 'override' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['pending', 'held', 'released', 'refunded', 'failed'].map((s) => (
                    <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Text input for note/reason */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentModal.inputLabel}
              </label>
              <textarea value={modalInput} onChange={(e) => setModalInput(e.target.value)}
                placeholder={currentModal.inputPlaceholder}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none" />
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={closeModal}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAction} disabled={actionLoading === modal.payment._id}
                className={`px-5 py-2.5 rounded-lg text-white text-sm font-medium flex items-center gap-2 ${currentModal.confirmClass} disabled:opacity-50`}>
                {actionLoading === modal.payment._id && <Loader2 className="w-4 h-4 animate-spin" />}
                {currentModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}