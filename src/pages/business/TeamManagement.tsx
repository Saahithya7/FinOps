import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Copy,
  CheckCircle,
  Building,
  ArrowLeft,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/storage';
import { formatDate } from '../../utils/formatters';
import { BusinessInvitation, BusinessMember, UserRole } from '../../types';
import { fetchSupabaseMemberships } from '../../services/supabaseDataService';

export const TeamManagement: React.FC<{ onNavigatePortalHub: () => void }> = ({
  onNavigatePortalHub,
}) => {
  const { session, activeBusiness } = useAuth();
  const businessId = activeBusiness?.id || 'biz_apex_01';

  const [members, setMembers] = useState<BusinessMember[]>(() => {
    return db.getMembersByBusiness(businessId);
  });

  // Load from Supabase memberships
  useEffect(() => {
    async function loadMemberships() {
      const res = await fetchSupabaseMemberships({ organizationId: businessId });
      if (res.data && res.data.length > 0) {
        const mapped: BusinessMember[] = res.data.map((m, idx) => ({
          id: `mem_${idx + 1}`,
          business_id: m.organization_id,
          user_id: m.user_id,
          role: (m.role as any) || 'Risk Analyst',
          status: 'active',
          invitation_status: 'accepted',
          created_at: m.created_at || new Date().toISOString(),
          profile: {
            id: m.user_id,
            username: `user_${m.user_id.slice(0, 6)}`,
            full_name: `Member (${m.role})`,
            email: `member_${m.user_id.slice(0, 6)}@finops-demo.com`,
            phone: '+91 98000 00000',
            account_type: 'business',
            created_at: m.created_at || new Date().toISOString(),
          },
        }));
        setMembers(mapped);
      }
    }
    loadMemberships();
  }, [businessId]);

  const [invitations, setInvitations] = useState<BusinessInvitation[]>(() => {
    return db.getInvitations(businessId);
  });

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Risk Analyst');
  const [toastMsg, setToastMsg] = useState('');
  const [copiedToken, setCopiedToken] = useState('');

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const token = 'tok_' + Math.random().toString(36).substring(2, 11);
    const suggestedUsername = inviteEmail.split('@')[0];
    const newInvite: BusinessInvitation = {
      id: 'inv_' + Date.now(),
      business_id: businessId,
      email: inviteEmail,
      username: suggestedUsername,
      assigned_role: inviteRole,
      token_hash: token,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      accepted_at: null,
      status: 'pending',
      invited_by: session?.user.full_name || 'Rajesh Sharma',
    };

    db.saveInvitation(newInvite);
    setInvitations([newInvite, ...invitations]);
    setIsInviteOpen(false);
    setInviteEmail('');
    setToastMsg(`Invitation dispatched to ${inviteEmail} for role: ${inviteRole}`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleCopyLink = (token: string) => {
    navigator.clipboard?.writeText(window.location.origin + `/business/invite?token=${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4">
      {toastMsg && (
        <div className="bg-[#159B72] text-white p-3 rounded-2xl text-xs font-semibold flex justify-between items-center animate-fade-in shadow-md">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={onNavigatePortalHub}
            className="text-xs font-semibold text-[#536176] hover:text-[#101A2C] flex items-center gap-1 mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Business Operations
          </button>
          <h1 className="text-2xl font-black text-[#101A2C] tracking-tight">
            Team Management &amp; Role Permissions
          </h1>
          <p className="text-xs text-[#536176]">
            Employee directory &amp; access control for {activeBusiness?.business_name}
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2.5 bg-[#2864F0] hover:bg-[#1E52CC] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Invite New Member
        </button>
      </div>

      {/* Active Members Table */}
      <div className="bg-white rounded-3xl border border-[#E1E7F0] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E1E7F0] flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-base text-[#101A2C]">Active Staff Members ({members.length})</h3>
            <p className="text-xs text-[#536176]">Employees authorized to access designated portals</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7FB] text-[#536176] uppercase tracking-wider font-semibold border-b border-[#E1E7F0]">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Corporate Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E7F0]">
              {members.map((mem) => (
                <tr key={mem.id} className="hover:bg-[#F4F7FB]/50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#101A2C]">
                      {mem.profile?.full_name || 'Staff Member'}
                    </div>
                    <div className="text-[10px] text-[#536176]">@{mem.profile?.username || 'member'}</div>
                  </td>
                  <td className="py-3 px-4 text-[#101A2C] font-mono">{mem.profile?.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        mem.role === 'Admin'
                          ? 'bg-[#101A2C] text-white'
                          : mem.role === 'Risk Analyst'
                          ? 'bg-emerald-50 text-[#159B72]'
                          : mem.role === 'Fraud & Compliance Analyst'
                          ? 'bg-rose-50 text-[#E45464]'
                          : mem.role === 'Manager'
                          ? 'bg-amber-50 text-[#F2A93B]'
                          : 'bg-blue-50 text-[#2864F0]'
                      }`}
                    >
                      {mem.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#159B72] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#536176]">{formatDate(mem.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      <div className="bg-white rounded-3xl border border-[#E1E7F0] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E1E7F0]">
          <h3 className="font-extrabold text-base text-[#101A2C]">Pending Invitations ({invitations.length})</h3>
          <p className="text-xs text-[#536176]">Invitations awaiting employee redemption</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F7FB] text-[#536176] uppercase tracking-wider font-semibold border-b border-[#E1E7F0]">
              <tr>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Designated Desk Role</th>
                <th className="py-3 px-4">Invited By</th>
                <th className="py-3 px-4">Token Hash</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E7F0]">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F4F7FB]/50 transition">
                  <td className="py-3 px-4 font-bold text-[#101A2C]">{inv.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F4F7FB] text-[#101A2C] border border-[#E1E7F0]">
                      {inv.assigned_role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#536176]">{inv.invited_by}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#536176]">{inv.token_hash}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleCopyLink(inv.token_hash)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-[#101A2C] border border-[#E1E7F0] rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <Copy className="w-3 h-3 text-[#2864F0]" />
                      {copiedToken === inv.token_hash ? 'Copied Link' : 'Copy Link'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101A2C]/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E1E7F0] max-w-md w-full overflow-hidden">
            <div className="bg-[#101A2C] text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-sm">Send Team Invitation</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#101A2C] mb-1">Corporate Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="analyst@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-[#101A2C]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#101A2C] mb-1">Assigned Operational Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-[#101A2C] bg-white"
                >
                  <option value="Risk Analyst">Risk Analyst</option>
                  <option value="Fraud & Compliance Analyst">Fraud &amp; Compliance Analyst</option>
                  <option value="Manager">Manager</option>
                  <option value="Support Agent">Support Agent</option>
                  <option value="Admin">Business Administrator</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 border border-[#E1E7F0] rounded-xl text-[#536176] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2864F0] hover:bg-[#1E52CC] text-white rounded-xl font-bold cursor-pointer"
                >
                  Create Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
