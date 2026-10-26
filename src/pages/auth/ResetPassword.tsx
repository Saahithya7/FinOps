import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface ResetPasswordProps {
  onNavigate: (route: string) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onNavigate }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="min-h-[85vh] bg-[#F4F7FB] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E1E7F0] shadow-xl p-8 space-y-5">
        <div>
          <div className="w-10 h-10 rounded-2xl bg-[#101A2C] text-white flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-[#35C6D9]" />
          </div>
          <h2 className="text-2xl font-black text-[#101A2C]">Set New Password</h2>
          <p className="text-xs text-[#536176] mt-1 leading-relaxed">
            Enter your verification code and configure a new credential.
          </p>
        </div>

        {success ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#159B72] mx-auto" />
            <h4 className="font-bold text-sm text-[#101A2C]">Password Updated Successfully</h4>
            <p className="text-xs text-[#536176]">Your security credentials have been updated.</p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => onNavigate('/customer/login')}
                className="px-4 py-2 bg-[#2864F0] text-white rounded-xl text-xs font-bold hover:bg-[#1E52CC]"
              >
                Customer Sign In
              </button>
              <button
                onClick={() => onNavigate('/business/login')}
                className="px-4 py-2 bg-[#101A2C] text-white rounded-xl text-xs font-bold hover:bg-[#18263E]"
              >
                Business Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && <div className="p-3 bg-rose-50 text-[#E45464] rounded-xl">{error}</div>}

            <div>
              <label className="block font-bold text-[#101A2C] mb-1">Reset Verification Token</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. RST-99824"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs font-mono text-[#101A2C]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#101A2C] mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <div>
              <label className="block font-bold text-[#101A2C] mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#536176]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-[#E1E7F0] rounded-xl focus:outline-[#2864F0] text-xs text-[#101A2C]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#101A2C] hover:bg-[#18263E] text-white rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Update Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
