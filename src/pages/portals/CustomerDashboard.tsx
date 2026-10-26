import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  TrendingUp,
  Receipt,
  Search,
  Send,
  X,
  CheckCircle2,
  PieChart as PieIcon,
  ShieldCheck,
  User,
  Building,
  Target,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Lock,
  ChevronRight,
  Download,
  Percent,
  Calculator,
  Shield,
  Check,
  PiggyBank,
  Briefcase,
  AlertCircle,
  Copy,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/storage';
import { formatINR, formatDate, formatShortDate } from '../../utils/formatters';
import { Transaction, TransactionCategory, Customer, TransactionType } from '../../types';
import {
  fetchSupabaseTransactions,
  insertSupabaseTransaction,
  SupabaseTransactionRow,
} from '../../services/supabaseDataService';
import {
  fetchCustomerDashboardData,
  CustomerDashboardData,
} from '../../services/customerDataService';

const CATEGORY_COLORS: Record<string, string> = {
  'Software & SaaS': '#2864F0',
  'Customer Deposit': '#159B72',
  Operations: '#35C6D9',
  'Travel & Dining': '#F2A93B',
  Investment: '#101A2C',
  'Salary & Payroll': '#18263E',
  'Vendor Payout': '#536176',
  'Shopping & Retail': '#E45464',
  Utilities: '#64748B',
  Marketing: '#8B5CF6',
};

interface CustomerDashboardProps {
  activeTab?: string;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ activeTab = 'overview' }) => {
  const { session } = useAuth();

  // Strictly isolate customer records to the authenticated user; never fall back to other users' records
  const customerRecord = useMemo(() => {
    if (session?.customerRecord) return session.customerRecord;
    if (session?.user) {
      const existing = db.getCustomerByUserId(session.user.id);
      if (existing) return existing;
      const newRec: Customer = {
        id: 'cust_' + session.user.id,
        business_id: 'biz_abc_01',
        user_id: session.user.id,
        customer_name: session.user.full_name || session.user.username || 'Valued Customer',
        customer_reference: `CUST-IND-${session.user.id.slice(0, 4)}`,
        account_type: 'Individual',
        email: session.user.email || '',
        phone: session.user.phone || '+91 98000 00000',
        balance_inr: 50000.0,
        credit_limit_inr: 150000.0,
        savings_account_no: `SB-${session.user.id.slice(0, 6)}`,
        created_at: session.user.created_at || new Date().toISOString(),
      };
      db.saveCustomer(newRec);
      return newRec;
    }
    return undefined;
  }, [session]);

  // Active sub-dashboard tab: 'overview' | 'investments' | 'credit_health'
  const [selectedDashboard, setSelectedDashboard] = useState<'overview' | 'investments' | 'credit_health'>('overview');

  // Sync with layout sidebar activeTab
  useEffect(() => {
    if (activeTab === 'investments') {
      setSelectedDashboard('investments');
    } else if (activeTab === 'credit_health') {
      setSelectedDashboard('credit_health');
    } else if (activeTab === 'overview' || activeTab === 'transactions' || activeTab === 'budget' || activeTab === 'profile') {
      setSelectedDashboard('overview');
    }
  }, [activeTab]);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    return customerRecord?.id ? db.getAllCustomerTransactions(customerRecord.id) : [];
  });
  const [isLoadingTxns, setIsLoadingTxns] = useState(false);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Authoritative Supabase Transactions Loader
  const loadTransactions = useCallback(async () => {
    if (!customerRecord?.id) return;
    setIsLoadingTxns(true);
    const orgId = customerRecord.business_id || 'org_apex_01';
    const res = await fetchSupabaseTransactions({
      customerId: customerRecord.id,
      organizationId: orgId,
    });

    if (res.data && res.data.length > 0) {
      setTransactions(res.data);
    } else {
      // Local ledger fallback
      setTransactions(db.getAllCustomerTransactions(customerRecord.id));
    }
    setIsLoadingTxns(false);
  }, [customerRecord?.id, customerRecord?.business_id]);

  useEffect(() => {
    if (customerRecord?.id) {
      loadTransactions();
    } else {
      setTransactions([]);
    }
  }, [customerRecord?.id, loadTransactions]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const [activeCashflowView, setActiveCashflowView] = useState<'flow' | 'trend'>('flow');
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Transfer state
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferCategory, setTransferCategory] = useState<TransactionCategory>('Operations');
  const [transferNote, setTransferNote] = useState('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');
  const [transferErrorMsg, setTransferErrorMsg] = useState('');

  // Add Transaction modal state
  const [newTxType, setNewTxType] = useState<TransactionType>('Debit');
  const [newTxCategory, setNewTxCategory] = useState<TransactionCategory>('Software & SaaS');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxMerchant, setNewTxMerchant] = useState('');
  const [newTxPaymentMethod, setNewTxPaymentMethod] = useState('UPI');
  const [newTxNote, setNewTxNote] = useState('');
  const [newTxSuccessMsg, setNewTxSuccessMsg] = useState('');
  const [newTxErrorMsg, setNewTxErrorMsg] = useState('');

  // Investment state
  const [isNewSipModalOpen, setIsNewSipModalOpen] = useState(false);
  const [sipFundName, setSipFundName] = useState('Parag Parikh Flexi Cap Fund');
  const [sipAmount, setSipAmount] = useState('10000');
  const [sipDebitDate, setSipDebitDate] = useState('15');
  const [sipSuccessMsg, setSipSuccessMsg] = useState('');

  // Primary Financial Metrics
  const totalReceived = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === 'Credit')
      .reduce((acc, t) => acc + Number(t.transaction_amount), 0);
  }, [transactions]);

  const totalSpent = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === 'Debit')
      .reduce((acc, t) => acc + Number(t.transaction_amount), 0);
  }, [transactions]);

  // Cash Flow Dataset
  const cashFlowTrendData = [
    { month: 'Jun', income: 140000, expenses: 48000, balance: 320000 },
    { month: 'Jul', income: 155000, expenses: 62000, balance: 350000 },
    { month: 'Aug', income: 130000, expenses: 54000, balance: 375000 },
    { month: 'Sep', income: 170000, expenses: 79000, balance: 410459 },
    { month: 'Oct', income: totalReceived || 150000, expenses: totalSpent || 77959, balance: customerRecord?.balance_inr || 482500 },
  ];

  // Spending by category
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.transaction_type === 'Debit')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.transaction_amount);
      });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#536176',
    }));
  }, [transactions]);

  // Budgets
  const budgets = [
    { category: 'Software & SaaS', spent: 14999, limit: 30000, color: '#2864F0' },
    { category: 'Operations & Utilities', spent: 8400, limit: 15000, color: '#35C6D9' },
    { category: 'Travel & Dining', spent: 4560, limit: 20000, color: '#F2A93B' },
    { category: 'Monthly SIP Savings', spent: 50000, limit: 50000, color: '#159B72' },
  ];

  // Investments Data
  const [sips, setSips] = useState([
    { id: 'sip_1', fund: 'Parag Parikh Flexi Cap Fund - Direct Growth', type: 'Equity', monthlyAmount: 15000, currentVal: 542000, returns: 21.4, nextDate: '15 Oct 2026' },
    { id: 'sip_2', fund: 'Mirae Asset Large Cap Fund - Direct Growth', type: 'Large Cap', monthlyAmount: 10000, currentVal: 384500, returns: 16.8, nextDate: '18 Oct 2026' },
    { id: 'sip_3', fund: 'ICICI Prudential Liquid & Overnight Fund', type: 'Debt & Cash', monthlyAmount: 5000, currentVal: 258500, returns: 7.2, nextDate: '20 Oct 2026' },
    { id: 'sip_4', fund: 'Sovereign Gold Bond (SGB) Tranche VI', type: 'Precious Metals', monthlyAmount: 5000, currentVal: 240800, returns: 24.5, nextDate: '25 Oct 2026' },
  ]);

  const wealthGrowthData = [
    { month: 'May', portfolio: 1120000, niftyBenchmark: 1100000 },
    { month: 'Jun', portfolio: 1195000, niftyBenchmark: 1145000 },
    { month: 'Jul', portfolio: 1250000, niftyBenchmark: 1180000 },
    { month: 'Aug', portfolio: 1315000, niftyBenchmark: 1210000 },
    { month: 'Sep', portfolio: 1378000, niftyBenchmark: 1260000 },
    { month: 'Oct', portfolio: 1425800, niftyBenchmark: 1295000 },
  ];

  const assetAllocationData = [
    { name: 'Equity Mutual Funds', value: 52, fill: '#2864F0' },
    { name: 'Direct Stocks & ETFs', value: 22, fill: '#35C6D9' },
    { name: 'Sovereign Gold', value: 14, fill: '#F2A93B' },
    { name: 'Liquid Debt Reserves', value: 12, fill: '#159B72' },
  ];

  // Loan & EMI Calculator State (Credit Health Dashboard)
  const [loanAmount, setLoanAmount] = useState<number>(1000000);
  const [interestRate, setInterestRate] = useState<number>(10.5);
  const [tenureYears, setTenureYears] = useState<number>(3);

  // EMI formula: [P * r * (1+r)^n] / [(1+r)^n - 1]
  const calculatedEmi = useMemo(() => {
    const p = loanAmount;
    const r = interestRate / 12 / 100;
    const n = tenureYears * 12;
    if (r === 0) return Math.round(p / n);
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  }, [loanAmount, interestRate, tenureYears]);

  const totalPayment = useMemo(() => {
    return calculatedEmi * tenureYears * 12;
  }, [calculatedEmi, tenureYears]);

  const totalInterest = useMemo(() => {
    return Math.max(0, totalPayment - loanAmount);
  }, [totalPayment, loanAmount]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.merchant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'All' || t.transaction_type === filterType;
      const matchCategory =
        filterCategory === 'All'
          ? drillCategory
            ? t.category === drillCategory
            : true
          : t.category === filterCategory;
      return matchSearch && matchType && matchCategory;
    });
  }, [transactions, searchTerm, filterType, filterCategory, drillCategory]);

  // Handle Transfer Money with Real Supabase Persistence
  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingTx) return;

    const amt = parseFloat(transferAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setTransferErrorMsg('Please enter a valid positive transfer amount.');
      return;
    }
    const currentBalance = customerRecord?.balance_inr || 482500;
    if (amt > currentBalance) {
      setTransferErrorMsg('Insufficient funds available in your account.');
      return;
    }

    setTransferErrorMsg('');
    setIsSubmittingTx(true);

    const txRefId = 'TXN-UPI-' + Math.floor(100000 + Math.random() * 900000);
    const orgId = customerRecord?.business_id || 'org_apex_01';
    const custId = customerRecord?.id || 'cust_01';
    const newBal = currentBalance - amt;

    const sbTxPayload: SupabaseTransactionRow = {
      transaction_id: txRefId,
      transaction_code: txRefId,
      organization_id: orgId,
      customer_id: custId,
      transaction_date: new Date().toISOString(),
      transaction_type: 'Debit',
      category: transferCategory,
      sub_category: 'Direct UPI Remittance',
      merchant_name: transferRecipient.trim() || 'UPI Payee',
      payment_method: 'UPI',
      transaction_amount: amt,
      currency: 'INR',
      account_balance_before: currentBalance,
      account_balance_after: newBal,
      transaction_status: 'Success',
      channel: 'UPI App',
      created_at: new Date().toISOString(),
    };

    const newTx: Transaction = {
      id: txRefId,
      business_id: orgId,
      customer_id: custId,
      transaction_id: txRefId,
      reference_no: 'REF-UPI-' + Date.now(),
      transaction_date: sbTxPayload.transaction_date || new Date().toISOString(),
      transaction_type: 'Debit',
      category: transferCategory,
      sub_category: 'Direct UPI Remittance',
      merchant_name: sbTxPayload.merchant_name,
      payment_method: 'UPI',
      transaction_amount: amt,
      account_balance_before: currentBalance,
      account_balance_after: newBal,
      transaction_status: 'Completed',
      channel: 'UPI App',
      created_at: sbTxPayload.created_at || new Date().toISOString(),
    };

    try {
      const res = await insertSupabaseTransaction(sbTxPayload);
      if (!res.success) {
        setTransferErrorMsg(
          `Supabase transaction insert failed: ${res.error || 'Database error'}. Transaction was NOT saved. Please ensure required table privileges and RLS policies are applied in Supabase.`
        );
        return;
      }

      // Only on verified remote database success:
      db.saveTransaction(newTx);
      if (customerRecord) {
        customerRecord.balance_inr = newBal;
      }

      // Refresh authoritative list directly from Supabase
      await loadTransactions();

      setTransferSuccessMsg(`Successfully transferred ${formatINR(amt)} to ${transferRecipient || 'Payee'}`);
      setTransferAmount('');
      setTransferRecipient('');
      setTransferNote('');
      setTimeout(() => {
        setIsTransferModalOpen(false);
        setTransferSuccessMsg('');
        setTransferErrorMsg('');
      }, 1800);
    } catch (err: any) {
      setTransferErrorMsg(err?.message || 'Transaction submission failed');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // Handle Add Transaction (Debit / Credit)
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingTx) return;

    const amt = parseFloat(newTxAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setNewTxErrorMsg('Please enter a valid positive transaction amount.');
      return;
    }
    if (!newTxMerchant.trim()) {
      setNewTxErrorMsg('Please specify a merchant or payee name.');
      return;
    }

    setNewTxErrorMsg('');
    setIsSubmittingTx(true);

    const txRefId = `TXN-${newTxType.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const orgId = customerRecord?.business_id || 'org_apex_01';
    const custId = customerRecord?.id || 'cust_01';
    const currentBalance = customerRecord?.balance_inr || 482500;
    const newBal = newTxType === 'Credit' ? currentBalance + amt : currentBalance - amt;

    const sbTxPayload: SupabaseTransactionRow = {
      transaction_id: txRefId,
      transaction_code: txRefId,
      organization_id: orgId,
      customer_id: custId,
      transaction_date: new Date().toISOString(),
      transaction_type: newTxType,
      category: newTxCategory,
      sub_category: newTxNote.trim() || 'General Transaction',
      merchant_name: newTxMerchant.trim(),
      payment_method: newTxPaymentMethod,
      transaction_amount: amt,
      currency: 'INR',
      account_balance_before: currentBalance,
      account_balance_after: newBal,
      transaction_status: 'Success',
      channel: 'Mobile App',
      created_at: new Date().toISOString(),
    };

    const newTx: Transaction = {
      id: txRefId,
      business_id: orgId,
      customer_id: custId,
      transaction_id: txRefId,
      reference_no: `REF-${Date.now()}`,
      transaction_date: sbTxPayload.transaction_date || new Date().toISOString(),
      transaction_type: newTxType,
      category: newTxCategory,
      sub_category: sbTxPayload.sub_category,
      merchant_name: sbTxPayload.merchant_name,
      payment_method: newTxPaymentMethod,
      transaction_amount: amt,
      account_balance_before: currentBalance,
      account_balance_after: newBal,
      transaction_status: 'Completed',
      channel: 'Mobile App',
      created_at: sbTxPayload.created_at || new Date().toISOString(),
    };

    try {
      const res = await insertSupabaseTransaction(sbTxPayload);
      if (!res.success) {
        setNewTxErrorMsg(
          `Supabase transaction insert failed: ${res.error || 'Database error'}. Transaction was NOT saved. Please ensure required table privileges and RLS policies are applied in Supabase.`
        );
        return;
      }

      // Only on verified remote database success:
      db.saveTransaction(newTx);
      if (customerRecord) {
        customerRecord.balance_inr = newBal;
      }

      await loadTransactions();

      setNewTxSuccessMsg(`Successfully recorded ${newTxType} of ${formatINR(amt)} for ${newTxMerchant}`);
      setNewTxAmount('');
      setNewTxMerchant('');
      setNewTxNote('');
      setTimeout(() => {
        setIsAddTxModalOpen(false);
        setNewTxSuccessMsg('');
        setNewTxErrorMsg('');
      }, 1800);
    } catch (err: any) {
      setNewTxErrorMsg(err?.message || 'Transaction could not be saved');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // Handle Start New SIP
  const handleCreateSip = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(sipAmount, 10);
    if (!amt || amt <= 0) return;

    const newSip = {
      id: 'sip_' + Date.now(),
      fund: sipFundName,
      type: 'Equity',
      monthlyAmount: amt,
      currentVal: amt,
      returns: 0.0,
      nextDate: `${sipDebitDate} Nov 2026`,
    };

    setSips([...sips, newSip]);
    setSipSuccessMsg(`SIP of ${formatINR(amt)}/month activated for ${sipFundName}`);
    setTimeout(() => {
      setIsNewSipModalOpen(false);
      setSipSuccessMsg('');
    }, 1600);
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(customerRecord?.savings_account_no || 'SB-0941-8842-1092');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* TOP HERO PROFILE & DASHBOARD SELECTOR */}
      <div className="bg-gradient-to-r from-[#101A2C] via-[#18263E] to-[#101A2C] rounded-3xl p-6 text-white shadow-lg border border-[#203252]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#35C6D9]/15 text-[#35C6D9] text-[11px] font-bold border border-[#35C6D9]/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {customerRecord?.account_type || 'Priority'} Wealth Client
              </span>
              <button
                onClick={copyAccountNumber}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-medium border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
                title="Click to copy account number"
              >
                <span>A/C: {customerRecord?.savings_account_no || 'SB-0941-8842-1092'}</span>
                {copiedAccount ? <Check className="w-3 h-3 text-[#159B72]" /> : <Copy className="w-3 h-3" />}
              </button>
              <span className="text-slate-400 text-xs">Customer Ref: {customerRecord?.customer_reference || 'CUST-IND-09412'}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Welcome back, {session?.user?.full_name || customerRecord?.customer_name || 'Valued Customer'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Access your real-time bank accounts, investment wealth portfolio, and personal credit health simulator in one unified command center.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-4 py-2.5 bg-[#2864F0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Send className="w-4 h-4" /> Send Money (UPI)
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold border border-white/15 flex items-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#35C6D9]" /> Download Statement
            </button>
          </div>
        </div>

        {/* 3 DISTINCT CUSTOMER DASHBOARDS SWITCHER */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDashboard('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              selectedDashboard === 'overview'
                ? 'bg-white text-[#101A2C] shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Wallet className="w-4 h-4 text-[#2864F0]" />
            Accounts & Cash Flow
          </button>

          <button
            onClick={() => setSelectedDashboard('investments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              selectedDashboard === 'investments'
                ? 'bg-white text-[#101A2C] shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-[#159B72]" />
            Investments & Wealth Portfolio
          </button>

          <button
            onClick={() => setSelectedDashboard('credit_health')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              selectedDashboard === 'credit_health'
                ? 'bg-white text-[#101A2C] shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#35C6D9]" />
            Credit Health & Loan Simulator
          </button>
        </div>
      </div>

      {/* DASHBOARD 1: ACCOUNTS & CASH FLOW */}
      {selectedDashboard === 'overview' && (
        <div className="space-y-6">
          {/* 4 Sleek Primary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Available Liquidity</span>
                <div className="p-2 rounded-xl bg-[#2864F0]/10 text-[#2864F0]">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">
                {formatINR(customerRecord?.balance_inr || 482500)}
              </div>
              <div className="mt-2 text-[11px] text-[#159B72] font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Live INR Savings Balance
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Monthly Inflow</span>
                <div className="p-2 rounded-xl bg-[#159B72]/10 text-[#159B72]">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">
                {formatINR(totalReceived || 150000)}
              </div>
              <div className="mt-2 text-[11px] text-[#159B72] font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% vs previous cycle
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Monthly Outflow</span>
                <div className="p-2 rounded-xl bg-[#E45464]/10 text-[#E45464]">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">
                {formatINR(totalSpent || 77959)}
              </div>
              <div className="mt-2 text-[11px] text-[#536176] font-semibold">
                Controlled burn rate (38% budget)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Savings Rate</span>
                <div className="p-2 rounded-xl bg-[#35C6D9]/10 text-[#35C6D9]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">48.0%</div>
              <div className="mt-2 text-[11px] text-[#159B72] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Prime financial buffer
              </div>
            </div>
          </div>

          {/* Clean 2-Column Analytics Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cash Flow Dynamics Chart */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-[#101A2C]">Monthly Cash Flow Velocity</h3>
                  <p className="text-xs text-[#536176]">Inflow deposits vs operational debits</p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-[#F4F7FB] rounded-xl border border-[#E1E7F0]">
                  <button
                    onClick={() => setActiveCashflowView('flow')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      activeCashflowView === 'flow' ? 'bg-[#2864F0] text-white shadow-xs' : 'text-[#536176]'
                    }`}
                  >
                    Income vs Expenses
                  </button>
                  <button
                    onClick={() => setActiveCashflowView('trend')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      activeCashflowView === 'trend' ? 'bg-[#2864F0] text-white shadow-xs' : 'text-[#536176]'
                    }`}
                  >
                    Net Balance Trajectory
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {activeCashflowView === 'flow' ? (
                    <BarChart data={cashFlowTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7F0" />
                      <XAxis dataKey="month" stroke="#536176" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#536176" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip
                        formatter={(val: any) => formatINR(Number(val))}
                        contentStyle={{ backgroundColor: '#101A2C', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar dataKey="income" name="Deposits Inflow" fill="#159B72" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenditure" fill="#2864F0" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <AreaChart data={cashFlowTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2864F0" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2864F0" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7F0" />
                      <XAxis dataKey="month" stroke="#536176" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#536176" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip
                        formatter={(val: any) => formatINR(Number(val))}
                        contentStyle={{ backgroundColor: '#101A2C', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="balance" name="Account Liquidity" stroke="#2864F0" strokeWidth={2.5} fill="url(#balanceGrad)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown & Budgets */}
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#101A2C]">Spending by Category</h3>
                  <p className="text-xs text-[#536176]">Click a slice to filter transactions below</p>
                </div>
                {drillCategory && (
                  <button
                    onClick={() => setDrillCategory(null)}
                    className="text-[11px] text-[#2864F0] font-bold hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={(entry: any) => setDrillCategory(entry?.name ?? null)}
                    >
                      {spendingByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={drillCategory === entry.name ? '#101A2C' : '#fff'}
                          strokeWidth={drillCategory === entry.name ? 3 : 1}
                          className="cursor-pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => formatINR(Number(val))}
                      contentStyle={{ backgroundColor: '#101A2C', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Budget Progress bars */}
              <div className="pt-2 border-t border-[#E1E7F0] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#101A2C]">
                  <span>Monthly Budget Utilization</span>
                  <span className="text-[#159B72]">38% of ₹1.15L</span>
                </div>
                {budgets.slice(0, 3).map((b, i) => {
                  const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#536176] font-medium">{b.category}</span>
                        <span className="text-[#101A2C] font-bold">
                          {formatINR(b.spent)} / {formatINR(b.limit)}
                        </span>
                      </div>
                      <div className="w-full bg-[#E1E7F0] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: b.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Transactions Ledger */}
          <div className="bg-white rounded-3xl border border-[#E1E7F0] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E1E7F0] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#101A2C]">Recent Transaction Ledger</h3>
                <p className="text-xs text-[#536176]">Real-time settled payments and UPI incoming credits</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#536176] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search merchant, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-1.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs text-[#101A2C] placeholder-[#536176] focus:outline-hidden focus:border-[#2864F0] w-48"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs text-[#101A2C] focus:outline-hidden focus:border-[#2864F0]"
                >
                  <option value="All">All Types</option>
                  <option value="Credit">Credits Only</option>
                  <option value="Debit">Debits Only</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setDrillCategory(null);
                  }}
                  className="px-2.5 py-1.5 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-xs text-[#101A2C] focus:outline-hidden focus:border-[#2864F0]"
                >
                  <option value="All">All Categories</option>
                  {Object.keys(CATEGORY_COLORS).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={loadTransactions}
                  disabled={isLoadingTxns}
                  title="Refresh from Supabase"
                  className="p-1.5 bg-[#F4F7FB] hover:bg-slate-200 border border-[#E1E7F0] rounded-xl text-[#536176] hover:text-[#101A2C] transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTxns ? 'animate-spin text-[#2864F0]' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddTxModalOpen(true)}
                  className="px-3 py-1.5 bg-[#2864F0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Transaction
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F7FB] text-[#536176] text-[11px] font-bold uppercase tracking-wider border-b border-[#E1E7F0]">
                    <th className="py-3 px-4">Transaction / ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Channel / Method</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7F0] text-xs">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#536176]">
                        No matching transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50 transition cursor-pointer"
                        onClick={() => setSelectedTx(tx)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-xl shrink-0 ${
                                tx.transaction_type === 'Credit'
                                  ? 'bg-[#159B72]/10 text-[#159B72]'
                                  : 'bg-[#2864F0]/10 text-[#2864F0]'
                              }`}
                            >
                              {tx.transaction_type === 'Credit' ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <span className="font-extrabold text-[#101A2C] block">
                                {tx.merchant_name}
                              </span>
                              <span className="text-[10px] text-[#536176] font-mono">
                                {tx.transaction_id}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[tx.category] || '#536176'}15`,
                              color: CATEGORY_COLORS[tx.category] || '#536176',
                            }}
                          >
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#536176]">
                          {tx.payment_method} &bull; {tx.channel}
                        </td>
                        <td className="py-3.5 px-4 text-[#536176]">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-extrabold ${
                            tx.transaction_type === 'Credit' ? 'text-[#159B72]' : 'text-[#101A2C]'
                          }`}
                        >
                          {tx.transaction_type === 'Credit' ? '+' : '-'}
                          {formatINR(tx.transaction_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTx(tx);
                            }}
                            className="p-1.5 text-[#536176] hover:text-[#2864F0] hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="View Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 2: INVESTMENTS & WEALTH PORTFOLIO (NEW DASHBOARD 1) */}
      {selectedDashboard === 'investments' && (
        <div className="space-y-6">
          {/* 4 Investment KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Portfolio Net Worth</span>
                <div className="p-2 rounded-xl bg-[#2864F0]/10 text-[#2864F0]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">₹14,25,800</div>
              <div className="mt-2 text-[11px] text-[#159B72] font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% All-time Gain (+₹2,21,500)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Monthly SIPs</span>
                <div className="p-2 rounded-xl bg-[#159B72]/10 text-[#159B72]">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">₹35,000 / mo</div>
              <div className="mt-2 text-[11px] text-[#536176] font-semibold">
                Across 4 diversified fund houses
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Projected 5-Yr Corpus</span>
                <div className="p-2 rounded-xl bg-[#35C6D9]/10 text-[#35C6D9]">
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">₹38,50,000</div>
              <div className="mt-2 text-[11px] text-[#2864F0] font-semibold">
                Compounded at historical 12.8% CAGR
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Emergency Buffer</span>
                <div className="p-2 rounded-xl bg-[#F2A93B]/10 text-[#F2A93B]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">6.2 Months</div>
              <div className="mt-2 text-[11px] text-[#159B72] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Liquid reserves optimal
              </div>
            </div>
          </div>

          {/* Wealth Growth & Asset Allocation Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#101A2C]">Portfolio Growth vs NIFTY 50</h3>
                  <p className="text-xs text-[#536176]">Consolidated NAV performance trajectory</p>
                </div>
                <button
                  onClick={() => setIsNewSipModalOpen(true)}
                  className="px-3 py-1.5 bg-[#159B72] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Start New SIP
                </button>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={wealthGrowthData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#159B72" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#159B72" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E7F0" />
                    <XAxis dataKey="month" stroke="#536176" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#536176" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 100000}L`} />
                    <Tooltip
                      formatter={(val: any) => formatINR(Number(val))}
                      contentStyle={{ backgroundColor: '#101A2C', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area type="monotone" dataKey="portfolio" name="Your Portfolio" stroke="#159B72" strokeWidth={2.5} fill="url(#wealthGrad)" />
                    <Line type="monotone" dataKey="niftyBenchmark" name="NIFTY 50 Index" stroke="#536176" strokeDasharray="4 4" strokeWidth={1.8} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-[#101A2C]">Asset Allocation</h3>
                <p className="text-xs text-[#536176]">Target risk-adjusted distribution</p>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={assetAllocationData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={4} dataKey="value">
                      {assetAllocationData.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#101A2C', borderRadius: '10px', color: '#fff', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#E1E7F0]">
                {assetAllocationData.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.fill }} />
                      <span className="text-[#536176]">{a.name}</span>
                    </div>
                    <span className="font-bold text-[#101A2C]">{a.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active SIPs & Mutual Fund Holdings Table */}
          <div className="bg-white rounded-3xl border border-[#E1E7F0] shadow-xs overflow-hidden">
            <div className="p-5 border-b border-[#E1E7F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#101A2C]">Systematic Investment Plans (SIP)</h3>
                <p className="text-xs text-[#536176]">Automated recurring debits and portfolio valuation</p>
              </div>
              <span className="px-3 py-1 bg-[#159B72]/10 text-[#159B72] text-xs font-bold rounded-full">
                4 Active Auto-Debits
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F7FB] text-[#536176] text-[11px] font-bold uppercase tracking-wider border-b border-[#E1E7F0]">
                    <th className="py-3 px-4">Fund Name</th>
                    <th className="py-3 px-4">Asset Class</th>
                    <th className="py-3 px-4">Monthly SIP</th>
                    <th className="py-3 px-4">Current Value</th>
                    <th className="py-3 px-4">Returns (XIRR)</th>
                    <th className="py-3 px-4">Next Auto-Debit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7F0] text-xs">
                  {sips.map((sip) => (
                    <tr key={sip.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-[#101A2C] flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#159B72]" />
                        {sip.fund}
                      </td>
                      <td className="py-3.5 px-4 text-[#536176]">
                        <span className="px-2 py-0.5 rounded-md bg-[#F4F7FB] border border-[#E1E7F0] text-[10px] font-semibold">
                          {sip.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#101A2C]">
                        {formatINR(sip.monthlyAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#101A2C]">
                        {formatINR(sip.currentVal)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#159B72]">
                        +{sip.returns}%
                      </td>
                      <td className="py-3.5 px-4 text-[#536176]">
                        {sip.nextDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD 3: CREDIT HEALTH & LOAN SIMULATOR (NEW DASHBOARD 2) */}
      {selectedDashboard === 'credit_health' && (
        <div className="space-y-6">
          {/* 4 Credit Health KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">CIBIL Bureau Score</span>
                <div className="p-2 rounded-xl bg-[#159B72]/10 text-[#159B72]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#159B72]">785 / 900</div>
              <div className="mt-2 text-[11px] text-[#159B72] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Excellent Tier (Top 8% Borrowers)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Credit Card Utilization</span>
                <div className="p-2 rounded-xl bg-[#2864F0]/10 text-[#2864F0]">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">14.2%</div>
              <div className="mt-2 text-[11px] text-[#159B72] font-semibold">
                ₹71,000 of ₹5,00,000 Limit (Optimal &lt; 30%)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Repayment History</span>
                <div className="p-2 rounded-xl bg-[#35C6D9]/10 text-[#35C6D9]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">100%</div>
              <div className="mt-2 text-[11px] text-[#159B72] font-semibold">
                48 consecutive on-time EMI clearances
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E1E7F0] shadow-xs">
              <div className="flex items-center justify-between text-[#536176] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Credit Lines</span>
                <div className="p-2 rounded-xl bg-[#101A2C]/10 text-[#101A2C]">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[#101A2C]">1 Loan &bull; 1 Card</div>
              <div className="mt-2 text-[11px] text-[#536176] font-semibold">
                Vehicle Loan (Principal bal: ₹3.4L)
              </div>
            </div>
          </div>

          {/* Interactive Loan Eligibility & EMI Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Calculator Box */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-[#101A2C] flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#2864F0]" />
                    Interactive Loan Eligibility & EMI Simulator
                  </h3>
                  <p className="text-xs text-[#536176]">Adjust parameters to view instant repayment and eligibility models</p>
                </div>
                <span className="px-2.5 py-1 bg-[#159B72]/10 text-[#159B72] rounded-full text-[11px] font-bold">
                  Pre-Approved Interest
                </span>
              </div>

              {/* Slider 1: Loan Amount */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#536176] font-semibold">Desired Loan Amount</span>
                  <span className="text-[#101A2C] font-extrabold text-sm">{formatINR(loanAmount)}</span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={5000000}
                  step={50000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-[#2864F0] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#536176]">
                  <span>₹1,00,000</span>
                  <span>₹25,00,000</span>
                  <span>₹50,00,000</span>
                </div>
              </div>

              {/* Slider 2: Tenure */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#536176] font-semibold">Repayment Tenure</span>
                  <span className="text-[#101A2C] font-extrabold text-sm">{tenureYears} Years ({tenureYears * 12} Months)</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-[#35C6D9] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#536176]">
                  <span>1 Year</span>
                  <span>3 Years</span>
                  <span>5 Years</span>
                  <span>7 Years</span>
                </div>
              </div>

              {/* Slider 3: Interest Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#536176] font-semibold">Applicable Annual Interest (APR)</span>
                  <span className="text-[#101A2C] font-extrabold text-sm">{interestRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min={8.5}
                  max={15.0}
                  step={0.25}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-[#101A2C] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#536176]">
                  <span>8.5% (Prime)</span>
                  <span>11.5%</span>
                  <span>15.0%</span>
                </div>
              </div>

              {/* Instant Output Summary Strip */}
              <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-[#E1E7F0] grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] font-semibold text-[#536176] block">Monthly EMI</span>
                  <span className="text-base font-black text-[#2864F0] block mt-0.5">
                    {formatINR(calculatedEmi)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#536176] block">Total Interest</span>
                  <span className="text-base font-black text-[#101A2C] block mt-0.5">
                    {formatINR(totalInterest)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#536176] block">Total Repayment</span>
                  <span className="text-base font-black text-[#159B72] block mt-0.5">
                    {formatINR(totalPayment)}
                  </span>
                </div>
              </div>
            </div>

            {/* Credit Factors & Pre-Approved Offers */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-[#E1E7F0] shadow-xs space-y-3">
                <h3 className="text-sm font-extrabold text-[#101A2C]">Credit Score Health Factors</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F4F7FB] border border-[#E1E7F0]">
                    <div>
                      <span className="font-bold text-[#101A2C] block">On-Time Repayments</span>
                      <span className="text-[10px] text-[#536176]">High Impact on Score</span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#159B72]/15 text-[#159B72] rounded-md font-bold text-[11px]">
                      100% (Perfect)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F4F7FB] border border-[#E1E7F0]">
                    <div>
                      <span className="font-bold text-[#101A2C] block">Credit Line Utilization</span>
                      <span className="text-[10px] text-[#536176]">High Impact on Score</span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#159B72]/15 text-[#159B72] rounded-md font-bold text-[11px]">
                      14.2% (Optimal)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F4F7FB] border border-[#E1E7F0]">
                    <div>
                      <span className="font-bold text-[#101A2C] block">Credit History Vintage</span>
                      <span className="text-[10px] text-[#536176]">Medium Impact</span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#2864F0]/15 text-[#2864F0] rounded-md font-bold text-[11px]">
                      4 Yrs 8 Mos
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F4F7FB] border border-[#E1E7F0]">
                    <div>
                      <span className="font-bold text-[#101A2C] block">Hard Credit Enquiries</span>
                      <span className="text-[10px] text-[#536176]">Low Impact</span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#159B72]/15 text-[#159B72] rounded-md font-bold text-[11px]">
                      0 in last 90 days
                    </span>
                  </div>
                </div>
              </div>

              {/* Pre-Approved Instant Card */}
              <div className="bg-gradient-to-br from-[#101A2C] to-[#2864F0] p-5 rounded-3xl text-white shadow-md border border-[#203252] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#35C6D9]">
                    Exclusive Pre-Approved Offer
                  </span>
                  <Sparkles className="w-4 h-4 text-[#35C6D9]" />
                </div>
                <h4 className="text-base font-extrabold text-white">
                  Instant Personal Overdraft up to ₹10,00,000
                </h4>
                <p className="text-[11px] text-slate-200">
                  Zero documentation required. Special interest rate of 9.9% fixed p.a. Instant credit to SB account.
                </p>
                <button
                  onClick={() => alert('Pre-approved facility unlocked! A relationship manager will contact you.')}
                  className="w-full py-2 bg-white text-[#101A2C] hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Claim Pre-Approved Line
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPI FUND TRANSFER */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-[#101A2C]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E1E7F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E7F0]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#2864F0]/10 text-[#2864F0]">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#101A2C]">Instant Fund Transfer (UPI)</h3>
                  <p className="text-[11px] text-[#536176]">Debit from {customerRecord?.savings_account_no || 'SB-0941'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-[#536176] hover:text-[#101A2C] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#159B72] mx-auto animate-bounce" />
                <h4 className="text-base font-extrabold text-[#101A2C]">Transfer Successful!</h4>
                <p className="text-xs text-[#536176]">{transferSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleInitiateTransfer} className="space-y-4">
                {transferErrorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{transferErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Recipient UPI ID or Account Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. rahul.sharma@okaxis or Lumina Corp"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Transfer Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#536176]">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs font-bold text-[#101A2C] focus:outline-hidden focus:border-[#2864F0]"
                    />
                  </div>
                  <span className="text-[10px] text-[#536176] mt-1 block">
                    Available: {formatINR(customerRecord?.balance_inr || 482500)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Category</label>
                  <select
                    value={transferCategory}
                    onChange={(e) => setTransferCategory(e.target.value as TransactionCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
                  >
                    <option value="Operations">Operations</option>
                    <option value="Software & SaaS">Software & SaaS</option>
                    <option value="Travel & Dining">Travel & Dining</option>
                    <option value="Investment">Investment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Shopping & Retail">Shopping & Retail</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Invoice #9021 or Personal expense"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setTransferErrorMsg('');
                    }}
                    className="px-4 py-2 rounded-xl border border-[#E1E7F0] text-xs font-bold text-[#536176] hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTx}
                    className="px-5 py-2 rounded-xl bg-[#2864F0] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingTx && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {isSubmittingTx ? 'Processing...' : 'Confirm & Send'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD TRANSACTION */}
      {isAddTxModalOpen && (
        <div className="fixed inset-0 bg-[#101A2C]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E1E7F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E7F0]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#2864F0]/10 text-[#2864F0]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#101A2C]">Record New Transaction</h3>
                  <p className="text-[11px] text-[#536176]">Save directly to Supabase public.transactions</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddTxModalOpen(false);
                  setNewTxErrorMsg('');
                }}
                className="text-[#536176] hover:text-[#101A2C] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newTxSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#159B72] mx-auto animate-bounce" />
                <h4 className="text-base font-extrabold text-[#101A2C]">Transaction Recorded!</h4>
                <p className="text-xs text-[#536176]">{newTxSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleAddTransaction} className="space-y-4">
                {newTxErrorMsg && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{newTxErrorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#101A2C] mb-1">Transaction Type</label>
                    <select
                      value={newTxType}
                      onChange={(e) => setNewTxType(e.target.value as TransactionType)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E1E7F0] text-xs font-bold focus:outline-hidden focus:border-[#2864F0]"
                    >
                      <option value="Debit">Debit (Expense)</option>
                      <option value="Credit">Credit (Income)</option>
                      <option value="UPI">UPI</option>
                      <option value="Transfer">Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#101A2C] mb-1">Payment Method</label>
                    <select
                      value={newTxPaymentMethod}
                      onChange={(e) => setNewTxPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
                    >
                      <option value="UPI">UPI</option>
                      <option value="NetBanking">NetBanking</option>
                      <option value="Corporate Rails">Corporate Rails</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="IMPS">IMPS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Merchant / Payee / Source</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AWS Cloud Services, Client Payout"
                    value={newTxMerchant}
                    onChange={(e) => setNewTxMerchant(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#536176]">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="0.00"
                      value={newTxAmount}
                      onChange={(e) => setNewTxAmount(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs font-bold text-[#101A2C] focus:outline-hidden focus:border-[#2864F0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Category</label>
                  <select
                    value={newTxCategory}
                    onChange={(e) => setNewTxCategory(e.target.value as TransactionCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
                  >
                    {Object.keys(CATEGORY_COLORS).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Reference / Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Invoice #8841"
                    value={newTxNote}
                    onChange={(e) => setNewTxNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddTxModalOpen(false);
                      setNewTxErrorMsg('');
                    }}
                    className="px-4 py-2 rounded-xl border border-[#E1E7F0] text-xs font-bold text-[#536176] hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTx}
                    className="px-5 py-2 rounded-xl bg-[#2864F0] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingTx && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {isSubmittingTx ? 'Saving to Database...' : 'Save Transaction'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: START NEW SIP */}
      {isNewSipModalOpen && (
        <div className="fixed inset-0 bg-[#101A2C]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E1E7F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E7F0]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#159B72]/10 text-[#159B72]">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#101A2C]">Start New SIP Investment</h3>
                  <p className="text-[11px] text-[#536176]">Direct Growth Mutual Fund Auto-Debit</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewSipModalOpen(false)}
                className="text-[#536176] hover:text-[#101A2C] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sipSuccessMsg ? (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#159B72] mx-auto animate-bounce" />
                <h4 className="text-base font-extrabold text-[#101A2C]">SIP Activated!</h4>
                <p className="text-xs text-[#536176]">{sipSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateSip} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Select Fund House & Scheme</label>
                  <select
                    value={sipFundName}
                    onChange={(e) => setSipFundName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
                  >
                    <option value="Parag Parikh Flexi Cap Fund - Direct Growth">Parag Parikh Flexi Cap Fund (Equity)</option>
                    <option value="Mirae Asset Large Cap Fund - Direct Growth">Mirae Asset Large Cap Fund (Equity)</option>
                    <option value="HDFC Top 100 Index Fund - Direct Growth">HDFC Top 100 Index Fund (Index)</option>
                    <option value="Nippon India Small Cap Fund - Direct Growth">Nippon India Small Cap Fund (High Alpha)</option>
                    <option value="SBI Sovereign Gold Bond Scheme">SBI Sovereign Gold Scheme (Commodity)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Monthly SIP Amount (INR)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={sipAmount}
                    onChange={(e) => setSipAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs font-bold focus:outline-hidden focus:border-[#2864F0]"
                  />
                  <span className="text-[10px] text-[#536176] mt-1 block">Minimum SIP: ₹1,000 / month</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#101A2C] mb-1">Monthly Debit Day</label>
                  <select
                    value={sipDebitDate}
                    onChange={(e) => setSipDebitDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E1E7F0] text-xs focus:outline-hidden focus:border-[#2864F0]"
                  >
                    <option value="5">5th of every month</option>
                    <option value="10">10th of every month</option>
                    <option value="15">15th of every month</option>
                    <option value="20">20th of every month</option>
                    <option value="25">25th of every month</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewSipModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#E1E7F0] text-xs font-bold text-[#536176] hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#159B72] hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Activate SIP Mandate
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: TRANSACTION RECEIPT */}
      {selectedTx && (
        <div className="fixed inset-0 bg-[#101A2C]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E1E7F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E7F0]">
              <span className="text-xs font-bold text-[#536176]">Official Transaction Receipt</span>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-[#536176] hover:text-[#101A2C] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <span className="text-[11px] text-[#536176] block">Settled Amount</span>
              <div
                className={`text-2xl font-black ${
                  selectedTx.transaction_type === 'Credit' ? 'text-[#159B72]' : 'text-[#101A2C]'
                }`}
              >
                {selectedTx.transaction_type === 'Credit' ? '+' : '-'}
                {formatINR(selectedTx.transaction_amount)}
              </div>
              <span className="text-xs font-bold text-[#101A2C]">{selectedTx.merchant_name}</span>
            </div>

            <div className="bg-[#F4F7FB] p-3.5 rounded-2xl border border-[#E1E7F0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#536176]">Status:</span>
                <span className="font-bold text-[#159B72] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {selectedTx.transaction_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#536176]">Transaction ID:</span>
                <span className="font-mono text-[#101A2C]">{selectedTx.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#536176]">Timestamp:</span>
                <span className="text-[#101A2C]">{formatDate(selectedTx.transaction_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#536176]">Category:</span>
                <span className="text-[#101A2C]">{selectedTx.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#536176]">Channel:</span>
                <span className="text-[#101A2C]">{selectedTx.channel}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 bg-[#101A2C] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
