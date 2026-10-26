import React from 'react';
import { Lock, ArrowLeft, Building2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AccessDeniedProps {
  requiredRole?: UserRole;
  currentRole?: UserRole | null;
  onNavigateHome?: () => void;
  onNavigatePortal?: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredRole,
  currentRole,
  onNavigateHome,
  onNavigatePortal,
}) => {
  const { session } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[#F4F7FB]">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#E1E7F0] shadow-xl overflow-hidden">
        <div className="bg-[#101A2C] px-6 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E45464]/20 border border-[#E45464]/40 mb-4 text-[#E45464]">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Access Restricted</h2>
          <p className="text-slate-300 text-xs mt-1">
            Enterprise Role-Based Access Control Policy
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-[#F4F7FB] border border-[#E1E7F0] rounded-2xl p-4 text-xs space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-[#E1E7F0]">
              <span className="text-[#536176] font-medium">Current Account:</span>
              <span className="font-bold text-[#101A2C]">
                {session?.user.full_name || 'Guest'} ({session?.accountType || 'unauthenticated'})
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-[#E1E7F0]">
              <span className="text-[#536176] font-medium">Assigned Role:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-[#F2A93B] border border-amber-200">
                {currentRole || 'No Role Assigned'}
              </span>
            </div>
            {requiredRole && (
              <div className="flex justify-between items-center py-1">
                <span className="text-[#536176] font-medium">Required Clearance:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-[#E45464] border border-rose-200">
                  {requiredRole} Clearance Only
                </span>
              </div>
            )}
            {session?.business && (
              <div className="flex justify-between items-center py-1 pt-2 border-t border-[#E1E7F0]">
                <span className="text-[#536176] font-medium">Company Boundary:</span>
                <span className="font-semibold text-[#101A2C] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#2864F0]" />
                  {session.business.business_name}
                </span>
              </div>
            )}
          </div>

          <p className="text-[#536176] text-xs leading-relaxed">
            Institutional policy strictly prevents unauthorized horizontal privilege escalation. Retail customers cannot access corporate desks, and specialized analysts and administrators are restricted strictly to their designated functional domains.
          </p>

          <div className="flex items-center gap-3 pt-2">
            {onNavigatePortal && (
              <button
                onClick={onNavigatePortal}
                className="flex-1 py-2.5 px-4 bg-[#101A2C] hover:bg-[#18263E] text-white text-xs font-bold rounded-xl transition shadow text-center cursor-pointer"
              >
                {session ? 'Return to My Authorized Dashboard' : 'Go to Sign In'}
              </button>
            )}
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="py-2.5 px-4 bg-white hover:bg-slate-50 text-[#536176] text-xs font-semibold rounded-xl border border-[#E1E7F0] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
