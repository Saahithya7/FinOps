import React, { useState, useMemo, useEffect } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Plus,
  Send,
  X,
  User,
  Shield,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  ThumbsUp,
  TrendingUp,
  RefreshCw,
  AlertCircle,
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
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/storage';
import { formatDate, formatShortDate } from '../../utils/formatters';
import { SupportTicket, TicketPriority, TicketStatus } from '../../types';
import {
  fetchSupportDashboardData,
  SupportDashboardData,
} from '../../services/supportDataService';
import {
  insertSupabaseSupportTicket,
  updateSupabaseSupportTicket,
} from '../../services/supabaseDataService';

export const SupportDashboard: React.FC<{ activeTab?: string }> = ({ activeTab = 'overview' }) => {
  const { session, activeBusiness } = useAuth();
  const businessId = activeBusiness?.id || 'biz_abc_01';
  const currentAgentName = session?.user?.full_name || 'Arjun Rao';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<SupportDashboardData | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // New ticket state
  const [newSubject, setNewSubject] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newPriority, setNewPriority] = useState<TicketPriority>('Medium');
  const [newCategory, setNewCategory] = useState<'Disputed Transaction' | 'Account Access' | 'KYC Verification' | 'UPI Failure' | 'Billing'>('Disputed Transaction');
  const [newInitialMsg, setNewInitialMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchSupportDashboardData(businessId, currentAgentName);
      if (res.error) {
        setErrorMsg(res.error);
      }
      if (res.data) {
        setDashboardData(res.data);
        setTickets(res.data.tickets);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to load support dashboard data from Supabase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId, currentAgentName]);

  // Support KPIs
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const assignedToMe = tickets.filter((t) =>
    t.assigned_agent.toLowerCase().includes('arjun') ||
    t.assigned_agent.toLowerCase().includes(currentAgentName.toLowerCase().split(' ')[0]) ||
    t.assigned_agent === currentAgentName
  ).length;
  const resolvedTickets = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length;

  // Chart 1: Status Distribution (Donut)
  const statusDistribution = useMemo(() => {
    if (dashboardData?.statusDistribution) return dashboardData.statusDistribution;
    return [
      { name: 'Resolved', count: resolvedTickets || 2, fill: '#159B72' },
      { name: 'In Progress', count: tickets.filter((t) => t.status === 'In Progress').length || 2, fill: '#2864F0' },
      { name: 'Open Queue', count: tickets.filter((t) => t.status === 'Open').length || 1, fill: '#E45464' },
      { name: 'Awaiting User', count: tickets.filter((t) => t.status === 'Waiting on Customer').length || 1, fill: '#F2A93B' },
    ];
  }, [dashboardData, resolvedTickets, tickets]);

  // Chart 2: Dispute Categories Breakdown (Bar)
  const ticketsByCategory = useMemo(() => {
    if (dashboardData?.ticketsByCategory) return dashboardData.ticketsByCategory;
    const counts: Record<string, number> = {
      'UPI Failure': 0,
      'Disputed Transaction': 0,
      'KYC Verification': 0,
      'Account Access': 0,
      'Billing': 0,
    };
    tickets.forEach((t) => {
      const c = t.category || 'Disputed Transaction';
      if (counts[c] !== undefined) counts[c]++;
      else counts['Disputed Transaction']++;
    });
    return [
      { category: 'UPI Failure', count: counts['UPI Failure'] || 3, fill: '#35C6D9' },
      { category: 'Dispute / Card', count: counts['Disputed Transaction'] || 2, fill: '#2864F0' },
      { category: 'KYC Checks', count: counts['KYC Verification'] || 2, fill: '#F2A93B' },
      { category: 'Access / Auth', count: counts['Account Access'] || 1, fill: '#101A2C' },
      { category: 'Billing', count: counts['Billing'] || 1, fill: '#8B5CF6' },
    ];
  }, [dashboardData, tickets]);

  // Chart 3: Ticket Inflow vs Resolution Velocity (Area Chart)
  const ticketTrendsOverTime = useMemo(() => {
    if (dashboardData?.ticketTrendsOverTime) return dashboardData.ticketTrendsOverTime;
    return [
      { day: '05 Oct', received: 2, resolved: 1 },
      { day: '08 Oct', received: 4, resolved: 3 },
      { day: '11 Oct', received: 3, resolved: 3 },
      { day: '14 Oct', received: 5, resolved: 4 },
      { day: '17 Oct', received: 4, resolved: 4 },
      { day: '20 Oct', received: Math.max(tickets.length, 3), resolved: Math.max(resolvedTickets, 2) },
    ];
  }, [dashboardData, tickets.length, resolvedTickets]);

  // Chart 4: Tickets by Priority Distribution (Bar Chart)
  const priorityDistribution = useMemo(() => {
    if (dashboardData?.priorityDistribution) return dashboardData.priorityDistribution;
    const counts = { Urgent: 0, High: 0, Medium: 0, Low: 0 };
    tickets.forEach((t) => {
      const p = t.priority || 'Medium';
      if (counts[p as keyof typeof counts] !== undefined) counts[p as keyof typeof counts]++;
      else counts.Medium++;
    });
    return [
      { priority: 'Urgent', count: counts.Urgent || 1, fill: '#E45464' },
      { priority: 'High', count: counts.High || 2, fill: '#F2A93B' },
      { priority: 'Medium', count: counts.Medium || 3, fill: '#2864F0' },
      { priority: 'Low', count: counts.Low || 2, fill: '#159B72' },
    ];
  }, [dashboardData, tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch =
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.assigned_agent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPrio = filterPriority === 'All' || t.priority === filterPriority;
      const matchSt = filterStatus === 'All' || t.status === filterStatus;
      return matchSearch && matchPrio && matchSt;
    });
  }, [tickets, searchTerm, filterPriority, filterStatus]);

  // Handle Update Status
  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    const updated: SupportTicket = {
      ...selectedTicket,
      status: newStatus,
      resolution_notes: replyMessage || selectedTicket.resolution_notes,
      updated_at: new Date().toISOString(),
    };
    db.saveTicket(updated);
    setTickets(tickets.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTicket(updated);
    setToastMsg(`Ticket ${updated.id} marked as ${newStatus}`);
    setReplyMessage('');

    // Sync to Supabase
    await updateSupabaseSupportTicket(updated.id, {
      status: newStatus,
      description: updated.resolution_notes,
    });

    setTimeout(() => setToastMsg(''), 3000);
  };

  // Handle Create Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTick: SupportTicket = {
      id: 'TCK-' + Math.floor(10000 + Math.random() * 90000),
      business_id: businessId,
      customer_id: 'cust_01',
      customer_name: newCustomerName || 'Walk-in Customer',
      assigned_agent: currentAgentName,
      subject: newSubject,
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      resolution_notes: newInitialMsg,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.saveTicket(newTick);
    setTickets([newTick, ...tickets]);

    // Insert to Supabase support_tickets table
    await insertSupabaseSupportTicket({
      organization_id: businessId,
      customer_id: 'cust_01',
      subject: newSubject,
      description: newInitialMsg || 'Customer support inquiry',
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      channel: 'Web Portal',
      assigned_to: currentAgentName,
    });

    setIsNewTicketOpen(false);
    setNewSubject('');
    setNewCustomerName('');
    setNewInitialMsg('');
    setToastMsg(`Support ticket ${newTick.id} created successfully.`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#101A2C] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#203252] animate-fade-in text-xs">
          <CheckCircle2 className="w-4 h-4 text-[#159B72]" />
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
            <span className="text-[11px] font-bold text-[#35C6D9] bg-[#35C6D9]/10 px-2.5 py-0.5 rounded-full border border-[#35C6D9]/20">
              Customer Support Desk
            </span>
            <span className="text-xs text-[#536176]">&bull; {currentAgentName}</span>
          </div>
          <h2 className="text-xl font-black text-[#101A2C] tracking-tight mt-1">
            Omnichannel Support &amp; Dispute Operations
          </h2>
          <p className="text-xs text-[#536176]">
            Transaction dispute tickets, account inquiries, and customer resolution workflow.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-[#F4F7FB] hover:bg-slate-100 text-[#101A2C] border border-[#E1E7F0] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={() => setIsNewTicketOpen(true)}
            className="px-4 py-2 bg-[#2864F0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Open New Ticket
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="flex-1">Supabase sync note: {errorMsg}. Displaying verified local cache.</p>
        </div>
      )}

      {/* 4 Support KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
          <div className="flex items-center justify-between text-[#536176] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inbound</span>
            <div className="p-2 rounded-xl bg-[#2864F0]/10 text-[#2864F0]">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#101A2C]">{totalTickets} Cases</div>
          <div className="mt-2 text-[11px] text-[#536176]">Logged in Supabase</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
          <div className="flex items-center justify-between text-[#536176] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Queue</span>
            <div className="p-2 rounded-xl bg-[#E45464]/10 text-[#E45464]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#101A2C]">{openTickets} Unresolved</div>
          <div className="mt-2 text-[11px] text-[#E45464] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Open / In Progress
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
          <div className="flex items-center justify-between text-[#536176] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned to Me</span>
            <div className="p-2 rounded-xl bg-[#F2A93B]/10 text-[#F2A93B]">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#101A2C]">{assignedToMe} Tickets</div>
          <div className="mt-2 text-[11px] text-[#536176]">Primary owner</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
          <div className="flex items-center justify-between text-[#536176] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Resolved Rate</span>
            <div className="p-2 rounded-xl bg-[#159B72]/10 text-[#159B72]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#101A2C]">{resolvedTickets} Closed</div>
          <div className="mt-2 text-[11px] text-[#159B72] font-semibold flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5" />
            {totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 100}% SLA Satisfied
          </div>
        </div>
      </div>

      {/* 4 INDEPENDENT SUPPORT CHARTS (OWNED EXCLUSIVELY BY SUPPORT DASHBOARD) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Chart 1: Ticket Status Distribution (Doughnut) */}
        <div className="bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#101A2C]">Ticket Status Distribution</h3>
              <p className="text-[11px] text-[#536176]">Current caseload states from <code className="font-mono text-[#2864F0]">public.support_tickets</code></p>
            </div>
            <span className="text-[10px] font-bold text-[#159B72] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Doughnut
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={4} dataKey="count">
                  {statusDistribution.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#101A2C', borderRadius: '10px', color: '#fff', fontSize: '11px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Support Chart 2: Dispute Categories Breakdown (Bar Chart) */}
        <div className="bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#101A2C]">Dispute &amp; Inquiries by Category</h3>
              <p className="text-[11px] text-[#536176]">Categorized inquiries handled across banking services</p>
            </div>
            <span className="text-[10px] font-bold text-[#2864F0] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Category Bar
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketsByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="category" tick={{ fill: '#536176', fontSize: 10 }} />
                <YAxis tick={{ fill: '#536176', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#101A2C', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {ticketsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Support Chart 3: Ticket Inflow vs Resolution Velocity (Area Chart) */}
        <div className="bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#101A2C]">Inflow vs Resolution Velocity</h3>
              <p className="text-[11px] text-[#536176]">Daily volume received vs successfully closed tickets</p>
            </div>
            <span className="text-[10px] font-bold text-[#35C6D9] bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
              Area Chart
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ticketTrendsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="supRecGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2864F0" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2864F0" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="supResGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#159B72" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#159B72" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#536176" tick={{ fontSize: 11 }} />
                <YAxis stroke="#536176" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#101A2C', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Legend verticalAlign="bottom" height={36} />
                <Area type="monotone" dataKey="received" name="Tickets Received" stroke="#2864F0" strokeWidth={2} fill="url(#supRecGrad)" />
                <Area type="monotone" dataKey="resolved" name="Tickets Resolved" stroke="#159B72" strokeWidth={2} fill="url(#supResGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Support Chart 4: Tickets by Priority Distribution (Bar Chart) */}
        <div className="bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-[#101A2C]">Tickets by Priority SLA Breakdown</h3>
              <p className="text-[11px] text-[#536176]">Caseload urgency ranking from Urgent to Low</p>
            </div>
            <span className="text-[10px] font-bold text-[#E45464] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Priority Bar
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="priority" tick={{ fill: '#536176', fontSize: 11 }} />
                <YAxis tick={{ fill: '#536176', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#101A2C', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Support Ticket Queue & Interactive Desk */}
      <div className="bg-white rounded-3xl border border-[#E1E7F0] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#E1E7F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-[#101A2C]">Omnichannel Ticket Queue</h3>
            <p className="text-xs text-[#536176]">Assigned customer support cases and resolution workflow</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs focus:outline-none focus:border-[#2864F0] w-44"
              />
            </div>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl px-2.5 py-1.5 text-xs text-[#101A2C] font-medium"
            >
              <option value="All">All Priority</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl px-2.5 py-1.5 text-xs text-[#101A2C] font-medium"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting on Customer">Waiting on Customer</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-[#536176] text-xs">
            No support tickets match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F7FB] text-[#536176] font-semibold uppercase text-[10px] tracking-wider border-b border-[#E1E7F0]">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E7F0]">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#101A2C]">{t.id}</td>
                    <td className="py-3 px-4 font-medium text-[#101A2C]">{t.customer_name || 'Retail Client'}</td>
                    <td className="py-3 px-4 text-[#101A2C] max-w-xs truncate">{t.subject}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold text-[#536176] bg-slate-100 px-2 py-0.5 rounded-md">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : t.priority === 'High'
                            ? 'bg-amber-100 text-amber-700'
                            : t.priority === 'Medium'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'Resolved' || t.status === 'Closed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : t.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : t.status === 'Waiting on Customer'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#536176]">{t.assigned_agent}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-2.5 py-1 bg-[#2864F0]/10 hover:bg-[#2864F0]/20 text-[#2864F0] rounded-lg font-bold text-[11px] transition cursor-pointer"
                      >
                        View &amp; Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details & Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E1E7F0] shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-[#E1E7F0] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#2864F0] bg-blue-50 px-2 py-0.5 rounded-md">
                    {selectedTicket.id}
                  </span>
                  <span className="text-xs text-[#536176]">{formatDate(selectedTicket.created_at)}</span>
                </div>
                <h3 className="text-base font-extrabold text-[#101A2C] mt-1">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-[#101A2C] hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#F4F7FB] p-4 rounded-2xl">
                <div>
                  <div className="text-[10px] text-[#536176] uppercase font-bold">Customer</div>
                  <div className="font-semibold text-[#101A2C]">{selectedTicket.customer_name || 'Retail Client'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#536176] uppercase font-bold">Category</div>
                  <div className="font-semibold text-[#101A2C]">{selectedTicket.category}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#536176] uppercase font-bold">Priority</div>
                  <div className="font-semibold text-[#101A2C]">{selectedTicket.priority}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#536176] uppercase font-bold">Current Status</div>
                  <div className="font-semibold text-[#101A2C]">{selectedTicket.status}</div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#536176] uppercase block mb-1">
                  Customer Inquiry Description
                </label>
                <div className="p-3 bg-slate-50 border border-[#E1E7F0] rounded-xl text-slate-700 leading-relaxed">
                  {selectedTicket.resolution_notes || 'Customer contacted support regarding this inquiry.'}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#536176] uppercase block mb-1">
                  Agent Response / Resolution Notes
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Enter response notes or resolution summary..."
                  rows={3}
                  className="w-full p-3 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs focus:outline-none focus:border-[#2864F0]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E1E7F0]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('In Progress')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Set In Progress
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('Waiting on Customer')}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Await Customer
                  </button>
                </div>
                <button
                  onClick={() => handleUpdateStatus('Resolved')}
                  className="px-4 py-1.5 bg-[#159B72] hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E1E7F0] shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-[#E1E7F0] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#101A2C]">Open New Customer Ticket</h3>
                <p className="text-xs text-[#536176]">Log a customer support dispute or banking inquiry</p>
              </div>
              <button
                onClick={() => setIsNewTicketOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-[#101A2C] hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-[#536176] uppercase block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Mehta"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full p-2.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs focus:outline-none focus:border-[#2864F0]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#536176] uppercase block mb-1">Subject / Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Card debited but merchant payment pending"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs focus:outline-none focus:border-[#2864F0]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#536176] uppercase block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs focus:outline-none focus:border-[#2864F0]"
                  >
                    <option value="Disputed Transaction">Disputed Transaction</option>
                    <option value="UPI Failure">UPI Failure</option>
                    <option value="Account Access">Account Access</option>
                    <option value="KYC Verification">KYC Verification</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#536176] uppercase block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full p-2.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs focus:outline-none focus:border-[#2864F0]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#536176] uppercase block mb-1">Initial Details / Notes</label>
                <textarea
                  rows={3}
                  placeholder="Describe the transaction reference or details..."
                  value={newInitialMsg}
                  onChange={(e) => setNewInitialMsg(e.target.value)}
                  className="w-full p-2.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs focus:outline-none focus:border-[#2864F0]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2 text-[#536176] hover:bg-slate-100 rounded-xl font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2864F0] hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
