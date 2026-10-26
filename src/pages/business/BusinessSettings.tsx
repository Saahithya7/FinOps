import React, { useState } from 'react';
import {
  Building,
  Shield,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/storage';

export const BusinessSettings: React.FC<{ onNavigatePortalHub: () => void }> = ({
  onNavigatePortalHub,
}) => {
  const { session, activeBusiness } = useAuth();
  const [bizName, setBizName] = useState(activeBusiness?.business_name || 'Apex FinTech Capital Ltd');
  const [gstin, setGstin] = useState(activeBusiness?.gstin || '27AABCU9603R1ZM');
  const [cin, setCin] = useState(activeBusiness?.cin || 'U65999MH2021PTC368192');
  const [address, setAddress] = useState(
    activeBusiness?.address || 'Level 14, Tower 3, Bandra-Kurla Complex (BKC), Mumbai, Maharashtra 400051'
  );
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeBusiness) {
      const updated = {
        ...activeBusiness,
        business_name: bizName,
        gstin,
        cin,
        address,
      };
      db.saveBusiness(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4 text-xs">
      <div>
        <button
          onClick={onNavigatePortalHub}
          className="font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Operations Hub
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Business Profile &amp; Regulatory Settings
        </h1>
        <p className="text-slate-500">Corporate KYC, statutory compliance identifiers, and tenancy parameters</p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4" /> Settings updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Building className="w-4 h-4 text-teal-600" /> Legal Entity Particulars
        </h3>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Company Registered Name</label>
          <input
            type="text"
            required
            value={bizName}
            onChange={(e) => setBizName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">GSTIN Identification</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Corporate Identity Number (CIN)</label>
            <input
              type="text"
              value={cin}
              onChange={(e) => setCin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Registered Corporate Address</label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
          >
            Save Entity Details
          </button>
        </div>
      </form>

      {/* Tenancy Security Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-teal-400 font-bold">
          <Shield className="w-4 h-4" /> Multi-Tenant Boundary Enforcement
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          All application data queries are bound to Tenant ID <span className="font-mono text-teal-300">{activeBusiness?.id || 'biz_apex_01'}</span>. PostgreSQL Row Level Security (RLS) guarantees that other businesses cannot access this tenant's transactions, credit assessments, or investigations.
        </p>
      </div>
    </div>
  );
};
