import React, { useState } from 'react';
import {
  Building,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Shield,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BusinessLoginProps {
  onNavigate: (route: string) => void;
  onSuccess: (requiresPlan?: boolean) => void;
}

export const BusinessLogin: React.FC<BusinessLoginProps> = ({ onNavigate, onSuccess }) => {
  const { loginBusiness } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginBusiness(usernameOrEmail, password);
    setLoading(false);

    if (res.success) {
      onSuccess(res.requiresPlan);
    } else {
      setError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-[88vh] bg-[#F4F7FB] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-[#E1E7F0] shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Enterprise Identity */}
        <div className="bg-[#101A2C] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #2864F0 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-[#2864F0] text-white flex items-center justify-center font-bold">
                <Building className="w-4 h-4 text-[#35C6D9]" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                FinOps<span className="text-[#35C6D9]"> AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#18263E] text-slate-300">
                Business Portal
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight leading-snug">
              Enterprise Financial Operations Workspace
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Sign in to your authorized operational desk. Access credit risk modeling, real-time fraud investigation, managerial sign-offs, support ticketing, and administrative controls.
            </p>

            {/* Role indicator cards */}
            <div className="mt-8 space-y-2 text-xs">
              <div className="p-3 bg-[#18263E] rounded-xl border border-[#203252] flex items-center justify-between">
                <span className="text-slate-300">Sample Organization</span>
                <span className="text-[#35C6D9] font-bold">ABC Finance</span>
              </div>
              <div className="p-3 bg-[#18263E] rounded-xl border border-[#203252] flex items-center justify-between">
                <span className="text-slate-300">Supported Desks</span>
                <span className="text-white font-semibold">6 Role Portals</span>
              </div>
              <div className="p-3 bg-[#18263E] rounded-xl border border-[#203252] flex items-center justify-between">
                <span className="text-slate-300">Multi-Tenant Isolation</span>
                <span className="text-[#159B72] font-semibold">Row-Level Security (RLS)</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#35C6D9] shrink-0" />
              <span>Strict RBAC enforcement prevents unauthorized cross-desk access.</span>
            </div>
            <div className="text-[10px] text-amber-400/90 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Portfolio Demo: Demo usernames authenticate via synthetic identity resolution.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Business Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-[#101A2C] tracking-tight">Business Sign In</h2>
              <p className="text-xs text-[#536176] mt-1">
                Sign in with your registered corporate email and password
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
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#101A2C]">
                    Registered Corporate Email
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameOrEmail('admin@abcfinance.com');
                      setPassword('AdminPassword123!');
                    }}
                    className="text-[11px] font-semibold text-[#2864F0] hover:underline cursor-pointer"
                  >
                    Use Admin Credentials
                  </button>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin@abcfinance.com"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#101A2C] mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
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

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => onNavigate('/business/forgot-password')}
                  className="font-semibold text-[#2864F0] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#101A2C] hover:bg-[#18263E] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Verifying RBAC...' : 'Sign In to Business Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-[#E1E7F0] flex flex-col gap-1.5 text-center text-xs text-[#536176]">
            <div>
              New organization?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/business/signup')}
                className="font-bold text-[#2864F0] hover:underline cursor-pointer"
              >
                Register Business &rarr;
              </button>
            </div>
            <div>
              Individual customer?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/customer/login')}
                className="font-bold text-[#101A2C] hover:underline cursor-pointer"
              >
                Go to Customer Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
