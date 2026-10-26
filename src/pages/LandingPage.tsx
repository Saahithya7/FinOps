import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  Layers,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Users,
  CreditCard,
  PieChart,
  Lock,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Building,
  User,
  ArrowUpRight,
  Flame,
  Search,
  Activity,
  FileCheck2,
  LifeBuoy,
  BarChart3,
  Check,
  HelpCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { formatINR } from '../utils/formatters';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  // Preview chart mock data
  const previewVolumeData = [
    { day: 'Mon', volume: 18.2 },
    { day: 'Tue', volume: 24.5 },
    { day: 'Wed', volume: 21.0 },
    { day: 'Thu', volume: 32.8 },
    { day: 'Fri', volume: 44.1 },
    { day: 'Sat', volume: 38.6 },
    { day: 'Sun', volume: 51.4 },
  ];

  const platformCapabilities = [
    {
      title: 'Financial Analytics',
      desc: 'Multi-account visibility, automated ledger reconciliation, and real-time cash flow monitoring with precise numerical typography.',
      icon: PieChart,
      metric: '₹140+ Cr',
      label: 'Volume Tracked',
    },
    {
      title: 'Transaction Monitoring',
      desc: 'Continuous surveillance across UPI, NEFT, RTGS, IMPS, and corporate cards with automated anomaly velocity thresholds.',
      icon: Search,
      metric: '99.98%',
      label: 'SLA Reliability',
    },
    {
      title: 'Risk Operations & Underwriting',
      desc: 'Algorithmic credit assessment integrating CIBIL scores (300-900), debt-to-income (DTI) calculations, and stress tests.',
      icon: TrendingUp,
      metric: '1.2% PD',
      label: 'Prime Default Rate',
    },
    {
      title: 'Fraud & Compliance Investigation',
      desc: 'Anomaly scoring (0-100), device fingerprinting, and automated Suspicious Activity Reporting (SAR) compliant with PMLA guidelines.',
      icon: Flame,
      metric: '42 mins',
      label: 'Avg Investigation Time',
    },
    {
      title: 'Customer Service Automation',
      desc: 'Omnichannel dispute management, priority SLAs, conversation history tracking, and immediate escalation channels.',
      icon: Users,
      metric: '< 15 mins',
      label: 'First Response Time',
    },
    {
      title: 'Business Performance Reporting',
      desc: 'Executive summaries, team KPI tracking, managerial waiver workflows, and strict multi-tenant data boundaries.',
      icon: Briefcase,
      metric: '100%',
      label: 'Tenant Isolation',
    },
  ];

  return (
    <div className="bg-[#F4F7FB] text-[#101A2C]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-[#101A2C] text-white">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #35C6D9 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Tag pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#18263E] border border-[#203252] text-[#35C6D9]">
              <span className="w-2 h-2 rounded-full bg-[#35C6D9]" />
              <span>FinOps AI Enterprise Platform</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-normal">Banking &amp; Corporate Operations</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Financial Operations.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2864F0] via-[#35C6D9] to-cyan-300">
                Reimagined.
              </span>
            </h1>

            {/* Exact supporting text */}
            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              One intelligent workspace for financial visibility, transaction management, risk operations, and customer service.
            </p>

            {/* Primary Actions */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('/login')}
                className="px-6 py-3.5 bg-[#2864F0] hover:bg-[#1E52CC] text-white font-bold text-sm rounded-xl transition shadow-md flex items-center gap-2 group cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-[#35C6D9]" />
                <span>Sign In to Unified Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate('/customer/signup')}
                className="px-6 py-3.5 bg-white text-[#101A2C] hover:bg-slate-100 font-bold text-sm rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-[#2864F0]" />
                <span>Create Customer Account</span>
              </button>
            </div>

            <div className="pt-2 text-xs text-slate-400">
              Enterprise security with multi-tenant isolation, role-based controls, and full audit logs.
            </div>
          </div>

          {/* Elegant Dashboard Preview */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="bg-[#18263E] rounded-3xl p-5 sm:p-7 border border-[#203252] shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#203252]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#E45464]" />
                  <div className="w-3 h-3 rounded-full bg-[#F2A93B]" />
                  <div className="w-3 h-3 rounded-full bg-[#159B72]" />
                  <span className="text-xs font-mono text-slate-400 ml-2">
                    FinOps AI Command Center • Live Workspace Preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#2864F0]/20 text-[#35C6D9] border border-[#2864F0]/40">
                    Production Active
                  </span>
                </div>
              </div>

              {/* Preview Content Grid */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Metric 1 */}
                <div className="bg-[#101A2C] p-5 rounded-2xl border border-[#203252]">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                    <span>Net Settled Liquidity</span>
                    <span className="text-[#159B72] font-semibold">+14.2%</span>
                  </div>
                  <div className="text-2xl font-black text-white">₹48,25,000</div>
                  <p className="text-[11px] text-slate-400 mt-1">Across 12 monitored partner accounts</p>
                </div>

                {/* Metric 2 */}
                <div className="bg-[#101A2C] p-5 rounded-2xl border border-[#203252]">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                    <span>Active Loan Portfolio</span>
                    <span className="text-[#35C6D9] font-semibold">Tier 1 CIBIL</span>
                  </div>
                  <div className="text-2xl font-black text-[#35C6D9]">₹1,48,00,000</div>
                  <p className="text-[11px] text-slate-400 mt-1">Weighted DTI: 28.5% (Prime)</p>
                </div>

                {/* Metric 3 */}
                <div className="bg-[#101A2C] p-5 rounded-2xl border border-[#203252]">
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                    <span>Fraud &amp; AML Interceptions</span>
                    <span className="text-[#E45464] font-semibold">0 False Clears</span>
                  </div>
                  <div className="text-2xl font-black text-white">₹8,50,000</div>
                  <p className="text-[11px] text-slate-400 mt-1">Intercepted via velocity heuristic #14</p>
                </div>
              </div>

              {/* Chart Preview */}
              <div className="mt-5 p-5 bg-[#101A2C] rounded-2xl border border-[#203252]">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Weekly Financial Operations Velocity (Cr ₹)
                    </h4>
                    <p className="text-[11px] text-slate-400">Automated ledger volume through corporate rail</p>
                  </div>
                  <span className="text-xs text-[#35C6D9] font-mono">Live Sync</span>
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={previewVolumeData}>
                      <defs>
                        <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2864F0" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#35C6D9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" stroke="#536176" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#536176" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}Cr`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#101A2C',
                          borderColor: '#203252',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#fff',
                        }}
                        formatter={(val: any) => [`₹${val} Cr`, 'Volume']}
                      />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="#35C6D9"
                        strokeWidth={2}
                        fill="url(#heroGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2864F0] bg-white px-3 py-1 rounded-full border border-[#E1E7F0] shadow-2xs">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101A2C] tracking-tight">
            Comprehensive Financial Infrastructure
          </h2>
          <p className="text-sm text-[#536176]">
            Engineered with deep numerical precision for financial institutions, credit analysts, and corporate operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformCapabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="bg-white p-7 rounded-3xl border border-[#E1E7F0] shadow-xs hover:shadow-lg hover:border-[#2864F0] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F4F7FB] text-[#2864F0] flex items-center justify-center border border-[#E1E7F0]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#101A2C]">{cap.metric}</div>
                      <div className="text-[10px] text-[#536176]">{cap.label}</div>
                    </div>
                  </div>
                  <h3 className="font-extrabold text-base text-[#101A2C] mb-2">{cap.title}</h3>
                  <p className="text-xs text-[#536176] leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Business Solutions & Six Roles Overview */}
      <section id="solutions" className="py-20 bg-white border-y border-[#E1E7F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2864F0] bg-[#F4F7FB] px-3 py-1 rounded-full border border-[#E1E7F0]">
              Business Solutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101A2C] tracking-tight">
              Six Purpose-Built Role Portals
            </h2>
            <p className="text-sm text-[#536176]">
              Each operational desk receives an isolated, tailored workspace with dedicated toolsets rather than a one-size-fits-all dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#F4F7FB] p-6 rounded-3xl border border-[#E1E7F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#2864F0] flex items-center justify-center border border-[#E1E7F0]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#101A2C]">Customer Portal</h4>
                  <p className="text-[11px] text-[#536176]">Personal Finance Hub</p>
                </div>
              </div>
              <p className="text-xs text-[#536176] leading-relaxed">
                Balances, money received and spent, monthly spending trends, category breakdown, budget progress, and transfer actions in INR.
              </p>
            </div>

            <div className="bg-[#F4F7FB] p-6 rounded-3xl border border-[#E1E7F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#159B72] flex items-center justify-center border border-[#E1E7F0]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#101A2C]">Risk Analyst Portal</h4>
                  <p className="text-[11px] text-[#536176]">Credit Underwriting Desk</p>
                </div>
              </div>
              <p className="text-xs text-[#536176] leading-relaxed">
                Applications assessed, high-risk flags, CIBIL 300–900 tiering, DTI ratios, loan distributions, and underwriting review queues.
              </p>
            </div>

            <div className="bg-[#F4F7FB] p-6 rounded-3xl border border-[#E1E7F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#E45464] flex items-center justify-center border border-[#E1E7F0]">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#101A2C]">Fraud &amp; Compliance</h4>
                  <p className="text-[11px] text-[#536176]">Transaction Investigation</p>
                </div>
              </div>
              <p className="text-xs text-[#536176] leading-relaxed">
                Suspicious stream, risk score distribution (0-100), device fingerprinting, investigation queue, and statutory PMLA SAR reporting.
              </p>
            </div>

            <div className="bg-[#F4F7FB] p-6 rounded-3xl border border-[#E1E7F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#F2A93B] flex items-center justify-center border border-[#E1E7F0]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#101A2C]">Manager Portal</h4>
                  <p className="text-[11px] text-[#536176]">Executive Operations</p>
                </div>
              </div>
              <p className="text-xs text-[#536176] leading-relaxed">
                Overall KPIs, pending approvals for exposures &gt; ₹50L, escalated cases, team performance metrics, and digital signature sign-offs.
              </p>
            </div>

            <div className="bg-[#F4F7FB] p-6 rounded-3xl border border-[#E1E7F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#35C6D9] flex items-center justify-center border border-[#E1E7F0]">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#101A2C]">Support Agent Portal</h4>
                  <p className="text-[11px] text-[#536176]">Customer Care Service</p>
                </div>
              </div>
              <p className="text-xs text-[#536176] leading-relaxed">
                Ticket inbox, SLA timers, customer detail panels, conversation history threads, resolution archives, and escalation tracking.
              </p>
            </div>

            <div className="bg-[#F4F7FB] p-6 rounded-3xl border border-[#E1E7F0]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white text-[#101A2C] flex items-center justify-center border border-[#E1E7F0]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#101A2C]">Admin Portal</h4>
                  <p className="text-[11px] text-[#536176]">Tenant Governance</p>
                </div>
              </div>
              <p className="text-xs text-[#536176] leading-relaxed">
                User management, employee email invitations, role assignment, subscription management, and immutable SOC-2 security audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plan Overview for Businesses */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2864F0] bg-white px-3 py-1 rounded-full border border-[#E1E7F0] shadow-2xs">
            Business Subscription Plans
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101A2C] tracking-tight">
            Transparent Pricing for Business Customers
          </h2>
          <p className="text-sm text-[#536176]">
            Configurable tiers for NBFCs, banks, payment processors, and lenders. Plans are selected only during corporate business onboarding.
          </p>

          {/* Billing Switch */}
          <div className="inline-flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-[#E1E7F0] shadow-2xs mt-4">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-[#101A2C] text-white shadow-2xs'
                  : 'text-[#536176] hover:text-[#101A2C]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                billingPeriod === 'annual'
                  ? 'bg-[#101A2C] text-white shadow-2xs'
                  : 'text-[#536176] hover:text-[#101A2C]'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-extrabold bg-[#35C6D9] text-[#101A2C] px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter */}
          <div className="bg-white rounded-3xl p-8 border border-[#E1E7F0] shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-[#101A2C]">Starter</h3>
              <p className="text-xs text-[#536176] mt-1 min-h-[32px]">
                For boutique lenders and digital businesses establishing core financial tracking.
              </p>
              <div className="my-6 pb-6 border-b border-[#E1E7F0]">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#101A2C]">
                    {formatINR(billingPeriod === 'monthly' ? 9999 : 99990)}
                  </span>
                  <span className="text-xs text-[#536176]">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                </div>
                <p className="text-[11px] text-[#536176] mt-1">Configurable placeholder rate</p>
              </div>

              <ul className="space-y-3 text-xs text-[#536176]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Financial overview dashboard
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Transaction history &amp; monitoring
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Basic reporting exports
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Limited team access (up to 5 seats)
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E1E7F0]">
              <button
                onClick={() => onNavigate('/business/signup')}
                className="w-full py-3 bg-[#101A2C] hover:bg-[#18263E] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Register Business Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Professional */}
          <div className="bg-white rounded-3xl p-8 border-2 border-[#2864F0] shadow-xl relative flex flex-col justify-between ring-2 ring-[#2864F0]/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2864F0] text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
              Most Popular
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-[#101A2C]">Professional</h3>
              <p className="text-xs text-[#536176] mt-1 min-h-[32px]">
                Comprehensive risk modeling, fraud surveillance, and customer service.
              </p>
              <div className="my-6 pb-6 border-b border-[#E1E7F0]">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#101A2C]">
                    {formatINR(billingPeriod === 'monthly' ? 24999 : 249990)}
                  </span>
                  <span className="text-xs text-[#536176]">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                </div>
                <p className="text-[11px] text-[#536176] mt-1">Configurable placeholder rate</p>
              </div>

              <ul className="space-y-3 text-xs text-[#536176]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Advanced financial dashboards
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Risk analysis &amp; CIBIL scoring
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Fraud monitoring heuristics
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Team collaboration (up to 25 seats)
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Enhanced reporting &amp; audit trails
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E1E7F0]">
              <button
                onClick={() => onNavigate('/business/signup')}
                className="w-full py-3 bg-[#2864F0] hover:bg-[#1E52CC] text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Select Professional Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Enterprise */}
          <div className="bg-white rounded-3xl p-8 border border-[#E1E7F0] shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-[#101A2C]">Enterprise</h3>
              <p className="text-xs text-[#536176] mt-1 min-h-[32px]">
                Full six-portal deployment with custom access controls and dedicated SLAs.
              </p>
              <div className="my-6 pb-6 border-b border-[#E1E7F0]">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#101A2C]">
                    {formatINR(billingPeriod === 'monthly' ? 49999 : 499990)}
                  </span>
                  <span className="text-xs text-[#536176]">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
                </div>
                <p className="text-[11px] text-[#536176] mt-1">Configurable placeholder rate</p>
              </div>

              <ul className="space-y-3 text-xs text-[#536176]">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Advanced administrative controls
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Expanded team &amp; usage limits
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Detailed compliance reporting (PMLA)
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Configurable business requirements
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#159B72] shrink-0" /> Priority 15-minute SLA support
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#E1E7F0]">
              <button
                onClick={() => onNavigate('/business/signup')}
                className="w-full py-3 bg-[#101A2C] hover:bg-[#18263E] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Select Enterprise Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#101A2C] text-slate-400 py-14 border-t border-[#18263E] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-[#18263E]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2864F0] text-white flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#35C6D9]" />
              </div>
              <div>
                <span className="font-extrabold text-base text-white">FinOps AI</span>
                <p className="text-[11px] text-slate-400">Enterprise Financial Operations Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-5 text-slate-300">
              <button onClick={() => onNavigate('/login')} className="hover:text-[#35C6D9] cursor-pointer">
                Sign In (Unified Portal)
              </button>
              <button onClick={() => onNavigate('/customer/signup')} className="hover:text-[#35C6D9] cursor-pointer">
                Customer Signup
              </button>
              <button onClick={() => onNavigate('/pricing')} className="hover:text-[#35C6D9] cursor-pointer">
                Pricing (Business)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-[11px]">
            <div>
              <p className="font-bold text-white uppercase tracking-wider mb-2.5">Platform</p>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white">Financial Analytics</a></li>
                <li><a href="#features" className="hover:text-white">Transaction Monitoring</a></li>
                <li><a href="#features" className="hover:text-white">Risk Operations</a></li>
                <li><a href="#features" className="hover:text-white">Fraud &amp; AML Surveillance</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white uppercase tracking-wider mb-2.5">Company</p>
              <ul className="space-y-2 text-slate-400">
                <li><span className="hover:text-white cursor-pointer">About Us</span></li>
                <li><span className="hover:text-white cursor-pointer">Security Whitepaper</span></li>
                <li><span className="hover:text-white cursor-pointer">Compliance Architecture</span></li>
                <li><span className="hover:text-white cursor-pointer">Contact Financial Support</span></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white uppercase tracking-wider mb-2.5">Legal</p>
              <ul className="space-y-2 text-slate-400">
                <li><span className="hover:text-white cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-white cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-white cursor-pointer">PMLA 2002 Declarations</span></li>
                <li><span className="hover:text-white cursor-pointer">RBI IT Framework Compliance</span></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-white uppercase tracking-wider mb-2.5">Architecture</p>
              <p className="text-slate-400 leading-relaxed">
                Operating with multi-tenant isolation in INR (₹). Client ledgers are partitioned with database-level access controls.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-[#18263E] flex flex-wrap justify-between items-center text-[10px] text-slate-500 gap-4">
            <p>&copy; 2026 FinOps AI Technologies Ltd. All rights reserved.</p>
            <p>ISO 27001 &amp; SOC-2 Type II Certified Architecture</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
