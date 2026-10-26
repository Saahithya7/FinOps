import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db } from './storage';
import {
  Transaction,
  Customer,
  RiskAssessment,
  TransactionInvestigation,
  ManagerReview,
  SupportTicket,
  AdminActivity,
  CustomerVerificationRequest,
  Profile,
} from '../types';

/**
 * Standard RFC4122 v4 UUID validation & generation utility.
 * Guarantees that any ID passed to PostgreSQL UUID columns satisfies uuid syntax.
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(val?: string | null): boolean {
  return Boolean(val && UUID_REGEX.test(val));
}

export function toValidUuid(val?: string | null): string {
  if (val && UUID_REGEX.test(val)) {
    return val;
  }
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Supabase Data Service — Connects application modules to the 12 Supabase tables:
 * 1. profiles
 * 2. customers
 * 3. transactions
 * 4. fraud_alerts
 * 5. fraud_analysis
 * 6. risk_assessments
 * 7. customer_risk_profiles
 * 8. manager_reviews
 * 9. support_tickets
 * 10. admin_activity_logs
 * 11. organizations
 * 12. memberships
 */

// -----------------------------------------------------------------------------
// DEFAULT FOREIGN KEYS FOR AUTHORITATIVE DATABASE CONSTRAINTS
// -----------------------------------------------------------------------------
export const DEFAULT_SUPABASE_ORG_ID = 'cb5831e7-a0df-4f7b-8800-af49387fb82d';
export const DEFAULT_SUPABASE_CUSTOMER_ID = '8d8ca5cd-b8f3-4ea9-8a90-448aadc67ca0';

// -----------------------------------------------------------------------------
// 1. TRANSACTIONS
// -----------------------------------------------------------------------------
export interface SupabaseTransactionRow {
  transaction_id?: string; // UUID
  transaction_code?: string; // NOT NULL column, e.g. 'TXN-123456'
  organization_id?: string; // UUID
  customer_id?: string; // UUID
  transaction_date?: string;
  transaction_type: string;
  category: string;
  sub_category?: string;
  transaction_amount: number;
  currency?: string;
  payment_method?: string;
  transaction_status?: string; // Check constraint: 'Success' | 'Pending' | 'Failed' | 'Reversed'
  merchant_name?: string;
  channel?: string;
  account_balance_before?: number;
  account_balance_after?: number;
  created_at?: string;
}

export async function fetchSupabaseTransactions(params?: {
  customerId?: string;
  organizationId?: string;
}): Promise<{ data: Transaction[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: [] };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return { data: [] };
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    // Only apply eq filter if it is a valid UUID, preventing Postgres 22P02 syntax error
    if (params?.customerId && isValidUuid(params.customerId)) {
      query = query.eq('customer_id', params.customerId);
    }
    if (params?.organizationId && isValidUuid(params.organizationId)) {
      query = query.eq('organization_id', params.organizationId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase transactions fetch error:', error.message);
      return { data: [], error: error.message };
    }

    const mapped: Transaction[] = (data || []).map((row: any) => ({
      id: row.transaction_id,
      business_id: row.organization_id,
      customer_id: row.customer_id,
      transaction_id: row.transaction_code || row.transaction_id,
      transaction_date: row.transaction_date || new Date().toISOString(),
      transaction_type: row.transaction_type || 'Debit',
      category: row.category || 'Operations',
      sub_category: row.sub_category,
      merchant_name: row.merchant_name || 'Merchant',
      payment_method: row.payment_method || 'UPI',
      transaction_amount: Number(row.transaction_amount) || 0,
      account_balance_before: Number(row.account_balance_before) || 0,
      account_balance_after: Number(row.account_balance_after) || 0,
      transaction_status:
        row.transaction_status === 'Success'
          ? 'Completed'
          : row.transaction_status || 'Completed',
      channel: row.channel || 'UPI App',
      reference_no: row.transaction_code || row.transaction_id,
      created_at: row.created_at,
    }));

    return { data: mapped };
  } catch (err: any) {
    console.error('Error querying Supabase transactions:', err);
    return { data: [], error: err?.message || 'Failed to fetch transactions' };
  }
}

export async function insertSupabaseTransaction(
  tx: SupabaseTransactionRow
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return { success: false, error: 'User is not authenticated. Please log in.' };
    }

    // Resolve valid foreign keys for customer and organization
    const orgId = isValidUuid(tx.organization_id)
      ? tx.organization_id!
      : DEFAULT_SUPABASE_ORG_ID;

    const custId = isValidUuid(tx.customer_id)
      ? tx.customer_id!
      : DEFAULT_SUPABASE_CUSTOMER_ID;

    // Status mapping: PostgreSQL check constraint "transactions_transaction_status_check"
    // Valid values: 'Success', 'Pending', 'Failed', 'Reversed'
    let rawStatus = tx.transaction_status || 'Success';
    let dbStatus = 'Success';
    if (['Success', 'Pending', 'Failed', 'Reversed'].includes(rawStatus)) {
      dbStatus = rawStatus;
    } else if (rawStatus === 'Completed') {
      dbStatus = 'Success';
    }

    // Generate valid UUID transaction_id and NOT-NULL transaction_code
    const txId = toValidUuid(tx.transaction_id);
    const txCode =
      tx.transaction_code ||
      (typeof tx.transaction_id === 'string' && tx.transaction_id.startsWith('TXN')
        ? tx.transaction_id
        : `TXN-${Math.floor(100000 + Math.random() * 900000)}`);

    const payload = {
      transaction_id: txId,
      transaction_code: txCode,
      organization_id: orgId,
      customer_id: custId,
      transaction_date: tx.transaction_date || new Date().toISOString(),
      transaction_type: tx.transaction_type || 'Debit',
      category: tx.category || 'Operations',
      sub_category: tx.sub_category || 'General',
      transaction_amount: Number(tx.transaction_amount) || 0,
      currency: tx.currency || 'INR',
      payment_method: tx.payment_method || 'UPI',
      transaction_status: dbStatus,
      merchant_name: tx.merchant_name || 'Direct Transfer',
      channel: tx.channel || 'UPI App',
      account_balance_before: Number(tx.account_balance_before || 0),
      account_balance_after: Number(tx.account_balance_after || 0),
      created_at: tx.created_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase transaction insert failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Error inserting transaction into Supabase:', err);
    return { success: false, error: err?.message || 'Database insert error' };
  }
}

// -----------------------------------------------------------------------------
// 2. CUSTOMERS
// -----------------------------------------------------------------------------
export interface SupabaseCustomerRow {
  customer_id: string; // UUID
  organization_id: string; // UUID
  customer_name: string;
  account_type: string;
  age?: number;
  gender?: string;
  city?: string;
  created_at?: string;
}

export async function fetchSupabaseCustomers(
  organizationId?: string
): Promise<{ data: Customer[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return { data: [] };

    let query = supabase.from('customers').select('*');
    if (organizationId && isValidUuid(organizationId)) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) {
      return { data: [], error: error.message };
    }

    const mapped: Customer[] = (data || []).map((c: any) => ({
      id: c.customer_id,
      business_id: c.organization_id,
      user_id: sessionData.session.user.id,
      customer_name: c.customer_name,
      customer_reference: c.customer_id,
      age: c.age,
      gender: c.gender,
      city: c.city,
      account_type: c.account_type || 'Individual',
      balance_inr: 482500,
      credit_limit_inr: 100000,
      savings_account_no: `SB-${c.customer_id.slice(-4)}`,
      created_at: c.created_at || new Date().toISOString(),
    }));

    return { data: mapped };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

export async function insertSupabaseCustomer(
  customer: SupabaseCustomerRow
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase unconfigured' };

  try {
    const payload = {
      customer_id: toValidUuid(customer.customer_id),
      organization_id: toValidUuid(customer.organization_id),
      customer_name: customer.customer_name,
      account_type: customer.account_type || 'Individual',
      age: customer.age || 32,
      gender: customer.gender || 'Not Specified',
      city: customer.city || 'Mumbai',
      created_at: customer.created_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// -----------------------------------------------------------------------------
// 3. FRAUD ALERTS & FRAUD ANALYSIS
// -----------------------------------------------------------------------------
export interface SupabaseFraudAlertRow {
  alert_id: string; // UUID
  organization_id: string; // UUID
  transaction_id: string; // UUID
  risk_score: number;
  severity: string;
  status: string;
  reason: string;
  assigned_to: string;
  created_at?: string;
}

export async function fetchSupabaseFraudAlerts(
  organizationId?: string
): Promise<{ data: TransactionInvestigation[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return { data: [] };

    let query = supabase.from('fraud_alerts').select('*').order('created_at', { ascending: false });
    if (organizationId && isValidUuid(organizationId)) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const mapped: TransactionInvestigation[] = (data || []).map((row: any) => ({
      id: row.alert_id,
      business_id: row.organization_id,
      transaction_id: row.transaction_id,
      case_number: row.alert_id,
      risk_score: Number(row.risk_score) || 0,
      investigation_status: (row.status as any) || 'Open',
      severity: (row.severity as any) || 'Medium',
      assigned_to: row.assigned_to || 'Unassigned Analyst',
      investigation_notes: row.reason || '',
      flag_reason: row.reason || 'Automated rule match',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.created_at || new Date().toISOString(),
    }));

    return { data: mapped };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

export async function updateSupabaseFraudAlert(
  alertId: string,
  updates: Partial<SupabaseFraudAlertRow>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase unconfigured' };

  try {
    if (!isValidUuid(alertId)) return { success: false, error: 'Invalid UUID for alert' };

    const { error } = await supabase
      .from('fraud_alerts')
      .update(updates)
      .eq('alert_id', alertId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function fetchSupabaseFraudAnalysis(
  transactionId?: string
): Promise<{ data: any[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    let query = supabase.from('fraud_analysis').select('*');
    if (transactionId && isValidUuid(transactionId)) query = query.eq('transaction_id', transactionId);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data || [] };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

// -----------------------------------------------------------------------------
// 4. RISK ASSESSMENTS & CUSTOMER RISK PROFILES
// -----------------------------------------------------------------------------
export interface SupabaseRiskAssessmentRow {
  assessment_id?: string; // UUID
  organization_id: string; // UUID
  customer_id: string; // UUID
  risk_score: number;
  risk_level?: string;
  status: string;
  assessed_by?: string;
  reason?: string;
  created_at?: string;
}

export async function fetchSupabaseRiskAssessments(
  organizationId?: string
): Promise<{ data: RiskAssessment[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return { data: [] };

    let query = supabase.from('risk_assessments').select('*').order('created_at', { ascending: false });
    if (organizationId && isValidUuid(organizationId)) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const mapped: RiskAssessment[] = (data || []).map((row: any, idx: number) => ({
      id: row.assessment_id || `risk_${row.customer_id}_${idx}`,
      business_id: row.organization_id,
      customer_id: row.customer_id,
      credit_score: Math.min(900, Math.max(300, 750 - Number(row.risk_score || 50) * 4)),
      monthly_income_inr: 85000,
      loan_amount: 500000,
      loan_purpose: row.reason || 'Working Capital',
      debt_to_income_ratio: 28.5,
      employment_status: 'Salaried Professional',
      previous_defaults: Number(row.risk_score) > 75 ? 1 : 0,
      risk_rating:
        (row.risk_level as any) ||
        (Number(row.risk_score) > 80 ? 'Critical' : Number(row.risk_score) > 60 ? 'High' : Number(row.risk_score) > 30 ? 'Moderate' : 'Low'),
      assessment_status: (row.status as any) || 'Under Review',
      assessed_by: row.assessed_by || 'Dr. Vikram Malhotra',
      created_at: row.created_at || new Date().toISOString(),
      notes: row.reason,
    }));

    return { data: mapped };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

export async function insertSupabaseRiskAssessment(
  assessment: SupabaseRiskAssessmentRow
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase unconfigured' };

  try {
    const payload = {
      assessment_id: toValidUuid(assessment.assessment_id),
      organization_id: toValidUuid(assessment.organization_id || DEFAULT_SUPABASE_ORG_ID),
      customer_id: toValidUuid(assessment.customer_id || DEFAULT_SUPABASE_CUSTOMER_ID),
      risk_score: Number(assessment.risk_score) || 50,
      risk_level: assessment.risk_level || (Number(assessment.risk_score) > 75 ? 'High' : 'Moderate'),
      status: assessment.status || 'Under Review',
      assessed_by: assessment.assessed_by || 'Dr. Vikram Malhotra',
      reason: assessment.reason || 'Credit Underwriting Evaluation',
      created_at: assessment.created_at || new Date().toISOString(),
    };

    const { data, error } = await supabase.from('risk_assessments').insert(payload).select().maybeSingle();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateSupabaseRiskAssessment(
  assessmentId: string,
  updates: Partial<SupabaseRiskAssessmentRow>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase unconfigured' };

  try {
    if (!isValidUuid(assessmentId)) return { success: false, error: 'Invalid UUID for assessment' };

    const { error } = await supabase
      .from('risk_assessments')
      .update(updates)
      .eq('assessment_id', assessmentId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function fetchSupabaseCustomerRiskProfiles(
  customerId?: string
): Promise<{ data: any[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    let query = supabase.from('customer_risk_profiles').select('*');
    if (customerId && isValidUuid(customerId)) query = query.eq('customer_id', customerId);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data || [] };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

// -----------------------------------------------------------------------------
// 5. MANAGER REVIEWS
// -----------------------------------------------------------------------------
export interface SupabaseManagerReviewRow {
  organization_id: string; // UUID
  customer_id: string; // UUID
  risk_score: number;
  case_type: string;
  review_status: string;
  priority: string;
  created_at?: string;
}

export async function fetchSupabaseManagerReviews(
  organizationId?: string
): Promise<{ data: ManagerReview[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    let query = supabase.from('manager_reviews').select('*').order('created_at', { ascending: false });
    if (organizationId && isValidUuid(organizationId)) query = query.eq('organization_id', organizationId);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const mapped: ManagerReview[] = (data || []).map((row: any, idx: number) => ({
      id: `rev_${row.customer_id}_${idx}`,
      business_id: row.organization_id,
      case_reference: `CASE-${row.customer_id}`,
      case_type: (row.case_type as any) || 'High Risk Loan',
      assigned_manager: 'Sunita Menon',
      review_status: (row.review_status as any) || 'Pending',
      decision: '',
      review_notes: `Escalated case for customer ${row.customer_id} with risk score ${row.risk_score}`,
      escalated_by: 'Risk Analytics Engine',
      priority: (row.priority as any) || 'Standard',
      created_at: row.created_at || new Date().toISOString(),
    }));

    return { data: mapped };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

// -----------------------------------------------------------------------------
// 6. SUPPORT TICKETS
// -----------------------------------------------------------------------------
export interface SupabaseSupportTicketRow {
  ticket_id?: string; // UUID
  organization_id: string; // UUID
  customer_id: string; // UUID
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  channel?: string;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export async function fetchSupabaseSupportTickets(
  params?: { organizationId?: string; customerId?: string } | string
): Promise<{ data: SupportTicket[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    let query = supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    
    if (typeof params === 'string') {
      if (isValidUuid(params)) {
        query = query.eq('organization_id', params);
      }
    } else if (params) {
      if (params.organizationId && isValidUuid(params.organizationId)) {
        query = query.eq('organization_id', params.organizationId);
      }
      if (params.customerId && isValidUuid(params.customerId)) {
        query = query.eq('customer_id', params.customerId);
      }
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const mapped: SupportTicket[] = (data || []).map((row: any, idx: number) => ({
      id: row.ticket_id || `tkt_${idx + 1}`,
      business_id: row.organization_id,
      customer_id: row.customer_id,
      customer_name: row.customer_id ? `Customer (${row.customer_id.slice(0, 8)})` : 'Valued Customer',
      assigned_agent: row.assigned_to || 'Unassigned Agent',
      subject: row.subject || 'General Inquiry',
      priority: (row.priority as any) || 'Medium',
      status: (row.status as any) || 'Open',
      category: (row.category as any) || 'Disputed Transaction',
      resolution_notes: row.description || '',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
      conversation: [
        {
          sender: 'Customer',
          role: 'customer',
          message: row.description || 'Customer opened this dispute ticket.',
          timestamp: row.created_at || new Date().toISOString(),
        },
      ],
    }));

    return { data: mapped };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

export async function insertSupabaseSupportTicket(
  ticket: SupabaseSupportTicketRow
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase unconfigured' };

  try {
    const payload = {
      ticket_id: toValidUuid(ticket.ticket_id),
      organization_id: toValidUuid(ticket.organization_id || DEFAULT_SUPABASE_ORG_ID),
      customer_id: toValidUuid(ticket.customer_id || DEFAULT_SUPABASE_CUSTOMER_ID),
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category || 'Disputed Transaction',
      priority: ticket.priority || 'Medium',
      status: ticket.status || 'Open',
      channel: ticket.channel || 'Customer Portal',
      assigned_to: ticket.assigned_to || 'Support Desk',
      created_at: ticket.created_at || new Date().toISOString(),
      updated_at: ticket.updated_at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('support_tickets')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function updateSupabaseSupportTicket(
  ticketId: string,
  updates: Partial<SupabaseSupportTicketRow>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase unconfigured' };

  try {
    if (!isValidUuid(ticketId)) return { success: false, error: 'Invalid UUID for ticket' };

    const { error } = await supabase
      .from('support_tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('ticket_id', ticketId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// -----------------------------------------------------------------------------
// 7. ADMIN ACTIVITY LOGS
// -----------------------------------------------------------------------------
export interface SupabaseAdminActivityLogRow {
  user_id: string; // UUID
  organization_id: string; // UUID
  action: string;
  details: string;
  ip_address?: string;
  created_at?: string;
}

export async function fetchSupabaseAdminActivityLogs(
  organizationId?: string
): Promise<{ data: AdminActivity[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    let query = supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false });
    if (organizationId && isValidUuid(organizationId)) query = query.eq('organization_id', organizationId);

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };

    const mapped: AdminActivity[] = (data || []).map((row: any, idx: number) => ({
      id: `act_${idx + 1}`,
      business_id: row.organization_id,
      admin_user_id: row.user_id,
      admin_name: 'Administrator',
      action: row.action,
      target_reference: row.details || 'System',
      ip_address: row.ip_address,
      created_at: row.created_at || new Date().toISOString(),
    }));

    return { data: mapped };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

export async function insertSupabaseAdminActivityLog(
  log: SupabaseAdminActivityLogRow
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false };

  try {
    const { error } = await supabase.from('admin_activity_logs').insert({
      log_id: toValidUuid(),
      user_id: toValidUuid(log.user_id),
      organization_id: toValidUuid(log.organization_id),
      action: log.action,
      details: log.details,
      ip_address: log.ip_address || '127.0.0.1',
      created_at: log.created_at || new Date().toISOString(),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// -----------------------------------------------------------------------------
// 8. ORGANIZATIONS & MEMBERSHIPS
// -----------------------------------------------------------------------------
export interface SupabaseOrganizationRow {
  organization_id: string; // UUID
  organization_name: string;
  created_at?: string;
}

export interface SupabaseMembershipRow {
  user_id: string; // UUID
  organization_id: string; // UUID
  role: string;
  created_at?: string;
}

export async function fetchSupabaseOrganizations(): Promise<{ data: SupabaseOrganizationRow[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    const { data, error } = await supabase.from('organizations').select('*');
    if (error) return { data: [], error: error.message };
    return { data: data || [] };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

export async function fetchSupabaseMemberships(params?: {
  organizationId?: string;
  userId?: string;
}): Promise<{ data: SupabaseMembershipRow[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { data: [] };

  try {
    let query = supabase.from('memberships').select('*');
    if (params?.organizationId && isValidUuid(params.organizationId)) {
      query = query.eq('organization_id', params.organizationId);
    }
    if (params?.userId && isValidUuid(params.userId)) {
      query = query.eq('user_id', params.userId);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: error.message };
    return { data: data || [] };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

export async function insertSupabaseOrganization(
  org: { organization_id?: string; organization_name: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase unconfigured' };

  try {
    const payload = {
      organization_id: toValidUuid(org.organization_id),
      organization_name: org.organization_name,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('organizations').insert(payload).select().maybeSingle();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

export async function insertSupabaseMembership(
  membership: { user_id: string; organization_id: string; role: string }
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase unconfigured' };

  try {
    const payload = {
      user_id: toValidUuid(membership.user_id),
      organization_id: toValidUuid(membership.organization_id),
      role: membership.role,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('memberships').insert(payload).select().maybeSingle();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// -----------------------------------------------------------------------------
// 9. PROFILES & ROLE MANAGEMENT
// -----------------------------------------------------------------------------
export interface SupabaseProfileRow {
  user_id: string; // UUID
  full_name: string;
  email: string;
  role?: string;
  account_status?: 'Pending' | 'Active' | 'Rejected';
  created_at?: string;
}

export async function fetchSupabaseProfiles(): Promise<{ data: SupabaseProfileRow[]; error?: string }> {
  let supabaseProfiles: SupabaseProfileRow[] = [];
  let fetchError: string | undefined = undefined;

  // 1. Try server API endpoint (/api/admin/users) if authenticated session exists
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        try {
          const apiRes = await fetch('/api/admin/users', {
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
          });
          if (apiRes.ok) {
            const json = await apiRes.json();
            if (json.success && Array.isArray(json.data)) {
              supabaseProfiles = json.data as SupabaseProfileRow[];
            }
          }
        } catch {
          // Fall back to direct query
        }
      }

      // 2. Direct Supabase query fallback if server route didn't return profiles
      if (supabaseProfiles.length === 0) {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, role, account_status, created_at')
          .order('created_at', { ascending: false });

        if (error) {
          if (error.code === '42703') {
            const fallback = await supabase
              .from('profiles')
              .select('user_id, full_name, email, created_at')
              .order('created_at', { ascending: false });
            if (!fallback.error && fallback.data) {
              supabaseProfiles = fallback.data as SupabaseProfileRow[];
            }
          } else {
            fetchError = error.message;
          }
        } else if (data) {
          supabaseProfiles = data as SupabaseProfileRow[];
        }
      }
    } catch (err: any) {
      fetchError = err?.message;
    }
  }

  // Merge with local profiles to guarantee a unified directory across RLS boundaries
  const localProfiles = db.getProfiles();
  const mergedMap = new Map<string, SupabaseProfileRow>();

  // Add local profiles
  localProfiles.forEach((p: Profile) => {
    const key = (p.id || p.user_id || p.email).toLowerCase();
    mergedMap.set(key, {
      user_id: p.id || p.user_id || '',
      full_name: p.full_name,
      email: p.email,
      role: p.role,
      account_status: (p.account_status as any) || (p.role === 'Applicant' ? 'Pending' : 'Active'),
      created_at: p.created_at,
    });
  });

  // Supabase profiles overwrite local profiles (authoritative remote record)
  supabaseProfiles.forEach((sp) => {
    const keyByUserId = sp.user_id?.toLowerCase();
    const keyByEmail = sp.email?.toLowerCase();
    if (keyByUserId) mergedMap.set(keyByUserId, sp);
    if (keyByEmail) mergedMap.set(keyByEmail, sp);
  });

  const allProfiles = Array.from(new Set(mergedMap.values())).sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });

  return { data: allProfiles, error: fetchError };
}

export async function fetchSupabaseProfile(
  userId: string
): Promise<{ data?: SupabaseProfileRow; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return {};

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, role, account_status, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === '42703') {
        const fallback = await supabase
          .from('profiles')
          .select('user_id, full_name, email, created_at')
          .eq('user_id', userId)
          .maybeSingle();
        return { data: fallback.data || undefined };
      }
      return { error: error.message };
    }

    return { data: data || undefined };
  } catch (err: any) {
    return { error: err?.message };
  }
}

export async function updateCustomerAccountStatus(
  targetUserId: string,
  newStatus: 'Pending' | 'Active' | 'Rejected',
  targetName?: string,
  targetEmail?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase client is not configured' };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return { success: false, error: 'Administrator authentication required.' };
    }

    // Verify caller has Admin role in authoritative profiles table
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', sessionData.session.user.id)
      .maybeSingle();

    if (callerProfile?.role && callerProfile.role !== 'Admin') {
      return {
        success: false,
        error: 'Unauthorized: Only platform Administrators are permitted to approve or reject customer accounts.',
      };
    }

    // 1. First, attempt secure server-side endpoint (/api/admin/approve-customer)
    try {
      const serverRes = await fetch('/api/admin/approve-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          targetUserId,
          newStatus,
          targetName,
          targetEmail,
        }),
      });

      const serverJson = await serverRes.json().catch(() => null);
      if (serverRes.ok && serverJson?.success) {
        syncLocalCustomerStatus(targetUserId, newStatus, targetName, targetEmail, sessionData.session.user.id);
        return { success: true };
      } else if (serverJson?.error) {
        return { success: false, error: serverJson.error };
      }
    } catch {
      // Server endpoint not reachable directly; proceed to direct client RPC / query
    }

    // 2. Try secure RPC function (admin_update_customer_status)
    const rpcRes = await supabase.rpc('admin_update_customer_status', {
      target_user_id: targetUserId,
      new_status: newStatus,
    });

    if (!rpcRes.error) {
      syncLocalCustomerStatus(targetUserId, newStatus, targetName, targetEmail, sessionData.session.user.id);
      return { success: true };
    }

    // 3. Direct update on public.profiles.account_status with select verification
    const { data: updatedRows, error: updateErr } = await supabase
      .from('profiles')
      .update({ account_status: newStatus })
      .eq('user_id', targetUserId)
      .select('user_id, account_status');

    if (updateErr && updateErr.code !== '42703') {
      return { success: false, error: updateErr.message };
    }

    // Under PostgreSQL Row-Level Security, 0 rows updated means RLS policy prevented update
    if (!updatedRows || updatedRows.length === 0) {
      return {
        success: false,
        error:
          'Database RLS restriction: 0 rows updated in Supabase public.profiles. Under PostgreSQL Row-Level Security, an administrator cannot update another user\'s profile without the admin RLS policy or admin RPC function executed in Supabase (see src/db/admin_approval_and_roles_migration.sql) or SUPABASE_SERVICE_ROLE_KEY configured on the server.',
      };
    }

    // 4. Resolve organization safely without hardcoding
    let orgId = DEFAULT_SUPABASE_ORG_ID;
    try {
      const { data: orgs } = await supabase.from('organizations').select('organization_id').limit(1);
      if (orgs && orgs[0]?.organization_id) {
        orgId = orgs[0].organization_id;
      }
    } catch {
      // Fallback
    }

    // 5. Synchronize customer record in public.customers
    if (newStatus === 'Active') {
      try {
        const { data: existingCust } = await supabase
          .from('customers')
          .select('customer_id')
          .eq('profile_id', targetUserId)
          .maybeSingle();

        if (existingCust?.customer_id) {
          await supabase
            .from('customers')
            .update({ customer_status: 'Active' })
            .eq('customer_id', existingCust.customer_id);
        } else {
          await supabase.from('customers').insert({
            customer_id: toValidUuid(),
            customer_code: 'CUST-' + targetUserId.slice(0, 8).toUpperCase(),
            customer_name: targetName || 'Verified Customer',
            organization_id: orgId,
            account_type: 'Individual',
            city: 'Mumbai',
            gender: 'Not Specified',
            customer_status: 'Active',
            profile_id: targetUserId,
            created_at: new Date().toISOString(),
          });
        }
      } catch (custErr) {
        console.warn('Notice synchronizing customers table:', custErr);
      }
    } else if (newStatus === 'Rejected') {
      try {
        await supabase
          .from('customers')
          .update({ customer_status: 'Rejected' })
          .eq('profile_id', targetUserId);
      } catch {
        // Non-fatal
      }
    }

    // 6. Synchronize customer_verification_requests table if present
    try {
      const vStatus = newStatus === 'Active' ? 'Approved' : newStatus === 'Rejected' ? 'Rejected' : 'Pending';
      await supabase
        .from('customer_verification_requests')
        .update({
          verification_status: vStatus,
          reviewed_by: sessionData.session.user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('profile_user_id', targetUserId);
    } catch {
      // Non-fatal
    }

    // 7. Record in public.admin_activity_logs
    try {
      await supabase.from('admin_activity_logs').insert({
        log_id: toValidUuid(),
        user_id: sessionData.session.user.id,
        organization_id: orgId,
        action: 'Update Account Status',
        details: `Updated account status of ${targetName || targetEmail || targetUserId} to ${newStatus}`,
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      });
    } catch {
      // Activity log non-fatal
    }

    // 8. Synchronize local storage only after verified database success
    syncLocalCustomerStatus(targetUserId, newStatus, targetName, targetEmail, sessionData.session.user.id, orgId);

    return { success: true };
  } catch (err: any) {
    console.error('Error updating customer status:', err);
    return { success: false, error: err?.message || 'Failed to update customer status' };
  }
}

function syncLocalCustomerStatus(
  targetUserId: string,
  newStatus: 'Pending' | 'Active' | 'Rejected',
  targetName?: string,
  targetEmail?: string,
  adminUserId?: string,
  orgId?: string
) {
  try {
    const profiles = db.getProfiles();
    const p = profiles.find((prof: Profile) => prof.id === targetUserId || prof.user_id === targetUserId || prof.email === targetEmail);
    if (p) {
      p.account_status = newStatus;
      if (newStatus === 'Active' && p.role === 'Applicant') {
        p.role = 'Customer';
      }
      db.saveProfile(p);
    }

    const vReq = db.getVerificationRequestByUserId(targetUserId);
    if (vReq) {
      vReq.verification_status = newStatus === 'Active' ? 'Approved' : newStatus === 'Rejected' ? 'Rejected' : 'Pending';
      vReq.updated_at = new Date().toISOString();
      db.saveVerificationRequest(vReq);
    }

    db.logAdminActivity({
      business_id: orgId || 'biz_abc_01',
      admin_user_id: adminUserId || 'admin',
      admin_name: 'Rajesh Sharma (Admin)',
      action: 'Update Customer Status',
      target_reference: `${targetName || targetEmail || targetUserId} (${newStatus})`,
    });
  } catch {
    // Non-fatal
  }
}

export async function changeUserRole(
  targetUserId: string,
  newRole: string,
  targetEmail?: string,
  targetName?: string,
  previousRole?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase client is not configured' };
  }

  const ALLOWED_ROLES = [
    'Customer',
    'Admin',
    'Manager',
    'Risk Analyst',
    'Fraud & Compliance Analyst',
    'Support Agent',
  ];

  if (!ALLOWED_ROLES.includes(newRole)) {
    return {
      success: false,
      error: `Invalid role '${newRole}'. Allowed roles are: ${ALLOWED_ROLES.join(', ')}`,
    };
  }

  // Protect primary administrator account from demotion
  if (
    (targetEmail === 'admin@abcfinance.com' || targetUserId === 'e2ff607e-69ad-4027-bd00-69afb0516396') &&
    newRole !== 'Admin'
  ) {
    return {
      success: false,
      error: 'Security Policy: Cannot demote the primary administrator account (admin@abcfinance.com). The platform requires at least one active Admin account.',
    };
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      return { success: false, error: 'Administrator authentication required.' };
    }

    // Prevent self-role modification
    if (sessionData.session.user.id === targetUserId) {
      return {
        success: false,
        error: 'Security Policy: You cannot modify your own role through this interface.',
      };
    }

    // Verify caller has Admin role in authoritative profiles table
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', sessionData.session.user.id)
      .maybeSingle();

    if (callerProfile?.role && callerProfile.role !== 'Admin') {
      return {
        success: false,
        error: 'Unauthorized: Only platform Administrators are permitted to change user roles.',
      };
    }

    // 1. First, attempt secure server-side endpoint (/api/admin/change-role)
    try {
      const serverRes = await fetch('/api/admin/change-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          targetUserId,
          newRole,
          targetEmail,
          targetName,
          previousRole,
        }),
      });

      const serverJson = await serverRes.json().catch(() => null);
      if (serverRes.ok && serverJson?.success) {
        syncLocalRoleChange(targetUserId, newRole, targetEmail, targetName, previousRole, sessionData.session.user.id);
        return { success: true };
      } else if (serverJson?.error) {
        return { success: false, error: serverJson.error };
      }
    } catch {
      // Server endpoint not reachable directly; proceed to direct client RPC / query
    }

    // 2. Try secure RPC function (admin_change_user_role or change_user_role)
    const rpcRes = await supabase.rpc('admin_change_user_role', {
      target_user_id: targetUserId,
      new_role: newRole,
    });

    if (!rpcRes.error) {
      syncLocalRoleChange(targetUserId, newRole, targetEmail, targetName, previousRole, sessionData.session.user.id);
      return { success: true };
    }

    // Fallback RPC name
    const rpcResFallback = await supabase.rpc('change_user_role', {
      target_user_id: targetUserId,
      new_role: newRole,
    });

    if (!rpcResFallback.error) {
      syncLocalRoleChange(targetUserId, newRole, targetEmail, targetName, previousRole, sessionData.session.user.id);
      return { success: true };
    }

    // 3. Authoritative direct update on profiles with select verification
    const { data: updatedRows, error: updateErr } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('user_id', targetUserId)
      .select('user_id, role');

    if (updateErr && updateErr.code !== '42703') {
      return { success: false, error: updateErr.message };
    }

    // Under PostgreSQL Row-Level Security, 0 rows updated means RLS policy prevented update
    if (!updatedRows || updatedRows.length === 0) {
      return {
        success: false,
        error:
          'Database RLS restriction: 0 rows updated in Supabase public.profiles. Under PostgreSQL Row-Level Security, an administrator cannot update another user\'s role without the admin RLS policy or admin RPC function executed in Supabase (see src/db/admin_approval_and_roles_migration.sql) or SUPABASE_SERVICE_ROLE_KEY configured on the server.',
      };
    }

    // Resolve organization dynamically without hardcoded dependency
    let orgId = DEFAULT_SUPABASE_ORG_ID;
    try {
      const { data: orgs } = await supabase.from('organizations').select('organization_id').limit(1);
      if (orgs && orgs[0]?.organization_id) {
        orgId = orgs[0].organization_id;
      }
    } catch {
      // Fallback
    }

    // 4. Record role change in admin_activity_logs
    try {
      await supabase.from('admin_activity_logs').insert({
        log_id: toValidUuid(),
        user_id: sessionData.session.user.id,
        organization_id: orgId,
        action: 'Update Role',
        details: `Changed role of ${targetName || targetEmail || targetUserId} from ${previousRole || 'Current Role'} to ${newRole}`,
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      });
    } catch {
      // Activity log non-fatal
    }

    // 5. Synchronize local storage only after verified database success
    syncLocalRoleChange(targetUserId, newRole, targetEmail, targetName, previousRole, sessionData.session.user.id, orgId);

    return { success: true };
  } catch (err: any) {
    console.error('Error changing user role:', err);
    return { success: false, error: err?.message || 'Failed to update user role' };
  }
}

function syncLocalRoleChange(
  targetUserId: string,
  newRole: string,
  targetEmail?: string,
  targetName?: string,
  previousRole?: string,
  adminUserId?: string,
  orgId?: string
) {
  try {
    const profiles = db.getProfiles();
    const p = profiles.find((prof: Profile) => prof.id === targetUserId || prof.user_id === targetUserId || prof.email === targetEmail);
    if (p) {
      p.role = newRole as any;
      p.account_type = newRole === 'Customer' || newRole === 'Applicant' ? 'customer' : 'business';
      db.saveProfile(p);
    }

    db.logAdminActivity({
      business_id: orgId || 'biz_abc_01',
      admin_user_id: adminUserId || 'admin',
      admin_name: 'Rajesh Sharma (Admin)',
      action: 'Update Role',
      target_reference: `${targetName || targetEmail || targetUserId}: ${previousRole || 'Current'} → ${newRole}`,
    });
  } catch {
    // Non-fatal
  }
}

// -----------------------------------------------------------------------------
// 10. CUSTOMER VERIFICATION REQUESTS
// -----------------------------------------------------------------------------
export async function fetchSupabaseVerificationRequests(
  statusFilter?: string
): Promise<{ data: CustomerVerificationRequest[]; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: [] };
  }

  try {
    let query = supabase
      .from('customer_verification_requests')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('verification_status', statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data || []) as CustomerVerificationRequest[] };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

export async function fetchSupabaseVerificationRequestByUserId(
  userId: string
): Promise<{ data: CustomerVerificationRequest | null; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { data: null };
  }

  try {
    const { data, error } = await supabase
      .from('customer_verification_requests')
      .select('*')
      .eq('profile_user_id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CustomerVerificationRequest | null };
  } catch (err: any) {
    return { data: null, error: err?.message };
  }
}

export async function reviewSupabaseCustomerVerification(
  requestId: string,
  decision: 'Approved' | 'Rejected' | 'Under Review',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Database unconfigured' };
  }

  try {
    // 1. Try secure RPC function review_customer_verification
    const { error: rpcErr } = await supabase.rpc('review_customer_verification', {
      p_request_id: requestId,
      p_decision: decision,
      p_notes: notes || null,
    });

    if (!rpcErr) {
      return { success: true };
    }

    // 2. Direct fallback update
    const { data: sessionData } = await supabase.auth.getSession();
    const reviewerId = sessionData?.session?.user?.id;

    const { error: updateErr } = await supabase
      .from('customer_verification_requests')
      .update({
        verification_status: decision,
        reviewed_by: reviewerId || null,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('request_id', requestId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Review failed' };
  }
}

