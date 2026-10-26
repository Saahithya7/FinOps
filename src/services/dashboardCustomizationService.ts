import { UserRole, DashboardWidgetConfig, RoleDashboardLayout } from '../types';

export const DEFAULT_ROLE_WIDGETS: Record<UserRole, DashboardWidgetConfig[]> = {
  Admin: [
    {
      id: 'kpi_cards',
      title: 'Enterprise KPI Metric Tiles',
      description: 'Tenant members count, subscription plan, active invitation tokens, and immutable audit logs.',
      category: 'kpi',
      enabled: true,
      order: 1,
      width: 'full',
    },
    {
      id: 'chart_account_status',
      title: 'Customer Account Status Distribution',
      description: 'Active vs Pending Review vs Rejected customer profile ratios.',
      category: 'chart',
      enabled: true,
      order: 2,
      width: 'half',
      chartType: 'donut',
    },
    {
      id: 'chart_tx_volume',
      title: 'Platform Transaction Volume Trends',
      description: 'Historical financial volume trends across verified transactions.',
      category: 'chart',
      enabled: true,
      order: 3,
      width: 'half',
      chartType: 'area',
    },
    {
      id: 'chart_staff_roles',
      title: 'Staff Operational Role Breakdown',
      description: 'Staff allocation across Admin, Manager, Risk Analyst, and Support Agent roles.',
      category: 'chart',
      enabled: true,
      order: 4,
      width: 'half',
      chartType: 'bar',
    },
    {
      id: 'chart_security_audit',
      title: 'Security & Audit Log Activity',
      description: 'Temporal frequency of administrative and compliance ledger actions.',
      category: 'chart',
      enabled: true,
      order: 5,
      width: 'half',
      chartType: 'line',
    },
    {
      id: 'user_management_table',
      title: 'Employee & Customer Role Directory',
      description: 'Interactive roster with role change and customer account approval controls.',
      category: 'table',
      enabled: true,
      order: 6,
      width: 'full',
    },
    {
      id: 'live_pulse_feed',
      title: 'Live Settlement Activity Pulse',
      description: 'Real-time telemetry stream of incoming transactions with risk indicators.',
      category: 'feed',
      enabled: true,
      order: 7,
      width: 'full',
    },
  ],

  Manager: [
    {
      id: 'kpi_cards',
      title: 'Managerial Performance KPIs',
      description: 'Pending approvals count, total supervised cases, decision throughput, and system health.',
      category: 'kpi',
      enabled: true,
      order: 1,
      width: 'full',
    },
    {
      id: 'chart_onboarding',
      title: 'Customer Onboarding & Approval Trajectory',
      description: 'Monthly applications vs approved active account progression.',
      category: 'chart',
      enabled: true,
      order: 2,
      width: 'half',
      chartType: 'area',
    },
    {
      id: 'chart_tx_volume',
      title: 'Supervised Transaction Volume Over Time',
      description: 'Overall volume trends across banking operational accounts.',
      category: 'chart',
      enabled: true,
      order: 3,
      width: 'half',
      chartType: 'area',
    },
    {
      id: 'chart_review_status',
      title: 'Manager Review Queue Status',
      description: 'Status of escalated loan exceptions and approval requests.',
      category: 'chart',
      enabled: true,
      order: 4,
      width: 'half',
      chartType: 'donut',
    },
    {
      id: 'chart_customer_risk',
      title: 'Portfolio Risk Classification',
      description: 'Distribution of supervised portfolio from Low to Critical risk tiers.',
      category: 'chart',
      enabled: true,
      order: 5,
      width: 'half',
      chartType: 'bar',
    },
    {
      id: 'reviews_table',
      title: 'Executive Review Queue Table',
      description: 'Interactive queue for approving, rejecting, or requesting additional information on high-value cases.',
      category: 'table',
      enabled: true,
      order: 6,
      width: 'full',
    },
    {
      id: 'live_pulse_feed',
      title: 'Live Settlement Activity Pulse',
      description: 'Real-time telemetry stream of incoming transactions with risk indicators.',
      category: 'feed',
      enabled: true,
      order: 7,
      width: 'full',
    },
  ],

  'Risk Analyst': [
    {
      id: 'kpi_cards',
      title: 'Credit Risk & Anomaly Metrics',
      description: 'Total analyzed records, high-risk anomalies, open fraud alerts, and queue counts.',
      category: 'kpi',
      enabled: true,
      order: 1,
      width: 'full',
    },
    {
      id: 'chart_risk_dist',
      title: 'Risk Rating Distribution',
      description: 'Portfolio concentration across Low, Medium, High, and Critical bands.',
      category: 'chart',
      enabled: true,
      order: 2,
      width: 'half',
      chartType: 'donut',
    },
    {
      id: 'chart_risk_trends',
      title: 'Temporal Risk Velocity Trends',
      description: 'Multi-line progression of risk rating occurrences over recent days.',
      category: 'chart',
      enabled: true,
      order: 3,
      width: 'half',
      chartType: 'line',
    },
    {
      id: 'chart_alerts_status',
      title: 'Fraud Alerts by Status',
      description: 'Active vs Under Investigation vs Cleared alerts.',
      category: 'chart',
      enabled: true,
      order: 4,
      width: 'half',
      chartType: 'bar',
    },
    {
      id: 'chart_risk_category',
      title: 'Risk Profile by Transaction Category',
      description: 'Stacked exposure breakdown across merchant and payment domains.',
      category: 'chart',
      enabled: true,
      order: 5,
      width: 'half',
      chartType: 'bar',
    },
    {
      id: 'investigation_studio',
      title: 'Interactive Fraud Investigation Studio',
      description: 'Searchable triage queue with customer dossiers, velocity indicators, and SAR status updates.',
      category: 'tool',
      enabled: true,
      order: 6,
      width: 'full',
    },
    {
      id: 'live_pulse_feed',
      title: 'Live Transaction Activity Pulse',
      description: 'Real-time telemetry stream of incoming transactions with risk indicators.',
      category: 'feed',
      enabled: true,
      order: 7,
      width: 'full',
    },
  ],

  'Fraud & Compliance Analyst': [
    {
      id: 'kpi_cards',
      title: 'Surveillance Metrics',
      description: 'Critical flags, active SAR filings, velocity alerts, and AML cases.',
      category: 'kpi',
      enabled: true,
      order: 1,
      width: 'full',
    },
    {
      id: 'investigation_studio',
      title: 'Fraud Investigation Workspace',
      description: 'Dedicated workbench for triaging suspicious patterns and velocity anomalies.',
      category: 'tool',
      enabled: true,
      order: 2,
      width: 'full',
    },
    {
      id: 'live_pulse_feed',
      title: 'Live Settlement Stream',
      description: 'Incoming live transaction ledger with automated rule tags.',
      category: 'feed',
      enabled: true,
      order: 3,
      width: 'full',
    },
  ],

  'Support Agent': [
    {
      id: 'kpi_cards',
      title: 'Support Desk Operational KPIs',
      description: 'Total inbound tickets, open queue, assigned to me, and resolution rate.',
      category: 'kpi',
      enabled: true,
      order: 1,
      width: 'full',
    },
    {
      id: 'chart_ticket_status',
      title: 'Ticket Status Distribution',
      description: 'Resolved vs In Progress vs Open vs Awaiting Customer ratio.',
      category: 'chart',
      enabled: true,
      order: 2,
      width: 'half',
      chartType: 'donut',
    },
    {
      id: 'chart_dispute_categories',
      title: 'Inquiries by Banking Category',
      description: 'Volume breakdown across UPI Failures, Disputes, and Account Access.',
      category: 'chart',
      enabled: true,
      order: 3,
      width: 'half',
      chartType: 'bar',
    },
    {
      id: 'chart_inflow_velocity',
      title: 'Ticket Inflow vs Resolution Velocity',
      description: 'Temporal area chart of daily received vs successfully resolved cases.',
      category: 'chart',
      enabled: true,
      order: 4,
      width: 'half',
      chartType: 'area',
    },
    {
      id: 'chart_priority_breakdown',
      title: 'Priority & SLA Breakdown',
      description: 'Urgency distribution from Urgent to Low.',
      category: 'chart',
      enabled: true,
      order: 5,
      width: 'half',
      chartType: 'bar',
    },
    {
      id: 'ticket_queue_table',
      title: 'Omnichannel Ticket Queue & Desk',
      description: 'Interactive list of tickets with customer search, status updates, and detail modal.',
      category: 'table',
      enabled: true,
      order: 6,
      width: 'full',
    },
  ],

  Customer: [
    {
      id: 'kpi_cards',
      title: 'Personal Financial Summary KPIs',
      description: 'Available balance, monthly outflow, approved credit limit, and monthly income.',
      category: 'kpi',
      enabled: true,
      order: 1,
      width: 'full',
    },
    {
      id: 'chart_spending_categories',
      title: 'Category Spending Distribution',
      description: 'Donut chart breakdown of debit expenses by spending category.',
      category: 'chart',
      enabled: true,
      order: 2,
      width: 'half',
      chartType: 'donut',
    },
    {
      id: 'chart_cashflow_trends',
      title: 'Monthly Cashflow In vs Out',
      description: 'Area comparison of total credits received versus debits spent.',
      category: 'chart',
      enabled: true,
      order: 3,
      width: 'half',
      chartType: 'area',
    },
    {
      id: 'chart_outflow_trajectory',
      title: 'Outflow Spending Trajectory',
      description: 'Temporal bar chart of daily expenditure.',
      category: 'chart',
      enabled: true,
      order: 4,
      width: 'half',
      chartType: 'bar',
    },
    {
      id: 'chart_credit_utilization',
      title: 'Credit Limit Utilization',
      description: 'Donut chart showing utilized vs available credit line.',
      category: 'chart',
      enabled: true,
      order: 5,
      width: 'half',
      chartType: 'donut',
    },
    {
      id: 'recent_transactions_table',
      title: 'Recent Bank Statement & Ledger',
      description: 'Searchable ledger of personal credits, debits, and transfers.',
      category: 'table',
      enabled: true,
      order: 6,
      width: 'full',
    },
  ],

  Applicant: [
    {
      id: 'kpi_cards',
      title: 'Application Status KPI',
      description: 'Verification status indicator and application timeline.',
      category: 'kpi',
      enabled: true,
      order: 1,
      width: 'full',
    },
  ],
};

function getStorageKey(role: UserRole, userId: string): string {
  return `finops_layout_${role.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${userId}`;
}

/**
 * Retrieves the stored layout for a specific role and user.
 * Strictly guarantees that an employee's layout never leaks into Admin or another role.
 */
export function getSavedDashboardLayout(role: UserRole, userId: string = 'default'): DashboardWidgetConfig[] {
  const defaultList = DEFAULT_ROLE_WIDGETS[role] || DEFAULT_ROLE_WIDGETS.Admin;
  try {
    const key = getStorageKey(role, userId);
    const raw = localStorage.getItem(key);
    if (!raw) return defaultList;

    const parsed: RoleDashboardLayout = JSON.parse(raw);
    if (!parsed || parsed.role !== role || !Array.isArray(parsed.widgets)) {
      return defaultList;
    }

    // Merge in any newly added default widgets that might not be in saved layout
    const savedMap = new Map(parsed.widgets.map((w) => [w.id, w]));
    const merged: DashboardWidgetConfig[] = [];

    // Add widgets according to saved order
    parsed.widgets.forEach((w) => {
      const defaultMatch = defaultList.find((d) => d.id === w.id);
      if (defaultMatch) {
        merged.push({
          ...defaultMatch,
          enabled: w.enabled !== undefined ? w.enabled : defaultMatch.enabled,
          order: w.order !== undefined ? w.order : defaultMatch.order,
          chartType: w.chartType || defaultMatch.chartType,
          width: w.width || defaultMatch.width,
        });
      }
    });

    // Append any default widgets not yet present in saved config
    defaultList.forEach((d) => {
      if (!savedMap.has(d.id)) {
        merged.push({ ...d, order: merged.length + 1 });
      }
    });

    merged.sort((a, b) => a.order - b.order);
    return merged;
  } catch (e) {
    console.warn('Failed to read dashboard layout from storage:', e);
    return defaultList;
  }
}

/**
 * Saves the role- and user-specific widget layout.
 */
export function saveDashboardLayout(
  role: UserRole,
  userId: string,
  widgets: DashboardWidgetConfig[]
): boolean {
  try {
    const key = getStorageKey(role, userId);
    const payload: RoleDashboardLayout = {
      role,
      userId,
      widgets,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.error('Failed to save dashboard layout:', e);
    return false;
  }
}

/**
 * Resets the layout back to role defaults.
 */
export function resetDashboardLayout(role: UserRole, userId: string): DashboardWidgetConfig[] {
  try {
    const key = getStorageKey(role, userId);
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to clear layout from storage:', e);
  }
  return DEFAULT_ROLE_WIDGETS[role] || DEFAULT_ROLE_WIDGETS.Admin;
}
