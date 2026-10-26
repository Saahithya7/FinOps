import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../layout/Navbar';
import { AccessDenied } from '../common/AccessDenied';
import { DashboardLayout } from '../layout/DashboardLayout';
import { ApplicantDashboard } from '../../pages/portals/ApplicantDashboard';
import { UserRole } from '../../types';
import { getDashboardRouteForRole, normalizeUserRole } from '../../utils/formatters';

interface ProtectedRouteProps {
  requiredRole: UserRole | UserRole[];
  children: React.ReactNode;
  onNavigate: (route: string) => void;
  currentRoute: string;
  title: string;
  subtitle: string;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

/**
 * Reusable protected route component enforcing authentication and strict role-based authorization (RBAC).
 * Prevents unauthorized users from accessing another role's dashboard simply by modifying the URL.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  children,
  onNavigate,
  currentRoute,
  title,
  subtitle,
  activeTab = 'overview',
  onSelectTab,
}) => {
  const { session, isAuthenticated, userRole, hasAccessToRole } = useAuth();

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  const primaryRequiredRole = allowedRoles[0];

  // 1. Authentication Check
  if (!isAuthenticated || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar onNavigate={onNavigate} currentRoute={currentRoute} />
        <AccessDenied
          requiredRole={primaryRequiredRole}
          currentRole={null}
          onNavigateHome={() => onNavigate('/')}
          onNavigatePortal={() => onNavigate('/login')}
        />
      </div>
    );
  }

  // 2. Authorization (RBAC) Check
  const isAuthorized = allowedRoles.some((role) => hasAccessToRole(role));
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar onNavigate={onNavigate} currentRoute={currentRoute} />
        <AccessDenied
          requiredRole={primaryRequiredRole}
          currentRole={userRole}
          onNavigateHome={() => onNavigate('/')}
          onNavigatePortal={() => {
            const myPortal = getDashboardRouteForRole(userRole);
            onNavigate(myPortal || '/login');
          }}
        />
      </div>
    );
  }

  // 3. Customer Account Status Check: Unapproved/Pending customers must not access active customer portal
  const normalizedRole = normalizeUserRole(userRole);
  if (normalizedRole === 'Customer' && session?.user?.account_status && session.user.account_status !== 'Active') {
    return (
      <DashboardLayout
        portalRole="Applicant"
        title="Bank Customer Verification Desk"
        subtitle="Identity verification status, queue review, and application updates"
        activeTab={activeTab}
        onSelectTab={onSelectTab || (() => {})}
        onNavigate={onNavigate}
        currentRoute={currentRoute}
      >
        <ApplicantDashboard activeTab={activeTab} />
      </DashboardLayout>
    );
  }

  // 4. Authorized Access
  return (
    <DashboardLayout
      portalRole={primaryRequiredRole}
      title={title}
      subtitle={subtitle}
      activeTab={activeTab}
      onSelectTab={onSelectTab || (() => {})}
      onNavigate={onNavigate}
      currentRoute={currentRoute}
    >
      {children}
    </DashboardLayout>
  );
};
