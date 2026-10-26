import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  ArrowRight,
  ExternalLink,
  X,
  FileText,
  Save,
  Check,
  RefreshCw,
  Building,
  CreditCard,
  SlidersHorizontal,
} from 'lucide-react';
import { TransactionInvestigation, Transaction, Customer, RiskAssessment } from '../../types';
import {
  fetchSupabaseFraudAlerts,
  updateSupabaseFraudAlert,
  fetchSupabaseTransactions,
  fetchSupabaseCustomers,
  fetchSupabaseRiskAssessments,
} from '../../services/supabaseDataService';
import { db } from '../../services/storage';
import { formatINR, formatDate, formatShortDate } from '../../utils/formatters';

interface FraudInvestigationStudioProps {
  businessId?: string;
  onSelectCase?: (alert: TransactionInvestigation) => void;
}

export const FraudInvestigationStudio: React.FC<FraudInvestigationStudioProps> = ({
  businessId = 'biz_abc_01',
}) => {
  const [alerts, setAlerts] = useState<TransactionInvestigation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<TransactionInvestigation | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Investigation drawer edit state
  const [drawerNotes, setDrawerNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertRes, txRes, custRes, riskRes] = await Promise.all([
        fetchSupabaseFraudAlerts(businessId),
        fetchSupabaseTransactions(),
        fetchSupabaseCustomers(businessId),
        fetchSupabaseRiskAssessments(businessId),
      ]);

      if (alertRes.data && alertRes.data.length > 0) setAlerts(alertRes.data);
      else setAlerts(db.getInvestigations(businessId));

      if (txRes.data && txRes.data.length > 0) setTransactions(txRes.data);
      else setTransactions(db.getTransactions(businessId));

      if (custRes.data && custRes.data.length > 0) setCustomers(custRes.data);
      else setCustomers(db.getCustomers(businessId));

      if (riskRes.data && riskRes.data.length > 0) setRiskAssessments(riskRes.data);
      else setRiskAssessments(db.getRiskAssessments(businessId));
    } catch (e) {
      console.error('Error loading investigation workspace data:', e);
      setAlerts(db.getInvestigations(businessId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.transaction_id.toLowerCase().includes(q) ||
        (a.flag_reason || '').toLowerCase().includes(q) ||
        (a.assigned_to || '').toLowerCase().includes(q);

      const matchSeverity = selectedSeverity === 'All' || a.severity === selectedSeverity;
      const matchStatus = selectedStatus === 'All' || a.investigation_status === selectedStatus;

      return matchSearch && matchSeverity && matchStatus;
    });
  }, [alerts, searchQuery, selectedSeverity, selectedStatus]);

  const handleOpenDrawer = (alert: TransactionInvestigation) => {
    setSelectedAlert(alert);
    setDrawerNotes(alert.investigation_notes || '');
  };

  const handleUpdateStatus = async (newStatus: 'Open' | 'Under Investigation' | 'Resolved' | 'Escalated') => {
    if (!selectedAlert) return;
    setIsUpdating(true);

    const updated: TransactionInvestigation = {
      ...selectedAlert,
      investigation_status: newStatus,
      investigation_notes: drawerNotes,
      updated_at: new Date().toISOString(),
    };

    // Update in local state & DB storage
    db.saveInvestigation(updated);
    setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAlert(updated);

    // Save to Supabase fraud_alerts
    await updateSupabaseFraudAlert(updated.id, {
      status: newStatus,
      reason: drawerNotes || updated.flag_reason,
    });

    setIsUpdating(false);
    setToastMsg(`Investigation ${updated.id} status updated to ${newStatus}`);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Find associated transaction and customer
  const relatedTx = useMemo(() => {
    if (!selectedAlert) return null;
    return transactions.find((t) => t.id === selectedAlert.transaction_id || t.transaction_id === selectedAlert.transaction_id);
  }, [selectedAlert, transactions]);

  const relatedCustomer = useMemo(() => {
    if (!relatedTx?.customer_id) return customers[0] || null;
    return customers.find((c) => c.id === relatedTx.customer_id) || customers[0] || null;
  }, [relatedTx, customers]);

  const relatedRisk = useMemo(() => {
    if (!relatedCustomer?.id) return null;
    return riskAssessments.find((r) => r.customer_id === relatedCustomer.id) || null;
  }, [relatedCustomer, riskAssessments]);

  return (
    <div className="bg-[#121C2D] border border-[#1E293B] rounded-2xl p-6 text-slate-100 flex flex-col gap-6 shadow-sm">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-[#0B1220] border border-[#19D3A2]/40 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#19D3A2]" />
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
              Risk Analyst Studio
            </span>
            <span className="text-xs text-slate-400">&bull; Anti-Financial Crime Surveillance</span>
          </div>
          <h2 className="text-lg font-black tracking-tight text-white mt-1 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#EF4444]" /> Fraud &amp; Anomaly Investigation Studio
          </h2>
          <p className="text-xs text-slate-400">
            Interactive triage for flagged suspicious activity, velocity anomalies, and SAR reporting.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-[#0B1220] hover:bg-[#18263E] border border-[#1E293B] text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Studio
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative col-span-1 sm:col-span-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alert ID, transaction, reason..."
            className="w-full bg-[#0B1220] border border-[#1E293B] rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#19D3A2]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium shrink-0">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full bg-[#0B1220] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#19D3A2]"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium shrink-0">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-[#0B1220] border border-[#1E293B] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#19D3A2]"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* Case Table */}
      <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#0B1220]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#121C2D] text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-[#1E293B]">
            <tr>
              <th className="py-3 px-4">Alert Reference</th>
              <th className="py-3 px-4">Transaction Ref</th>
              <th className="py-3 px-4">Flag Reason</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Investigation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/60">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                  No fraud alerts match the selected search or filters.
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => {
                const isCritical = alert.severity === 'Critical';
                const isHigh = alert.severity === 'High';

                return (
                  <tr key={alert.id} className="hover:bg-[#18263E]/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                      {alert.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{alert.transaction_id}</td>
                    <td className="py-3 px-4 text-slate-200 max-w-xs truncate">{alert.flag_reason}</td>
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          alert.risk_score >= 80
                            ? 'text-[#EF4444]'
                            : alert.risk_score >= 60
                            ? 'text-[#F59E0B]'
                            : 'text-[#19D3A2]'
                        }`}
                      >
                        {alert.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isCritical
                            ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                            : isHigh
                            ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                            : 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          alert.investigation_status === 'Resolved'
                            ? 'bg-[#19D3A2]/15 text-[#19D3A2]'
                            : alert.investigation_status === 'Escalated'
                            ? 'bg-[#A855F7]/15 text-[#A855F7]'
                            : alert.investigation_status === 'Under Investigation'
                            ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {alert.investigation_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDrawer(alert)}
                        className="px-3 py-1 bg-[#19D3A2]/10 hover:bg-[#19D3A2]/20 text-[#19D3A2] border border-[#19D3A2]/30 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Triage Case
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Case Details Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full sm:w-[560px] h-full bg-[#0B1220] border-l border-[#1E293B] shadow-2xl flex flex-col animate-slide-left text-slate-100">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#1E293B] bg-[#121C2D] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#EF4444] bg-[#EF4444]/15 px-2 py-0.5 rounded border border-[#EF4444]/30">
                    {selectedAlert.id}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(selectedAlert.created_at)}</span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1">Investigation Dossier</h3>
              </div>

              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#18263E] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Alert Status Card */}
              <div className="bg-[#121C2D] p-4 rounded-xl border border-[#1E293B] grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Severity</span>
                  <span className="font-bold text-white text-sm">{selectedAlert.severity}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Calculated Risk Score</span>
                  <span className="font-bold text-[#EF4444] text-sm">{selectedAlert.risk_score} / 100</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Status</span>
                  <span className="font-semibold text-[#19D3A2]">{selectedAlert.investigation_status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Assigned Analyst</span>
                  <span className="font-semibold text-slate-200">{selectedAlert.assigned_to}</span>
                </div>
              </div>

              {/* Trigger Reason */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Automated Heuristic Trigger Reason
                </label>
                <div className="p-3 bg-[#121C2D] border border-[#1E293B] rounded-xl text-slate-300 leading-relaxed">
                  {selectedAlert.flag_reason}
                </div>
              </div>

              {/* Linked Transaction Information */}
              {relatedTx && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Linked Transaction Telemetry
                  </label>
                  <div className="p-3.5 bg-[#121C2D] border border-[#1E293B] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Transaction ID:</span>
                      <span className="font-mono font-bold text-white">{relatedTx.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Amount:</span>
                      <span className="font-mono font-bold text-[#19D3A2]">
                        {formatINR(Number(relatedTx.transaction_amount || 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Merchant / Category:</span>
                      <span className="text-white">{relatedTx.merchant_name || relatedTx.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Payment Switch:</span>
                      <span className="font-mono text-slate-300">{relatedTx.payment_method || 'UPI Gateway'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Settlement Status:</span>
                      <span className="font-semibold text-white">{relatedTx.transaction_status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Profile Dossier */}
              {relatedCustomer && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                    Account Holder Profile
                  </label>
                  <div className="p-3.5 bg-[#121C2D] border border-[#1E293B] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Customer Name:</span>
                      <span className="font-semibold text-white">{relatedCustomer.customer_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Account Reference:</span>
                      <span className="font-mono text-slate-300">{relatedCustomer.customer_reference}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Available Balance:</span>
                      <span className="font-mono text-slate-200">
                        {formatINR(Number(relatedCustomer.balance_inr || 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Credit Limit:</span>
                      <span className="font-mono text-slate-200">
                        {formatINR(Number(relatedCustomer.credit_limit_inr || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Investigation Notes Input */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Analyst Findings &amp; SAR Case Notes
                </label>
                <textarea
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                  placeholder="Record investigative findings, merchant contact verification, or justification..."
                  rows={4}
                  className="w-full bg-[#121C2D] border border-[#1E293B] rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#19D3A2]"
                />
              </div>

              {/* Action Decision Buttons */}
              <div className="pt-3 border-t border-[#1E293B] space-y-2.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Record Investigative Decision
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus('Under Investigation')}
                    disabled={isUpdating}
                    className="px-3 py-2 bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 text-[#38BDF8] border border-[#38BDF8]/30 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Set Under Investigation
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('Escalated')}
                    disabled={isUpdating}
                    className="px-3 py-2 bg-[#A855F7]/15 hover:bg-[#A855F7]/25 text-[#A855F7] border border-[#A855F7]/30 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Escalate to Manager
                  </button>
                </div>

                <button
                  onClick={() => handleUpdateStatus('Resolved')}
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-[#19D3A2] hover:bg-[#10B981] text-[#0B1220] rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Clear Anomaly &amp; Mark Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
