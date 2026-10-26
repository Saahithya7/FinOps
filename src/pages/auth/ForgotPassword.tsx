import React, { useState } from 'react';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, TrendingUp, KeyRound } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigate: (route: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-[85vh] bg-[#F4F7FB] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E1E7F0] shadow-xl p-8 space-y-5">
        <button
          onClick={() => onNavigate('/')}
          className="text-xs font-semibold text-[#536176] hover:text-[#101A2C] flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>

        <div>
          <div className="w-10 h-10 rounded-2xl bg-[#101A2C] text-white flex items-center justify-center mb-3">
            <KeyRound className="w-5 h-5 text-[#35C6D9]" />
          </div>
          <h2 className="text-2xl font-black text-[#101A2C]">Forgot Password</h2>
          <p className="text-xs text-[#536176] mt-1 leading-relaxed">
            Enter your registered email address and we'll dispatch a cryptographic reset verification token.
          </p>
        </div>

        {submitted ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#159B72] mx-auto" />
            <h4 className="font-bold text-sm text-[#101A2C]">Password Reset Link Dispatched</h4>
            <p className="text-xs text-[#536176]">
              If an account matching <strong>{email}</strong> exists, verification instructions have been dispatched.
            </p>
            <button
              onClick={() => onNavigate('/customer/reset-password')}
              className="mt-2 px-4 py-2 bg-[#101A2C] text-white rounded-xl text-xs font-bold hover:bg-[#18263E] transition cursor-pointer"
            >
              Enter Token &amp; Reset Password &rarr;
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#101A2C] mb-1">Registered Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#101A2C] hover:bg-[#18263E] text-white rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Send Reset Instructions</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
