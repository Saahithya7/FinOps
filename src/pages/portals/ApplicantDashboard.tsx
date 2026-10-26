import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Lock,
  User,
  Mail,
  Building,
  RefreshCw,
  Send,
  Info,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/storage';
import { formatDate } from '../../utils/formatters';
import { CustomerVerificationRequest } from '../../types';
import {
  fetchSupabaseVerificationRequestByUserId,
} from '../../services/supabaseDataService';

export const ApplicantDashboard: React.FC<{ activeTab?: string }> = () => {
  const { session, userRole } = useAuth();
  const userId = session?.user?.id || session?.user?.user_id || '';
  const userEmail = session?.user?.email || '';
  const fullName = session?.user?.full_name || 'Applicant';

  const [request, setRequest] = useState<CustomerVerificationRequest | null>(() => {
    if (!userId) return null;
    return db.getVerificationRequestByUserId(userId) || null;
  });
  const [loading, setLoading] = useState(false);
  const [phoneUpdate, setPhoneUpdate] = useState(session?.user?.phone || '+91 98000 00000');
  const [cityUpdate, setCityUpdate] = useState('Mumbai');
  const [notesUpdate, setNotesUpdate] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Refresh status from Supabase
  const loadStatus = async () => {
    if (!userId) return;
    setLoading(true);
    const res = await fetchSupabaseVerificationRequestByUserId(userId);
    if (res.data) {
      setRequest(res.data);
      db.saveVerificationRequest(res.data);
    } else {
      // Local fallback request if not yet created
      let localReq = db.getVerificationRequestByUserId(userId);
      if (!localReq) {
        localReq = {
          request_id: 'cvr_' + userId.slice(0, 12),
          profile_user_id: userId,
          verification_status: 'Pending',
          submitted_at: session?.user?.created_at || new Date().toISOString(),
          created_at: session?.user?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          review_notes: 'Initial registration received. Awaiting compliance officer review.',
        };
        db.saveVerificationRequest(localReq);
      }
      setRequest(localReq);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, [userId]);

  const handleUpdatePermittedInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;

    const updated: CustomerVerificationRequest = {
      ...request,
      review_notes: notesUpdate
        ? `Applicant Note (${new Date().toLocaleDateString()}): ${notesUpdate}. Previous: ${request.review_notes || 'None'}`
        : request.review_notes,
      updated_at: new Date().toISOString(),
    };

    if (request.verification_status === 'Rejected') {
      // Allow applicant to resubmit if rejected
      updated.verification_status = 'Pending';
      updated.submitted_at = new Date().toISOString();
    }

    db.saveVerificationRequest(updated);
    setRequest(updated);

    // Update profile in storage
    const profiles = db.getProfiles();
    const p = profiles.find((prof) => prof.id === userId || prof.user_id === userId);
    if (p) {
      p.phone = phoneUpdate;
      db.saveProfile(p);
    }

    setUpdateSuccess('Your applicant information update has been recorded and submitted for officer review.');
    setNotesUpdate('');
    setTimeout(() => setUpdateSuccess(''), 5000);
  };

  const status = request?.verification_status || 'Pending';

  const statusConfig = {
    Pending: {
      label: 'Pending Review',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-500',
      desc: 'Your bank customer verification request is in the verification queue. A bank compliance officer will review your identity credentials.',
    },
    'Under Review': {
      label: 'Under Active Review',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: RefreshCw,
      iconColor: 'text-blue-500 animate-spin',
      desc: 'A compliance analyst is actively verifying your application records against statutory KYC/PMLA registries.',
    },
    Approved: {
      label: 'Approved & Verified',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      desc: 'Congratulations! Your bank customer status has been verified and activated. You now have full access to customer banking portals.',
    },
    Rejected: {
      label: 'Action Required / Rejected',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: XCircle,
      iconColor: 'text-rose-500',
      desc: 'Your application requires additional clarification. Please review officer notes below and submit corrected information.',
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-[#E1E7F0] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F4F7FB] text-[#536176] border border-[#E1E7F0]">
                Applicant Role: {userRole || 'Applicant'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badge}`}>
                Status: {statusConfig.label}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#101A2C] tracking-tight">
              Bank Customer Verification Desk
            </h1>
            <p className="text-xs text-[#536176] mt-1">
              Registered Account: <span className="font-semibold text-[#101A2C]">{fullName}</span> ({userEmail})
            </p>
          </div>

          <button
            onClick={loadStatus}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#F4F7FB] hover:bg-[#E1E7F0] text-[#101A2C] text-xs font-bold rounded-xl border border-[#E1E7F0] transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      <div className="bg-white rounded-2xl border border-[#E1E7F0] p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#F4F7FB] rounded-2xl border border-[#E1E7F0]">
            <StatusIcon className={`w-8 h-8 ${statusConfig.iconColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[#101A2C]">
                Verification State: <span className="text-[#2864F0]">{statusConfig.label}</span>
              </h3>
              <span className="text-xs text-[#536176]">
                Submitted: {request?.submitted_at ? formatDate(request.submitted_at) : 'Just now'}
              </span>
            </div>
            <p className="text-xs text-[#536176] mt-2 leading-relaxed">
              {statusConfig.desc}
            </p>

            {request?.review_notes && (
              <div className="mt-4 p-3.5 bg-slate-50 border border-[#E1E7F0] rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#101A2C] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#2864F0]" /> Compliance Reviewer Notes:
                </p>
                <p className="text-[#536176] italic">{request.review_notes}</p>
                {request.reviewed_at && (
                  <p className="text-[11px] text-slate-400 pt-1">
                    Reviewed on {formatDate(request.reviewed_at)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Workflow Steps Indicator */}
        <div className="mt-8 pt-6 border-t border-[#E1E7F0] grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-950">Step 1: Account Created</p>
              <p className="text-[11px] text-emerald-700">Auth credentials & applicant profile registered</p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            status === 'Pending' || status === 'Under Review'
              ? 'bg-amber-50 border-amber-200'
              : status === 'Approved'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-rose-50 border-rose-200'
          }`}>
            <Clock className={`w-5 h-5 shrink-0 ${
              status === 'Pending' || status === 'Under Review' ? 'text-amber-600' : status === 'Approved' ? 'text-emerald-600' : 'text-rose-600'
            }`} />
            <div>
              <p className="text-xs font-bold text-slate-900">Step 2: Bank Verification</p>
              <p className="text-[11px] text-slate-600">
                {status === 'Approved' ? 'Verified by authorized officer' : 'Compliance queue inspection'}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            status === 'Approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-60'
          }`}>
            <ShieldCheck className={`w-5 h-5 shrink-0 ${status === 'Approved' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <div>
              <p className="text-xs font-bold text-slate-900">Step 3: Customer Ledger Access</p>
              <p className="text-[11px] text-slate-600">
                {status === 'Approved' ? 'Personal balance & transfers active' : 'Locked until verification approval'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restricted Financial Data Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Financial Banking Data Protected
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              As an applicant with a pending verification request, you cannot view customer transaction ledgers, initiate UPI/NEFT/RTGS fund transfers, or access credit facilities until authorized bank officers approve your customer verification request. This multi-tier verification protects customer accounts from unauthorized financial onboarding.
            </p>
          </div>
        </div>
      </div>

      {/* Locked Feature Previews */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E1E7F0] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#536176] mb-2">
            <span>Primary Savings Ledger</span>
            <span className="p-1 rounded-md bg-slate-100 text-slate-500"><Lock className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-lg font-black text-slate-400">₹ ••••••••</div>
          <p className="text-[11px] text-slate-400 mt-1">Available post-approval</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E1E7F0] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#536176] mb-2">
            <span>Fund Transfers &amp; UPI</span>
            <span className="p-1 rounded-md bg-slate-100 text-slate-500"><Lock className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-lg font-black text-slate-400">Locked</div>
          <p className="text-[11px] text-slate-400 mt-1">Requires verified customer status</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E1E7F0] p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#536176] mb-2">
            <span>Debit / Corporate Cards</span>
            <span className="p-1 rounded-md bg-slate-100 text-slate-500"><Lock className="w-3.5 h-3.5" /></span>
          </div>
          <div className="text-lg font-black text-slate-400">Card Issuance Locked</div>
          <p className="text-[11px] text-slate-400 mt-1">Dispatched after KYC confirmation</p>
        </div>
      </div>

      {/* Permitted Request Updates Form */}
      <div className="bg-white rounded-2xl border border-[#E1E7F0] p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#101A2C]">
            Permitted Application Updates
          </h3>
          <p className="text-xs text-[#536176] mt-0.5">
            Applicants may update contact phone, city, and submit clarification notes for reviewing officers.
          </p>
        </div>

        {updateSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{updateSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePermittedInfo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#101A2C] mb-1.5">
                Primary Contact Phone
              </label>
              <input
                type="text"
                value={phoneUpdate}
                onChange={(e) => setPhoneUpdate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl focus:border-[#2864F0] focus:bg-white outline-hidden font-medium text-[#101A2C]"
                placeholder="+91 98000 00000"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101A2C] mb-1.5">
                City / Branch Jurisdiction
              </label>
              <input
                type="text"
                value={cityUpdate}
                onChange={(e) => setCityUpdate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl focus:border-[#2864F0] focus:bg-white outline-hidden font-medium text-[#101A2C]"
                placeholder="Mumbai"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#101A2C] mb-1.5">
              Additional Notes or Document Reference for Bank Reviewer
            </label>
            <textarea
              rows={3}
              value={notesUpdate}
              onChange={(e) => setNotesUpdate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl focus:border-[#2864F0] focus:bg-white outline-hidden text-[#101A2C]"
              placeholder="E.g. Aadhaar / PAN submission reference, branch reference, or resubmission explanation..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#101A2C] hover:bg-[#18263E] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Application Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
