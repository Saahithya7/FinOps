import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { DemoBanner } from './components/common/DemoBanner';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CommandPalette } from './components/common/CommandPalette';
import { ThemePreviewRibbon } from './components/theme/ThemePreviewRibbon';
import { ThemeManagerModal } from './components/theme/ThemeManagerModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { CommonLogin } from './pages/auth/CommonLogin';
import { CustomerLogin } from './pages/auth/CustomerLogin';
import { CustomerSignup } from './pages/auth/CustomerSignup';
import { BusinessLogin } from './pages/auth/BusinessLogin';
import { BusinessSignup } from './pages/auth/BusinessSignup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { SubscriptionPlans } from './pages/business/SubscriptionPlans';
import { BusinessPortalHub } from './pages/business/BusinessPortalHub';
import { TeamManagement } from './pages/business/TeamManagement';
import { BusinessSettings } from './pages/business/BusinessSettings';

// Portals
import { CustomerDashboard } from './pages/portals/CustomerDashboard';
import { RiskAnalystDashboard } from './pages/portals/RiskAnalystDashboard';
import { FraudComplianceDashboard } from './pages/portals/FraudComplianceDashboard';
import { ManagerDashboard } from './pages/portals/ManagerDashboard';
import { SupportDashboard } from './pages/portals/SupportDashboard';
import { SupportAgentDashboard } from './pages/portals/SupportAgentDashboard';
import { AdminDashboard } from './pages/portals/AdminDashboard';
import { ApplicantDashboard } from './pages/portals/ApplicantDashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AccessDenied } from './components/common/AccessDenied';
import { UserRole } from './types';
import { getDashboardRouteForRole } from './utils/formatters';

function AppContent() {
  const { session, isAuthenticated, userRole, hasAccessToRole } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    // Check initial window location hash or pathname
    const path = window.location.pathname;
    if (path && path !== '/') return path;
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return '/';
  });

  const [activeTab, setActiveTab] = useState<string>('overview');

  // Sync route with browser history
  const navigate = (route: string) => {
    setCurrentRoute(route);
    setActiveTab('overview');
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  // Route switch
  const renderRoute = () => {
    switch (currentRoute) {
    case '/':
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <DemoBanner
            onNavigatePortalHub={() => navigate('/business/portal')}
            onNavigateHome={() => navigate('/')}
          />
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <LandingPage onNavigate={navigate} />
        </div>
      );

    case '/pricing':
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <DemoBanner
            onNavigatePortalHub={() => navigate('/business/portal')}
            onNavigateHome={() => navigate('/')}
          />
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <SubscriptionPlans
            onSuccessRedirect={() => navigate('/business/portal')}
            isNewRegistration={false}
          />
        </div>
      );

    case '/login':
    case '/customer/login':
    case '/business/login':
    case '/business/portal-login':
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <CommonLogin
            onNavigate={navigate}
            onSuccess={(targetRoute) => navigate(targetRoute)}
          />
        </div>
      );

    case '/customer/signup':
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <CustomerSignup
            onNavigate={navigate}
            onSuccess={() => navigate('/applicant/dashboard')}
          />
        </div>
      );

    case '/business/signup':
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <DemoBanner
            onNavigatePortalHub={() => navigate('/business/portal')}
            onNavigateHome={() => navigate('/')}
          />
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <BusinessSignup
            onNavigate={navigate}
            onSuccess={() => navigate('/business/subscription')}
          />
        </div>
      );

    case '/forgot-password':
    case '/customer/forgot-password':
    case '/business/forgot-password':
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <DemoBanner
            onNavigatePortalHub={() => navigate('/business/portal')}
            onNavigateHome={() => navigate('/')}
          />
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <ForgotPassword onNavigate={navigate} />
        </div>
      );

    case '/reset-password':
    case '/customer/reset-password':
    case '/business/reset-password':
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <DemoBanner
            onNavigatePortalHub={() => navigate('/business/portal')}
            onNavigateHome={() => navigate('/')}
          />
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <ResetPassword onNavigate={navigate} />
        </div>
      );

    case '/subscription':
    case '/business/subscription':
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <DemoBanner
            onNavigatePortalHub={() => navigate('/business/portal')}
            onNavigateHome={() => navigate('/')}
          />
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <SubscriptionPlans
            onSuccessRedirect={() => navigate('/business/portal')}
            isNewRegistration={true}
          />
        </div>
      );

    case '/business/portal':
    case '/business/dashboard':
      if (!isAuthenticated) {
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar onNavigate={navigate} currentRoute={currentRoute} />
            <AccessDenied
              requiredRole="Admin"
              currentRole={null}
              onNavigateHome={() => navigate('/')}
              onNavigatePortal={() => navigate('/login')}
            />
          </div>
        );
      } else {
        const dest = getDashboardRouteForRole(userRole);
        if (dest) {
          setTimeout(() => navigate(dest), 0);
          return null;
        }
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar onNavigate={navigate} currentRoute={currentRoute} />
            <AccessDenied
              requiredRole="Admin"
              currentRole={userRole}
              onNavigateHome={() => navigate('/')}
              onNavigatePortal={() => navigate('/login')}
            />
          </div>
        );
      }

    case '/business/team':
      if (!isAuthenticated || session?.accountType === 'customer') {
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <DemoBanner
              onNavigatePortalHub={() => navigate('/business/portal')}
              onNavigateHome={() => navigate('/')}
            />
            <Navbar onNavigate={navigate} currentRoute={currentRoute} />
            <AccessDenied
              requiredRole="Admin"
              currentRole={userRole}
              onNavigateHome={() => navigate('/')}
              onNavigatePortal={() => navigate('/business/login')}
            />
          </div>
        );
      }
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <DemoBanner
            onNavigatePortalHub={() => navigate('/business/portal')}
            onNavigateHome={() => navigate('/')}
          />
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <TeamManagement onNavigatePortalHub={() => navigate('/business/portal')} />
        </div>
      );

    case '/business/settings':
      if (!isAuthenticated || session?.accountType === 'customer') {
        return (
          <div className="min-h-screen bg-slate-50 flex flex-col">
            <DemoBanner
              onNavigatePortalHub={() => navigate('/business/portal')}
              onNavigateHome={() => navigate('/')}
            />
            <Navbar onNavigate={navigate} currentRoute={currentRoute} />
            <AccessDenied
              requiredRole="Admin"
              currentRole={userRole}
              onNavigateHome={() => navigate('/')}
              onNavigatePortal={() => navigate('/business/login')}
            />
          </div>
        );
      }
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <DemoBanner
            onNavigatePortalHub={() => navigate('/business/portal')}
            onNavigateHome={() => navigate('/')}
          />
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <BusinessSettings onNavigatePortalHub={() => navigate('/business/portal')} />
        </div>
      );

    // Portals
    case '/applicant/dashboard':
      return (
        <ProtectedRoute
          requiredRole="Applicant"
          title="Bank Customer Verification Desk"
          subtitle="Identity verification status, queue review, and application updates"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNavigate={navigate}
          currentRoute={currentRoute}
        >
          <ApplicantDashboard activeTab={activeTab} />
        </ProtectedRoute>
      );

    case '/customer/dashboard':
      return (
        <ProtectedRoute
          requiredRole="Customer"
          title="Customer Financial Wealth Portal"
          subtitle="Personal bank balances, spending analytics, and fund transfers"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNavigate={navigate}
          currentRoute={currentRoute}
        >
          <CustomerDashboard activeTab={activeTab} />
        </ProtectedRoute>
      );

    case '/risk-analyst/dashboard':
    case '/risk/dashboard':
      return (
        <ProtectedRoute
          requiredRole="Risk Analyst"
          title="Credit Risk & Underwriting Desk"
          subtitle="Credit score modeling, loan application queue, and DTI stress testing"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNavigate={navigate}
          currentRoute={currentRoute}
        >
          <RiskAnalystDashboard activeTab={activeTab} />
        </ProtectedRoute>
      );

    case '/fraud-compliance/dashboard':
    case '/fraud-analyst/dashboard':
    case '/fraud/dashboard':
      return (
        <ProtectedRoute
          requiredRole="Fraud & Compliance Analyst"
          title="Fraud Heuristics & AML Compliance"
          subtitle="Real-time anomaly monitoring, card cloning flags, and statutory PMLA SAR cases"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNavigate={navigate}
          currentRoute={currentRoute}
        >
          <FraudComplianceDashboard activeTab={activeTab} />
        </ProtectedRoute>
      );

    case '/manager/dashboard':
      return (
        <ProtectedRoute
          requiredRole="Manager"
          title="Managerial Operations Command"
          subtitle="Executive approvals queue, team performance KPIs, and loan exception waivers"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNavigate={navigate}
          currentRoute={currentRoute}
        >
          <ManagerDashboard activeTab={activeTab} />
        </ProtectedRoute>
      );

    case '/support/dashboard':
    case '/support-agent/dashboard':
      return (
        <ProtectedRoute
          requiredRole="Support Agent"
          title="Omnichannel Customer Support Desk"
          subtitle="Transaction dispute tickets, SLA tracking, and live messaging threads"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNavigate={navigate}
          currentRoute={currentRoute}
        >
          <SupportDashboard activeTab={activeTab} />
        </ProtectedRoute>
      );

    case '/admin/dashboard':
      return (
        <ProtectedRoute
          requiredRole="Admin"
          title="Enterprise Tenant Administration"
          subtitle="Employee directory, invitation tokens, subscription billing, and audit logs"
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onNavigate={navigate}
          currentRoute={currentRoute}
        >
          <AdminDashboard
            activeTab={activeTab}
            onNavigateSubscription={() => navigate('/business/subscription')}
          />
        </ProtectedRoute>
      );

    default:
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <DemoBanner
            onNavigatePortalHub={() => navigate('/business/portal')}
            onNavigateHome={() => navigate('/')}
          />
          <Navbar onNavigate={navigate} currentRoute={currentRoute} />
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-4">
              <h2 className="text-3xl font-extrabold text-slate-900">404 - Page Not Found</h2>
              <p className="text-xs text-slate-500">The requested route does not exist.</p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Return to Landing Page
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <ThemePreviewRibbon />
      {renderRoute()}
      <ThemeManagerModal />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
