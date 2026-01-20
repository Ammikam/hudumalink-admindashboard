import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '@/api/axios';
import {
  Search,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  Eye,
  X,
  AlertTriangle,
  User,
  Award,
  CheckCircle,
} from 'lucide-react';

interface Designer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  designerProfile: {
    status: string;
    idNumber?: string;
    portfolioImages: string[];
    credentials: string[];
    references: { name: string; email: string; relation: string }[];
    location: string;
    about: string;
    styles: string[];
    startingPrice: number;
    socialLinks?: {
      instagram?: string;
      pinterest?: string;
      website?: string;
    };
  };
}

export default function PendingDesigners() {
  const { getToken } = useAuth();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; open: boolean }>({
    id: '',
    open: false,
  });
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPendingDesigners = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await apiRequest('get', '/admin/designers?status=pending', token);
      // res is AxiosResponse → access .data
      if (res.data.success) {
        setDesigners(res.data.designers || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending designers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDesigners();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const token = await getToken();
      if (!token) return;
      await apiRequest('patch', `/admin/designers/${id}/approve`, token);
      fetchPendingDesigners();
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
      await apiRequest('patch', `/admin/designers/${rejectModal.id}/reject`, token, {
        reason: rejectionReason,
      });
      setRejectModal({ id: '', open: false });
      setRejectionReason('');
      fetchPendingDesigners();
    } catch (err) {
      alert('Failed to reject designer');
    } finally {
      setActionLoading(null);
    }
  };

return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Pending Designer Applications</h1>
        <div className="text-sm text-gray-600">
          {designers.length} application{designers.length !== 1 ? 's' : ''} awaiting review
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex gap-4">
          <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-amber-800 mb-2">Verification Guidelines</h3>
            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
              <li>Portfolio: High-quality, original before/after images</li>
              <li>Check for stolen images (reverse search if suspicious)</li>
              <li>Profile must be complete and professional</li>
              <li>Verify credentials if provided</li>
              <li>Cross-check ID number with name</li>
              <li>Reject with clear reason if any doubt</li>
            </ul>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600" />
          <p className="mt-4 text-lg">Loading applications...</p>
        </div>
      ) : designers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-20 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold mb-4">No Pending Applications</h3>
          <p className="text-gray-600">All designers have been reviewed. Great job!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {designers.map((designer) => (
            <div
              key={designer._id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-dashed flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{designer.name}</h3>
                      <p className="text-gray-600">{designer.email}</p>
                      {designer.phone && <p className="text-sm text-gray-500">{designer.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Applied</p>
                      <p className="font-medium">
                        {new Date(designer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Portfolio</p>
                      <p className="font-medium">
                        {designer.designerProfile.portfolioImages.length} images
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Credentials</p>
                      <p className="font-medium">
                        {designer.designerProfile.credentials.length} file
                        {designer.designerProfile.credentials.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">References</p>
                      <p className="font-medium">
                        {designer.designerProfile.references.length} provided
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedDesigner(designer)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Review
                  </button>

                  <button
                    onClick={() => handleApprove(designer._id)}
                    disabled={actionLoading === designer._id}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === designer._id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                    Approve
                  </button>

                  <button
                    onClick={() => setRejectModal({ id: designer._id, open: true })}
                    disabled={actionLoading === designer._id}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                  >
                    <UserX className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Preview Modal */}
      {selectedDesigner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold">Review: {selectedDesigner.name}</h2>
              <button
                onClick={() => setSelectedDesigner(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-10">
              {/* Personal Info */}
              <section>
                <h3 className="text-2xl font-bold mb-6">Personal Information</h3>
                <div className="bg-gray-50 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-semibold text-lg">{selectedDesigner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-lg">{selectedDesigner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-lg">
                      {selectedDesigner.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">National ID</p>
                    <p className="font-semibold text-lg">
                      {selectedDesigner.designerProfile.idNumber || 'Not provided'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Portfolio */}
              <section>
                <h3 className="text-2xl font-bold mb-6">
                  Portfolio ({selectedDesigner.designerProfile.portfolioImages.length} images)
                </h3>
                {selectedDesigner.designerProfile.portfolioImages.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600">No portfolio images uploaded</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedDesigner.designerProfile.portfolioImages.map((url, i) => (
                      <div key={i} className="group relative rounded-xl overflow-hidden shadow-lg">
                        <img
                          src={url}
                          alt={`Portfolio ${i + 1}`}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                          <p className="text-white opacity-0 group-hover:opacity-100 font-bold text-xl">
                            Image {i + 1}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Credentials */}
              <section>
                <h3 className="text-2xl font-bold mb-6">Professional Credentials</h3>
                {selectedDesigner.designerProfile.credentials.length === 0 ? (
                  <p className="text-gray-600">No credentials uploaded</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedDesigner.designerProfile.credentials.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition flex items-center gap-4"
                      >
                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <Award className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium">Credential {i + 1}</p>
                          <p className="text-sm text-indigo-600">Click to view document</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {/* References */}
              <section>
                <h3 className="text-2xl font-bold mb-6">Professional References</h3>
                {selectedDesigner.designerProfile.references.length === 0 ? (
                  <p className="text-gray-600">No references provided</p>
                ) : (
                  <div className="space-y-4">
                    {selectedDesigner.designerProfile.references.map((ref, i) => (
                      <div key={i} className="bg-gray-50 p-6 rounded-xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="font-semibold">{ref.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-semibold">{ref.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Relationship</p>
                            <p className="font-semibold">{ref.relation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Action Buttons */}
              <div className="flex justify-center gap-6 pt-8 border-t">
                <button
                  onClick={() => {
                    handleApprove(selectedDesigner._id);
                    setSelectedDesigner(null);
                  }}
                  className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-3 text-lg font-medium"
                >
                  <UserCheck className="w-6 h-6" />
                  Approve Designer
                </button>
                <button
                  onClick={() => {
                    setRejectModal({ id: selectedDesigner._id, open: true });
                    setSelectedDesigner(null);
                  }}
                  className="px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-3 text-lg font-medium"
                >
                  <UserX className="w-6 h-6" />
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-6">
              Please provide a reason. This will be shown to the designer.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Portfolio appears to contain non-original work..."
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 resize-none"
            />
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setRejectModal({ id: '', open: false });
                  setRejectionReason('');
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Reject Designer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}