export type UserRole =
  | 'Applicant'
  | 'Customer'
  | 'Risk Analyst'
  | 'Fraud & Compliance Analyst'
  | 'Manager'
  | 'Support Agent'
  | 'Admin';

export type CustomerAccountStatus = 'Pending' | 'Active' | 'Rejected';

export type AccountType = 'customer' | 'business';

export type SubscriptionPlan = 'Starter' | 'Professional' | 'Enterprise';
export type BillingPeriod = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'trial' | 'pending' | 'cancelled' | 'expired';

export interface Profile {
  id: string;
  user_id?: string;
  username: string; // unique display username
  full_name: string;
  email: string;
  phone: string;
  account_type: AccountType;
  role?: UserRole;
  account_status?: CustomerAccountStatus;
  created_at: string;
  updated_at?: string;
}

export interface Business {
  id: string;
  business_name: string;
  business_username: string; // unique organization identifier e.g. "abc_admin"
  business_email: string;
  phone?: string;
  contact_person?: string;
  status: 'active' | 'suspended' | 'pending';
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at?: string;
  gstin?: string;
  cin?: string;
  address?: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  status: 'active' | 'inactive';
  invitation_status: 'accepted' | 'pending' | 'revoked';
  created_at: string;
  profile?: Profile;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_name: SubscriptionPlan;
  billing_period: BillingPeriod;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  payment_reference: string;
  amount_inr: number;
  created_at?: string;
}

export interface Customer {
  id: string;
  customer_id?: string;
  business_id: string;
  organization_id?: string;
  user_id: string | null;
  profile_id?: string;
  customer_name: string;
  customer_reference: string;
  customer_code?: string;
  age?: number;
  gender?: string;
  city?: string;
  account_type: 'Individual' | 'Corporate' | 'Priority' | 'NRI';
  customer_status?: string;
  email?: string;
  phone?: string;
  balance_inr: number;
  credit_limit_inr: number;
  savings_account_no?: string;
  created_at: string;
}

export type TransactionType = 'Credit' | 'Debit' | 'Transfer' | 'UPI' | 'NEFT' | 'RTGS' | 'IMPS';
export type TransactionCategory =
  | 'Vendor Payout'
  | 'Salary & Payroll'
  | 'Operations'
  | 'Marketing'
  | 'Software & SaaS'
  | 'Utilities'
  | 'Loan Disbursement'
  | 'Customer Deposit'
  | 'Shopping & Retail'
  | 'Travel & Dining'
  | 'Investment';

export type TransactionStatus = 'Completed' | 'Pending' | 'Flagged' | 'Rejected' | 'Reversed' | 'Failed' | 'Success';

export interface Transaction {
  id: string;
  business_id: string;
  customer_id: string;
  transaction_id: string; // unique reference
  transaction_date: string;
  transaction_type: TransactionType;
  category: TransactionCategory;
  sub_category?: string;
  merchant?: string;
  merchant_name?: string;
  payment_method: string;
  transaction_amount: number; // in INR
  account_balance_before?: number;
  account_balance_after?: number;
  transaction_status: TransactionStatus;
  channel?: 'Mobile App' | 'NetBanking' | 'POS' | 'ATM' | 'Corporate Rails' | 'UPI App';
  is_weekend?: boolean;
  transaction_month?: string;
  description?: string;
  reference_no: string;
  created_at?: string;
}

export type RiskRating = 'Low' | 'Moderate' | 'High' | 'Critical';
export type AssessmentStatus = 'Under Review' | 'Approved' | 'Conditional' | 'Rejected';

export interface RiskAssessment {
  id: string;
  business_id: string;
  customer_id: string;
  customer_name?: string;
  credit_score: number; // 300 - 900 (CIBIL standard)
  income?: number;
  monthly_income_inr: number;
  loan_amount: number; // in INR
  loan_purpose: string;
  debt_to_income_ratio: number; // percentage (e.g. 28.5)
  employment_status: string;
  previous_defaults: number;
  risk_rating: RiskRating;
  assessment_status: AssessmentStatus;
  education_level?: string;
  age_group?: string;
  existing_liabilities_inr?: number;
  collateral_value_inr?: number;
  assessed_by?: string;
  created_at: string;
  notes?: string;
}

export type InvestigationStatus =
  | 'Open'
  | 'Under Investigation'
  | 'Escalated to Manager'
  | 'Escalated'
  | 'Confirmed Fraud'
  | 'Cleared'
  | 'Resolved';

export interface TransactionInvestigation {
  id: string;
  business_id: string;
  transaction_id: string;
  case_number: string;
  risk_score: number; // 0 to 100
  investigation_status: InvestigationStatus;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  assigned_to: string; // Analyst name or user_id
  investigation_notes: string;
  flag_reason: string;
  device_ip?: string;
  location?: string;
  channel?: string;
  created_at: string;
  updated_at: string;
}

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected' | 'Needs Information';

export interface ManagerReview {
  id: string;
  business_id: string;
  case_reference: string;
  case_type: 'High Risk Loan' | 'Fraud Escaped' | 'Credit Limit Exception' | 'Policy Waiver';
  assigned_manager: string;
  review_status: ReviewStatus;
  decision: string;
  review_notes: string;
  requested_amount_inr?: number;
  escalated_by: string;
  priority: 'High' | 'Urgent' | 'Standard';
  created_at: string;
  updated_at?: string;
}

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Open' | 'In Progress' | 'Waiting on Customer' | 'Resolved' | 'Closed';

export interface SupportTicket {
  id: string;
  business_id: string;
  customer_id: string;
  customer_name?: string;
  assigned_agent: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: 'Disputed Transaction' | 'Account Access' | 'KYC Verification' | 'UPI Failure' | 'Billing';
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  conversation?: Array<{
    sender: string;
    role: 'customer' | 'agent';
    message: string;
    timestamp: string;
  }>;
}

export interface AdminActivity {
  id: string;
  business_id: string;
  admin_user_id: string;
  admin_name: string;
  action: string;
  target_reference: string;
  ip_address?: string;
  created_at: string;
}

export interface BusinessInvitation {
  id: string;
  business_id: string;
  username: string; // or invitation email
  email: string;
  assigned_role: UserRole;
  token_hash: string;
  expires_at: string;
  accepted_at: string | null;
  status: 'pending' | 'accepted' | 'expired';
  invited_by: string;
  created_at?: string;
}

export interface CustomerVerificationRequest {
  request_id: string;
  profile_user_id: string;
  organization_id?: string;
  verification_status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
  submitted_at: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface AuthSession {
  user: Profile;
  accountType: AccountType;
  business?: Business;
  member?: BusinessMember;
  subscription?: Subscription;
  customerRecord?: Customer;
}

export type WidgetCategory = 'kpi' | 'chart' | 'table' | 'feed' | 'tool';

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  description: string;
  category: WidgetCategory;
  enabled: boolean;
  order: number;
  width?: 'full' | 'half' | 'third';
  chartType?: 'area' | 'bar' | 'line' | 'donut';
}

export interface RoleDashboardLayout {
  role: UserRole;
  userId: string;
  widgets: DashboardWidgetConfig[];
  updatedAt: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: string[];
  suggestedActions?: string[];
}

