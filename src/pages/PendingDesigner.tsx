// src/pages/admin/PendingDesigners.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { apiRequest } from '@/api/axios';
import {
  UserCheck, UserX, Loader2, Eye, X, CheckCircle, Mail, Phone, MapPin,
  Briefcase, IdCard, ExternalLink,  AlertCircle,
  Clock, Globe,  DollarSign, Timer,
  ChevronRight, Shield, FileText, Users, Star
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
    socialLinks?: { instagram?: string; pinterest?: string; website?: string };
  };
}

function getPairs(images: string[]) {
  const pairs: { before: string; after: string }[] = [];
  for (let i = 0; i + 1 < images.length; i += 2) {
    pairs.push({ before: images[i], after: images[i + 1] });
  }
  return pairs;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
];

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function PendingDesigners() {
  const { getToken } = useAuth();
  const [designers, setDesigners]               = useState<Designer[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null);
  const [actionLoading, setActionLoading]       = useState<string | null>(null);
  const [rejectModal, setRejectModal]           = useState<{ id: string; open: boolean }>({ id: '', open: false });
  const [rejectionReason, setRejectionReason]   = useState('');
  const [lightboxImage, setLightboxImage]       = useState<string | null>(null);
  const [activeTab, setActiveTab]               = useState<'info' | 'portfolio' | 'references'>('info');

  const fetchPending = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await apiRequest('get', '/admin/designers?status=pending', token);
      if (res.data.success) setDesigners(res.data.designers || []);
    } catch { console.error('Fetch failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const token = await getToken();
      if (!token) return;
      await apiRequest('patch', `/admin/designers/${id}/approve`, token);
      fetchPending();
      setSelectedDesigner(null);
    } catch { alert('Failed to approve'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) { alert('Please provide a reason'); return; }
    setActionLoading(rejectModal.id);
    try {
      const token = await getToken();
      if (!token) return;
      await apiRequest('patch', `/admin/designers/${rejectModal.id}/reject`, token, { reason: rejectionReason });
      setRejectModal({ id: '', open: false });
      setRejectionReason('');
      fetchPending();
      setSelectedDesigner(null);
    } catch { alert('Failed to reject'); }
    finally { setActionLoading(null); }
  };

  const openReview = (d: Designer) => {
    setSelectedDesigner(d);
    setActiveTab('info');
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pending Applications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review and verify new designer applications</p>
        </div>
        {!loading && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            designers.length > 0
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${designers.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {designers.length} Pending
          </div>
        )}
      </div>

      {/* ── Verification checklist ── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-semibold text-amber-800">Verification Checklist</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-y-1.5 gap-x-6">
          {[
            ['Portfolio', 'Genuine before/after pairs — min 2 projects'],
            ['Identity', 'ID number matches the applicant name'],
            ['References', 'At least 2 with valid contact info'],
            ['Bio', '150+ char professional bio'],
            ['Red flags', 'Stolen images / fake refs → reject with reason'],
          ].map(([bold, rest]) => (
            <div key={bold} className="flex items-start gap-2 text-xs">
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
              <span className="text-amber-900/70">
                <span className="font-semibold text-amber-900">{bold}:</span> {rest}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="rounded-xl border border-border bg-card flex flex-col items-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading applications…</p>
        </div>
      ) : designers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="font-semibold mb-1">All caught up!</h3>
          <p className="text-sm text-muted-foreground">No pending applications right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {designers.map((d) => {
            const pairs = getPairs(d.designerProfile.portfolioImages);
            const initials = getInitials(d.name);
            const avatarColor = getAvatarColor(d.name);
            const isActioning = actionLoading === d._id;

            return (
              <div key={d._id} className="rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all duration-200 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm`}>
                      {initials}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      {/* Name row */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div>
                          <p className="font-semibold text-sm">{d.name}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />{d.email}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />{d.designerProfile.location}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => openReview(d)}
                            className="h-8 px-3 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted transition flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Review
                          </button>
                          <button
                            onClick={() => handleApprove(d._id)}
                            disabled={isActioning}
                            className="h-8 px-3 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: d._id, open: true })}
                            disabled={isActioning}
                            className="h-8 px-3 text-xs font-medium rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <UserX className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>

                      {/* Stats pills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          { icon: Briefcase, label: `${pairs.length} project pairs` },
                          { icon: Users, label: `${d.designerProfile.references.length} references` },
                          { icon: DollarSign, label: `KSh ${(d.designerProfile.startingPrice / 1000).toFixed(0)}k starting` },
                          { icon: Star, label: `${d.designerProfile.styles.length} styles` },
                        ].map(({ icon: Icon, label }) => (
                          <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground">
                            <Icon className="w-3 h-3" />{label}
                          </span>
                        ))}
                      </div>

                      {/* Portfolio strip */}
                      {pairs.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-0.5">
                          {pairs.slice(0, 3).map((pair, i) => (
                            <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
                              <div className="relative group">
                                <img
                                  src={pair.before}
                                  alt="before"
                                  onClick={() => setLightboxImage(pair.before)}
                                  className="w-[72px] h-12 object-cover rounded-lg border border-border cursor-pointer group-hover:brightness-90 transition"
                                />
                                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-orange-500 text-white px-1 py-px rounded leading-tight">B</span>
                              </div>
                              <ChevronRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                              <div className="relative group">
                                <img
                                  src={pair.after}
                                  alt="after"
                                  onClick={() => setLightboxImage(pair.after)}
                                  className="w-[72px] h-12 object-cover rounded-lg border border-border cursor-pointer group-hover:brightness-90 transition"
                                />
                                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-emerald-600 text-white px-1 py-px rounded leading-tight">A</span>
                              </div>
                            </div>
                          ))}
                          {pairs.length > 3 && (
                            <button
                              onClick={() => openReview(d)}
                              className="w-[72px] h-12 rounded-lg bg-muted border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition flex-shrink-0"
                            >
                              +{pairs.length - 3} more
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail panel ─────────────────────────────────────────────────────── */}
      {selectedDesigner && (() => {
        const d = selectedDesigner;
        const pairs = getPairs(d.designerProfile.portfolioImages);
        const avatarColor = getAvatarColor(d.name);

        return (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
              onClick={() => setSelectedDesigner(null)}
            />

            {/* Panel — fully hardcoded light mode, no CSS variables */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col bg-white border-l border-zinc-200 shadow-2xl">

              {/* Header */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-200 bg-zinc-50">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {getInitials(d.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-zinc-900 leading-tight">{d.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{d.email}</p>
                </div>
                <button
                  onClick={() => setSelectedDesigner(null)}
                  className="p-1.5 hover:bg-zinc-100 rounded-lg transition flex-shrink-0 text-zinc-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-zinc-200 bg-zinc-50">
                {([
                  { id: 'info',       label: 'Info',       icon: IdCard },
                  { id: 'portfolio',  label: 'Portfolio',  icon: Briefcase },
                  { id: 'references', label: 'References', icon: Users },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    {id === 'portfolio' && (
                      <span className={`text-[10px] px-1.5 py-px rounded-full font-semibold ${
                        pairs.length >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {pairs.length}
                      </span>
                    )}
                    {id === 'references' && (
                      <span className={`text-[10px] px-1.5 py-px rounded-full font-semibold ${
                        d.designerProfile.references.length >= 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {d.designerProfile.references.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto bg-white">

                {/* ── INFO TAB ── */}
                {activeTab === 'info' && (
                  <div className="p-5 space-y-5">

                    {/* Key details grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'National ID', value: d.designerProfile.idNumber || '—', icon: IdCard, highlight: true },
                        { label: 'Location',    value: d.designerProfile.location,         icon: MapPin,    highlight: false },
                        { label: 'Starting Price', value: `KSh ${d.designerProfile.startingPrice.toLocaleString()}`, icon: DollarSign, highlight: false },
                        { label: 'Response Time',  value: d.designerProfile.responseTime,  icon: Timer,     highlight: false },
                      ].map(({ label, value, icon: Icon, highlight }) => (
                        <div key={label} className={`rounded-xl p-3 border ${highlight ? 'border-blue-200 bg-blue-50' : 'border-zinc-200 bg-zinc-50'}`}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Icon className={`w-3 h-3 ${highlight ? 'text-blue-600' : 'text-zinc-400'}`} />
                            <p className={`text-[10px] font-semibold uppercase tracking-wide ${highlight ? 'text-blue-600' : 'text-zinc-400'}`}>{label}</p>
                          </div>
                          <p className="text-sm font-semibold text-zinc-900 break-all">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Phone */}
                    {d.phone && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-medium text-zinc-900">{d.phone}</span>
                      </div>
                    )}

                    {/* About */}
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> About
                      </p>
                      <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3">
                        <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                          {d.designerProfile.about}
                        </p>
                        <div className="mt-3 pt-2 border-t border-zinc-200">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            d.designerProfile.about.length >= 150
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {d.designerProfile.about.length >= 150 ? '✓' : '✗'} {d.designerProfile.about.length} chars
                            {d.designerProfile.about.length < 150 && ` (need ${150 - d.designerProfile.about.length} more)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Design Styles */}
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" /> Design Styles
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {d.designerProfile.styles.map(s => (
                          <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Social Links & Calendly */}
                    {(d.designerProfile.calendlyLink ||
                      (d.designerProfile.socialLinks && Object.values(d.designerProfile.socialLinks).some(Boolean))) && (
                      <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" /> Links
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {d.designerProfile.calendlyLink && (
                            <a href={d.designerProfile.calendlyLink} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-medium transition">
                              <Clock className="w-3 h-3" /> Calendly <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          )}
                          {d.designerProfile.socialLinks && Object.entries(d.designerProfile.socialLinks)
                            .filter(([, v]) => v)
                            .map(([key, url]) => (
                              <a key={key} href={url!} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium capitalize border border-zinc-200 transition">
                                {key} <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                              </a>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PORTFOLIO TAB ── */}
                {activeTab === 'portfolio' && (
                  <div className="p-5">
                    {pairs.length === 0 ? (
                      <div className="text-center py-16 rounded-xl bg-zinc-50 border border-dashed border-zinc-300">
                        <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">No portfolio images uploaded</p>
                        <p className="text-xs text-red-500 mt-1 font-medium">⚠ Minimum 2 pairs required</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                          pairs.length >= 2
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {pairs.length >= 2
                            ? <CheckCircle className="w-3.5 h-3.5" />
                            : <AlertCircle className="w-3.5 h-3.5" />}
                          {pairs.length} of 2 required pairs uploaded
                        </div>

                        {pairs.map((pair, i) => (
                          <div key={i} className="rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-200">
                              <span className="text-xs font-semibold text-zinc-700">Project {i + 1}</span>
                              {i < 2
                                ? <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium">Required</span>
                                : <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">Bonus</span>
                              }
                            </div>
                            <div className="grid grid-cols-2">
                              <div className="relative group cursor-pointer border-r border-zinc-200" onClick={() => setLightboxImage(pair.before)}>
                                <img src={pair.before} alt="before" className="w-full aspect-video object-cover group-hover:brightness-90 transition" />
                                <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-orange-500 text-white rounded-md shadow-sm">BEFORE</span>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                  <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg">Click to enlarge</div>
                                </div>
                              </div>
                              <div className="relative group cursor-pointer" onClick={() => setLightboxImage(pair.after)}>
                                <img src={pair.after} alt="after" className="w-full aspect-video object-cover group-hover:brightness-90 transition" />
                                <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-md shadow-sm">AFTER</span>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                  <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg">Click to enlarge</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── REFERENCES TAB ── */}
                {activeTab === 'references' && (
                  <div className="p-5 space-y-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                      d.designerProfile.references.length >= 2
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {d.designerProfile.references.length >= 2
                        ? <CheckCircle className="w-3.5 h-3.5" />
                        : <AlertCircle className="w-3.5 h-3.5" />}
                      {d.designerProfile.references.length} of 2 required references provided
                    </div>

                    {d.designerProfile.references.length === 0 ? (
                      <div className="text-center py-12 rounded-xl bg-zinc-50 border border-dashed border-zinc-300">
                        <Users className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">No references provided</p>
                      </div>
                    ) : (
                      d.designerProfile.references.map((ref, i) => (
                        <div key={i} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 bg-zinc-50">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                                {i + 1}
                              </div>
                              <span className="text-xs font-semibold text-zinc-900">{ref.name}</span>
                              {i < 2 && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded-full">Required</span>}
                            </div>
                            <a href={`mailto:${ref.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                              <Mail className="w-3 h-3" /> Email
                            </a>
                          </div>
                          <div className="px-4 py-3 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Email</p>
                              <p className="text-xs font-medium text-zinc-800 break-all">{ref.email}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">Relationship</p>
                              <p className="text-xs font-medium text-zinc-800">{ref.relation}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-5 py-4 border-t border-zinc-200 bg-zinc-50 flex gap-3">
                <button
                  onClick={() => handleApprove(d._id)}
                  disabled={actionLoading !== null}
                  className="flex-1 h-10 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {actionLoading === d._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Approve
                </button>
                <button
                  onClick={() => { setRejectModal({ id: d._id, open: true }); setSelectedDesigner(null); }}
                  disabled={actionLoading !== null}
                  className="flex-1 h-10 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Lightbox ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Reject modal ── */}
      {rejectModal.open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={() => { setRejectModal({ id: '', open: false }); setRejectionReason(''); }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto">
              {/* Icon header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">Reject Application</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The designer will receive this message via email.
                  </p>
                </div>
                <button
                  onClick={() => { setRejectModal({ id: '', open: false }); setRejectionReason(''); }}
                  className="p-1.5 hover:bg-muted rounded-lg transition flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g., Portfolio appears to contain non-original work. Please submit your own designs with verifiable project details."
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring mb-4 resize-none bg-muted/30"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectModal({ id: '', open: false }); setRejectionReason(''); }}
                  className="flex-1 h-10 border border-border text-sm font-medium rounded-xl hover:bg-muted transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading !== null || !rejectionReason.trim()}
                  className="flex-1 h-10 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PanelSection({ title, icon, children }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        {title}
      </p>
      {children}
    </div>
  );
}