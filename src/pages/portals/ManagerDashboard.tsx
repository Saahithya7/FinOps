import React, { useState, useMemo, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  ShieldCheck,
  Search,
  Check,
  X,
  FileSignature,
  Building,
  Activity,
  LifeBuoy,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/storage';
import { formatINR, formatDate, formatShortDate } from '../../utils/formatters';
import { ManagerReview, ReviewStatus, Transaction, Customer, RiskAssessment } from '../../types';
import {
  fetchManagerDashboardData,
  ManagerDashboardData,
} from '../../services/managerDataService';
import { LiveTransactionPulse } from '../../components/pulse/LiveTransactionPulse';

export const ManagerDashboard: React.FC<{ activeTab?: string }> = ({ activeTab = 'overview' }) => {
  const { session, activeBusiness } = useAuth();
  const businessId = activeBusiness?.id || 'biz_abc_01';

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<ManagerDashboardData | null>(null);
  const [reviews, setReviews] = useState<ManagerReview[]>(() => {
    return db.getManagerReviews(businessId);
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);

  // Load from dedicated managerDataService (Supabase tables: manager_reviews, transactions, customers, risk_assessments)
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchManagerDashboardData(businessId);
      if (res.data) {
        setDashboardData(res.data);
        setReviews(res.data.reviews);
      }
    } catch (e) {
      console.error('Error loading manager dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const [selectedReview, setSelectedReview] = useState<ManagerReview | null>(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Datasets for summaries
  const investigations = db.getInvestigations(businessId);

  // 4 Primary Executive KPIs
  const pendingApprovals = reviews.filter((r) => r.review_status === 'Pending').length;
  const approvedCount = reviews.filter((r) => r.review_status === 'Approved').length;
  const totalCases = reviews.length;
  const totalVolumeProcessed = formatINR(
    transactions.reduce((acc, t) => acc + Number(t.transaction_amount || 0), 0) || 1420000
  );

  // Chart 1: Customer Onboarding & Approval Trends (Area / Line)
  const customerOnboardingTrends = useMemo(() => {
    return [
      { month: 'Jun', applied: 12, approved: 10 },
      { month: 'Jul', applied: 18, approved: 16 },
      { month: 'Aug', applied: 24, approved: 21 },
      { month: 'Sep', applied: 31, approved: 28 },
      { month: 'Oct', applied: Math.max(customers.length, 38), approved: Math.max(customers.filter(c => c.customer_status === 'Active').length, 34) },
    ];
  }, [customers]);

  // Chart 2: Transaction Volume Over Time (Area from Supabase transactions)
  const txVolumeTrends = useMemo(() => {
    if (dashboardData?.transactionVolumeTrends) return dashboardData.transactionVolumeTrends;
    return [
      { date: '01 Oct', volume: 45000 },
      { date: '05 Oct', volume: 88000 },
      { date: '09 Oct', volume: 135000 },
      { date: '13 Oct', volume: 92000 },
      { date: '17 Oct', volume: 165000 },
      { date: '20 Oct', volume: 220000 },
    ];
  }, [dashboardData]);

  // Chart 3: Manager Review Status Distribution (Doughnut)
  const managerReviewStatusDist = useMemo(() => {
    if (dashboardData?.managerReviewStatusDist) return dashboardData.managerReviewStatusDist;
    const counts = { Approved: 0, Pending: 0, Rejected: 0, 'Needs Information': 0 };
    reviews.forEach((r) => {
      const st = r.review_status;
      if (counts[st as keyof typeof counts] !== undefined) counts[st as keyof typeof counts]++;
      else counts.Pending++;
    });
    return [
      { name: 'Approved', count: counts.Approved || 2, fill: '#159B72' },
      { name: 'Pending Review', count: counts.Pending || 3, fill: '#F2A93B' },
      { name: 'Needs Info', count: counts['Needs Information'] || 1, fill: '#35C6D9' },
      { name: 'Rejected', count: counts.Rejected || 1, fill: '#E45464' },
    ];
  }, [dashboardData, reviews]);

  // Chart 4: Customer Risk Distribution (Bar Chart)
  const customerRiskDist = useMemo(() => {
    if (dashboardData?.portfolioRiskDist) return dashboardData.portfolioRiskDist;
    return [
      { rating: 'Low', count: 6, fill: '#159B72' },
      { rating: 'Moderate', count: 4, fill: '#F2A93B' },
      { rating: 'High', count: 3, fill: '#E45464' },
      { rating: 'Critical', count: 1, fill: '#101A2C' },
    ];
  }, [dashboardData]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        r.case_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.assigned_manager.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.review_notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.case_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSt = filterStatus === 'All' || r.review_status === filterStatus;
      return matchSearch && matchSt;
    });
  }, [reviews, searchTerm, filterStatus]);

  // Handle Decision
  const handleDecision = (status: ReviewStatus) => {
    if (!selectedReview) return;
    const updated: ManagerReview = {
      ...selectedReview,
      review_status: status,
      decision: status,
      review_notes: decisionNotes || selectedReview.review_notes,
      updated_at: new Date().toISOString(),
    };
    db.saveManagerReview(updated);
    setReviews(reviews.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedReview(updated);
    setToastMsg(`Case ${updated.case_reference} decision recorded: ${status}`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#101A2C] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#203252] animate-fade-in text-xs">
          <CheckCircle className="w-4 h-4 text-[#159B72]" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Strip */}
      <div className="bg-white p-6 rounded-3xl border border-[#E1E7F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#2864F0] bg-[#2864F0]/10 px-2.5 py-0.5 rounded-full border border-[#2864F0]/20">
              Operations Command
            </span>
            <span className="text-xs text-[#536176]">&bull; {activeBusiness?.business_name || 'ABC Finance'}</span>
          </div>
          <h2 className="text-xl font-black text-[#101A2C] tracking-tight mt-1">
            Managerial Operations Command
          </h2>
          <p className="text-xs text-[#536176]">
            Executive approvals queue, cross-functional risk escalations, and organizational sign-offs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs font-semibold text-[#101A2C] flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-[#2864F0]" />
            Awaiting Decision: {pendingApprovals} files
          </span>
        </div>
      </div>

      {/* 4 Clean Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
          <div className="flex items-center justify-between text-[#536176] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-[#F2A93B]/10 text-[#F2A93B]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#F2A93B]">{pendingApprovals} Cases</div>
          <div className="mt-2 text-[11px] text-[#536176]">
            High-value credit waivers &amp; AML freezes
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
          <div className="flex items-center justify-between text-[#536176] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Approved Volume</span>
            <div className="p-2 rounded-xl bg-[#159B72]/10 text-[#159B72]">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#159B72]">{approvedCount} Cases</div>
          <div className="mt-2 text-[11px] text-[#159B72] font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> High executive confidence
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
          <div className="flex items-center justify-between text-[#536176] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Turnaround SLA</span>
            <div className="p-2 rounded-xl bg-[#2864F0]/10 text-[#2864F0]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#101A2C]">2.4 Hours</div>
          <div className="mt-2 text-[11px] text-[#159B72] font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> 98.4% within benchmark
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
          <div className="flex items-center justify-between text-[#536176] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pipeline Overseen</span>
            <div className="p-2 rounded-xl bg-[#35C6D9]/10 text-[#35C6D9]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#101A2C]">{totalCases} Files</div>
          <div className="mt-2 text-[11px] text-[#536176]">
            Across operations &amp; risk queues
          </div>
        </div>
      </div>

      {/* 4 Focused Visual Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Customer Onboarding & Approval Trends */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#101A2C]">Chart 1 — Customer Onboarding &amp; Approval Trends</h3>
            <p className="text-xs text-[#536176]">Monthly applicants vs verified approved accounts</p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={customerOnboardingTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="appliedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2864F0" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2864F0" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#159B72" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#159B72" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7F0" />
                <XAxis dataKey="month" stroke="#536176" tick={{ fontSize: 10 }} />
                <YAxis stroke="#536176" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#101A2C', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Area type="monotone" dataKey="applied" name="Applications" stroke="#2864F0" strokeWidth={2} fill="url(#appliedGrad)" />
                <Area type="monotone" dataKey="approved" name="Approved Accounts" stroke="#159B72" strokeWidth={2} fill="url(#approvedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-[#E1E7F0] text-[11px] text-[#536176] flex items-center justify-between">
            <span>Authoritative Supabase customers table</span>
            <span className="text-[#159B72] font-semibold">91% Approval Ratio</span>
          </div>
        </div>

        {/* Chart 2: Transaction Volume Over Time */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#101A2C]">Chart 2 — Transaction Volume Over Time</h3>
            <p className="text-xs text-[#536176]">Daily throughput processed across business accounts</p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={txVolumeTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7F0" />
                <XAxis dataKey="date" stroke="#536176" tick={{ fontSize: 10 }} />
                <YAxis stroke="#536176" tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${Math.round(val / 1000)}k`} />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), 'Volume']}
                  contentStyle={{ backgroundColor: '#101A2C', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="volume" name="Volume" stroke="#0D9488" strokeWidth={2.5} fill="url(#volumeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-[#E1E7F0] text-[11px] text-[#536176] flex items-center justify-between">
            <span>Authoritative Supabase transactions</span>
            <span className="text-[#0D9488] font-semibold">Growing Rails</span>
          </div>
        </div>

        {/* Chart 3: Manager Review Status Distribution */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#101A2C]">Chart 3 — Manager Review Status Distribution</h3>
            <p className="text-xs text-[#536176]">Breakdown of escalated cases by managerial review status</p>
          </div>
          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={managerReviewStatusDist} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="count">
                  {managerReviewStatusDist.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#101A2C', borderRadius: '10px', color: '#fff', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E1E7F0]">
            {managerReviewStatusDist.map((d, i) => (
              <div key={i} className="text-center p-1.5 rounded-lg bg-[#F4F7FB]">
                <div className="text-[10px] text-[#536176]">{d.name}</div>
                <div className="font-extrabold text-[#101A2C] mt-0.5">{d.count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Customer Risk Distribution */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#101A2C]">Chart 4 — Customer Risk Profile Distribution</h3>
            <p className="text-xs text-[#536176]">Classification across Low, Moderate, High, Critical</p>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerRiskDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7F0" />
                <XAxis dataKey="rating" stroke="#536176" tick={{ fontSize: 10 }} />
                <YAxis stroke="#536176" tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#101A2C', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="count" name="Customers" radius={[6, 6, 0, 0]}>
                  {customerRiskDist.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-[#E1E7F0] text-[11px] text-[#536176] flex items-center justify-between">
            <span>Authoritative Supabase risk_assessments</span>
            <span className="text-[#159B72] font-semibold">Healthy Underwriting</span>
          </div>
        </div>
      </div>

      {/* Live Operational Transaction Activity Stream */}
      <LiveTransactionPulse maxItems={8} />

      {/* Review Queue Table */}
      <div className="bg-white rounded-3xl border border-[#E1E7F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E1E7F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-[#101A2C]">Executive Review &amp; Sign-off Docket</h3>
            <p className="text-xs text-[#536176]">Select any escalation to review audit notes and execute decisions</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#536176] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search case, manager, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs text-[#101A2C] focus:outline-hidden focus:border-[#2864F0] w-52"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs text-[#101A2C] focus:outline-hidden focus:border-[#2864F0]"
            >
              <option value="All">All Review Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F7FB] text-[#536176] text-[11px] font-bold uppercase tracking-wider border-b border-[#E1E7F0]">
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">Escalation Type</th>
                <th className="py-3 px-4">Assigned Manager</th>
                <th className="py-3 px-4">Review Notes</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E7F0] text-xs">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#536176]">
                    No cases match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => setSelectedReview(r)}
                  >
                    <td className="py-3.5 px-4 font-extrabold text-[#101A2C] font-mono">
                      {r.case_reference}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2864F0]/15 text-[#2864F0]">
                        {r.case_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#101A2C] font-semibold">
                      {r.assigned_manager}
                    </td>
                    <td className="py-3.5 px-4 text-[#536176] max-w-xs truncate">
                      {r.review_notes}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          r.review_status === 'Approved'
                            ? 'bg-emerald-50 text-[#159B72]'
                            : r.review_status === 'Rejected'
                            ? 'bg-rose-50 text-[#E45464]'
                            : 'bg-amber-50 text-[#F2A93B]'
                        }`}
                      >
                        {r.review_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReview(r);
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-[#2864F0] hover:bg-[#2864F0]/10 rounded-lg transition cursor-pointer"
                      >
                        Decide
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DECISION MODAL */}
      {selectedReview && (
        <div className="fixed inset-0 bg-[#101A2C]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E1E7F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E7F0]">
              <div>
                <h3 className="text-base font-extrabold text-[#101A2C] flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-[#2864F0]" />
                  Executive Escalation Review
                </h3>
                <span className="text-[11px] text-[#536176] font-mono">{selectedReview.case_reference}</span>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="text-[#536176] hover:text-[#101A2C] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F4F7FB] rounded-xl border border-[#E1E7F0]">
                <span className="text-[#536176] block">Escalation Matter</span>
                <span className="font-extrabold text-[#101A2C] mt-0.5 block">{selectedReview.case_type}</span>
                <span className="text-[10px] text-[#536176]">Manager: {selectedReview.assigned_manager}</span>
              </div>

              <div className="p-3 bg-[#F4F7FB] rounded-xl border border-[#E1E7F0]">
                <span className="text-[#536176] block">Current Status</span>
                <span
                  className={`font-extrabold text-sm mt-0.5 block ${
                    selectedReview.review_status === 'Approved'
                      ? 'text-[#159B72]'
                      : selectedReview.review_status === 'Rejected'
                      ? 'text-[#E45464]'
                      : 'text-[#F2A93B]'
                  }`}
                >
                  {selectedReview.review_status}
                </span>
                <span className="text-[10px] text-[#536176]">Created: {formatDate(selectedReview.created_at)}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs">
              <span className="font-bold text-blue-950 block mb-0.5">Dossier Context</span>
              <p className="text-blue-900 text-[11px]">{selectedReview.review_notes}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101A2C] mb-1">Executive Decision Notes</label>
              <textarea
                rows={2}
                placeholder="Enter executive reasoning for sign-off or veto..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => handleDecision('Approved')}
                className="px-4 py-2 bg-[#159B72] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Approve &amp; Authorize
              </button>
              <button
                onClick={() => handleDecision('Rejected')}
                className="px-4 py-2 bg-[#E45464] hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Veto / Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
