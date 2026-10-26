import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthSession,
  Business,
  BusinessMember,
  Customer,
  Profile,
  Subscription,
  SubscriptionPlan,
  BillingPeriod,
  UserRole,
  CustomerVerificationRequest,
  CustomerAccountStatus,
} from '../types';
import { db } from '../services/storage';
import {
  supabase,
  isSupabaseConfigured,
  resolveSyntheticEmail,
  extractUsername,
  signUpCustomerWithSupabase,
  signInCustomerWithSupabase,
  signInWithGoogle,
  fetchCustomerProfile,
  signOutSupabase,
} from '../services/supabaseClient';
import { isValidUserRole, normalizeUserRole, getDashboardRouteForRole } from '../utils/formatters';

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  activeBusiness: Business | null;
  subscription: Subscription | null;
  loginUnified: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; role?: UserRole; account_status?: string; error?: string }>;
  loginCustomer: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signupCustomer: (
    fullName: string,
    usernameOrEmail: string,
    password?: string
  ) => Promise<{ success: boolean; needsEmailVerification?: boolean; message?: string; error?: string }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error?: string }>;
  loginBusiness: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string; requiresPlan?: boolean }>;
  signupBusiness: (data: {
    businessName: string;
    businessUsername: string;
    contactPerson: string;
    phone: string;
    password?: string;
  }) => Promise<{ success: boolean; businessId?: string; error?: string }>;
  activateSubscription: (businessId: string, plan: SubscriptionPlan, billingPeriod: BillingPeriod) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (roleName: 'admin' | 'risk' | 'fraud' | 'manager' | 'support' | 'customer' | 'lumina_admin') => void;
  hasAccessToRole: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'finops_current_session_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load session', e);
    }
    // Unauthenticated state by default: users must explicitly log in to access their role-specific portal
    return null;
  });

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  // Listen for Supabase Auth changes (Google OAuth redirect, token refresh, etc.)
  useEffect(() => {
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, sbSession) => {
        if (event === 'SIGNED_IN' && sbSession?.user) {
          const user = sbSession.user;
          // Attempt to retrieve profile populated by PostgreSQL on_auth_user_created trigger
          const sbProfile = await fetchCustomerProfile(user.id);
          const fullName =
            sbProfile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Valued Customer';
          const email = user.email || sbProfile?.email || '';
          const username = extractUsername(email);

          let localProfile = db.getProfiles().find((p) => p.id === user.id || p.email === email);
          if (!localProfile) {
            localProfile = {
              id: user.id,
              username,
              full_name: fullName,
              email,
              phone: '+91 98000 00000',
              account_type: 'customer',
              created_at: sbProfile?.created_at || user.created_at || new Date().toISOString(),
            };
            db.saveProfile(localProfile);
          }

          let custRec = db.getCustomerByUserId(localProfile.id);
          if (!custRec) {
            custRec = {
              id: 'cust_' + Date.now(),
              business_id: 'biz_abc_01',
              user_id: localProfile.id,
              customer_name: fullName,
              customer_reference: `CUST-IND-${Math.floor(1000 + Math.random() * 9000)}`,
              account_type: 'Individual',
              email,
              phone: localProfile.phone,
              balance_inr: 50000.0,
              credit_limit_inr: 150000.0,
              savings_account_no: `SB-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
              created_at: localProfile.created_at,
            };
            db.saveCustomer(custRec);
          }

          setSession({
            user: localProfile,
            accountType: 'customer',
            customerRecord: custRec,
          });
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loginUnified = async (
    usernameOrEmail: string,
    password?: string
  ): Promise<{ success: boolean; role?: UserRole; account_status?: string; error?: string }> => {
    const rawInput = usernameOrEmail.trim();
    if (!rawInput) {
      return { success: false, error: 'Please enter your registered email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your account password.' };
    }

    // Resolve email identifier
    let resolvedEmail = rawInput.toLowerCase();
    if (!resolvedEmail.includes('@')) {
      const aliasMap: Record<string, string> = {
        admin: 'admin@abcfinance.com',
        abc_admin: 'admin@abcfinance.com',
        risk: 'risk@abcfinance.com',
        abc_risk: 'risk@abcfinance.com',
        fraud: 'fraud@abcfinance.com',
        abc_fraud: 'fraud@abcfinance.com',
        manager: 'manager@abcfinance.com',
        abc_manager: 'manager@abcfinance.com',
        support: 'support@abcfinance.com',
        abc_support: 'support@abcfinance.com',
        customer: 'customer@demo.com',
        demo_customer: 'customer@demo.com',
      };
      if (aliasMap[resolvedEmail]) {
        resolvedEmail = aliasMap[resolvedEmail];
      } else {
        const localProf = db.findProfileByUsernameOrEmail(rawInput);
        if (localProf?.email) {
          resolvedEmail = localProf.email.toLowerCase();
        } else {
          resolvedEmail = `${rawInput}@abcfinance.com`;
        }
      }
    }

    // 1. Authenticate with Supabase Auth as the primary source of truth
    if (isSupabaseConfigured() && supabase) {
      try {
        let { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password: password,
        });

        // If credentials fail or account missing, check known provisioned accounts
        if (authErr && (authErr.message.includes('Invalid login credentials') || authErr.message.includes('User not found'))) {
          const knownDemos: Record<string, { role: UserRole; name: string; defaultPass: string }> = {
            'admin@abcfinance.com': { role: 'Admin', name: 'Rajesh Sharma (Admin)', defaultPass: 'AdminPassword123!' },
            'risk@abcfinance.com': { role: 'Risk Analyst', name: 'Dr. Vikram Malhotra', defaultPass: 'RiskPassword123!' },
            'fraud@abcfinance.com': { role: 'Fraud & Compliance Analyst', name: 'Neha Verma', defaultPass: 'FraudPassword123!' },
            'manager@abcfinance.com': { role: 'Manager', name: 'Sunita Menon', defaultPass: 'ManagerPassword123!' },
            'support@abcfinance.com': { role: 'Support Agent', name: 'Arjun Rao', defaultPass: 'SupportPassword123!' },
            'customer@demo.com': { role: 'Customer', name: 'Rohan Mehta', defaultPass: 'CustomerPass123!' },
          };

          if (knownDemos[resolvedEmail]) {
            const demo = knownDemos[resolvedEmail];
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
              email: resolvedEmail,
              password: password,
              options: {
                data: {
                  full_name: demo.name,
                  role: demo.role,
                },
              },
            });

            if (!signUpErr && (signUpData.session || signUpData.user)) {
              const retryLogin = await supabase.auth.signInWithPassword({
                email: resolvedEmail,
                password: password,
              });
              if (!retryLogin.error && retryLogin.data.user) {
                authData = retryLogin.data;
                authErr = null;
              }
            }
          }
        }

        if (authErr || !authData?.user) {
          return {
            success: false,
            error: authErr?.message || 'Authentication failed. Please verify email and password.',
          };
        }

        const authUser = authData.user;

        // 2. Authoritative role & account_status resolution from public.profiles
        let userRole: UserRole | null = null;
        let accountStatus: CustomerAccountStatus = 'Pending';
        let displayName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || '';
        let profileCreated = authUser.created_at || new Date().toISOString();

        try {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .maybeSingle();

          if (profileRow) {
            if (profileRow.full_name) displayName = profileRow.full_name;
            if (profileRow.created_at) profileCreated = profileRow.created_at;
            const normRole = normalizeUserRole(profileRow.role);
            if (normRole) {
              userRole = normRole;
            }
            if (profileRow.account_status) {
              accountStatus = profileRow.account_status as CustomerAccountStatus;
            }
          }
        } catch (e) {
          console.warn('Error reading profiles table:', e);
        }

        // Check memberships table if role is not resolved from profiles
        if (!userRole) {
          try {
            const { data: memberRow } = await supabase
              .from('memberships')
              .select('role')
              .eq('user_id', authUser.id)
              .maybeSingle();
            if (memberRow?.role) {
              const normMember = normalizeUserRole(memberRow.role);
              if (normMember) userRole = normMember;
            }
          } catch (e) {
            console.warn('Error reading memberships table:', e);
          }
        }

        // Fallback role resolution if database column role is not populated yet
        if (!userRole) {
          const metaRole = normalizeUserRole(authUser.user_metadata?.role);
          if (metaRole) {
            userRole = metaRole;
          } else if (resolvedEmail === 'admin@abcfinance.com' || rawInput === 'abc_admin') {
            userRole = 'Admin';
            accountStatus = 'Active';
          } else if (resolvedEmail === 'risk@abcfinance.com' || rawInput === 'abc_risk') {
            userRole = 'Risk Analyst';
            accountStatus = 'Active';
          } else if (resolvedEmail === 'fraud@abcfinance.com' || rawInput === 'abc_fraud') {
            userRole = 'Fraud & Compliance Analyst';
            accountStatus = 'Active';
          } else if (resolvedEmail === 'manager@abcfinance.com' || rawInput === 'abc_manager') {
            userRole = 'Manager';
            accountStatus = 'Active';
          } else if (resolvedEmail === 'support@abcfinance.com' || rawInput === 'abc_support') {
            userRole = 'Support Agent';
            accountStatus = 'Active';
          } else {
            // Check local profiles storage
            const localP = db.getProfiles().find((p) => p.email === resolvedEmail || p.id === authUser.id);
            const localNorm = normalizeUserRole(localP?.role);
            if (localNorm) {
              userRole = localNorm;
              accountStatus = localP?.account_status || 'Pending';
            } else if (localP?.account_type === 'customer') {
              userRole = 'Customer';
              accountStatus = localP?.account_status || 'Pending';
            }
          }
        }

        // Safe access denial if role is missing or invalid
        if (!userRole || !isValidUserRole(userRole)) {
          return {
            success: false,
            error: 'Access Denied: The role assigned to your profile is missing or invalid. Please contact your administrator.',
          };
        }

        if (!displayName) {
          displayName = userRole === 'Customer' ? 'Retail Customer' : `${userRole} Staff`;
        }

        // Establish session based on authoritative role and account_status
        if (userRole === 'Applicant' || (userRole === 'Customer' && accountStatus !== 'Active')) {
          const appProfile: Profile = {
            id: authUser.id,
            user_id: authUser.id,
            username: extractUsername(resolvedEmail),
            full_name: displayName || 'Applicant',
            email: resolvedEmail,
            phone: '+91 98000 00000',
            account_type: 'customer',
            role: userRole,
            account_status: accountStatus,
            created_at: profileCreated,
          };
          db.saveProfile(appProfile);

          // Ensure applicant verification request exists
          let vReq = db.getVerificationRequestByUserId(authUser.id);
          if (!vReq) {
            vReq = {
              request_id: 'cvr_' + authUser.id.slice(0, 12),
              profile_user_id: authUser.id,
              verification_status: accountStatus === 'Rejected' ? 'Rejected' : 'Pending',
              submitted_at: profileCreated,
              created_at: profileCreated,
              updated_at: new Date().toISOString(),
              review_notes: 'Initial registration received. Awaiting compliance officer review.',
            };
            db.saveVerificationRequest(vReq);
          }

          setSession({
            user: appProfile,
            accountType: 'customer',
          });

          return { success: true, role: userRole, account_status: accountStatus };
        } else if (userRole === 'Customer') {
          const custProfile: Profile = {
            id: authUser.id,
            user_id: authUser.id,
            username: extractUsername(resolvedEmail),
            full_name: displayName,
            email: resolvedEmail,
            phone: '+91 98000 00000',
            account_type: 'customer',
            role: 'Customer',
            account_status: 'Active',
            created_at: profileCreated,
          };
          db.saveProfile(custProfile);

          let custRec = db.getCustomerByUserId(authUser.id);
          if (!custRec) {
            custRec = {
              id: 'cust_' + authUser.id.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16),
              business_id: 'cb5831e7-a0df-4f7b-8800-af49387fb82d',
              user_id: authUser.id,
              customer_name: displayName,
              customer_reference: `CUST-IND-${authUser.id.slice(0, 8)}`,
              account_type: 'Individual',
              email: resolvedEmail,
              phone: custProfile.phone,
              balance_inr: 50000.0,
              credit_limit_inr: 150000.0,
              savings_account_no: `SB-${authUser.id.slice(0, 8)}`,
              created_at: profileCreated,
            };
            db.saveCustomer(custRec);
          }

          setSession({
            user: custProfile,
            accountType: 'customer',
            customerRecord: custRec,
          });

          return { success: true, role: 'Customer', account_status: 'Active' };
        } else {
          // Employee or Admin session
          const activeBiz: Business = {
            id: 'cb5831e7-a0df-4f7b-8800-af49387fb82d',
            business_name: 'ABC Finance',
            business_username: 'abc_finance',
            business_email: 'contact@abcfinance.com',
            status: 'active',
            subscription_status: 'active',
            created_at: new Date().toISOString(),
          };

          const activeSub: Subscription = {
            id: 'sub_enterprise_01',
            business_id: activeBiz.id,
            plan_name: 'Enterprise',
            billing_period: 'annual',
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 365 * 86400000).toISOString(),
            payment_reference: 'ENTERPRISE-ACTIVE-SUB',
            amount_inr: 499990.0,
          };

          const userProfile: Profile = {
            id: authUser.id,
            user_id: authUser.id,
            username: extractUsername(resolvedEmail),
            full_name: displayName,
            email: resolvedEmail,
            phone: '+91 98000 00000',
            account_type: 'business',
            role: userRole,
            created_at: profileCreated,
          };

          const activeMember: BusinessMember = {
            id: `mem_${authUser.id.slice(0, 8)}`,
            business_id: activeBiz.id,
            user_id: authUser.id,
            role: userRole,
            status: 'active',
            invitation_status: 'accepted',
            created_at: profileCreated,
            profile: userProfile,
          };

          db.saveProfile(userProfile);
          db.saveBusiness(activeBiz);
          db.saveSubscription(activeSub);
          db.saveBusinessMember(activeMember);

          setSession({
            user: userProfile,
            accountType: 'business',
            business: activeBiz,
            member: activeMember,
            subscription: activeSub,
          });

          return { success: true, role: userRole };
        }
      } catch (err: any) {
        console.error('Unified login error:', err);
        return { success: false, error: err?.message || 'Login error occurred.' };
      }
    }

    // 2. Synthetic fallback if Supabase is unconfigured
    const profile = db.findProfileByUsernameOrEmail(rawInput) || db.findProfileByUsernameOrEmail(resolvedEmail);
    if (!profile) {
      return { success: false, error: 'No account found with this email or username.' };
    }

    let resolvedRole: UserRole = profile.role || (profile.account_type === 'customer' ? 'Customer' : 'Admin');
    if (profile.account_type === 'business') {
      const allMembers = db.getBusinessMembers();
      const member = allMembers.find((m) => m.user_id === profile.id);
      if (member?.role && isValidUserRole(member.role)) {
        resolvedRole = member.role;
      }
    }

    if (!isValidUserRole(resolvedRole)) {
      return {
        success: false,
        error: 'Access Denied: The role assigned to your profile is missing or invalid.',
      };
    }

    if (resolvedRole === 'Customer') {
      let custRec = db.getCustomerByUserId(profile.id) || db.getCustomers()[0];
      setSession({
        user: profile,
        accountType: 'customer',
        customerRecord: custRec,
      });
    } else {
      const biz = db.getBusinesses()[0];
      const member: BusinessMember = {
        id: `mem_${profile.id.slice(0, 8)}`,
        business_id: biz.id,
        user_id: profile.id,
        role: resolvedRole,
        status: 'active',
        invitation_status: 'accepted',
        created_at: profile.created_at,
        profile,
      };
      const sub = db.getSubscriptionByBusinessId(biz.id);
      setSession({
        user: profile,
        accountType: 'business',
        business: biz,
        member,
        subscription: sub,
      });
    }

    return { success: true, role: resolvedRole };
  };

  const loginCustomer = async (
    usernameOrEmail: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Authenticate with Supabase if client is configured and password is provided
    if (isSupabaseConfigured() && supabase && password) {
      const emailToUse = usernameOrEmail.includes('@')
        ? usernameOrEmail.trim().toLowerCase()
        : resolveSyntheticEmail(usernameOrEmail);

      const sbRes = await signInCustomerWithSupabase(emailToUse, password);
      if (sbRes.success && sbRes.user) {
        // Retrieve profile from public.profiles table (created by trigger)
        const sbProfile = await fetchCustomerProfile(sbRes.user.id);
        const displayName =
          sbProfile?.full_name ||
          sbRes.user.user_metadata?.full_name ||
          extractUsername(emailToUse);

        let localProfile = db.getProfiles().find((p) => p.id === sbRes.user!.id || p.email === emailToUse);
        if (!localProfile) {
          localProfile = {
            id: sbRes.user.id,
            username: extractUsername(emailToUse),
            full_name: displayName,
            email: emailToUse,
            phone: '+91 98000 00000',
            account_type: 'customer',
            created_at: sbProfile?.created_at || new Date().toISOString(),
          };
          db.saveProfile(localProfile);
        }

        let custRec = db.getCustomerByUserId(localProfile.id);
        if (!custRec) {
          custRec = {
            id: localProfile.id,
            business_id: '00000000-0000-0000-0000-000000000001',
            user_id: localProfile.id,
            customer_name: displayName,
            customer_reference: `CUST-IND-${localProfile.id.slice(0, 8)}`,
            account_type: 'Individual',
            email: emailToUse,
            phone: localProfile.phone,
            balance_inr: 50000.0,
            credit_limit_inr: 150000.0,
            savings_account_no: `SB-${localProfile.id.slice(0, 6)}`,
            created_at: localProfile.created_at,
          };
          db.saveCustomer(custRec);
        }

        setSession({
          user: localProfile,
          accountType: 'customer',
          customerRecord: custRec,
        });
        return { success: true };
      } else if (!sbRes.success && usernameOrEmail !== 'demo_customer') {
        // Return actual Supabase error (e.g. unverified email, bad credentials, rate limits)
        return {
          success: false,
          error: sbRes.error || 'Authentication failed. Please check your credentials.',
        };
      }
    }

    // 2. Local database / demo account fallback (supports demo_customer)
    const profile = db.findProfileByUsernameOrEmail(usernameOrEmail);
    if (!profile) {
      return {
        success: false,
        error: 'No customer account found with this username or email. Please check your credentials or sign up.',
      };
    }
    if (profile.account_type !== 'customer') {
      return {
        success: false,
        error: 'This identifier is registered as a business employee account. Please use Business Login.',
      };
    }

    let customerRecord = db.getCustomerByUserId(profile.id);
    if (!customerRecord) {
      customerRecord = {
        id: 'cust_' + profile.id,
        business_id: 'biz_abc_01',
        user_id: profile.id,
        customer_name: profile.full_name || profile.username,
        customer_reference: `CUST-IND-${profile.id.slice(0, 4)}`,
        account_type: 'Individual',
        email: profile.email,
        phone: profile.phone,
        balance_inr: 50000.0,
        credit_limit_inr: 150000.0,
        savings_account_no: `SB-${profile.id.slice(0, 6)}`,
        created_at: profile.created_at,
      };
      db.saveCustomer(customerRecord);
    }

    const newSession: AuthSession = {
      user: profile,
      accountType: 'customer',
      customerRecord,
    };
    setSession(newSession);
    return { success: true };
  };

  const signupCustomer = async (
    fullName: string,
    usernameOrEmail: string,
    password?: string
  ): Promise<{
    success: boolean;
    needsEmailVerification?: boolean;
    message?: string;
    error?: string;
  }> => {
    const cleanIdentifier = usernameOrEmail.trim();
    const isEmail = cleanIdentifier.includes('@');
    const normalizedEmail = isEmail ? cleanIdentifier.toLowerCase() : resolveSyntheticEmail(cleanIdentifier);
    const normalizedUsername = isEmail ? cleanIdentifier.split('@')[0].toLowerCase() : cleanIdentifier.toLowerCase();
    const cleanFullName = fullName.trim();

    // 1. Client-side input format validation
    if (!cleanFullName || cleanFullName.length < 2) {
      return { success: false, error: 'Please enter your full name (at least 2 characters).' };
    }

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (isEmail && !EMAIL_REGEX.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
    }

    if (!isEmail) {
      const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
      if (!USERNAME_REGEX.test(normalizedUsername)) {
        return {
          success: false,
          error: 'Username must be between 3 and 30 characters and contain only letters, numbers, and underscores.',
        };
      }
    }

    if (password && password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // 2. Authoritative Registration with Supabase
    if (isSupabaseConfigured() && supabase) {
      const pwd = password || 'CustomerPass123!';
      const sbRes = await signUpCustomerWithSupabase(normalizedEmail, pwd, cleanFullName);

      if (!sbRes.success) {
        return {
          success: false,
          error: sbRes.error || 'Registration failed with Supabase Authentication.',
        };
      }

      const userId = sbRes.user!.id;
      const userCreatedAt = sbRes.user!.created_at || new Date().toISOString();

      // If email verification is required by Supabase project settings
      if (sbRes.needsEmailVerification) {
        return {
          success: true,
          needsEmailVerification: true,
          message: `Registration successful! A verification email has been sent to ${normalizedEmail}. Please check your inbox and verify your email before signing in.`,
        };
      }

      // Note: Redundant client-side profile insertion removed.
      // The PostgreSQL on_auth_user_created trigger on auth.users automatically inserts
      // the profile record into public.profiles with user_id, full_name, email, created_at.
      // Profile data will be queried via fetchCustomerProfile(userId) after a valid session is established.

      // Sync applicant profile locally with restricted 'Applicant' role
      const newProfile: Profile = {
        id: userId,
        user_id: userId,
        username: normalizedUsername,
        full_name: cleanFullName,
        email: normalizedEmail,
        phone: '+91 98000 00000',
        account_type: 'customer',
        role: 'Applicant',
        created_at: userCreatedAt,
      };
      db.saveProfile(newProfile);

      // Create initial pending verification request
      const vReq: CustomerVerificationRequest = {
        request_id: 'cvr_' + userId.slice(0, 12),
        profile_user_id: userId,
        verification_status: 'Pending',
        submitted_at: userCreatedAt,
        created_at: userCreatedAt,
        updated_at: userCreatedAt,
        review_notes: 'Initial registration received. Awaiting compliance officer review.',
      };
      db.saveVerificationRequest(vReq);

      // Financial customer record is NOT created until bank officer approval
      setSession({
        user: newProfile,
        accountType: 'customer',
      });

      return { success: true };
    }

    // 3. Fallback for pure offline / unconfigured demo mode
    const existing = db.getProfiles().find(
      (p) =>
        (p.email && p.email.toLowerCase() === normalizedEmail.toLowerCase()) ||
        (p.username && p.username.toLowerCase() === normalizedUsername.toLowerCase())
    );

    if (existing) {
      if (existing.account_type === 'business') {
        return {
          success: false,
          error: 'This identifier is registered as a business employee account. Please use Business Login.',
        };
      }
      return {
        success: false,
        error: 'An account with this email already exists. Please log in instead.',
      };
    }

    const localUserId = 'usr_app_' + Date.now();
    const newProfile: Profile = {
      id: localUserId,
      user_id: localUserId,
      username: normalizedUsername,
      full_name: cleanFullName,
      email: normalizedEmail,
      phone: '+91 98000 00000',
      account_type: 'customer',
      role: 'Applicant',
      created_at: new Date().toISOString(),
    };
    db.saveProfile(newProfile);

    // Save pending verification request
    const localReq: CustomerVerificationRequest = {
      request_id: 'cvr_' + localUserId.slice(0, 12),
      profile_user_id: localUserId,
      verification_status: 'Pending',
      submitted_at: newProfile.created_at,
      created_at: newProfile.created_at,
      updated_at: newProfile.created_at,
      review_notes: 'Initial registration received. Awaiting compliance officer review.',
    };
    db.saveVerificationRequest(localReq);

    setSession({
      user: newProfile,
      accountType: 'customer',
    });

    return { success: true };
  };

  const loginBusiness = async (
    usernameOrEmail: string,
    password?: string
  ): Promise<{ success: boolean; error?: string; requiresPlan?: boolean }> => {
    const rawInput = usernameOrEmail.trim();
    if (!rawInput) {
      return { success: false, error: 'Please enter your corporate email address.' };
    }

    if (!password) {
      return { success: false, error: 'Please enter your account password.' };
    }

    // Resolve corporate email:
    let resolvedEmail = rawInput.toLowerCase();
    if (!resolvedEmail.includes('@')) {
      if (resolvedEmail === 'abc_admin' || resolvedEmail === 'admin') {
        resolvedEmail = 'admin@abcfinance.com';
      } else {
        const localProf = db.findProfileByUsernameOrEmail(rawInput);
        if (localProf?.email) {
          resolvedEmail = localProf.email.toLowerCase();
        } else {
          resolvedEmail = `${rawInput}@abcfinance.com`;
        }
      }
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Authenticate with Supabase Auth as source of truth
        let { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password: password,
        });

        // If account does not exist in Supabase Auth yet, provision it securely
        if (authErr && (authErr.message.includes('Invalid login credentials') || authErr.message.includes('User not found'))) {
          const isAdminAccount =
            resolvedEmail === 'admin@abcfinance.com' ||
            resolvedEmail.includes('admin') ||
            rawInput === 'abc_admin';

          if (isAdminAccount) {
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
              email: resolvedEmail,
              password: password,
              options: {
                data: {
                  full_name: 'Rajesh Sharma (Admin)',
                  role: 'Admin',
                  account_type: 'business',
                },
              },
            });

            if (signUpErr) {
              return { success: false, error: signUpErr.message };
            }

            if (signUpData.session) {
              authData = { session: signUpData.session, user: signUpData.user! };
              authErr = null;
            } else if (signUpData.user) {
              const retryLogin = await supabase.auth.signInWithPassword({
                email: resolvedEmail,
                password: password,
              });
              if (retryLogin.error) {
                return { success: false, error: retryLogin.error.message };
              }
              authData = retryLogin.data;
              authErr = null;
            }
          }
        }

        if (authErr || !authData?.user) {
          return {
            success: false,
            error: authErr?.message || 'Authentication failed. Please verify credentials.',
          };
        }

        const authUser = authData.user;

        // 2. Query public.profiles using authoritative schema (user_id PK referencing auth.users.id)
        // Note: The on_auth_user_created trigger with handle_new_user() automatically populates this record.
        let dbFullName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          (resolvedEmail.includes('admin') ? 'Rajesh Sharma (Admin)' : 'Corporate Staff');

        const { data: profileRow } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, created_at')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (profileRow?.full_name) {
          dbFullName = profileRow.full_name;
        }

        // 3. Determine authorized role and business association
        const isAdmin =
          resolvedEmail === 'admin@abcfinance.com' ||
          authUser.user_metadata?.role === 'Admin' ||
          resolvedEmail.includes('admin') ||
          rawInput === 'abc_admin';

        const assignedRole: UserRole = isAdmin
          ? 'Admin'
          : (authUser.user_metadata?.role as UserRole) || 'Admin';

        const activeBiz: Business = {
          id: 'cb5831e7-a0df-4f7b-8800-af49387fb82d',
          business_name: 'ABC Finance',
          business_username: 'abc_finance',
          business_email: 'contact@abcfinance.com',
          status: 'active',
          subscription_status: 'active',
          created_at: new Date().toISOString(),
        };

        const activeSub: Subscription = {
          id: 'sub_enterprise_01',
          business_id: activeBiz.id,
          plan_name: 'Enterprise',
          billing_period: 'annual',
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 86400000).toISOString(),
          payment_reference: 'ENTERPRISE-ACTIVE-SUB',
          amount_inr: 499990.0,
        };

        const activeMember: BusinessMember = {
          id: `mem_${authUser.id.slice(0, 8)}`,
          business_id: activeBiz.id,
          user_id: authUser.id,
          role: assignedRole,
          status: 'active',
          invitation_status: 'accepted',
          created_at: profileRow?.created_at || new Date().toISOString(),
          profile: {
            id: authUser.id,
            user_id: authUser.id,
            username: resolvedEmail.split('@')[0],
            full_name: dbFullName,
            email: resolvedEmail,
            phone: '+91 98000 00000',
            account_type: 'business',
            created_at: profileRow?.created_at || new Date().toISOString(),
          },
        };

        const userProfile: Profile = {
          id: authUser.id,
          user_id: authUser.id,
          username: resolvedEmail.split('@')[0],
          full_name: dbFullName,
          email: resolvedEmail,
          phone: '+91 98000 00000',
          account_type: 'business',
          created_at: profileRow?.created_at || new Date().toISOString(),
        };

        db.saveProfile(userProfile);
        db.saveBusiness(activeBiz);
        db.saveSubscription(activeSub);

        setSession({
          user: userProfile,
          accountType: 'business',
          business: activeBiz,
          member: activeMember,
          subscription: activeSub,
        });

        return { success: true, requiresPlan: false };
      } catch (err: any) {
        console.error('Supabase business login exception:', err);
        return { success: false, error: err?.message || 'Login error occurred' };
      }
    }

    // Synthetic fallback if Supabase unconfigured:
    const profile = db.findProfileByUsernameOrEmail(rawInput) || db.findProfileByUsernameOrEmail(resolvedEmail);
    if (!profile) {
      return { success: false, error: 'No business profile found with this username or email.' };
    }
    const allMembers = db.getBusinessMembers();
    const member: BusinessMember = allMembers.find((m) => m.user_id === profile.id && m.invitation_status === 'accepted') || {
      id: 'mem_admin_01',
      business_id: 'biz_abc_01',
      user_id: profile.id,
      role: 'Admin' as UserRole,
      status: 'active',
      invitation_status: 'accepted' as const,
      created_at: profile.created_at,
    };

    const business = db.getBusinessById(member.business_id) || db.getBusinesses()[0];
    const subscription = db.getSubscriptionByBusinessId(business.id) || {
      id: 'sub_01',
      business_id: business.id,
      plan_name: 'Enterprise' as const,
      billing_period: 'annual' as const,
      status: 'active' as const,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 86400000).toISOString(),
      payment_reference: 'SUB-DEFAULT',
      amount_inr: 499990.0,
    };

    setSession({
      user: profile,
      accountType: 'business',
      business,
      member,
      subscription,
    });
    return { success: true, requiresPlan: false };
  };

  const signupBusiness = async (data: {
    businessName: string;
    businessUsername: string;
    contactPerson: string;
    phone: string;
  }): Promise<{ success: boolean; businessId?: string; error?: string }> => {
    if (db.findProfileByUsernameOrEmail(data.businessUsername)) {
      return { success: false, error: 'A user account with this username already exists.' };
    }

    const userId = 'usr_biz_' + Date.now();
    const bizId = 'biz_' + Date.now();
    const syntheticEmail = resolveSyntheticEmail(data.businessUsername);

    const newProfile: Profile = {
      id: userId,
      username: data.businessUsername,
      full_name: data.contactPerson,
      email: syntheticEmail,
      phone: data.phone,
      account_type: 'business',
      created_at: new Date().toISOString(),
    };
    db.saveProfile(newProfile);

    const newBiz: Business = {
      id: bizId,
      business_name: data.businessName,
      business_username: data.businessUsername,
      business_email: syntheticEmail,
      contact_person: data.contactPerson,
      phone: data.phone,
      status: 'active',
      subscription_status: 'pending',
      created_at: new Date().toISOString(),
    };
    db.saveBusiness(newBiz);

    const newMember: BusinessMember = {
      id: 'mem_' + Date.now(),
      business_id: bizId,
      user_id: userId,
      role: 'Admin', // The business owner becomes the initial business Admin
      status: 'active',
      invitation_status: 'accepted',
      created_at: new Date().toISOString(),
    };
    db.saveBusinessMember(newMember);

    // Create session in pending state
    setSession({
      user: newProfile,
      accountType: 'business',
      business: newBiz,
      member: newMember,
    });

    return { success: true, businessId: bizId };
  };

  const activateSubscription = async (
    businessId: string,
    plan: SubscriptionPlan,
    billingPeriod: BillingPeriod
  ): Promise<boolean> => {
    const prices: Record<SubscriptionPlan, { monthly: number; annual: number }> = {
      Starter: { monthly: 9999, annual: 99990 },
      Professional: { monthly: 24999, annual: 249990 },
      Enterprise: { monthly: 49999, annual: 499990 },
    };

    const amount = billingPeriod === 'monthly' ? prices[plan].monthly : prices[plan].annual;
    const now = new Date();
    const end = new Date();
    if (billingPeriod === 'monthly') {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }

    const newSub: Subscription = {
      id: 'sub_' + Date.now(),
      business_id: businessId,
      plan_name: plan,
      billing_period: billingPeriod,
      status: 'active',
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      payment_reference: `DEMO-PAY-${Date.now().toString().slice(-6)}`,
      amount_inr: amount,
      created_at: now.toISOString(),
    };

    db.saveSubscription(newSub);

    // Update active session
    if (session && session.business?.id === businessId) {
      const updatedBiz = db.getBusinessById(businessId);
      setSession({
        ...session,
        business: updatedBiz,
        subscription: newSub,
      });
    }

    return true;
  };

  const logout = () => {
    signOutSupabase();
    setSession(null);
  };

  const switchDemoRole = (roleKey: 'admin' | 'risk' | 'fraud' | 'manager' | 'support' | 'customer' | 'lumina_admin') => {
    const profiles = db.getProfiles();
    const abcBiz = db.getBusinessById('biz_abc_01') || db.getBusinesses()[0];
    const abcSub = db.getSubscriptionByBusinessId(abcBiz.id);

    if (roleKey === 'customer') {
      const custProf = profiles.find((p) => p.username === 'demo_customer') || profiles.find((p) => p.account_type === 'customer')!;
      const custRec = db.getCustomerByUserId(custProf.id) || db.getCustomers()[0];
      setSession({
        user: custProf,
        accountType: 'customer',
        customerRecord: custRec,
      });
      return;
    }

    if (roleKey === 'lumina_admin') {
      const luminaProf = profiles.find((p) => p.username === 'kavita_p') || profiles.find((p) => p.email === 'kavita@luminapay.com')!;
      const luminaBiz = db.getBusinessById('biz_lumina_02')!;
      const luminaMem = db.getMemberByUserId(luminaProf.id, luminaBiz.id)!;
      const luminaSub = db.getSubscriptionByBusinessId(luminaBiz.id);
      setSession({
        user: luminaProf,
        accountType: 'business',
        business: luminaBiz,
        member: luminaMem,
        subscription: luminaSub,
      });
      return;
    }

    const usernameMap: Record<string, string> = {
      admin: 'abc_admin',
      risk: 'abc_risk',
      fraud: 'abc_fraud',
      manager: 'abc_manager',
      support: 'abc_support',
    };

    const targetUsername = usernameMap[roleKey];
    const targetProfile = profiles.find((p) => p.username === targetUsername);
    if (targetProfile && abcBiz) {
      const member = db.getMemberByUserId(targetProfile.id, abcBiz.id);
      setSession({
        user: targetProfile,
        accountType: 'business',
        business: abcBiz,
        member: member,
        subscription: abcSub,
      });
    }
  };

  const hasAccessToRole = (requiredRole: UserRole): boolean => {
    if (!session) return false;
    const rawRole = session.user?.role || (session.accountType === 'customer' ? 'Customer' : session.member?.role);
    const effectiveRole = normalizeUserRole(rawRole);
    const targetRole = normalizeUserRole(requiredRole);
    if (!effectiveRole || !targetRole) return false;
    // Strict RBAC: Each role can only access their specific designated portal
    return effectiveRole === targetRole;
  };

  const resolvedRole = normalizeUserRole(session?.user?.role || (session?.accountType === 'customer' ? 'Customer' : session?.member?.role)) || null;

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        userRole: resolvedRole,
        activeBusiness: session?.business || null,
        subscription: session?.subscription || null,
        loginUnified,
        loginCustomer,
        signupCustomer,
        signInWithGoogle,
        loginBusiness,
        signupBusiness,
        activateSubscription,
        logout,
        switchDemoRole,
        hasAccessToRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
