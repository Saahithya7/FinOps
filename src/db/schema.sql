-- ==============================================================================
-- FinOps AI — Database Schema & Row-Level Security (PostgreSQL / Supabase)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone VARCHAR(50),
  account_type VARCHAR(50) DEFAULT 'customer' CHECK (account_type IN ('customer', 'business')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. BUSINESSES (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(255) NOT NULL,
  business_email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  contact_person VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'pending' CHECK (subscription_status IN ('active', 'trial', 'pending', 'cancelled', 'expired')),
  gstin VARCHAR(50),
  cin VARCHAR(50),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESS_MEMBERS (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'Customer',
    'Risk Analyst',
    'Fraud & Compliance Analyst',
    'Manager',
    'Support Agent',
    'Admin'
  )),
  invitation_status VARCHAR(50) DEFAULT 'accepted' CHECK (invitation_status IN ('accepted', 'pending', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_business_user UNIQUE(business_id, user_id)
);

-- 4. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_name VARCHAR(50) NOT NULL CHECK (plan_name IN ('Starter', 'Professional', 'Enterprise')),
  billing_period VARCHAR(50) NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'pending', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  payment_reference VARCHAR(255) NOT NULL,
  amount_inr NUMERIC(15, 2) NOT NULL DEFAULT 0.00
);

-- 5. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_reference VARCHAR(100) NOT NULL UNIQUE,
  account_type VARCHAR(50) DEFAULT 'Individual' CHECK (account_type IN ('Individual', 'Corporate', 'Priority', 'NRI')),
  email VARCHAR(255),
  phone VARCHAR(50),
  balance_inr NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  credit_limit_inr NUMERIC(15, 2) NOT NULL DEFAULT 100000.00,
  savings_account_no VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('Credit', 'Debit', 'Transfer', 'UPI', 'NEFT', 'RTGS', 'IMPS')),
  category VARCHAR(100) NOT NULL,
  transaction_amount NUMERIC(15, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_status VARCHAR(50) NOT NULL CHECK (transaction_status IN ('Completed', 'Pending', 'Flagged', 'Rejected', 'Reversed')),
  merchant VARCHAR(255),
  description TEXT,
  reference_no VARCHAR(100) NOT NULL UNIQUE
);

-- 7. RISK_ASSESSMENTS
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  credit_score INT NOT NULL CHECK (credit_score BETWEEN 300 AND 900),
  loan_amount NUMERIC(15, 2) NOT NULL,
  loan_purpose VARCHAR(255) NOT NULL,
  debt_to_income_ratio NUMERIC(5, 2) NOT NULL, -- percentage
  risk_rating VARCHAR(50) NOT NULL CHECK (risk_rating IN ('Low', 'Moderate', 'High', 'Critical')),
  assessment_status VARCHAR(50) NOT NULL CHECK (assessment_status IN ('Under Review', 'Approved', 'Conditional', 'Rejected')),
  monthly_income_inr NUMERIC(15, 2) NOT NULL,
  existing_liabilities_inr NUMERIC(15, 2) NOT NULL,
  collateral_value_inr NUMERIC(15, 2) DEFAULT 0.00,
  assessed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TRANSACTION_INVESTIGATIONS
CREATE TABLE IF NOT EXISTS transaction_investigations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  case_number VARCHAR(100) NOT NULL UNIQUE,
  risk_score INT NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  investigation_status VARCHAR(50) NOT NULL CHECK (investigation_status IN (
    'Open', 'Under Investigation', 'Escalated to Manager', 'Confirmed Fraud', 'Cleared'
  )),
  assigned_to VARCHAR(255) NOT NULL,
  investigation_notes TEXT,
  flag_reason VARCHAR(255) NOT NULL,
  device_ip VARCHAR(50),
  location VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MANAGER_REVIEWS
CREATE TABLE IF NOT EXISTS manager_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  case_reference VARCHAR(100) NOT NULL,
  case_type VARCHAR(100) NOT NULL,
  assigned_manager VARCHAR(255) NOT NULL,
  review_status VARCHAR(50) NOT NULL CHECK (review_status IN ('Pending', 'Approved', 'Rejected', 'Needs Information')),
  decision VARCHAR(255),
  review_notes TEXT,
  requested_amount_inr NUMERIC(15, 2),
  escalated_by VARCHAR(255) NOT NULL,
  priority VARCHAR(50) DEFAULT 'Standard',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SUPPORT_TICKETS
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  assigned_agent VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  priority VARCHAR(50) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed')),
  category VARCHAR(100) NOT NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ADMIN_ACTIVITY (Audit Log)
CREATE TABLE IF NOT EXISTS admin_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  target_reference VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. BUSINESS_INVITATIONS
CREATE TABLE IF NOT EXISTS business_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  assigned_role VARCHAR(50) NOT NULL CHECK (assigned_role IN (
    'Customer', 'Risk Analyst', 'Fraud & Compliance Analyst', 'Manager', 'Support Agent', 'Admin'
  )),
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  invited_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & TENANCY FILTERING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_members_biz ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_biz ON transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_tx_cust ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_risk_biz ON risk_assessments(business_id);
CREATE INDEX IF NOT EXISTS idx_fraud_biz ON transaction_investigations(business_id);
CREATE INDEX IF NOT EXISTS idx_tickets_biz ON support_tickets(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_biz ON admin_activity(business_id);

-- ==============================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES & AUTOMATED TRIGGERS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity ENABLE ROW LEVEL SECURITY;

-- 1. Automated Profile Creation Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  extracted_name TEXT;
  extracted_email TEXT;
BEGIN
  extracted_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(CONCAT_WS(' ', NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'family_name')), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
    'Valued Customer'
  );

  extracted_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');

  INSERT INTO public.profiles (user_id, full_name, email, created_at)
  VALUES (
    NEW.id,
    extracted_name,
    extracted_email,
    COALESCE(NEW.created_at, timezone('utc'::text, now()))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Provide safe diagnostics to PostgreSQL server logs with exact SQLERRM and SQLSTATE
    RAISE LOG 'handle_new_user exception for auth user % (%): % (SQLSTATE: %)',
      NEW.id, NEW.email, SQLERRM, SQLSTATE;
    -- Re-raise exception to preserve transaction integrity and prevent silent failures
    RAISE EXCEPTION 'Failed to create public.profile for user %: % (SQLSTATE: %)',
      NEW.id, SQLERRM, SQLSTATE;
END;
$$;

-- Function permissions: Grant execute to postgres, service_role, and supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
    GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
  END IF;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Helper security function: get current authenticated user's business
CREATE OR REPLACE FUNCTION get_current_user_business_id()
RETURNS UUID AS $$
  SELECT business_id FROM business_members
  WHERE user_id = auth.uid() AND invitation_status = 'accepted'
  LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Enforce multi-tenant isolation: Users only see records belonging to their business
CREATE POLICY "Tenant isolation for transactions" ON transactions
  FOR ALL USING (business_id = get_current_user_business_id());

CREATE POLICY "Tenant isolation for risk assessments" ON risk_assessments
  FOR ALL USING (business_id = get_current_user_business_id());

CREATE POLICY "Tenant isolation for fraud investigations" ON transaction_investigations
  FOR ALL USING (business_id = get_current_user_business_id());

-- Customers can only select their own transactions
CREATE POLICY "Customer self access to transactions" ON transactions
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );
