import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command,
  LayoutDashboard,
  Shield,
  LifeBuoy,
  FileText,
  Sparkles,
  Activity,
  Moon,
  Sun,
  User,
  LogOut,
  X,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getDashboardRouteForRole } from '../../utils/formatters';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  onOpenCopilot?: () => void;
  onOpenPulse?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenCopilot,
  onOpenPulse,
}) => {
  const { session, userRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const roleRoute = getDashboardRouteForRole(userRole) || '/';

  const allItems = [
    {
      id: 'my-dashboard',
      title: 'My Primary Dashboard',
      subtitle: `Open ${userRole || 'portal'} overview`,
      icon: LayoutDashboard,
      category: 'Navigation',
      action: () => onNavigate(roleRoute),
    },
    {
      id: 'copilot',
      title: 'Open Financial Intelligence Copilot',
      subtitle: 'Ask AI operational questions and anomaly analysis',
      icon: Sparkles,
      category: 'Intelligence',
      badge: 'AI',
      action: () => {
        if (onOpenCopilot) onOpenCopilot();
      },
    },
    {
      id: 'pulse',
      title: 'Live Transaction Activity Pulse',
      subtitle: 'Inspect real-time transaction streaming ledger',
      icon: Activity,
      category: 'Surveillance',
      badge: 'Live',
      action: () => {
        if (onOpenPulse) onOpenPulse();
      },
    },
    {
      id: 'theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: `Toggle interface theme (currently ${theme})`,
      icon: theme === 'dark' ? Sun : Moon,
      category: 'Preferences',
      action: () => toggleTheme(),
    },
    // Role-authorized pages
    ...(userRole === 'Admin'
      ? [
          {
            id: 'admin-dash',
            title: 'Admin Command Center',
            subtitle: 'Manage tenant staff, subscription, and audit logs',
            icon: Shield,
            category: 'Admin',
            action: () => onNavigate('/admin/dashboard'),
          },
        ]
      : []),
    ...(userRole === 'Manager'
      ? [
          {
            id: 'mgr-dash',
            title: 'Managerial Operations Command',
            subtitle: 'Executive queue, approvals, and performance metrics',
            icon: TrendingUp,
            category: 'Operations',
            action: () => onNavigate('/manager/dashboard'),
          },
        ]
      : []),
    ...(userRole === 'Risk Analyst'
      ? [
          {
            id: 'risk-dash',
            title: 'Credit Risk & Underwriting Desk',
            subtitle: 'Credit models, fraud alerts, and DTI stress analysis',
            icon: Shield,
            category: 'Risk',
            action: () => onNavigate('/risk-analyst/dashboard'),
          },
        ]
      : []),
    ...(userRole === 'Support Agent'
      ? [
          {
            id: 'support-dash',
            title: 'Omnichannel Customer Support Desk',
            subtitle: 'Dispute inquiries, SLA monitor, and customer lookup',
            icon: LifeBuoy,
            category: 'Support',
            action: () => onNavigate('/support/dashboard'),
          },
        ]
      : []),
    ...(userRole === 'Customer'
      ? [
          {
            id: 'cust-dash',
            title: 'Customer Wealth & Banking Portal',
            subtitle: 'View balances, send funds, and track support',
            icon: LayoutDashboard,
            category: 'Personal',
            action: () => onNavigate('/customer/dashboard'),
          },
        ]
      : []),
    {
      id: 'logout',
      title: 'Sign Out of FinOps',
      subtitle: 'Safely terminate your current authenticated session',
      icon: LogOut,
      category: 'Account',
      action: () => {
        logout();
        onNavigate('/login');
      },
    },
  ];

  const filteredItems = allItems.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        selected.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fade-in">
      <div
        className="w-full max-w-xl bg-[#0B1220] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-scale-up"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-[#1E293B] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#19D3A2] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to page... (Esc to close)"
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-[#121C2D] border border-[#1E293B] rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#1E293B]/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands or destinations found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#18263E] border border-[#19D3A2]/40 text-white'
                      : 'hover:bg-[#121C2D] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-[#19D3A2]/15 text-[#19D3A2]' : 'bg-[#121C2D] text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/20">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider shrink-0">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-[#121C2D] border-t border-[#1E293B] text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Select</span>
            <span>Esc Close</span>
          </div>
          <span className="text-[#19D3A2] font-semibold">FinOps AI Command</span>
        </div>
      </div>
    </div>
  );
};
