import React, { useState } from 'react';
import {
  Bell,
  X,
  SlidersHorizontal,
  Home,
  ChevronRight,
  Activity,
  Sparkles,
  Search,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { DemoBanner } from '../common/DemoBanner';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole, DashboardWidgetConfig } from '../../types';
import { FinancialCopilot } from '../copilot/FinancialCopilot';
import { CommandPalette } from '../common/CommandPalette';
import { CustomizeDashboardModal } from '../dashboard/CustomizeDashboardModal';
import {
  getSavedDashboardLayout,
  saveDashboardLayout,
} from '../../services/dashboardCustomizationService';

interface DashboardLayoutProps {
  portalRole: UserRole;
  title: string;
  subtitle?: string;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onLayoutChange?: (widgets: DashboardWidgetConfig[]) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  portalRole,
  title,
  subtitle,
  activeTab,
  onSelectTab,
  onNavigate,
  currentRoute,
  children,
  actions,
  onLayoutChange,
}) => {
  const { session, userRole } = useAuth();
  const { isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const userId = session?.user?.id || 'default_user';
  const currentWidgets = getSavedDashboardLayout(portalRole, userId);

  const notifications = [
    {
      id: 1,
      title: 'High-Value Settlement Alert',
      desc: '₹2,85,000 transaction flagged for velocity spike on card ending 4012',
      time: '12m ago',
      type: 'warning',
    },
    {
      id: 2,
      title: 'Credit Assessment Approved',
      desc: 'Rohan Mehta loan assessment approved at ₹15,00,000 by Manager',
      time: '1h ago',
      type: 'success',
    },
    {
      id: 3,
      title: 'Manager Approval Required',
      desc: 'Zenith Logistics fleet finance request ₹1,00,00,000 escalated',
      time: '2h ago',
      type: 'info',
    },
    {
      id: 4,
      title: 'SLA Target Achieved',
      desc: 'Support turnaround average maintained under 14 minutes today',
      time: '3h ago',
      type: 'success',
    },
  ];

  const handleApplyLayout = (newWidgets: DashboardWidgetConfig[]) => {
    saveDashboardLayout(portalRole, userId, newWidgets);
    if (onLayoutChange) {
      onLayoutChange(newWidgets);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isDark ? 'bg-[#0B1220] text-slate-100' : 'bg-[#F4F7FB] text-[#101A2C]'
      }`}
    >
      <DemoBanner
        onNavigatePortalHub={() => onNavigate('/business/portal')}
        onNavigateHome={() => onNavigate('/')}
      />

      <Navbar
        onNavigate={onNavigate}
        currentRoute={currentRoute}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Role-Specific Collapsible Sidebar */}
        <Sidebar
          currentPortal={portalRole}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          onNavigatePortalHub={() => onNavigate('/business/portal')}
          onNavigateHome={() => onNavigate('/')}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-y-auto max-h-[calc(100vh-100px)]">
          {/* Subheader Bar with Breadcrumbs & Actions */}
          <div
            className={`border-b px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md transition-colors ${
              isDark
                ? 'bg-[#121C2D]/95 border-[#1E293B] shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                : 'bg-white/95 border-[#E2E8F0] shadow-[0_1px_2px_rgba(16,26,44,0.02)]'
            }`}
          >
            {/* Breadcrumb Path & Title */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-[#19D3A2] transition flex items-center gap-1 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>FinOps</span>
                </button>
                <ChevronRight className="w-3 h-3 text-slate-500" />
                <span className="text-[#19D3A2] font-semibold">{portalRole} Desk</span>
                <ChevronRight className="w-3 h-3 text-slate-500" />
                <span className="capitalize font-medium text-slate-300">
                  {activeTab.replace('_', ' ')}
                </span>
              </div>

              <h1
                className={`text-xl font-black tracking-tight mt-1 ${
                  isDark ? 'text-white' : 'text-[#0B1220]'
                }`}
              >
                {title}
              </h1>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>

            {/* Quick Action Bar */}
            <div className="flex items-center gap-2.5">
              {/* Customize Dashboard Button */}
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  isDark
                    ? 'bg-[#0B1220] hover:bg-[#18263E] border-[#1E293B] text-slate-300 hover:text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
                title="Rearrange or toggle widgets"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#19D3A2]" />
                <span className="hidden sm:inline">Customize</span>
              </button>

              {/* Notification Center */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-xl border transition relative cursor-pointer ${
                    isDark
                      ? 'bg-[#0B1220] hover:bg-[#18263E] border-[#1E293B] text-slate-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                  title="Operational Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full animate-ping" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
                </button>

                {showNotifications && (
                  <div
                    className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border p-3.5 z-50 animate-scale-up ${
                      isDark
                        ? 'bg-[#0B1220] border-[#1E293B] text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#1E293B]">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#19D3A2]" /> Operational Feeds
                      </span>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="py-2 space-y-2 text-xs max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-xl border transition ${
                            isDark
                              ? 'bg-[#121C2D] border-[#1E293B] hover:bg-[#18263E]'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-slate-100 leading-tight">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{n.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#1E293B] flex justify-between items-center text-[11px] text-slate-400">
                      <span>4 new events</span>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-[#19D3A2] font-semibold hover:underline cursor-pointer"
                      >
                        Dismiss All
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {actions}
            </div>
          </div>

          {/* Page Content Body */}
          <div className="p-6 flex-1">{children}</div>
        </main>
      </div>

      {/* Financial Intelligence Copilot Floating Drawer & FAB */}
      <FinancialCopilot
        isOpen={isCopilotOpen}
        onToggleOpen={() => setIsCopilotOpen(!isCopilotOpen)}
      />

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onNavigate}
        onOpenCopilot={() => setIsCopilotOpen(true)}
      />

      {/* Customize Dashboard Modal */}
      <CustomizeDashboardModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        role={portalRole}
        userId={userId}
        currentWidgets={currentWidgets}
        onApplyLayout={handleApplyLayout}
      />
    </div>
  );
};
