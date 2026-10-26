import React, { useState } from 'react';
import {
  TrendingUp,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Wallet,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CustomerLoginProps {
  onNavigate: (route: string) => void;
  onSuccess: () => void;
}

export const CustomerLogin: React.FC<CustomerLoginProps> = ({ onNavigate, onSuccess }) => {
  const { loginCustomer, signInWithGoogle } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginCustomer(usernameOrEmail, password);
    setLoading(false);

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'Authentication failed. Please verify username.');
    }
  };

  return (
    <div className="min-h-[88vh] bg-[#F4F7FB] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-[#E1E7F0] shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Split-screen Product Preview */}
        <div className="bg-[#101A2C] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, #35C6D9 1px, transparent 0)',
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
                Customer Portal
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight leading-snug">
              Personal Wealth &amp; Cash Flow Management
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Track your bank balances in INR (₹), monitor categorized spending, view transaction history, and manage budgets in real time.
            </p>

            {/* Financial Card Preview */}
            <div className="mt-8 bg-[#18263E] p-5 rounded-2xl border border-[#203252] shadow-md space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[#35C6D9]" /> Savings Account
                </span>
                <span className="text-[10px] font-mono text-[#35C6D9]">SB-0941-8842-1092</span>
              </div>
              <div className="text-2xl font-black text-white">₹4,82,500.00</div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#203252]">
                <span>Credit Utilization: <strong>12%</strong></span>
                <span className="text-[#159B72] font-semibold">CIBIL: 785 (Prime)</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#159B72] shrink-0" />
              <span>Customer-only ledger isolation. Zero access to business operations.</span>
            </div>
            <div className="text-[10px] text-amber-400/90 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Portfolio Demo: Synthetic records in INR. No real funds involved.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Clean Login Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-[#101A2C] tracking-tight">Customer Sign In</h2>
              <p className="text-xs text-[#536176] mt-1">
                Enter your demo username or email to access your personal dashboard
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
                <label className="block font-bold text-[#101A2C] mb-1">Username or Email</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your customer username or email"
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
                <label className="flex items-center gap-2 cursor-pointer text-[#536176]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#E1E7F0] text-[#2864F0] focus:ring-[#2864F0]"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/customer/forgot-password')}
                  className="font-semibold text-[#2864F0] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2864F0] hover:bg-[#1E52CC] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Signing In...' : 'Sign In as Customer'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Google sign-in option */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E1E7F0]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#536176]">
                <span className="bg-white px-2">or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                setError('');
                const res = await signInWithGoogle();
                if (res?.error) {
                  setError(res.error);
                }
              }}
              className="w-full py-2.5 border border-[#E1E7F0] hover:bg-[#F4F7FB] text-[#101A2C] font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#E1E7F0] flex flex-col gap-1.5 text-center text-xs text-[#536176]">
            <div>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/customer/signup')}
                className="font-bold text-[#2864F0] hover:underline cursor-pointer"
              >
                Sign up as Customer
              </button>
            </div>
            <div>
              Corporate financial operations?{' '}
              <button
                type="button"
                onClick={() => onNavigate('/business/login')}
                className="font-bold text-[#101A2C] hover:underline cursor-pointer"
              >
                Go to Business Portal &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
