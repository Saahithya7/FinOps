-- ==============================================================================
-- FinOps AI — Supabase SQL Migration for 12 Authoritative Tables & RLS Policies
-- Execute in Supabase SQL Editor to grant table privileges and configure RLS.
-- ==============================================================================

-- 1. Ensure Schema Usages & Table Grants for Authenticated and Anon Roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Default privileges for any future tables created
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

-- 2. Explicit Table Grants for all 12 tables
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'profiles', 'customers', 'transactions', 'fraud_alerts', 'fraud_analysis',
    'risk_assessments', 'customer_risk_profiles', 'manager_reviews',
    'support_tickets', 'admin_activity_logs', 'organizations', 'memberships'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated;', tbl);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    END IF;
  END LOOP;
END $$;

-- 3. PROFILES Table RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. TRANSACTIONS Table RLS
DROP POLICY IF EXISTS "Authenticated users can select transactions" ON public.transactions;
CREATE POLICY "Authenticated users can select transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.transactions;
CREATE POLICY "Authenticated users can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update transactions" ON public.transactions;
CREATE POLICY "Authenticated users can update transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. CUSTOMERS Table RLS
DROP POLICY IF EXISTS "Authenticated users can select customers" ON public.customers;
CREATE POLICY "Authenticated users can select customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Authenticated users can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Authenticated users can update customers"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. ORGANIZATIONS & MEMBERSHIPS RLS
DROP POLICY IF EXISTS "Authenticated users can select organizations" ON public.organizations;
CREATE POLICY "Authenticated users can select organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON public.organizations;
CREATE POLICY "Authenticated users can insert organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can select memberships" ON public.memberships;
CREATE POLICY "Authenticated users can select memberships"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert memberships" ON public.memberships;
CREATE POLICY "Authenticated users can insert memberships"
  ON public.memberships FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. FRAUD ALERTS & FRAUD ANALYSIS RLS
DROP POLICY IF EXISTS "Authenticated users can select fraud_alerts" ON public.fraud_alerts;
CREATE POLICY "Authenticated users can select fraud_alerts"
  ON public.fraud_alerts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert fraud_alerts" ON public.fraud_alerts;
CREATE POLICY "Authenticated users can insert fraud_alerts"
  ON public.fraud_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update fraud_alerts" ON public.fraud_alerts;
CREATE POLICY "Authenticated users can update fraud_alerts"
  ON public.fraud_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can select fraud_analysis" ON public.fraud_analysis;
CREATE POLICY "Authenticated users can select fraud_analysis"
  ON public.fraud_analysis FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert fraud_analysis" ON public.fraud_analysis;
CREATE POLICY "Authenticated users can insert fraud_analysis"
  ON public.fraud_analysis FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. RISK ASSESSMENTS & CUSTOMER RISK PROFILES RLS
DROP POLICY IF EXISTS "Authenticated users can select risk_assessments" ON public.risk_assessments;
CREATE POLICY "Authenticated users can select risk_assessments"
  ON public.risk_assessments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert risk_assessments" ON public.risk_assessments;
CREATE POLICY "Authenticated users can insert risk_assessments"
  ON public.risk_assessments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update risk_assessments" ON public.risk_assessments;
CREATE POLICY "Authenticated users can update risk_assessments"
  ON public.risk_assessments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can select customer_risk_profiles" ON public.customer_risk_profiles;
CREATE POLICY "Authenticated users can select customer_risk_profiles"
  ON public.customer_risk_profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert customer_risk_profiles" ON public.customer_risk_profiles;
CREATE POLICY "Authenticated users can insert customer_risk_profiles"
  ON public.customer_risk_profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 9. MANAGER REVIEWS RLS
DROP POLICY IF EXISTS "Authenticated users can select manager_reviews" ON public.manager_reviews;
CREATE POLICY "Authenticated users can select manager_reviews"
  ON public.manager_reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert manager_reviews" ON public.manager_reviews;
CREATE POLICY "Authenticated users can insert manager_reviews"
  ON public.manager_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update manager_reviews" ON public.manager_reviews;
CREATE POLICY "Authenticated users can update manager_reviews"
  ON public.manager_reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 10. SUPPORT TICKETS RLS
DROP POLICY IF EXISTS "Authenticated users can select support_tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can select support_tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert support_tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can insert support_tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update support_tickets" ON public.support_tickets;
CREATE POLICY "Authenticated users can update support_tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 11. ADMIN ACTIVITY LOGS RLS
DROP POLICY IF EXISTS "Authenticated users can select admin_activity_logs" ON public.admin_activity_logs;
CREATE POLICY "Authenticated users can select admin_activity_logs"
  ON public.admin_activity_logs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert admin_activity_logs" ON public.admin_activity_logs;
CREATE POLICY "Authenticated users can insert admin_activity_logs"
  ON public.admin_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 12. Automated Profile Trigger (Preserving transaction integrity and role execution)
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
    RAISE LOG 'handle_new_user exception for auth user % (%): % (SQLSTATE: %)',
      NEW.id, NEW.email, SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Failed to create public.profile for user %: % (SQLSTATE: %)',
      NEW.id, SQLERRM, SQLSTATE;
END;
$$;

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
