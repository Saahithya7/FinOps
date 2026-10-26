import { UserRole } from '../types';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatShortDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function normalizeUserRole(rawRole?: string | null): UserRole | null {
  if (!rawRole) return null;
  const cleaned = rawRole.trim().toLowerCase().replace(/[-_\s]+/g, '_');

  if (cleaned === 'admin') return 'Admin';
  if (cleaned === 'manager') return 'Manager';
  if (cleaned === 'risk_analyst' || cleaned === 'risk' || cleaned === 'risk_officer') return 'Risk Analyst';
  if (cleaned === 'fraud_compliance_analyst' || cleaned === 'fraud_analyst' || cleaned === 'fraud' || cleaned === 'compliance') return 'Fraud & Compliance Analyst';
  if (cleaned === 'support_agent' || cleaned === 'support' || cleaned === 'agent') return 'Support Agent';
  if (cleaned === 'customer' || cleaned === 'client') return 'Customer';
  if (cleaned === 'applicant') return 'Applicant';

  if (isValidUserRole(rawRole)) {
    return rawRole as UserRole;
  }

  return null;
}

export function isValidUserRole(role?: string | null): boolean {
  if (!role) return false;
  return [
    'Applicant',
    'Customer',
    'Manager',
    'Risk Analyst',
    'Fraud & Compliance Analyst',
    'Support Agent',
    'Admin',
  ].includes(role);
}

export function getDashboardRouteForRole(role?: string | null): string | null {
  const norm = normalizeUserRole(role);
  switch (norm) {
    case 'Applicant':
      return '/applicant/dashboard';
    case 'Admin':
      return '/admin/dashboard';
    case 'Manager':
      return '/manager/dashboard';
    case 'Risk Analyst':
      return '/risk-analyst/dashboard';
    case 'Fraud & Compliance Analyst':
      return '/fraud-compliance/dashboard';
    case 'Support Agent':
      return '/support/dashboard';
    case 'Customer':
      return '/customer/dashboard';
    default:
      return null;
  }
}

