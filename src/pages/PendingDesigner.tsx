// src/pages/admin/PendingDesigners.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '@/api/axios';
import {
  UserCheck, UserX, Loader2, AlertCircle, Eye, X, AlertTriangle,
  User, Award, CheckCircle, Mail, Phone, MapPin, Calendar,
  Briefcase, IdCard, ExternalLink
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
    responseTime: string;
    calendlyLink?: string;
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
  const [rejectModal, setRejectModal] = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchPendingDesigners = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) { setLoading(false); return; }

      const res = await apiRequest('get', '/admin/designers?status=pending', token);
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
      setSelectedDesigner(null);
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
      setSelectedDesigner(null);
    } catch (err) {
      alert('Failed to reject designer');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pending Designer Applications</h1>
          <p className="text-muted-foreground mt-1">
            Review and verify new designer applications
          </p>
        </div>
        <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl font-semibold">
          {designers.length} Pending
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-amber-900 mb-3 text-lg">Verification Checklist</h3>
            <ul className="text-sm text-amber-800 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Portfolio Quality:</strong> High-quality, original before/after images (minimum 3)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Identity Verification:</strong> Verify ID number matches the applicant's name</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>References:</strong> At least 2 professional references with valid contact info</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Profile Completeness:</strong> Professional bio (150+ chars) and accurate information</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Red Flags:</strong> Stolen images, fake references, incomplete info → Reject with reason</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading applications...</p>
        </div>
      ) : designers.length === 0 ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm p-20 text-center border-2 border-green-100">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-14 h-14 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold mb-3">All Caught Up!</h3>
          <p className="text-lg text-muted-foreground">No pending applications. Great work!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {designers.map((designer) => (
            <div
              key={designer._id}
              className="bg-card rounded-2xl shadow-sm border-2 border-border hover:border-primary/30 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  {/* Applicant Info */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{designer.name}</h3>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" />{designer.email}
                        </span>
                        {designer.phone && (
                          <span className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5" />{designer.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />{designer.designerProfile.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-xl">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Applied</p>
                      <p className="font-semibold flex items-center gap-1.5 text-sm">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(designer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Portfolio</p>
                      <p className="font-semibold text-sm">
                        {designer.designerProfile.portfolioImages.length} images
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">References</p>
                      <p className="font-semibold text-sm">
                        {designer.designerProfile.references.length} provided
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Starting Price</p>
                      <p className="font-semibold text-sm">
                        KSh {(designer.designerProfile.startingPrice / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setSelectedDesigner(designer)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 justify-center"
                  >
                    <Eye className="w-4 h-4" />
                    Review
                  </button>

                  <button
                    onClick={() => handleApprove(designer._id)}
                    disabled={actionLoading === designer._id}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 justify-center disabled:opacity-50"
                  >
                    {actionLoading === designer._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserCheck className="w-4 h-4" />
                    )}
                    Approve
                  </button>

                  <button
                    onClick={() => setRejectModal({ id: designer._id, open: true })}
                    disabled={actionLoading === designer._id}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 justify-center disabled:opacity-50"
                  >
                    <UserX className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Review Modal */}
      {selectedDesigner && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-6xl w-full my-8 border-2 border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b-2 border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center rounded-t-3xl z-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedDesigner.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Designer Application Review</p>
              </div>
              <button
                onClick={() => setSelectedDesigner(null)}
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto bg-white dark:bg-gray-900">
              {/* Personal Info */}
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <IdCard className="w-5 h-5" />
                  Personal Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">{selectedDesigner.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedDesigner.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedDesigner.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">National ID</p>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">
                      {selectedDesigner.designerProfile.idNumber || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Location</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedDesigner.designerProfile.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Response Time</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedDesigner.designerProfile.responseTime}</p>
                  </div>
                </div>
              </section>

              {/* About */}
              <section>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">About</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl">
                  <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                    {selectedDesigner.designerProfile.about}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    {selectedDesigner.designerProfile.about.length} characters
                  </p>
                </div>
              </section>

              {/* Styles */}
              <section>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Design Styles</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDesigner.designerProfile.styles.map(s => (
                    <span key={s} className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-xl text-sm font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </section>

              {/* Portfolio */}
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <Briefcase className="w-5 h-5" />
                  Portfolio ({selectedDesigner.designerProfile.portfolioImages.length} images)
                </h3>
                {selectedDesigner.designerProfile.portfolioImages.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg text-gray-600 dark:text-gray-400">No portfolio images uploaded</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedDesigner.designerProfile.portfolioImages.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedImage(url)}
                        className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer aspect-square bg-gray-100 dark:bg-gray-800"
                      >
                        <img
                          src={url}
                          alt={`Portfolio ${i + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                          <p className="text-white font-bold">View Full Size</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* References */}
              <section>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <Award className="w-5 h-5" />
                  Professional References
                </h3>
                {selectedDesigner.designerProfile.references.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No references provided</p>
                ) : (
                  <div className="space-y-4">
                    {selectedDesigner.designerProfile.references.map((ref, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl">
                        <div className="flex items-start justify-between gap-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Name</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{ref.name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{ref.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Relationship</p>
                              <p className="font-semibold text-gray-900 dark:text-white">{ref.relation}</p>
                            </div>
                          </div>
                          <a
                            href={`mailto:${ref.email}`}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                            title="Send email"
                          >
                            <Mail className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Social Links */}
              {selectedDesigner.designerProfile.socialLinks &&
                Object.values(selectedDesigner.designerProfile.socialLinks).some(Boolean) && (
                <section>
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Social Links</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedDesigner.designerProfile.socialLinks.instagram && (
                      <a
                        href={selectedDesigner.designerProfile.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Instagram
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {selectedDesigner.designerProfile.socialLinks.pinterest && (
                      <a
                        href={selectedDesigner.designerProfile.socialLinks.pinterest}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Pinterest
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {selectedDesigner.designerProfile.socialLinks.website && (
                      <a
                        href={selectedDesigner.designerProfile.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Website
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t-2 border-gray-200 dark:border-gray-700 p-6 flex justify-center gap-4 rounded-b-3xl z-10">
              <button
                onClick={() => {
                  handleApprove(selectedDesigner._id);
                }}
                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-lg font-medium shadow-lg"
              >
                <UserCheck className="w-5 h-5" />
                Approve Designer
              </button>
              <button
                onClick={() => {
                  setRejectModal({ id: selectedDesigner._id, open: true });
                  setSelectedDesigner(null);
                }}
                className="px-8 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 text-lg font-medium shadow-lg"
              >
                <UserX className="w-5 h-5" />
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedImage}
            alt="Portfolio full size"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Reject Application</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Provide a clear reason. The designer will see this message.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Portfolio appears to contain non-original work. Please submit your own designs."
              rows={5}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModal({ id: '', open: false });
                  setRejectionReason('');
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading !== null}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 justify-center disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Reject Designer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}