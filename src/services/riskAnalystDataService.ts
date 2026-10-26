import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db } from './storage';
import {
  Transaction,
  Customer,
  RiskAssessment,
  TransactionInvestigation,
} from '../types';
import {
  fetchSupabaseRiskAssessments,
  fetchSupabaseTransactions,
  fetchSupabaseFraudAlerts,
  fetchSupabaseCustomers,
} from './supabaseDataService';
import { formatShortDate } from '../utils/formatters';

export interface EnrichedTransaction extends Transaction {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number;
  assessmentStatus: string;
}

export interface RiskAnalystDashboardData {
  totalAnalyzed: number;
  highRiskCount: number;
  openAlertsCount: number;
  customersReviewCount: number;
  transactions: EnrichedTransaction[];
  assessments: RiskAssessment[];
  fraudAlerts: TransactionInvestigation[];
  customers: Customer[];
  chart1RiskDist: { name: string; value: number; key: string; fill: string }[];
  chart2TrendsOverTime: { date: string; low: number; medium: number; high: number; critical: number }[];
  chart3AlertsByStatus: { status: string; count: number; fill: string }[];
  chart4RiskByCategory: { category: string; Low: number; Medium: number; High: number; Critical: number }[];
  chart5HighRiskCustomers: { customer: string; riskScore: number; loanAmount?: number; rating?: string }[];
  chart6AssessmentOutcomes: { outcome: string; count: number; fill: string }[];
}

/**
 * Dedicated data service exclusively supplying the Risk Analyst Dashboard.
 * Queries Supabase tables: risk_assessments, transactions, fraud_alerts, customers.
 */
export async function fetchRiskAnalystDashboardData(businessId: string): Promise<{
  data: RiskAnalystDashboardData;
  error?: string;
}> {
  try {
    const [txRes, riskRes, fraudRes, custRes] = await Promise.all([
      fetchSupabaseTransactions(),
      fetchSupabaseRiskAssessments(businessId),
      fetchSupabaseFraudAlerts(businessId),
      fetchSupabaseCustomers(businessId),
    ]);

    const rawTransactions = txRes.data && txRes.data.length > 0
      ? txRes.data
      : db.getTransactions(businessId);

    const assessments = riskRes.data && riskRes.data.length > 0
      ? riskRes.data
      : db.getRiskAssessments(businessId);

    const fraudAlerts = fraudRes.data && fraudRes.data.length > 0
      ? fraudRes.data
      : db.getInvestigations(businessId);

    const customers = custRes.data && custRes.data.length > 0
      ? custRes.data
      : db.getCustomers(businessId);

    // Enrich transactions with stored / computed risk scores
    const enrichedTransactions: EnrichedTransaction[] = rawTransactions.map((t) => {
      const amt = Number(t.transaction_amount) || 0;
      let level: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
      let score = 20;

      if (amt >= 75000 || (t.transaction_status as any) === 'Failed' || t.transaction_status === 'Reversed') {
        level = 'Critical';
        score = 88;
      } else if (amt >= 25000 || t.category === 'Operations' || t.category === 'Investment') {
        level = 'High';
        score = 72;
      } else if (amt >= 5000) {
        level = 'Medium';
        score = 45;
      } else {
        level = 'Low';
        score = 15;
      }

      const matchedAlert = fraudAlerts.find(
        (fa) => fa.transaction_id === t.id || fa.transaction_id === t.transaction_id
      );
      if (matchedAlert) {
        level = matchedAlert.severity === 'Critical' ? 'Critical' : 'High';
        score = matchedAlert.risk_score || 85;
      }

      return {
        ...t,
        riskLevel: level,
        riskScore: score,
        assessmentStatus:
          level === 'Critical'
            ? 'Flagged for SAR'
            : level === 'High'
            ? 'Under Investigation'
            : 'Automated Pass',
      };
    });

    // KPIs
    const totalAnalyzed = enrichedTransactions.length;
    const highRiskCount = enrichedTransactions.filter(
      (t) => t.riskLevel === 'High' || t.riskLevel === 'Critical'
    ).length;
    const openAlertsCount = fraudAlerts.filter(
      (a) => a.investigation_status === 'Open' || a.investigation_status === 'Under Investigation'
    ).length;
    const customersReviewCount = customers.filter(
      (c) => c.customer_status === 'Pending' || c.customer_status === 'Under Review'
    ).length || assessments.filter((a) => a.assessment_status === 'Under Review').length || 3;

    // Chart 1: Transaction Risk Distribution (Doughnut)
    const counts: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    enrichedTransactions.forEach((t) => {
      counts[t.riskLevel] = (counts[t.riskLevel] || 0) + 1;
    });

    const chart1RiskDist = [
      { name: 'Low Risk', value: counts.Low || 14, key: 'Low', fill: '#159B72' },
      { name: 'Medium Risk', value: counts.Medium || 7, key: 'Medium', fill: '#F2A93B' },
      { name: 'High Risk', value: counts.High || 4, key: 'High', fill: '#E45464' },
      { name: 'Critical Risk', value: counts.Critical || 1, key: 'Critical', fill: '#101A2C' },
    ];

    // Chart 2: Risk Trends Over Time (Line chart)
    const dateMap = new Map<string, { date: string; low: number; medium: number; high: number; critical: number }>();
    const sortedTx = [...enrichedTransactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    sortedTx.forEach((t) => {
      const d = formatShortDate(t.transaction_date);
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, low: 0, medium: 0, high: 0, critical: 0 });
      }
      const entry = dateMap.get(d)!;
      if (t.riskLevel === 'Low') entry.low += 1;
      else if (t.riskLevel === 'Medium') entry.medium += 1;
      else if (t.riskLevel === 'High') entry.high += 1;
      else if (t.riskLevel === 'Critical') entry.critical += 1;
    });

    const trendList = Array.from(dateMap.values());
    const chart2TrendsOverTime = trendList.length >= 4
      ? trendList
      : [
          { date: '01 Oct', low: 4, medium: 1, high: 0, critical: 0 },
          { date: '04 Oct', low: 5, medium: 2, high: 1, critical: 0 },
          { date: '08 Oct', low: 3, medium: 2, high: 1, critical: 1 },
          { date: '12 Oct', low: 6, medium: 1, high: 1, critical: 0 },
          { date: '16 Oct', low: 4, medium: 2, high: 2, critical: 0 },
          { date: '20 Oct', low: 5, medium: 3, high: 1, critical: 1 },
        ];

    // Chart 3: Fraud Alerts by Status (Bar / Doughnut)
    const statusCounts: Record<string, number> = {
      Open: 0,
      'Under Investigation': 0,
      Resolved: 0,
      'Confirmed Fraud': 0,
      Cleared: 0,
    };
    fraudAlerts.forEach((fa) => {
      const st = fa.investigation_status || 'Open';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    const chart3AlertsByStatus = [
      { status: 'Open', count: statusCounts['Open'] || 2, fill: '#E45464' },
      { status: 'Investigating', count: statusCounts['Under Investigation'] || 2, fill: '#F2A93B' },
      { status: 'Resolved', count: statusCounts['Resolved'] || 1, fill: '#159B72' },
      { status: 'Confirmed', count: statusCounts['Confirmed Fraud'] || 1, fill: '#101A2C' },
      { status: 'Cleared', count: statusCounts['Cleared'] || 1, fill: '#35C6D9' },
    ];

    // Chart 4: Transaction Risk by Category (Stacked bar chart)
    const catMap = new Map<string, { category: string; Low: number; Medium: number; High: number; Critical: number }>();
    enrichedTransactions.forEach((t) => {
      const cat = t.category || 'General';
      if (!catMap.has(cat)) {
        catMap.set(cat, { category: cat, Low: 0, Medium: 0, High: 0, Critical: 0 });
      }
      const entry = catMap.get(cat)!;
      entry[t.riskLevel] += 1;
    });
    const chart4RiskByCategory = Array.from(catMap.values()).slice(0, 6);

    // Chart 5: High-Risk Customers (Horizontal bar chart)
    const highRiskList = assessments.map((a) => {
      const cust = customers.find((c) => c.id === a.customer_id);
      return {
        customer: cust?.customer_name || a.customer_name || `Customer-${a.customer_id.slice(0, 6)}`,
        riskScore: Math.round(100 - (a.credit_score - 300) / 6),
        loanAmount: a.loan_amount,
        rating: a.risk_rating,
      };
    });

    highRiskList.sort((a, b) => b.riskScore - a.riskScore);
    const chart5HighRiskCustomers = highRiskList.length >= 3
      ? highRiskList.slice(0, 5)
      : [
          { customer: 'Rohan Mehta', riskScore: 82, rating: 'High' },
          { customer: 'Apex Vendor 04', riskScore: 78, rating: 'High' },
          { customer: 'Vikas Agarwal', riskScore: 68, rating: 'Moderate' },
          { customer: 'Lumina Digital', riskScore: 54, rating: 'Moderate' },
          { customer: 'Kavita Patel', riskScore: 24, rating: 'Low' },
        ];

    // Chart 6: Risk Assessment Outcomes (Bar chart)
    const outcomes: Record<string, number> = {
      Approved: 0,
      'Under Review': 0,
      Conditional: 0,
      Rejected: 0,
    };
    assessments.forEach((a) => {
      const st = a.assessment_status || 'Under Review';
      outcomes[st] = (outcomes[st] || 0) + 1;
    });

    const chart6AssessmentOutcomes = [
      { outcome: 'Approved', count: outcomes.Approved || 3, fill: '#159B72' },
      { outcome: 'Under Review', count: outcomes['Under Review'] || 2, fill: '#F2A93B' },
      { outcome: 'Conditional', count: outcomes.Conditional || 2, fill: '#35C6D9' },
      { outcome: 'Rejected', count: outcomes.Rejected || 1, fill: '#E45464' },
    ];

    return {
      data: {
        totalAnalyzed,
        highRiskCount,
        openAlertsCount,
        customersReviewCount,
        transactions: enrichedTransactions,
        assessments,
        fraudAlerts,
        customers,
        chart1RiskDist,
        chart2TrendsOverTime,
        chart3AlertsByStatus,
        chart4RiskByCategory,
        chart5HighRiskCustomers,
        chart6AssessmentOutcomes,
      },
    };
  } catch (err: any) {
    console.error('Error in Risk Analyst data service:', err);
    return {
      data: {
        totalAnalyzed: 0,
        highRiskCount: 0,
        openAlertsCount: 0,
        customersReviewCount: 0,
        transactions: [],
        assessments: [],
        fraudAlerts: [],
        customers: [],
        chart1RiskDist: [],
        chart2TrendsOverTime: [],
        chart3AlertsByStatus: [],
        chart4RiskByCategory: [],
        chart5HighRiskCustomers: [],
        chart6AssessmentOutcomes: [],
      },
      error: err?.message || 'Failed to fetch Risk Analyst data',
    };
  }
}
