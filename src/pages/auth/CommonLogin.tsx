import React, { useState } from 'react';
import {
  TrendingUp,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Building,
  KeyRound,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboardRouteForRole, isValidUserRole } from '../../utils/formatters';

interface CommonLoginProps {
  onNavigate: (route: string) => void;
  onSuccess: (targetRoute: string) => void;
}

export const CommonLogin: React.FC<CommonLoginProps> = ({ onNavigate, onSuccess }) => {
  const { loginUnified } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);

    try {
      const res = await loginUnified(cleanEmail, password);
      setLoading(false);

      if (res.success && res.role) {
        if (!isValidUserRole(res.role)) {
          setError(
            `Access Denied: The role '${res.role}' assigned to your profile is invalid or unsupported. Please contact your administrator.`
          );
          return;
        }

        // Enforce account status: pending or rejected customers route to restricted applicant verification desk
        if (res.role === 'Applicant' || (res.role === 'Customer' && res.account_status !== 'Active')) {
          onSuccess('/applicant/dashboard');
          return;
        }

        const targetRoute = getDashboardRouteForRole(res.role);
        if (targetRoute) {
          onSuccess(targetRoute);
        } else {
          setError('Unable to resolve dashboard routing for your role. Access safely denied.');
        }
      } else {
        setError(res.error || 'Authentication failed. Please check your email and password.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'An unexpected error occurred during login.');
    }
  };

  const handleQuickCredential = (credEmail: string, credPass: string) => {
    setEmail(credEmail);
    setPassword(credPass);
    setError('');
  };

  return (
    <div className="min-h-[88vh] bg-[#F4F7FB] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-[#E1E7F0] shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Brand & Platform Context */}
        <div className="bg-[#101A2C] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #2864F0 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-[#2864F0] text-white flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4 text-[#35C6D9]" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                FinOps<span className="text-[#35C6D9]"> AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#18263E] text-slate-300">
                Single Sign-On
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight leading-snug">
              Unified Financial Operations &amp; Customer Portal
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              One shared authentication gateway. Securely sign in to access your designated personal finance dashboard or enterprise operational desk.
            </p>

            {/* Architecture Highlights */}
            <div className="mt-8 space-y-2.5 text-xs">
              <div className="p-3 bg-[#18263E] rounded-xl border border-[#203252] flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#159B72]" /> Authoritative RBAC
                </span>
                <span className="text-[#35C6D9] font-bold">Supabase Profiles</span>
              </div>
              <div className="p-3 bg-[#18263E] rounded-xl border border-[#203252] flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#2864F0]" /> Direct Redirection
                </span>
                <span className="text-white font-semibold">Instant Dashboard</span>
              </div>
              <div className="p-3 bg-[#18263E] rounded-xl border border-[#203252] flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#F2A93B]" /> Zero Role Selection
                </span>
                <span className="text-slate-400 font-medium">Automatic Detection</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#35C6D9] shrink-0" />
              <span>Direct routing opens your authorized dashboard immediately upon sign-in.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Shared Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-[#101A2C] tracking-tight">Sign In</h2>
              <p className="text-xs text-[#536176] mt-1">
                Enter your registered credentials to access your authorized account
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#E45464] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#101A2C] mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-hidden focus:border-[#2864F0] text-xs text-[#101A2C]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#101A2C]">Password</label>
                  <button
                    type="button"
                    onClick={() => onNavigate('/forgot-password')}
                    className="font-semibold text-[#2864F0] hover:underline cursor-pointer text-[11px]"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-hidden focus:border-[#2864F0] text-xs text-[#101A2C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#536176] hover:text-[#101A2C] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#101A2C] hover:bg-[#18263E] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating & Verifying Role...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick-fill testing credentials panel */}
            <div className="p-3.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-2xl text-[11px] space-y-2">
              <div className="flex items-center justify-between font-bold text-[#101A2C]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2864F0]" /> Quick Role Test Credentials:
                </span>
                <span className="text-[10px] text-[#536176] font-normal">Click to fill</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickCredential('admin@abcfinance.com', 'AdminPassword123!')}
                  className="px-2 py-1.5 bg-white hover:bg-blue-50 border border-[#E1E7F0] hover:border-[#2864F0] rounded-lg text-left text-[#101A2C] transition cursor-pointer font-medium"
                >
                  <span className="font-bold text-[#2864F0]">Admin</span> &bull; Rajesh
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCredential('risk@abcfinance.com', 'RiskPassword123!')}
                  className="px-2 py-1.5 bg-white hover:bg-emerald-50 border border-[#E1E7F0] hover:border-[#159B72] rounded-lg text-left text-[#101A2C] transition cursor-pointer font-medium"
                >
                  <span className="font-bold text-[#159B72]">Risk</span> &bull; Vikram
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCredential('fraud@abcfinance.com', 'FraudPassword123!')}
                  className="px-2 py-1.5 bg-white hover:bg-rose-50 border border-[#E1E7F0] hover:border-[#E45464] rounded-lg text-left text-[#101A2C] transition cursor-pointer font-medium"
                >
                  <span className="font-bold text-[#E45464]">Fraud</span> &bull; Neha
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCredential('manager@abcfinance.com', 'ManagerPassword123!')}
                  className="px-2 py-1.5 bg-white hover:bg-amber-50 border border-[#E1E7F0] hover:border-[#F2A93B] rounded-lg text-left text-[#101A2C] transition cursor-pointer font-medium"
                >
                  <span className="font-bold text-[#F2A93B]">Manager</span> &bull; Sunita
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCredential('support@abcfinance.com', 'SupportPassword123!')}
                  className="px-2 py-1.5 bg-white hover:bg-cyan-50 border border-[#E1E7F0] hover:border-[#35C6D9] rounded-lg text-left text-[#101A2C] transition cursor-pointer font-medium"
                >
                  <span className="font-bold text-[#35C6D9]">Support</span> &bull; Arjun
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCredential('customer@demo.com', 'CustomerPass123!')}
                  className="px-2 py-1.5 bg-white hover:bg-slate-100 border border-[#E1E7F0] hover:border-[#101A2C] rounded-lg text-left text-[#101A2C] transition cursor-pointer font-medium"
                >
                  <span className="font-bold text-[#101A2C]">Customer</span> &bull; Retail
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E1E7F0] flex flex-col gap-1.5 text-center text-xs text-[#536176]">
            <div>
              New retail customer?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/customer/signup')}
                className="font-bold text-[#2864F0] hover:underline cursor-pointer"
              >
                Create Customer Account &rarr;
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              Employee accounts are provisioned via administrative invitation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
