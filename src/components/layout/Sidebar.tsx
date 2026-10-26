import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  FileCheck2,
  Users,
  LifeBuoy,
  Settings,
  CreditCard,
  Building,
  TrendingUp,
  ReceiptText,
  AlertTriangle,
  FolderLock,
  PieChart,
  ArrowLeft,
  ChevronRight,
  Shield,
  FileSignature,
  ChevronLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentPortal: UserRole;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onNavigatePortalHub?: () => void;
  onNavigateHome?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPortal,
  activeTab,
  onSelectTab,
  onNavigatePortalHub,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const { session, activeBusiness } = useAuth();
  const { isDark } = useTheme();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const getNavItems = () => {
    switch (currentPortal) {
      case 'Customer':
        return [
          { id: 'overview', label: 'Financial Overview', icon: LayoutDashboard },
          { id: 'transactions', label: 'Recent Transactions', icon: ReceiptText },
          { id: 'support', label: 'Help & Support', icon: LifeBuoy },
          { id: 'investments', label: 'Investments & Wealth', icon: TrendingUp },
          { id: 'credit_health', label: 'Credit Health & Loans', icon: Shield },
          { id: 'budget', label: 'Budget Progress', icon: FileCheck2 },
          { id: 'profile', label: 'Account Details', icon: Users },
        ];
      case 'Risk Analyst':
        return [
          { id: 'overview', label: 'Risk Analytics', icon: LayoutDashboard },
          { id: 'investigation', label: 'Fraud Studio', icon: ShieldAlert },
          { id: 'applications', label: 'Underwriting Desk', icon: FileCheck2 },
          { id: 'scoring', label: 'Credit Scores & DTI', icon: TrendingUp },
          { id: 'trends', label: 'Risk Trends', icon: PieChart },
        ];
      case 'Fraud & Compliance Analyst':
        return [
          { id: 'overview', label: 'Surveillance Center', icon: LayoutDashboard },
          { id: 'monitoring', label: 'Investigation Queue', icon: AlertTriangle },
          { id: 'alerts', label: 'High-Risk Alerts', icon: ShieldAlert },
          { id: 'compliance', label: 'AML & SAR Filings', icon: FolderLock },
        ];
      case 'Manager':
        return [
          { id: 'overview', label: 'Executive Operations', icon: LayoutDashboard },
          { id: 'approvals', label: 'Pending Approvals', icon: FileSignature },
          { id: 'escalated', label: 'Escalated Cases', icon: AlertTriangle },
          { id: 'performance', label: 'Team Performance', icon: Users },
          { id: 'timeline', label: 'Operational Activity', icon: FolderLock },
        ];
      case 'Support Agent':
        return [
          { id: 'overview', label: 'Support Queue & SLA', icon: LayoutDashboard },
          { id: 'assigned', label: 'Assigned to Me', icon: Users },
          { id: 'priority', label: 'High-Priority Issues', icon: AlertTriangle },
          { id: 'resolved', label: 'Resolved Tickets', icon: LifeBuoy },
        ];
      case 'Admin':
        return [
          { id: 'overview', label: 'Admin Command', icon: LayoutDashboard },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'invitations', label: 'Employee Invitations', icon: Shield },
          { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard },
          { id: 'audit_logs', label: 'Security Audit Logs', icon: FolderLock },
          { id: 'settings', label: 'Business Profile', icon: Settings },
        ];
      default:
        return [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`transition-all duration-300 flex flex-col shrink-0 border-r min-h-[calc(100vh-64px)] select-none ${
        collapsed ? 'w-20' : 'w-64'
      } ${
        isDark
          ? 'bg-[#0B1220] text-slate-300 border-[#1E293B]'
          : 'bg-[#101A2C] text-slate-300 border-[#18263E]'
      }`}
    >
      {/* Workspace Header */}
      <div className={`p-4 border-b ${isDark ? 'border-[#1E293B]' : 'border-[#18263E]'}`}>
        {!collapsed ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#19D3A2] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#19D3A2] animate-pulse" />
                {currentPortal}
              </div>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#121C2D] text-slate-400 border border-[#1E293B]">
                Desk
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 truncate font-semibold">
              {session?.accountType === 'customer'
                ? 'Personal Wealth Account'
                : activeBusiness?.business_name || 'Apex FinTech Capital Ltd'}
            </p>

            {session?.accountType === 'business' && onNavigatePortalHub && (
              <button
                onClick={onNavigatePortalHub}
                className="mt-3 w-full py-1.5 px-2 bg-[#121C2D] hover:bg-[#18263E] text-[#19D3A2] text-xs font-semibold rounded-lg border border-[#1E293B] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Portal Directory
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#19D3A2] animate-pulse" />
            <span className="text-[9px] font-bold uppercase text-[#19D3A2] mt-1 text-center">
              {currentPortal.substring(0, 3)}
            </span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl text-xs font-medium transition cursor-pointer ${
                collapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-[#19D3A2]/20 to-[#19D3A2]/5 text-white font-bold border border-[#19D3A2]/40 shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#121C2D]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#19D3A2]' : 'text-slate-400'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!collapsed && isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-[#19D3A2] shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Collapse Toggle & Organization Footer */}
      <div
        className={`p-3 border-t flex flex-col gap-2 ${
          isDark ? 'border-[#1E293B] bg-[#0B1220]' : 'border-[#18263E] bg-[#0A111E]'
        }`}
      >
        <button
          type="button"
          onClick={toggleCollapse}
          className="w-full py-1.5 px-2 rounded-lg bg-[#121C2D] hover:bg-[#18263E] border border-[#1E293B] text-slate-400 hover:text-white text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-[#19D3A2]" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-[#19D3A2]" />
              <span className="text-[11px] font-semibold">Collapse Sidebar</span>
            </>
          )}
        </button>

        {!collapsed && (
          <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="font-mono">FINOPS v2.4</span>
            <span className="text-[#19D3A2] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#19D3A2]" /> Online
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
