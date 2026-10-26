import React, { useState } from 'react';
import {
  Check,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/formatters';
import { BillingPeriod, SubscriptionPlan } from '../../types';

interface SubscriptionPlansProps {
  onSuccessRedirect: () => void;
  isNewRegistration?: boolean;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  onSuccessRedirect,
  isNewRegistration = false,
}) => {
  const { activeBusiness, subscription, activateSubscription } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('Professional');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  const plans = [
    {
      id: 'Starter' as SubscriptionPlan,
      name: 'Starter',
      description: 'Foundational financial operations for small businesses and boutique lenders.',
      monthlyPrice: 9999,
      annualPrice: 99990,
      features: [
        'Financial overview',
        'Transaction history',
        'Basic reporting',
        'Limited team access',
      ],
      notIncluded: [
        'Advanced risk modeling & CIBIL score distribution',
        'Automated fraud surveillance & PMLA filing',
        'Executive approvals queue for high-value exposures',
      ],
      badge: 'Starter Tier',
      popular: false,
    },
    {
      id: 'Professional' as SubscriptionPlan,
      name: 'Professional',
      description: 'Integrated operations suite for growing financial institutions and digital platforms.',
      monthlyPrice: 24999,
      annualPrice: 249990,
      features: [
        'Advanced financial dashboards',
        'Risk analysis',
        'Fraud monitoring',
        'Team collaboration',
        'Enhanced reporting',
      ],
      notIncluded: [
        'Custom administrative controls & multi-tenant policies',
      ],
      badge: 'Recommended',
      popular: true,
    },
    {
      id: 'Enterprise' as SubscriptionPlan,
      name: 'Enterprise',
      description: 'Mission-critical platform with high limits and priority SLAs for established institutions.',
      monthlyPrice: 49999,
      annualPrice: 499990,
      features: [
        'Advanced administrative controls',
        'Expanded team and usage limits',
        'Detailed reporting',
        'Configurable business requirements',
        'Priority support',
      ],
      notIncluded: [],
      badge: 'Enterprise Tier',
      popular: false,
    },
  ];

  const comparisonMatrix = [
    { feature: 'Core Financial Dashboard', starter: true, professional: true, enterprise: true },
    { feature: 'Transaction Monitoring Ledger', starter: true, professional: true, enterprise: true },
    { feature: 'Basic Accounting Reports', starter: true, professional: true, enterprise: true },
    { feature: 'Team Seats', starter: 'Up to 5', professional: 'Up to 25', enterprise: 'Unlimited' },
    { feature: 'Credit Risk Analysis & CIBIL Scoring', starter: false, professional: true, enterprise: true },
    { feature: 'Debt-to-Income (DTI) Calculations', starter: false, professional: true, enterprise: true },
    { feature: 'Real-Time Fraud Heuristics', starter: false, professional: true, enterprise: true },
    { feature: 'AML & SAR Case Docket', starter: false, professional: true, enterprise: true },
    { feature: 'Manager Approval Workflows (> ₹50L)', starter: false, professional: false, enterprise: true },
    { feature: 'Enterprise Security Audit Logs (SOC-2)', starter: false, professional: false, enterprise: true },
    { feature: 'Dedicated Support SLA', starter: 'Standard (24h)', professional: 'Priority (4h)', enterprise: 'Dedicated (15m)' },
  ];

  const currentPrice = (plan: typeof plans[0]) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  };

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    setSelectedPlan(planId);
    setShowCheckoutModal(true);
  };

  const handleConfirmCheckout = async () => {
    if (!activeBusiness) return;
    setIsProcessing(true);

    setTimeout(async () => {
      await activateSubscription(activeBusiness.id, selectedPlan, billingPeriod);
      setIsProcessing(false);
      setActivationSuccess(true);
      setTimeout(() => {
        setShowCheckoutModal(false);
        onSuccessRedirect();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-[#2864F0] border border-[#E1E7F0] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#2864F0]" />
            <span>Business Subscription Plans</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#101A2C] tracking-tight">
            Select Your Business Plan
          </h1>

          <p className="text-[#536176] text-sm">
            {isNewRegistration
              ? `Welcome ${activeBusiness?.business_name || 'Partner'}. Activate your plan to access the Business Operations workspace.`
              : 'Choose the appropriate operational tier based on your loan portfolio volume and risk operations team size.'}
          </p>

          {/* Billing Switch */}
          <div className="inline-flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-[#E1E7F0] shadow-2xs mt-4">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                billingPeriod === 'monthly'
                  ? 'bg-[#101A2C] text-white shadow-2xs'
                  : 'text-[#536176] hover:text-[#101A2C]'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                billingPeriod === 'annual'
                  ? 'bg-[#101A2C] text-white shadow-2xs'
                  : 'text-[#536176] hover:text-[#101A2C]'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-extrabold bg-[#35C6D9] text-[#101A2C] px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* 3 Configurable Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price = currentPrice(plan);
            const isCurrentSub = subscription?.plan_name === plan.id && subscription?.status === 'active';

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative border ${
                  plan.popular
                    ? 'border-[#2864F0] shadow-xl ring-2 ring-[#2864F0]/15'
                    : 'border-[#E1E7F0] shadow-xs hover:shadow-md'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#2864F0] text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="mb-2">
                    <h3 className="text-xl font-extrabold text-[#101A2C]">{plan.name}</h3>
                    <p className="text-xs text-[#536176] mt-1 min-h-[32px]">{plan.description}</p>
                  </div>

                  <div className="my-6 pb-6 border-b border-[#E1E7F0]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-[#101A2C]">
                        {formatINR(price)}
                      </span>
                      <span className="text-xs text-[#536176]">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#536176] mt-1">Configurable placeholder rate</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <p className="font-bold text-[#101A2C] uppercase tracking-wider text-[11px]">
                      Included Features:
                    </p>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-[#101A2C]">
                        <Check className="w-4 h-4 text-[#159B72] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-slate-400 line-through">
                        <X className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#E1E7F0]">
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                      isCurrentSub
                        ? 'bg-slate-100 text-[#536176] border border-[#E1E7F0] cursor-default'
                        : plan.popular
                        ? 'bg-[#2864F0] hover:bg-[#1E52CC] text-white shadow-md'
                        : 'bg-[#101A2C] hover:bg-[#18263E] text-white shadow-xs'
                    }`}
                  >
                    <span>{isCurrentSub ? 'Current Active Plan' : `Choose ${plan.name} Plan`}</span>
                    {!isCurrentSub && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-3xl border border-[#E1E7F0] shadow-xs overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-[#E1E7F0]">
            <h3 className="text-xl font-extrabold text-[#101A2C]">Feature Comparison</h3>
            <p className="text-xs text-[#536176] mt-1">
              Detailed breakdown of features, limits, and governance controls across each tier
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F7FB] text-[#536176] uppercase tracking-wider font-semibold border-b border-[#E1E7F0]">
                <tr>
                  <th className="py-4 px-6 w-2/5">Capability / Requirement</th>
                  <th className="py-4 px-6 text-center w-1/5">Starter</th>
                  <th className="py-4 px-6 text-center w-1/5">Professional</th>
                  <th className="py-4 px-6 text-center w-1/5">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E7F0]">
                {comparisonMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F4F7FB]/50 transition">
                    <td className="py-3.5 px-6 font-medium text-[#101A2C]">{row.feature}</td>
                    <td className="py-3.5 px-6 text-center">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? (
                          <Check className="w-4 h-4 text-[#159B72] mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="font-semibold text-[#101A2C]">{row.starter}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {typeof row.professional === 'boolean' ? (
                        row.professional ? (
                          <Check className="w-4 h-4 text-[#159B72] mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="font-semibold text-[#2864F0]">{row.professional}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      {typeof row.enterprise === 'boolean' ? (
                        row.enterprise ? (
                          <Check className="w-4 h-4 text-[#159B72] mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-slate-300 mx-auto" />
                        )
                      ) : (
                        <span className="font-semibold text-[#101A2C]">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simulated Demo Notice */}
        <div className="bg-white border border-[#E1E7F0] rounded-2xl p-5 text-xs text-[#536176] max-w-3xl mx-auto flex items-start gap-3 shadow-2xs">
          <AlertCircle className="w-5 h-5 text-[#2864F0] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Demonstration Checkout:</strong> Payments and billing periods on this page use configurable placeholder prices in INR (₹). Simulated activation updates your business tenant subscription record without submitting real payment transactions.
          </p>
        </div>
      </div>

      {/* Demo Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101A2C]/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E1E7F0] max-w-md w-full overflow-hidden">
            <div className="bg-[#101A2C] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-[#35C6D9]" />
                <h3 className="font-bold text-sm">Simulated Plan Activation</h3>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activationSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#159B72] mx-auto animate-bounce" />
                <h4 className="font-bold text-lg text-[#101A2C]">Plan Activated</h4>
                <p className="text-xs text-[#536176]">
                  {selectedPlan} Plan active for {activeBusiness?.business_name}. Launching Business Operations...
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4 text-xs">
                <div className="bg-[#F4F7FB] border border-[#E1E7F0] rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#536176]">Company Entity:</span>
                    <span className="font-bold text-[#101A2C]">{activeBusiness?.business_name || 'Apex FinTech Capital Ltd'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#536176]">Plan Selected:</span>
                    <span className="font-bold text-[#2864F0] bg-white px-2 py-0.5 rounded border border-[#E1E7F0]">
                      {selectedPlan} Tier
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#536176]">Billing Cycle:</span>
                    <span className="font-semibold text-[#101A2C] capitalize">{billingPeriod}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E1E7F0] flex justify-between items-center">
                    <span className="font-bold text-[#101A2C]">Simulated Amount (INR):</span>
                    <span className="text-base font-black text-[#101A2C]">
                      {formatINR(
                        billingPeriod === 'monthly'
                          ? plans.find((p) => p.id === selectedPlan)!.monthlyPrice
                          : plans.find((p) => p.id === selectedPlan)!.annualPrice
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F4F7FB] border border-[#E1E7F0] rounded-xl text-[#536176] text-[11px]">
                  Trial activation immediately authorizes your company members to access the business workspace.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowCheckoutModal(false)}
                    className="px-4 py-2 border border-[#E1E7F0] rounded-xl text-[#536176] hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCheckout}
                    disabled={isProcessing}
                    className="px-5 py-2.5 bg-[#101A2C] hover:bg-[#18263E] text-white rounded-xl font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? 'Activating Workspace...' : 'Activate & Open Workspace'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
