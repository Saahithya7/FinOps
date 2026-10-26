import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Info,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CustomerSignupProps {
  onNavigate: (route: string) => void;
  onSuccess: () => void;
}

export const CustomerSignup: React.FC<CustomerSignupProps> = ({ onNavigate, onSuccess }) => {
  const { signupCustomer, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState<{ email: string; message: string } | null>(null);
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSubmittingRef.current || loading) return;

    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const res = await signupCustomer(fullName, usernameOrEmail, password);
      if (res.success) {
        if (res.needsEmailVerification) {
          setVerificationSent({
            email: usernameOrEmail.trim(),
            message: res.message || 'Please check your email inbox to verify your account before logging in.',
          });
        } else {
          onSuccess();
        }
      } else {
        setError(res.error || 'Failed to create customer account');
      }
    } catch (err: any) {
      setError(err?.message || 'A network error occurred while connecting to the authentication service.');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-[88vh] bg-[#F4F7FB] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-[#E1E7F0] shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Split-screen Customer Illustration & Brand */}
        <div className="bg-[#101A2C] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-[#2864F0] text-white flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4 text-[#35C6D9]" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                FinOps<span className="text-[#35C6D9]"> AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#18263E] text-slate-300">
                Customer Registration
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight leading-snug">
              Open Your Secure Personal Ledger
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Create your retail financial account with instantaneous ledger provisioning, transaction tracking, and cash-flow monitoring in INR (₹).
            </p>

            <div className="mt-8 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#35C6D9] shrink-0" />
                <span>Instantaneous sandbox savings account generation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#35C6D9] shrink-0" />
                <span>Categorized cash-flow trends &amp; expense donuts</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#35C6D9] shrink-0" />
                <span>Zero business subscription fees for retail customers</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#159B72] shrink-0" />
              <span>Customer data is strictly isolated from internal business desks.</span>
            </div>
            <div className="text-[10px] text-amber-400/90 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Portfolio Demo: No actual banking credentials or real money required.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Signup Form or Verification Sent Card */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-white">
          {verificationSent ? (
            <div className="space-y-6 my-auto text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-[#159B72] flex items-center justify-center mx-auto shadow-sm">
                <Mail className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#101A2C] tracking-tight">Verify Your Email</h2>
                <p className="text-xs text-[#536176] max-w-sm mx-auto leading-relaxed">
                  We sent a confirmation link to <strong className="text-[#101A2C] font-semibold">{verificationSent.email}</strong>.
                  Please verify your email address before signing in.
                </p>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-left text-xs text-[#1E52CC] flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Once verified, your personal ledger account and profile are automatically ready.
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/customer/login')}
                  className="w-full py-3 bg-[#2864F0] hover:bg-[#1E52CC] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Go to Customer Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationSent(null)}
                  className="w-full py-2 text-xs text-[#536176] hover:text-[#101A2C] font-semibold cursor-pointer"
                >
                  Use a different email address
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-black text-[#101A2C] tracking-tight">Create Customer Account</h2>
                <p className="text-xs text-[#536176] mt-1">
                  Enter your details to open your personal customer portal
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#E45464] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#101A2C] mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rohan Mehta"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#101A2C] mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. rohan@example.com"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#101A2C] mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-9 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-[#536176] hover:text-[#101A2C] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#101A2C] mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-[#536176]">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-[#E1E7F0] text-[#2864F0] focus:ring-[#2864F0]"
                    />
                    <span className="text-[11px] leading-relaxed">
                      I agree to the <strong className="text-[#101A2C]">Terms of Service</strong> and <strong className="text-[#101A2C]">Privacy Policy</strong>. (Zero business subscription fees apply to customer portals).
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#2864F0] hover:bg-[#1E52CC] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>{loading ? 'Opening Account...' : 'Open Customer Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Google sign-up option */}
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
          )}

          <div className="pt-4 border-t border-[#E1E7F0] text-center text-xs text-[#536176]">
            Already have a customer account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/customer/login')}
              className="font-bold text-[#2864F0] hover:underline cursor-pointer"
            >
              Sign In to Customer Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
