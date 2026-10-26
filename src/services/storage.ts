import {
  AdminActivity,
  Business,
  BusinessInvitation,
  BusinessMember,
  Customer,
  ManagerReview,
  Profile,
  RiskAssessment,
  Subscription,
  SupportTicket,
  Transaction,
  TransactionInvestigation,
  UserRole,
  SubscriptionPlan,
  BillingPeriod,
  CustomerVerificationRequest,
} from '../types';
import {
  initialAdminActivity,
  initialBusinesses,
  initialCustomers,
  initialInvestigations,
  initialInvitations,
  initialManagerReviews,
  initialBusinessMembers,
  initialProfiles,
  initialRiskAssessments,
  initialSubscriptions,
  initialSupportTickets,
  initialTransactions,
} from '../data/seedData';
import { resolveSyntheticEmail } from './supabaseClient';

const STORAGE_KEYS = {
  PROFILES: 'finops_profiles_v2',
  BUSINESSES: 'finops_businesses_v2',
  MEMBERS: 'finops_members_v2',
  SUBSCRIPTIONS: 'finops_subscriptions_v2',
  CUSTOMERS: 'finops_customers_v2',
  TRANSACTIONS: 'finops_transactions_v2',
  RISK: 'finops_risk_v2',
  INVESTIGATIONS: 'finops_investigations_v2',
  REVIEWS: 'finops_reviews_v2',
  TICKETS: 'finops_tickets_v2',
  ACTIVITY: 'finops_activity_v2',
  INVITATIONS: 'finops_invitations_v2',
  ACTIVE_SESSION: 'finops_session_v2',
  VERIFICATION_REQUESTS: 'finops_verification_requests_v2',
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Storage get error for ' + key, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage set error for ' + key, e);
  }
}

export const db = {
  resetToDefault: () => {
    localStorage.removeItem(STORAGE_KEYS.PROFILES);
    localStorage.removeItem(STORAGE_KEYS.BUSINESSES);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.RISK);
    localStorage.removeItem(STORAGE_KEYS.INVESTIGATIONS);
    localStorage.removeItem(STORAGE_KEYS.REVIEWS);
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
    localStorage.removeItem(STORAGE_KEYS.INVITATIONS);
  },

  // 1. Profiles
  getProfiles: (): Profile[] => getItem(STORAGE_KEYS.PROFILES, initialProfiles),
  saveProfile: (profile: Profile): void => {
    const list = db.getProfiles();
    const idx = list.findIndex((p) => p.id === profile.id);
    if (idx >= 0) list[idx] = profile;
    else list.push(profile);
    setItem(STORAGE_KEYS.PROFILES, list);
  },
  findProfileByEmail: (email: string): Profile | undefined => {
    return db.getProfiles().find((p) => p.email.toLowerCase() === email.toLowerCase());
  },
  findProfileByUsername: (username: string): Profile | undefined => {
    return db.getProfiles().find((p) => p.username?.toLowerCase() === username.toLowerCase());
  },
  findProfileByUsernameOrEmail: (identifier: string): Profile | undefined => {
    const clean = identifier.trim().toLowerCase();
    const syntheticEmail = resolveSyntheticEmail(clean);
    return db.getProfiles().find(
      (p) =>
        p.username?.toLowerCase() === clean ||
        p.email?.toLowerCase() === clean ||
        p.email?.toLowerCase() === syntheticEmail
    );
  },

  // 2. Businesses
  getBusinesses: (): Business[] => getItem(STORAGE_KEYS.BUSINESSES, initialBusinesses),
  getBusinessById: (id: string): Business | undefined => {
    return db.getBusinesses().find((b) => b.id === id);
  },
  getBusinessByUsername: (username: string): Business | undefined => {
    return db.getBusinesses().find((b) => b.business_username?.toLowerCase() === username.toLowerCase());
  },
  saveBusiness: (business: Business): void => {
    const list = db.getBusinesses();
    const idx = list.findIndex((b) => b.id === business.id);
    if (idx >= 0) list[idx] = business;
    else list.push(business);
    setItem(STORAGE_KEYS.BUSINESSES, list);
  },

  // 3. Business Members
  getBusinessMembers: (): BusinessMember[] => getItem(STORAGE_KEYS.MEMBERS, initialBusinessMembers),
  getMembersByBusiness: (businessId: string): BusinessMember[] => {
    return db.getBusinessMembers().filter((m) => m.business_id === businessId);
  },
  getMemberByUserId: (userId: string, businessId?: string): BusinessMember | undefined => {
    return db
      .getBusinessMembers()
      .find((m) => m.user_id === userId && (!businessId || m.business_id === businessId));
  },
  saveBusinessMember: (member: BusinessMember): void => {
    const list = db.getBusinessMembers();
    const idx = list.findIndex((m) => m.id === member.id);
    if (idx >= 0) list[idx] = member;
    else list.push(member);
    setItem(STORAGE_KEYS.MEMBERS, list);
  },

  // 4. Subscriptions
  getSubscriptions: (): Subscription[] => getItem(STORAGE_KEYS.SUBSCRIPTIONS, initialSubscriptions),
  getSubscriptionByBusinessId: (businessId: string): Subscription | undefined => {
    return db.getSubscriptions().find((s) => s.business_id === businessId && s.status === 'active');
  },
  saveSubscription: (subscription: Subscription): void => {
    const list = db.getSubscriptions();
    const idx = list.findIndex((s) => s.id === subscription.id);
    if (idx >= 0) list[idx] = subscription;
    else list.push(subscription);
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, list);

    // Update business subscription_status
    const biz = db.getBusinessById(subscription.business_id);
    if (biz) {
      db.saveBusiness({
        ...biz,
        subscription_status: subscription.status,
      });
    }
  },

  // 5. Customers
  getCustomers: (businessId?: string): Customer[] => {
    const all = getItem(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    if (!businessId) return all;
    return all.filter((c) => c.business_id === businessId);
  },
  getCustomerByUserId: (userId: string): Customer | undefined => {
    return db.getCustomers().find((c) => c.user_id === userId);
  },
  getCustomerById: (customerId: string): Customer | undefined => {
    return db.getCustomers().find((c) => c.id === customerId);
  },
  saveCustomer: (customer: Customer): void => {
    const list = db.getCustomers();
    const idx = list.findIndex((c) => c.id === customer.id);
    if (idx >= 0) list[idx] = customer;
    else list.push(customer);
    setItem(STORAGE_KEYS.CUSTOMERS, list);
  },

  // 6. Transactions
  getTransactions: (businessId?: string, customerId?: string): Transaction[] => {
    const all = getItem(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
    return all.filter((t) => {
      const matchBiz = businessId ? t.business_id === businessId : true;
      const matchCust = customerId ? t.customer_id === customerId : true;
      return matchBiz && matchCust;
    });
  },
  getAllCustomerTransactions: (customerId: string): Transaction[] => {
    const all = getItem(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
    return all.filter((t) => t.customer_id === customerId);
  },
  saveTransaction: (tx: Transaction): void => {
    const list = getItem(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
    list.unshift(tx);
    setItem(STORAGE_KEYS.TRANSACTIONS, list);
  },

  // 7. Risk Assessments
  getRiskAssessments: (businessId?: string): RiskAssessment[] => {
    const all = getItem(STORAGE_KEYS.RISK, initialRiskAssessments);
    if (!businessId) return all;
    return all.filter((r) => r.business_id === businessId);
  },
  saveRiskAssessment: (assessment: RiskAssessment): void => {
    const list = db.getRiskAssessments();
    const idx = list.findIndex((r) => r.id === assessment.id);
    if (idx >= 0) list[idx] = assessment;
    else list.push(assessment);
    setItem(STORAGE_KEYS.RISK, list);
  },

  // 8. Transaction Investigations
  getInvestigations: (businessId?: string): TransactionInvestigation[] => {
    const all = getItem(STORAGE_KEYS.INVESTIGATIONS, initialInvestigations);
    if (!businessId) return all;
    return all.filter((i) => i.business_id === businessId);
  },
  saveInvestigation: (investigation: TransactionInvestigation): void => {
    const list = db.getInvestigations();
    const idx = list.findIndex((i) => i.id === investigation.id);
    if (idx >= 0) list[idx] = investigation;
    else list.push(investigation);
    setItem(STORAGE_KEYS.INVESTIGATIONS, list);
  },

  // 9. Manager Reviews
  getManagerReviews: (businessId?: string): ManagerReview[] => {
    const all = getItem(STORAGE_KEYS.REVIEWS, initialManagerReviews);
    if (!businessId) return all;
    return all.filter((r) => r.business_id === businessId);
  },
  saveManagerReview: (review: ManagerReview): void => {
    const list = db.getManagerReviews();
    const idx = list.findIndex((r) => r.id === review.id);
    if (idx >= 0) list[idx] = review;
    else list.push(review);
    setItem(STORAGE_KEYS.REVIEWS, list);
  },

  // 10. Support Tickets
  getTickets: (businessId?: string): SupportTicket[] => {
    const all = getItem(STORAGE_KEYS.TICKETS, initialSupportTickets);
    if (!businessId) return all;
    return all.filter((t) => t.business_id === businessId);
  },
  saveTicket: (ticket: SupportTicket): void => {
    const list = db.getTickets();
    const idx = list.findIndex((t) => t.id === ticket.id);
    if (idx >= 0) list[idx] = ticket;
    else list.unshift(ticket);
    setItem(STORAGE_KEYS.TICKETS, list);
  },

  // 11. Admin Activity Logs
  getAdminActivity: (businessId?: string): AdminActivity[] => {
    const all = getItem(STORAGE_KEYS.ACTIVITY, initialAdminActivity);
    if (!businessId) return all;
    return all.filter((a) => a.business_id === businessId);
  },
  logAdminActivity: (act: Omit<AdminActivity, 'id' | 'created_at'>): void => {
    const list = db.getAdminActivity();
    const fullLog: AdminActivity = {
      ...act,
      id: 'act_' + Date.now(),
      created_at: new Date().toISOString(),
    };
    list.unshift(fullLog);
    setItem(STORAGE_KEYS.ACTIVITY, list);
  },

  // 12. Business Invitations
  getInvitations: (businessId?: string): BusinessInvitation[] => {
    const all = getItem(STORAGE_KEYS.INVITATIONS, initialInvitations);
    if (!businessId) return all;
    return all.filter((inv) => inv.business_id === businessId);
  },
  saveInvitation: (inv: BusinessInvitation): void => {
    const list = db.getInvitations();
    const idx = list.findIndex((i) => i.id === inv.id);
    if (idx >= 0) list[idx] = inv;
    else list.unshift(inv);
    setItem(STORAGE_KEYS.INVITATIONS, list);
  },

  // 13. Customer Verification Requests (Applicant Onboarding)
  getVerificationRequests: (): CustomerVerificationRequest[] => {
    return getItem(STORAGE_KEYS.VERIFICATION_REQUESTS, []);
  },
  getVerificationRequestByUserId: (userId: string): CustomerVerificationRequest | undefined => {
    const all = db.getVerificationRequests();
    return all.find((r) => r.profile_user_id === userId);
  },
  saveVerificationRequest: (req: CustomerVerificationRequest): void => {
    const list = db.getVerificationRequests();
    const idx = list.findIndex((r) => r.request_id === req.request_id || r.profile_user_id === req.profile_user_id);
    if (idx >= 0) list[idx] = req;
    else list.unshift(req);
    setItem(STORAGE_KEYS.VERIFICATION_REQUESTS, list);
  },
  reviewVerificationRequest: (
    requestId: string,
    decision: 'Approved' | 'Rejected' | 'Under Review',
    reviewerId: string,
    notes?: string
  ): CustomerVerificationRequest | null => {
    const list = db.getVerificationRequests();
    const req = list.find((r) => r.request_id === requestId);
    if (!req) return null;

    req.verification_status = decision;
    req.reviewed_by = reviewerId;
    req.reviewed_at = new Date().toISOString();
    req.updated_at = new Date().toISOString();
    if (notes) req.review_notes = notes;

    setItem(STORAGE_KEYS.VERIFICATION_REQUESTS, list);
    return req;
  },
};
