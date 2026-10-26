import React from 'react';
import {
  User,
  TrendingUp,
  ShieldAlert,
  Briefcase,
  LifeBuoy,
  Shield,
  ArrowRight,
  Lock,
  Building,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/storage';
import { formatINR } from '../../utils/formatters';
import { UserRole } from '../../types';

interface PortalHubProps {
  onSelectPortal: (route: string) => void;
  onNavigateHome: () => void;
}

export const BusinessPortalHub: React.FC<PortalHubProps> = ({
  onSelectPortal,
  onNavigateHome,
}) => {
  const { session, userRole, activeBusiness, hasAccessToRole } = useAuth();
  const isAdmin = userRole === 'Admin';
  const bizId = activeBusiness?.id || 'biz_apex_01';

  // Live metrics for summary on each card
  const riskAssessments = db.getRiskAssessments(bizId);
  const investigations = db.getInvestigations(bizId);
  const managerReviews = db.getManagerReviews(bizId);
  const tickets = db.getTickets(bizId);
  const members = db.getMembersByBusiness(bizId);
  const customers = db.getCustomers(bizId);

  const portalCards = [
    {
      role: 'Customer' as UserRole,
      title: 'Customer Portal',
      route: '/customer/dashboard',
      icon: User,
      description: 'Personal finance dashboard for individual customers with balances, transactions, and budgets.',
      metrics: [
        { label: 'Active Retail Accounts', value: `${customers.length} Accounts` },
        { label: 'Default Currency', value: 'INR (₹)' },
      ],
      tag: 'Personal Finance',
    },
    {
      role: 'Risk Analyst' as UserRole,
      title: 'Risk Analyst Portal',
      route: '/risk-analyst/dashboard',
      icon: TrendingUp,
      description: 'Credit risk assessment workspace with CIBIL score distribution, DTI calculations, and underwriting review queue.',
      metrics: [
        { label: 'Underwriting Queue', value: `${riskAssessments.length} Cases` },
        { label: 'Avg Bureau Score', value: '785 CIBIL' },
      ],
      tag: 'Credit Underwriting',
    },
    {
      role: 'Fraud & Compliance Analyst' as UserRole,
      title: 'Fraud & Compliance Portal',
      route: '/fraud-compliance/dashboard',
      icon: ShieldAlert,
      description: 'Transaction investigation center with anomaly heuristics, velocity spikes, and PMLA SAR compliance.',
      metrics: [
        { label: 'Active Alerts', value: `${investigations.length} Flagged` },
        { label: 'High Risk (Score ≥80)', value: `${investigations.filter((i) => i.risk_score >= 80).length} Critical` },
      ],
      tag: 'Surveillance & AML',
    },
    {
      role: 'Manager' as UserRole,
      title: 'Manager Operations Portal',
      route: '/manager/dashboard',
      icon: Briefcase,
      description: 'Executive operational oversight with pending approvals for large exposures, team KPIs, and waiver sign-offs.',
      metrics: [
        { label: 'Pending Approvals', value: `${managerReviews.filter((r) => r.review_status === 'Pending').length} Pending` },
        { label: 'Exposures Reviewed', value: '₹1.08 Cr' },
      ],
      tag: 'Executive Governance',
    },
    {
      role: 'Support Agent' as UserRole,
      title: 'Support Agent Portal',
      route: '/support/dashboard',
      icon: LifeBuoy,
      description: 'Customer service desk with ticket triage, conversation threads, resolution archives, and SLA monitoring.',
      metrics: [
        { label: 'Ticket Queue', value: `${tickets.length} Total` },
        { label: 'Avg Response Time', value: '< 15 mins' },
      ],
      tag: 'Customer Care',
    },
    {
      role: 'Admin' as UserRole,
      title: 'Admin Command Portal',
      route: '/admin/dashboard',
      icon: Shield,
      description: 'Tenant administration with employee directory, invitations, role assignment, and immutable audit logs.',
      metrics: [
        { label: 'Staff Members', value: `${members.length} Members` },
        { label: 'Tenant Security', value: 'Isolated' },
      ],
      tag: 'Administration',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Panel */}
        <div className="bg-white rounded-3xl p-8 border border-[#E1E7F0] shadow-xs flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F4F7FB] text-[#2864F0] border border-[#E1E7F0] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2864F0]" /> Business Operations
              </span>
              <span className="text-xs text-[#536176] font-medium flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-[#101A2C]" />
                {activeBusiness?.business_name || 'Apex FinTech Capital Ltd'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#101A2C] tracking-tight">
              Business Operations
            </h1>
            <p className="text-sm text-[#536176] mt-1 max-w-2xl">
              Unified workspace for financial operations. Access authorized desks below based on your organizational role.
            </p>
          </div>

          <div className="bg-[#F4F7FB] border border-[#E1E7F0] rounded-2xl p-4 text-xs space-y-1.5 shrink-0">
            <div className="flex justify-between gap-6">
              <span className="text-[#536176]">Signed in As:</span>
              <span className="font-bold text-[#101A2C]">{session?.user.full_name}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-[#536176]">Assigned Role:</span>
              <span className="font-bold text-[#2864F0] bg-white px-2 py-0.5 rounded border border-[#E1E7F0]">
                {userRole}
              </span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-[#536176]">Subscription Tier:</span>
              <span className="font-semibold text-[#101A2C]">
                {session?.subscription?.plan_name || 'Enterprise'} (Active)
              </span>
            </div>
          </div>
        </div>

        {/* 6 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portalCards.map((portal) => {
            const Icon = portal.icon;
            const isAuthorized = hasAccessToRole(portal.role);

            // Strict RBAC: Any portal card not matching the user's specific role is locked with a restricted indicator
            if (!isAuthorized) {
              return (
                <div
                  key={portal.role}
                  className="bg-white/60 border border-dashed border-[#E1E7F0] rounded-3xl p-7 opacity-50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F4F7FB] text-slate-400 flex items-center justify-center border border-[#E1E7F0]">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Restricted
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-600">{portal.title}</h3>
                    <p className="text-xs text-slate-400 mt-2">{portal.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#E1E7F0] text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                    <Lock className="w-3.5 h-3.5" /> Requires {portal.role} permission
                  </div>
                </div>
              );
            }

            return (
              <div
                key={portal.role}
                className="bg-white rounded-3xl border border-[#E1E7F0] hover:border-[#2864F0] shadow-xs hover:shadow-xl transition-all duration-300 p-7 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#101A2C] text-white flex items-center justify-center group-hover:bg-[#2864F0] transition shadow-sm">
                      <Icon className="w-6 h-6 text-[#35C6D9] group-hover:text-white transition" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#159B72] border border-emerald-200">
                        <Check className="w-3 h-3" /> Accessible
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2864F0] bg-[#F4F7FB] px-2 py-0.5 rounded">
                    {portal.tag}
                  </span>
                  <h3 className="font-extrabold text-lg text-[#101A2C] mt-2 group-hover:text-[#2864F0] transition">
                    {portal.title}
                  </h3>
                  <p className="text-xs text-[#536176] mt-1.5 leading-relaxed">
                    {portal.description}
                  </p>

                  {/* Summary Metrics on Card */}
                  <div className="mt-5 pt-4 border-t border-[#E1E7F0] grid grid-cols-2 gap-2 text-xs">
                    {portal.metrics.map((m, i) => (
                      <div key={i} className="bg-[#F4F7FB] p-2.5 rounded-xl border border-[#E1E7F0]">
                        <div className="text-[10px] text-[#536176] truncate">{m.label}</div>
                        <div className="font-bold text-[#101A2C] truncate mt-0.5">{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E1E7F0]">
                  <button
                    onClick={() => onSelectPortal(portal.route)}
                    className="w-full py-2.5 px-4 bg-[#101A2C] group-hover:bg-[#2864F0] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Open Portal</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Multi-Tenant Notice */}
        <div className="bg-[#101A2C] text-slate-300 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#18263E] text-[#35C6D9] flex items-center justify-center border border-[#203252]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Role-Based Access Control Active</p>
              <p className="text-slate-400 text-xs">
                Financial records and operations are strictly isolated per enterprise organization credentials. All operations enforce role authorization.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 bg-[#18263E] hover:bg-[#203252] text-white rounded-xl font-medium transition cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
