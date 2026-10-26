import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldAlert,
  X,
  CreditCard,
  Wifi,
} from 'lucide-react';
import { Transaction } from '../../types';
import { fetchSupabaseTransactions } from '../../services/supabaseDataService';
import { formatINR, formatDate, formatShortDate } from '../../utils/formatters';

interface LiveTransactionPulseProps {
  onSelectTransaction?: (tx: Transaction) => void;
  maxItems?: number;
  compact?: boolean;
}

export const LiveTransactionPulse: React.FC<LiveTransactionPulseProps> = ({
  onSelectTransaction,
  maxItems = 20,
  compact = false,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isLiveActive, setIsLiveActive] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchSupabaseTransactions();
      if (res.data) {
        setTransactions(res.data);
      }
      if (res.error) {
        setErrorMsg(res.error);
      }
      setLastRefreshed(new Date());
    } catch (e: any) {
      setErrorMsg(e?.message || 'Error connecting to live ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    if (!isLiveActive) return;
    // Periodic live telemetry polling every 20 seconds
    const interval = setInterval(() => {
      fetchTransactions();
    }, 20000);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  const filtered = transactions.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      t.id.toLowerCase().includes(q) ||
      (t.merchant_name || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q) ||
      (t.payment_method || '').toLowerCase().includes(q);

    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Completed' && (t.transaction_status === 'Completed' || t.transaction_status === 'Success')) ||
      (filterStatus === 'Failed' && t.transaction_status === 'Failed') ||
      (filterStatus === 'Pending' && t.transaction_status === 'Pending');

    return matchesSearch && matchesStatus;
  });

  const displayList = filtered.slice(0, maxItems);

  // Derive risk indicator for transactions based on amount & status
  const getRiskIndicator = (tx: Transaction) => {
    const amount = Number(tx.transaction_amount || 0);
    if (tx.transaction_status === 'Failed' && amount > 100000) {
      return { level: 'Critical', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/15 border-[#EF4444]/30' };
    }
    if (amount > 150000) {
      return { level: 'High', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/15 border-[#F59E0B]/30' };
    }
    if (amount > 50000) {
      return { level: 'Moderate', color: 'text-[#38BDF8]', bg: 'bg-[#38BDF8]/15 border-[#38BDF8]/30' };
    }
    return { level: 'Low', color: 'text-[#19D3A2]', bg: 'bg-[#19D3A2]/15 border-[#19D3A2]/30' };
  };

  return (
    <div className="bg-[#121C2D] border border-[#1E293B] rounded-2xl p-5 text-slate-100 flex flex-col gap-4 shadow-sm">
      {/* Header with live signal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-[#19D3A2] animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#19D3A2] relative" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#19D3A2]" /> Live Transaction Pulse
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#19D3A2]/10 text-[#19D3A2] border border-[#19D3A2]/20 font-semibold">
                Supabase Ledger
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live settlement feed &bull; Polled {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              isLiveActive
                ? 'bg-[#19D3A2]/10 border-[#19D3A2]/30 text-[#19D3A2]'
                : 'bg-[#0B1220] border-[#1E293B] text-slate-400'
            }`}
            title="Toggle live polling"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{isLiveActive ? 'Live Sync' : 'Paused'}</span>
          </button>

          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-1.5 rounded-xl bg-[#0B1220] hover:bg-[#18263E] border border-[#1E293B] text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {!compact && (
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, merchant, category..."
              className="w-full bg-[#0B1220] border border-[#1E293B] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#19D3A2]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0B1220] p-1 rounded-xl border border-[#1E293B] text-xs">
            {['All', 'Completed', 'Pending', 'Failed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#18263E] text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl text-xs text-[#EF4444] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Notice: {errorMsg}. Showing local verified state.</span>
        </div>
      )}

      {/* Transaction List / Table */}
      {loading && transactions.length === 0 ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-[#0B1220] border border-[#1E293B]/60 animate-pulse flex items-center justify-between px-4"
            >
              <div className="w-32 h-3 bg-slate-800 rounded" />
              <div className="w-20 h-3 bg-slate-800 rounded" />
              <div className="w-16 h-3 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="p-10 text-center text-xs text-slate-400">
          No transactions match current filters.
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-96 pr-1">
          {displayList.map((tx) => {
            const risk = getRiskIndicator(tx);
            const isDebit = tx.transaction_type === 'Debit';
            const isSuccess = tx.transaction_status === 'Completed' || tx.transaction_status === 'Success';
            const isFailed = tx.transaction_status === 'Failed';

            return (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction?.(tx)}
                className="p-3 rounded-xl bg-[#0B1220] hover:bg-[#18263E] border border-[#1E293B] hover:border-[#19D3A2]/40 transition flex items-center justify-between gap-3 text-xs cursor-pointer group"
              >
                {/* Left: Direction Icon + Merchant/Category + ID */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isFailed
                        ? 'bg-[#EF4444]/15 text-[#EF4444]'
                        : isDebit
                        ? 'bg-[#38BDF8]/15 text-[#38BDF8]'
                        : 'bg-[#19D3A2]/15 text-[#19D3A2]'
                    }`}
                  >
                    {isFailed ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isDebit ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div className="truncate">
                    <div className="font-semibold text-slate-100 flex items-center gap-2 truncate">
                      <span className="truncate">{tx.merchant_name || tx.category || 'Financial Transfer'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tx.payment_method || 'UPI'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {tx.id} &bull; {formatShortDate(tx.transaction_date)}
                    </div>
                  </div>
                </div>

                {/* Right: Amount + Status + Risk Indicator */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <div
                      className={`font-mono font-bold text-xs ${
                        isDebit ? 'text-slate-100' : 'text-[#19D3A2]'
                      }`}
                    >
                      {isDebit ? '-' : '+'}{formatINR(Number(tx.transaction_amount || 0))}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                          isFailed
                            ? 'bg-[#EF4444]/15 text-[#EF4444]'
                            : isSuccess
                            ? 'bg-[#19D3A2]/15 text-[#19D3A2]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}
                      >
                        {tx.transaction_status}
                      </span>
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${risk.bg} ${risk.color}`}
                    title={`Risk Exposure Level: ${risk.level}`}
                  >
                    {risk.level}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
