import React, { useState } from 'react';
import {
  TrendingUp,
  ChevronDown,
  LogOut,
  User,
  Building,
  Menu,
  X,
  CreditCard,
  LayoutDashboard,
  Search,
  Moon,
  Sun,
  Sparkles,
  Shield,
  Activity,
  Palette,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getDashboardRouteForRole } from '../../utils/formatters';

interface NavbarProps {
  onNavigate: (route: string) => void;
  currentRoute: string;
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  currentRoute,
  onOpenCommandPalette,
}) => {
  const { session, userRole, activeBusiness, logout } = useAuth();
  const { isDark, toggleTheme, setIsThemeManagerOpen } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNav = (route: string) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const dashboardRoute = getDashboardRouteForRole(userRole) || '/login';

  return (
    <nav
      className={`sticky top-0 z-30 transition-colors border-b ${
        isDark
          ? 'bg-[#0B1220]/95 backdrop-blur-md border-[#1E293B] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
          : 'bg-white/95 backdrop-blur-md border-[#E2E8F0] text-slate-800 shadow-[0_1px_3px_rgba(16,26,44,0.04)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo */}
          <div
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#121C2D] to-[#1E293B] border border-[#19D3A2]/30 flex items-center justify-center text-white shadow-md group-hover:border-[#19D3A2] transition">
              <TrendingUp className="w-5 h-5 text-[#19D3A2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-black text-lg tracking-tight ${
                    isDark ? 'text-white' : 'text-[#0B1220]'
                  }`}
                >
                  FinOps<span className="text-[#19D3A2]"> AI</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#19D3A2]/15 text-[#19D3A2] px-1.5 py-0.5 rounded border border-[#19D3A2]/30">
                  Enterprise
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">
                Financial Operations Suite
              </p>
            </div>
          </div>

          {/* Quick Command Search Trigger */}
          <div className="hidden md:flex items-center">
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs transition cursor-pointer ${
                isDark
                  ? 'bg-[#121C2D] hover:bg-[#18263E] border-[#1E293B] text-slate-300 hover:text-white'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="Open Command Palette (Ctrl+K / Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#19D3A2]" />
              <span className="text-xs">Quick search or commands...</span>
              <kbd
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  isDark
                    ? 'bg-[#0B1220] border-[#1E293B] text-slate-400'
                    : 'bg-white border-slate-300 text-slate-500'
                }`}
              >
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <button
              onClick={() => handleNav('/#product')}
              className="hover:text-[#19D3A2] transition cursor-pointer"
            >
              Product
            </button>
            <button
              onClick={() => handleNav('/#features')}
              className="hover:text-[#19D3A2] transition cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => handleNav('/#solutions')}
              className="hover:text-[#19D3A2] transition cursor-pointer"
            >
              Solutions
            </button>
            <button
              onClick={() => handleNav('/pricing')}
              className={`hover:text-[#19D3A2] transition cursor-pointer ${
                currentRoute === '/pricing' ? 'text-[#19D3A2] font-bold' : ''
              }`}
            >
              Pricing
            </button>

            {session && (
              <button
                onClick={() => handleNav(dashboardRoute)}
                className="text-[#19D3A2] font-bold flex items-center gap-1.5 transition cursor-pointer bg-[#19D3A2]/10 hover:bg-[#19D3A2]/20 px-3 py-1.5 rounded-xl border border-[#19D3A2]/30"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#19D3A2]" />
                {userRole ? `${userRole} Desk` : 'My Workspace'}
              </button>
            )}
          </div>

          {/* Action Buttons & Profile */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Theme Toggle & Manager Buttons */}
            <button
              type="button"
              onClick={() => setIsThemeManagerOpen(true)}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-[#121C2D] hover:bg-[#18263E] border-[#1E293B] text-[#38BDF8]'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-[#2864F0]'
              }`}
              title="Theme Architecture (Original FinOps Blue / Old Money)"
            >
              <Palette className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-[#121C2D] hover:bg-[#18263E] border-[#1E293B] text-amber-300'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2.5 p-1.5 pr-3 rounded-full border transition text-left cursor-pointer ${
                    isDark
                      ? 'bg-[#121C2D] hover:bg-[#18263E] border-[#1E293B]'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#19D3A2] to-[#059669] text-[#0B1220] flex items-center justify-center font-black text-xs shadow-xs">
                    {session.user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left text-xs">
                    <p
                      className={`font-bold truncate max-w-[120px] ${
                        isDark ? 'text-white' : 'text-[#0B1220]'
                      }`}
                    >
                      {session.user.full_name}
                    </p>
                    <p className="text-[10px] text-[#19D3A2] font-semibold">{userRole}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border py-2 z-50 animate-scale-up ${
                      isDark
                        ? 'bg-[#0B1220] border-[#1E293B] text-slate-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 border-b text-xs ${
                        isDark ? 'border-[#1E293B]' : 'border-slate-100'
                      }`}
                    >
                      <p className="font-extrabold">{session.user.full_name}</p>
                      <p className="text-slate-400 truncate text-[11px]">{session.user.email}</p>
                      {activeBusiness && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#19D3A2] bg-[#19D3A2]/10 px-2 py-0.5 rounded font-medium border border-[#19D3A2]/20">
                          <Building className="w-3 h-3 text-[#19D3A2]" />
                          {activeBusiness.business_name}
                        </div>
                      )}
                    </div>

                    <div className="py-1.5 text-xs">
                      <button
                        onClick={() => handleNav(dashboardRoute)}
                        className={`w-full text-left px-4 py-2 flex items-center gap-2 font-bold cursor-pointer transition ${
                          isDark
                            ? 'text-[#19D3A2] hover:bg-[#121C2D]'
                            : 'text-blue-600 hover:bg-slate-50'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        {userRole ? `${userRole} Dashboard` : 'My Workspace'}
                      </button>

                      {userRole === 'Admin' && (
                        <>
                          <button
                            onClick={() => handleNav('/business/team')}
                            className={`w-full text-left px-4 py-2 flex items-center gap-2 font-medium cursor-pointer transition ${
                              isDark
                                ? 'text-slate-300 hover:bg-[#121C2D]'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <User className="w-4 h-4 text-slate-400" /> Team Members
                          </button>
                          <button
                            onClick={() => handleNav('/business/subscription')}
                            className={`w-full text-left px-4 py-2 flex items-center gap-2 font-medium cursor-pointer transition ${
                              isDark
                                ? 'text-slate-300 hover:bg-[#121C2D]'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <CreditCard className="w-4 h-4 text-slate-400" /> Subscription &amp; Billing
                          </button>
                        </>
                      )}
                    </div>

                    <div
                      className={`border-t pt-1 ${
                        isDark ? 'border-[#1E293B]' : 'border-slate-100'
                      }`}
                    >
                      <button
                        onClick={() => {
                          logout();
                          handleNav('/');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-center gap-2 cursor-pointer transition"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleNav('/login')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                    isDark
                      ? 'bg-[#121C2D] hover:bg-[#18263E] border-[#1E293B] text-white'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-[#0B1220]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('/business/signup')}
                  className="px-4 py-2 text-xs font-bold text-[#0B1220] bg-[#19D3A2] hover:bg-[#10B981] rounded-xl shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#121C2D] transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-t px-4 pt-3 pb-5 space-y-3 ${
            isDark ? 'bg-[#0B1220] border-[#1E293B]' : 'bg-white border-slate-200'
          }`}
        >
          {onOpenCommandPalette && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCommandPalette();
              }}
              className="w-full py-2 px-3 rounded-lg bg-[#121C2D] border border-[#1E293B] text-slate-300 text-xs flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#19D3A2]" /> Command Search
              </span>
              <kbd className="text-[10px] text-slate-400 bg-[#0B1220] px-1.5 py-0.5 rounded">⌘K</kbd>
            </button>
          )}

          <div className="flex flex-col gap-1 text-sm font-medium text-slate-300">
            <button
              onClick={() => handleNav('/#product')}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#121C2D]"
            >
              Product
            </button>
            <button
              onClick={() => handleNav('/#features')}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#121C2D]"
            >
              Features
            </button>
            <button
              onClick={() => handleNav('/#solutions')}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#121C2D]"
            >
              Solutions
            </button>
            <button
              onClick={() => handleNav('/pricing')}
              className="text-left py-2 px-3 rounded-lg hover:bg-[#121C2D]"
            >
              Pricing
            </button>
          </div>

          <div className="pt-3 border-t border-[#1E293B] flex flex-col gap-2">
            {session ? (
              <>
                <button
                  onClick={() => handleNav(dashboardRoute)}
                  className="w-full py-2.5 text-center text-xs font-bold text-[#0B1220] bg-[#19D3A2] rounded-xl"
                >
                  Go to {userRole} Desk
                </button>
                <button
                  onClick={() => {
                    logout();
                    handleNav('/');
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-rose-400 bg-rose-500/10 rounded-xl"
                >
                  Sign Out ({session.user.full_name})
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNav('/login')}
                  className="w-full py-2.5 text-center text-xs font-semibold text-white border border-[#1E293B] bg-[#121C2D] rounded-xl"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNav('/business/signup')}
                  className="w-full py-2.5 text-center text-xs font-bold text-[#0B1220] bg-[#19D3A2] rounded-xl"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
