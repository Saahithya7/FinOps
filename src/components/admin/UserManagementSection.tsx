import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Check,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  X,
  ChevronDown,
  Filter,
  Sparkles,
  ArrowRight,
  Info,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchSupabaseProfiles,
  updateCustomerAccountStatus,
  changeUserRole,
  SupabaseProfileRow,
} from '../../services/supabaseDataService';
import { formatShortDate, formatDate } from '../../utils/formatters';

interface UserManagementSectionProps {
  businessId?: string;
  onActionCompleted?: () => void;
}

type DirectoryTab = 'all' | 'pending' | 'active' | 'rejected' | 'employees';

const PERMITTED_ROLES = [
  'Admin',
  'Manager',
  'Risk Analyst',
  'Fraud & Compliance Analyst',
  'Support Agent',
  'Customer',
] as const;

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  businessId = 'biz_abc_01',
  onActionCompleted,
}) => {
  const { session } = useAuth();
  const currentUserId = session?.user?.id || (session?.user as any)?.user_id || '';
  const currentUserEmail = session?.user?.email?.toLowerCase() || '';

  // Directory state
  const [users, setUsers] = useState<SupabaseProfileRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Tab & Filters state
  const [activeTab, setActiveTab] = useState<DirectoryTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Notifications
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Status Change Confirmation Dialog
  const [statusDialog, setStatusDialog] = useState<{
    isOpen: boolean;
    user: SupabaseProfileRow | null;
    action: 'Approve Customer' | 'Reject Customer' | 'Reactivate Customer';
    newStatus: 'Active' | 'Rejected';
  }>({
    isOpen: false,
    user: null,
    action: 'Approve Customer',
    newStatus: 'Active',
  });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Role Change Confirmation Dialog
  const [roleDialog, setRoleDialog] = useState<{
    isOpen: boolean;
    user: SupabaseProfileRow | null;
    currentRole: string;
    targetRole: string;
  }>({
    isOpen: false,
    user: null,
    currentRole: 'Customer',
    targetRole: 'Customer',
  });
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // Fetch users from Supabase
  const loadUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetchSupabaseProfiles();
      if (res.error) {
        setFetchError(res.error);
      }
      setUsers(res.data);
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to load user records from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Compute tab counts
  const tabCounts = useMemo(() => {
    const all = users.length;
    let pending = 0;
    let active = 0;
    let rejected = 0;
    let employees = 0;

    users.forEach((u) => {
      const r = u.role || 'Customer';
      const isCust = r === 'Customer' || r === 'Applicant';
      const s = u.account_status || 'Pending';
      if (isCust) {
        if (s === 'Pending') pending++;
        else if (s === 'Active') active++;
        else if (s === 'Rejected') rejected++;
      } else {
        employees++;
      }
    });

    return { all, pending, active, rejected, employees };
  }, [users]);

  // Filtered users according to tab, search query, role filter, and status filter
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const role = u.role || 'Customer';
      const status = u.account_status || 'Pending';
      const isCust = role === 'Customer' || role === 'Applicant';

      // 1. Tab filter
      if (activeTab === 'pending') {
        if (!isCust || status !== 'Pending') return false;
      } else if (activeTab === 'active') {
        if (!isCust || status !== 'Active') return false;
      } else if (activeTab === 'rejected') {
        if (!isCust || status !== 'Rejected') return false;
      } else if (activeTab === 'employees') {
        if (isCust) return false;
      }

      // 2. Search filter (full name & email)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (u.full_name || '').toLowerCase().includes(q);
        const emailMatch = (u.email || '').toLowerCase().includes(q);
        if (!nameMatch && !emailMatch) return false;
      }

      // 3. Dropdown role filter
      if (roleFilter !== 'All') {
        if (role !== roleFilter) return false;
      }

      // 4. Dropdown status filter
      if (statusFilter !== 'All') {
        if (status !== statusFilter) return false;
      }

      return true;
    });
  }, [users, activeTab, searchQuery, roleFilter, statusFilter]);

  // Handlers for Status Dialog
  const handleOpenApprove = (u: SupabaseProfileRow) => {
    setStatusDialog({
      isOpen: true,
      user: u,
      action: 'Approve Customer',
      newStatus: 'Active',
    });
    setStatusError(null);
  };

  const handleOpenReject = (u: SupabaseProfileRow) => {
    setStatusDialog({
      isOpen: true,
      user: u,
      action: 'Reject Customer',
      newStatus: 'Rejected',
    });
    setStatusError(null);
  };

  const handleOpenReactivate = (u: SupabaseProfileRow) => {
    setStatusDialog({
      isOpen: true,
      user: u,
      action: 'Reactivate Customer',
      newStatus: 'Active',
    });
    setStatusError(null);
  };

  const handleConfirmStatus = async () => {
    if (isUpdatingStatus) return;
    if (!statusDialog.user) return;
    setIsUpdatingStatus(true);
    setStatusError(null);

    const target = statusDialog.user;
    const targetStatus = statusDialog.newStatus;
    const actionLabel = statusDialog.action;

    const res = await updateCustomerAccountStatus(
      target.user_id,
      targetStatus,
      target.full_name,
      target.email
    );

    setIsUpdatingStatus(false);

    if (res.success) {
      setStatusDialog({
        isOpen: false,
        user: null,
        action: 'Approve Customer',
        newStatus: 'Active',
      });
      setNotification({
        type: 'success',
        message: `Action successful: Customer ${target.full_name} account status updated to ${targetStatus} in Supabase profiles.`,
      });
      loadUsers();
      onActionCompleted?.();
      setTimeout(() => setNotification(null), 6000);
    } else {
      setStatusError(res.error || 'Failed to update customer account status in Supabase.');
    }
  };

  // Handlers for Role Dialog
  const handleOpenRoleModal = (u: SupabaseProfileRow) => {
    const curRole = u.role || 'Customer';
    setRoleDialog({
      isOpen: true,
      user: u,
      currentRole: curRole,
      targetRole: curRole,
    });
    setRoleError(null);
  };

  const handleConfirmRole = async () => {
    if (isUpdatingRole) return;
    if (!roleDialog.user) return;
    const target = roleDialog.user;
    const prev = roleDialog.currentRole;
    const next = roleDialog.targetRole;

    if (prev === next) {
      setRoleError('Please choose a different role from the dropdown.');
      return;
    }

    // Security check: user cannot modify own role
    if (
      (currentUserId && target.user_id && currentUserId === target.user_id) ||
      (currentUserEmail && target.email && currentUserEmail === target.email.toLowerCase())
    ) {
      setRoleError(
        'Security Policy Violation: You cannot modify your own role through this interface.'
      );
      return;
    }

    // Protect primary Admin account
    if (
      (target.email === 'admin@abcfinance.com' ||
        target.user_id === 'e2ff607e-69ad-4027-bd00-69afb0516396') &&
      next !== 'Admin'
    ) {
      setRoleError(
        'Security Policy Violation: Cannot demote the primary administrator account (admin@abcfinance.com). Platform security requires at least one active Admin.'
      );
      return;
    }

    setIsUpdatingRole(true);
    setRoleError(null);

    const res = await changeUserRole(
      target.user_id,
      next,
      target.email,
      target.full_name,
      prev
    );

    setIsUpdatingRole(false);

    if (res.success) {
      setRoleDialog({
        isOpen: false,
        user: null,
        currentRole: 'Customer',
        targetRole: 'Customer',
      });
      setNotification({
        type: 'success',
        message: `Role assignment successful: Changed ${target.full_name}'s role from ${prev} to ${next} in Supabase profiles. Event logged to admin_activity_logs.`,
      });
      loadUsers();
      onActionCompleted?.();
      setTimeout(() => setNotification(null), 6000);
    } else {
      setRoleError(res.error || 'Failed to update user role in Supabase.');
    }
  };

  // Helpers for role badge styles
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-slate-900 text-white border-slate-900';
      case 'Risk Analyst':
        return 'bg-emerald-50 text-[#159B72] border-emerald-200';
      case 'Fraud & Compliance Analyst':
        return 'bg-rose-50 text-[#E45464] border-rose-200';
      case 'Manager':
        return 'bg-amber-50 text-[#F2A93B] border-amber-200';
      case 'Support Agent':
        return 'bg-cyan-50 text-[#35C6D9] border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helpers for status badge styles
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Active':
        return {
          css: 'bg-emerald-50 text-[#159B72] border-emerald-200',
          icon: CheckCircle2,
          label: 'Active',
        };
      case 'Rejected':
        return {
          css: 'bg-rose-50 text-[#E45464] border-rose-200',
          icon: XCircle,
          label: 'Rejected',
        };
      default:
        return {
          css: 'bg-amber-50 text-[#F2A93B] border-amber-200',
          icon: Clock,
          label: 'Pending Review',
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E1E7F0] shadow-xs overflow-hidden p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E1E7F0]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#159B72] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Admin Portal
            </span>
            <span className="text-xs text-[#536176]">
              &bull; Supabase RBAC &amp; Customer Verification Engine
            </span>
          </div>
          <h3 className="text-lg font-black text-[#101A2C] tracking-tight mt-1">
            Customer Approval &amp; User Role Management
          </h3>
          <p className="text-xs text-[#536176]">
            Real-time directory connected to Supabase profiles. Approve customer accounts, reactivate rejected applicants, and securely assign enterprise roles with immutable audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadUsers}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl border border-[#E1E7F0] text-xs font-semibold text-[#536176] hover:bg-slate-50 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh directory from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#2864F0]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Global Action Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-[#159B72] border border-emerald-200 font-semibold'
              : 'bg-rose-50 text-[#E45464] border border-rose-200 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-[#E45464] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Notice from Supabase query: {fetchError}</span>
        </div>
      )}

      {/* 5 Directory Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F4F7FB] rounded-2xl border border-[#E1E7F0]">
        {[
          { key: 'all', label: 'All Users', count: tabCounts.all },
          { key: 'pending', label: 'Pending Customers', count: tabCounts.pending, badgeColor: 'bg-amber-100 text-amber-800' },
          { key: 'active', label: 'Active Customers', count: tabCounts.active, badgeColor: 'bg-emerald-100 text-emerald-800' },
          { key: 'rejected', label: 'Rejected Customers', count: tabCounts.rejected, badgeColor: 'bg-rose-100 text-rose-800' },
          { key: 'employees', label: 'Employees', count: tabCounts.employees, badgeColor: 'bg-blue-100 text-blue-800' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as DirectoryTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-white text-[#101A2C] shadow-xs border border-[#E1E7F0]'
                  : 'text-[#536176] hover:text-[#101A2C] hover:bg-white/50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive
                    ? 'bg-[#101A2C] text-white'
                    : tab.badgeColor || 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search by Full Name and Email */}
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
          <input
            type="text"
            placeholder="Search directory by full name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E1E7F0] focus:outline-hidden focus:border-[#2864F0] text-xs text-[#101A2C] bg-[#F4F7FB]/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter Dropdown */}
        <div className="md:col-span-3 flex items-center gap-1.5">
          <label className="text-[11px] font-bold text-[#536176] shrink-0">Role:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E1E7F0] text-xs font-semibold text-[#101A2C] bg-white focus:outline-hidden focus:border-[#2864F0] cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Risk Analyst">Risk Analyst</option>
            <option value="Fraud & Compliance Analyst">Fraud &amp; Compliance Analyst</option>
            <option value="Support Agent">Support Agent</option>
          </select>
        </div>

        {/* Account Status Filter Dropdown */}
        <div className="md:col-span-3 flex items-center gap-1.5">
          <label className="text-[11px] font-bold text-[#536176] shrink-0">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#E1E7F0] text-xs font-semibold text-[#101A2C] bg-white focus:outline-hidden focus:border-[#2864F0] cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Review</option>
            <option value="Active">Active</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#E1E7F0]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4F7FB] text-[#536176] text-[11px] font-bold uppercase tracking-wider border-b border-[#E1E7F0]">
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Email Address</th>
              <th className="py-3 px-4">Current Role</th>
              <th className="py-3 px-4">Account Status</th>
              <th className="py-3 px-4">Registration Date</th>
              <th className="py-3 px-4 text-center">Available Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E1E7F0] text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#536176]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-[#2864F0] animate-spin" />
                    <span className="font-semibold text-xs">Fetching verified users from Supabase...</span>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#536176]">
                  <div className="max-w-xs mx-auto space-y-1">
                    <UserX className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="font-bold text-[#101A2C]">No matching user records</div>
                    <div className="text-[11px] text-[#536176]">
                      Try clearing filters or search terms to inspect more users.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const role = u.role || 'Customer';
                const status = u.account_status || 'Pending';
                const isCustomer = role === 'Customer' || role === 'Applicant';
                const statusInfo = getStatusBadge(status);
                const StatusIcon = statusInfo.icon;
                const isProtectedAdmin =
                  u.email === 'admin@abcfinance.com' ||
                  u.user_id === 'e2ff607e-69ad-4027-bd00-69afb0516396';

                const isCurrentUser = Boolean(
                  (currentUserId && u.user_id && currentUserId === u.user_id) ||
                  (currentUserEmail && u.email && currentUserEmail === u.email.toLowerCase())
                );

                return (
                  <tr key={u.user_id || u.email} className="hover:bg-slate-50/70 transition">
                    {/* Full Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#101A2C] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {(u.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-[#101A2C] flex items-center gap-1.5">
                            <span>{u.full_name || 'Anonymous User'}</span>
                            {isProtectedAdmin && (
                              <span
                                title="Primary Platform Administrator"
                                className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 text-[#2864F0]"
                              >
                                Primary Admin
                              </span>
                            )}
                            {isCurrentUser && (
                              <span
                                title="Currently Authenticated Account"
                                className="px-1.5 py-0.2 rounded text-[9px] font-black bg-teal-100 text-[#0D9488]"
                              >
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-[#536176] truncate max-w-[130px]">
                            {u.user_id ? `ID: ${u.user_id.slice(0, 8)}...` : 'Local record'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-[#536176]">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="font-medium text-[#101A2C]">{u.email}</span>
                      </div>
                    </td>

                    {/* Current Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getRoleBadge(
                          role
                        )}`}
                      >
                        {role}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${statusInfo.css}`}
                      >
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        <span>{statusInfo.label}</span>
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="py-3.5 px-4 text-[#536176] font-mono text-[11px]">
                      {u.created_at ? formatShortDate(u.created_at) : 'N/A'}
                    </td>

                    {/* Available Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Status approval / rejection for customers */}
                        {isCustomer && (
                          <>
                            {status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  disabled={isUpdatingStatus || isUpdatingRole}
                                  onClick={() => handleOpenApprove(u)}
                                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                                  title="Approve customer account"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isUpdatingStatus || isUpdatingRole}
                                  onClick={() => handleOpenReject(u)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                                  title="Reject customer account"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {status === 'Rejected' && (
                              <button
                                type="button"
                                disabled={isUpdatingStatus || isUpdatingRole}
                                onClick={() => handleOpenReactivate(u)}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                                title="Reactivate previously rejected customer"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reactivate</span>
                              </button>
                            )}

                            {status === 'Active' && (
                              <button
                                type="button"
                                disabled={isUpdatingStatus || isUpdatingRole}
                                onClick={() => handleOpenReject(u)}
                                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-[#E45464] border border-rose-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Reject / Suspend active customer"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* Edit Role Action for All Users */}
                        {isCurrentUser ? (
                          <span
                            className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold flex items-center gap-1 border border-slate-200 cursor-not-allowed"
                            title="Security Policy: You cannot modify your own role"
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Your Account</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isUpdatingRole || isUpdatingStatus}
                            onClick={() => handleOpenRoleModal(u)}
                            className="px-2.5 py-1 bg-white hover:bg-teal-50 border border-[#E1E7F0] hover:border-[#0D9488] text-xs font-bold text-[#0D9488] rounded-lg transition flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                            title="Edit user role"
                          >
                            <Shield className="w-3 h-3" />
                            <span>Edit Role</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 1. CUSTOMER ACCOUNT STATUS CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {statusDialog.isOpen && statusDialog.user && (
        <div className="fixed inset-0 bg-[#101A2C]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E1E7F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E7F0]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#2864F0]" />
                <h4 className="text-base font-extrabold text-[#101A2C]">
                  Confirm Account Status Change
                </h4>
              </div>
              <button
                onClick={() =>
                  setStatusDialog({
                    isOpen: false,
                    user: null,
                    action: 'Approve Customer',
                    newStatus: 'Active',
                  })
                }
                className="text-[#536176] hover:text-[#101A2C] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User detail callout */}
            <div className="bg-[#F4F7FB] p-4 rounded-2xl border border-[#E1E7F0] space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#536176] font-medium">Customer:</span>
                <span className="font-extrabold text-[#101A2C]">
                  {statusDialog.user.full_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#536176] font-medium">Email:</span>
                <span className="font-mono text-[#101A2C]">{statusDialog.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#536176] font-medium">Current Status:</span>
                <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                  {statusDialog.user.account_status || 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#E1E7F0]">
                <span className="text-[#536176] font-medium">Action:</span>
                <span className="font-extrabold text-[#2864F0]">{statusDialog.action}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#536176] font-medium">New Status:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    statusDialog.newStatus === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {statusDialog.newStatus}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#536176] leading-relaxed">
              {statusDialog.newStatus === 'Active'
                ? 'Approving will grant this customer authoritative access to verified personal banking features, fund transfers, and ledger accounts in accordance with Supabase RLS security policies.'
                : 'Rejecting this customer will restrict access to financial actions and route them to the compliance review screen.'}
            </p>

            {statusError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#E45464] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setStatusDialog({
                    isOpen: false,
                    user: null,
                    action: 'Approve Customer',
                    newStatus: 'Active',
                  })
                }
                className="px-4 py-2 rounded-xl border border-[#E1E7F0] text-xs font-semibold text-[#536176] hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleConfirmStatus}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 ${
                  statusDialog.newStatus === 'Active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {isUpdatingStatus ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm {statusDialog.action}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CHANGE ROLE CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {roleDialog.isOpen && roleDialog.user && (
        <div className="fixed inset-0 bg-[#101A2C]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E1E7F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E7F0]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#2864F0]" />
                <h4 className="text-base font-extrabold text-[#101A2C]">Change User Role</h4>
              </div>
              <button
                onClick={() =>
                  setRoleDialog({
                    isOpen: false,
                    user: null,
                    currentRole: 'Customer',
                    targetRole: 'Customer',
                  })
                }
                className="text-[#536176] hover:text-[#101A2C] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User detail callout */}
            <div className="bg-[#F4F7FB] p-4 rounded-2xl border border-[#E1E7F0] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#536176] font-medium">User Name:</span>
                <span className="font-extrabold text-[#101A2C]">{roleDialog.user.full_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#536176] font-medium">Email:</span>
                <span className="font-mono text-[#101A2C]">{roleDialog.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#536176] font-medium">Current Role:</span>
                <span className="px-2 py-0.5 rounded font-bold bg-slate-200 text-slate-800">
                  {roleDialog.currentRole}
                </span>
              </div>
            </div>

            {/* Permitted Roles Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#101A2C]">
                Select Authorized New Role:
              </label>
              <select
                value={roleDialog.targetRole}
                onChange={(e) =>
                  setRoleDialog((prev) => ({ ...prev, targetRole: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-[#E1E7F0] text-xs font-semibold text-[#101A2C] bg-white focus:outline-hidden focus:border-[#2864F0] cursor-pointer"
              >
                {PERMITTED_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r} {r === 'Admin' ? '(Enterprise Administrator)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin demotion warning if applicable */}
            {(roleDialog.user.email === 'admin@abcfinance.com' ||
              roleDialog.user.user_id === 'e2ff607e-69ad-4027-bd00-69afb0516396') &&
              roleDialog.targetRole !== 'Admin' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Warning: Demotion of the primary administrator account (admin@abcfinance.com) is blocked to maintain platform availability.
                  </span>
                </div>
              )}

            <p className="text-[11px] text-[#536176] leading-relaxed">
              Confirming this role change will submit a secure update to <code className="font-mono text-[#2864F0]">public.profiles.role</code> and record an immutable audit entry in <code className="font-mono text-[#2864F0]">public.admin_activity_logs</code>.
            </p>

            {roleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#E45464] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{roleError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setRoleDialog({
                    isOpen: false,
                    user: null,
                    currentRole: 'Customer',
                    targetRole: 'Customer',
                  })
                }
                className="px-4 py-2 rounded-xl border border-[#E1E7F0] text-xs font-semibold text-[#536176] hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingRole || roleDialog.currentRole === roleDialog.targetRole}
                onClick={handleConfirmRole}
                className="px-5 py-2 rounded-xl bg-[#2864F0] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUpdatingRole ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Supabase...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Confirm Role Change</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
