import React, { useState } from 'react';
import {
  Building,
  User,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Tag,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BusinessSignupProps {
  onNavigate: (route: string) => void;
  onSuccess: (businessId: string) => void;
}

export const BusinessSignup: React.FC<BusinessSignupProps> = ({ onNavigate, onSuccess }) => {
  const { signupBusiness } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [businessUsername, setBusinessUsername] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const res = await signupBusiness({
      businessName,
      businessUsername: businessUsername.trim().toLowerCase(),
      contactPerson,
      phone: phone || '+91 99000 00000',
      password,
    });
    setLoading(false);

    if (res.success && res.businessId) {
      // Directs to Subscription Plans
      onSuccess(res.businessId);
    } else {
      setError(res.error || 'Failed to register business');
    }
  };

  return (
    <div className="min-h-[88vh] bg-[#F4F7FB] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl w-full bg-white rounded-3xl border border-[#E1E7F0] shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Enterprise Onboarding Info */}
        <div className="bg-[#101A2C] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-[#2864F0] text-white flex items-center justify-center font-bold">
                <Building className="w-4 h-4 text-[#35C6D9]" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                FinOps<span className="text-[#35C6D9]"> AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#18263E] text-slate-300">
                Corporate Registration
              </span>
            </div>

            <h3 className="text-2xl font-black tracking-tight leading-snug">
              Register Your Business Workspace
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Establish a dedicated corporate tenant for your lending book, risk analysis operations, and customer support.
            </p>

            <div className="mt-8 space-y-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#35C6D9] shrink-0" />
                <span>Primary registrant becomes initial Business Administrator</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#35C6D9] shrink-0" />
                <span>Redirects directly to subscription plan selection</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#35C6D9] shrink-0" />
                <span>Access all 6 role portals upon plan activation</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#159B72] shrink-0" />
              <span>Multi-tenant isolation backed by Supabase PostgreSQL Row Level Security (RLS).</span>
            </div>
            <div className="text-[10px] text-amber-400/90 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Portfolio Demo: No real company domain or email required.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-[#101A2C] tracking-tight">Create Business Tenant</h2>
              <p className="text-xs text-[#536176] mt-1">
                Step 1 of 2: Corporate details &amp; admin credential
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#E45464] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#101A2C] mb-1">Company / Business Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex FinTech Capital Ltd"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#101A2C] mb-1">Business Username (Tenant Handle)</label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. apex_admin (used for login)"
                    value={businessUsername}
                    onChange={(e) => setBusinessUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full pl-10 pr-3 py-2 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs font-mono text-[#101A2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#101A2C] mb-1">Contact Person Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#101A2C] mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                    <input
                      type="tel"
                      placeholder="+91 98201 44521"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                    />
                  </div>
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
                      className="w-full pl-10 pr-9 py-2 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
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
                      className="w-full pl-10 pr-3 py-2 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#536176] pt-1">
                After registration, you will be redirected to choose a subscription plan before accessing the business operations workspace.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2864F0] hover:bg-[#1E52CC] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Creating Tenant...' : 'Continue to Subscription Selection'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-[#E1E7F0] text-center text-xs text-[#536176]">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => onNavigate('/business/login')}
              className="font-bold text-[#2864F0] hover:underline cursor-pointer"
            >
              Sign In to Business Workspace &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
