-- ==============================================================================
-- FINOPS AI: AUTHORITATIVE SCHEMA MIGRATION & AUDIT-VERIFIED BANK VERIFICATION
-- ==============================================================================
-- Reviewed and corrected according to architectural requirements:
-- 1. NO hardcoded admin grant during public signup; every new user receives 'Applicant'.
-- 2. Secure customer verification request workflow with separate application roles
--    and bank verification statuses.
-- 3. Dynamic organization resolution (zero hardcoded UUID dependencies).
-- 4. Non-recursive RLS policies using STABLE SECURITY DEFINER helper functions.
-- 5. Hardened change_user_role() RPC using the actual existing admin_activity_logs schema.
-- 6. handle_new_user() trigger creates applicant profile & pending verification request.
-- 7. Verified customers table kept strictly separate from login profiles.
-- 8. Explicit, dependency-safe database reset script provided as a SEPARATE review block
--    with NO automatic destructive execution.
-- ==============================================================================

-- ==============================================================================
-- PART 1: SCHEMA MODIFICATIONS & TABLE CREATION
-- ==============================================================================

-- 1.1 PROFILES: Add role column with strict constraint
DO $$
BEGIN
  -- Add role column if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'Applicant';
  END IF;

  -- Ensure check constraint for authoritative allowed roles:
  -- Applicant, Customer, Admin, Manager, Risk Analyst, Fraud & Compliance Analyst, Support Agent
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('Applicant', 'Customer', 'Admin', 'Manager', 'Risk Analyst', 'Fraud & Compliance Analyst', 'Support Agent'));
END $$;

-- 1.2 CUSTOMER VERIFICATION REQUESTS TABLE
-- Tracks applicant identity verification before financial customer status is granted.
CREATE TABLE IF NOT EXISTS public.customer_verification_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(organization_id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'Pending' 
    CHECK (verification_status IN ('Pending', 'Under Review', 'Approved', 'Rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_active_verification UNIQUE (profile_user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_cvr_profile ON public.customer_verification_requests(profile_user_id);
CREATE INDEX IF NOT EXISTS idx_cvr_status ON public.customer_verification_requests(verification_status);
CREATE INDEX IF NOT EXISTS idx_cvr_org ON public.customer_verification_requests(organization_id);

-- 1.3 Ensure default organization exists safely without hardcoded UUID assumption
DO $$
DECLARE
  v_org_count INT;
BEGIN
  SELECT COUNT(*) INTO v_org_count FROM public.organizations;
  IF v_org_count = 0 THEN
    INSERT INTO public.organizations (organization_id, organization_name, created_at)
    VALUES (
      gen_random_uuid(),
      'ABC Finance Bank',
      NOW()
    );
  END IF;
END $$;

-- ==============================================================================
-- PART 2: NON-RECURSIVE SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================
-- These functions run with database owner privileges and search_path = public, auth, pg_temp.
-- They query public.profiles directly without triggering RLS recursion.

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.profiles
  WHERE user_id = auth.uid();
  RETURN COALESCE(v_role, 'Applicant');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'Admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_bank_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() 
      AND role IN ('Admin', 'Manager', 'Risk Analyst', 'Fraud & Compliance Analyst', 'Support Agent')
  );
$$;

-- Function permissions
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_bank_staff() TO anon, authenticated;

-- ==============================================================================
-- PART 3: PUBLIC SIGNUP TRIGGER FUNCTION (handle_new_user)
-- ==============================================================================
-- Rules:
-- 1. Public signups ALWAYS receive the restricted 'Applicant' role by default.
-- 2. NO hardcoded admin grant based on email (e.g. admin@abcfinance.com).
-- 3. Users cannot elevate their own role through signup metadata.
-- 4. Automatically creates a pending verification request in customer_verification_requests.
-- 5. Resolves organization dynamically without hardcoded UUIDs.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  extracted_name TEXT;
  extracted_email TEXT;
  v_org_id UUID;
BEGIN
  -- Extract full name safely from metadata or email prefix
  extracted_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(CONCAT_WS(' ', NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'family_name')), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
    'Applicant'
  );

  extracted_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');

  -- Insert profile with restricted 'Applicant' role
  -- If profile already exists (e.g. pre-existing admin), do NOT overwrite role
  INSERT INTO public.profiles (user_id, full_name, email, role, created_at)
  VALUES (
    NEW.id,
    extracted_name,
    extracted_email,
    'Applicant',
    COALESCE(NEW.created_at, NOW())
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email
    WHERE public.profiles.role IS NULL;

  -- Resolve organization_id dynamically without hardcoded UUID
  SELECT organization_id INTO v_org_id
  FROM public.organizations
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (organization_id, organization_name, created_at)
    VALUES (gen_random_uuid(), 'ABC Finance Bank', NOW())
    RETURNING organization_id INTO v_org_id;
  END IF;

  -- Create initial pending verification request for new applicant
  INSERT INTO public.customer_verification_requests (
    request_id,
    profile_user_id,
    organization_id,
    verification_status,
    submitted_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    v_org_id,
    'Pending',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (profile_user_id, organization_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user exception for auth user % (%): % (SQLSTATE: %)',
      NEW.id, NEW.email, SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Failed to create applicant profile and verification request: % (SQLSTATE: %)',
      SQLERRM, SQLSTATE;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

-- ==============================================================================
-- PART 4: BANK VERIFICATION REVIEW RPC (review_customer_verification)
-- ==============================================================================
-- Allows authorized bank staff to review, approve, or reject applicant verifications.
-- On approval:
-- 1. Updates verification request to 'Approved'.
-- 2. Transactionally creates or activates a record in public.customers.
-- 3. Updates profile role to 'Customer'.
-- 4. Logs to admin_activity_logs using exact existing schema.
CREATE OR REPLACE FUNCTION public.review_customer_verification(
  p_request_id UUID,
  p_decision TEXT, -- 'Approved' | 'Rejected' | 'Under Review'
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_reviewer_role TEXT;
  v_request RECORD;
  v_profile RECORD;
  v_org_id UUID;
  v_existing_customer_id UUID;
  v_new_customer_code TEXT;
BEGIN
  -- 1. Authentication check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 2. Authorization check: caller must be bank staff
  SELECT role INTO v_reviewer_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF v_reviewer_role IS NULL OR v_reviewer_role NOT IN ('Admin', 'Manager', 'Support Agent', 'Risk Analyst', 'Fraud & Compliance Analyst') THEN
    RAISE EXCEPTION 'Access Denied: Only authorized bank employees may review customer verifications.';
  END IF;

  -- 3. Input validation
  IF p_decision NOT IN ('Approved', 'Rejected', 'Under Review') THEN
    RAISE EXCEPTION 'Invalid decision status. Allowed: Approved, Rejected, Under Review.';
  END IF;

  -- 4. Locate request
  SELECT * INTO v_request
  FROM public.customer_verification_requests
  WHERE request_id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verification request % not found.', p_request_id;
  END IF;

  -- 5. Locate profile
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_request.profile_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Applicant profile not found for user %.', v_request.profile_user_id;
  END IF;

  -- 6. Resolve organization ID safely
  v_org_id := v_request.organization_id;
  IF v_org_id IS NULL THEN
    SELECT organization_id INTO v_org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
    IF v_org_id IS NULL THEN
      INSERT INTO public.organizations (organization_id, organization_name, created_at)
      VALUES (gen_random_uuid(), 'ABC Finance Bank', NOW())
      RETURNING organization_id INTO v_org_id;
    END IF;
  END IF;

  -- 7. Update verification request status
  UPDATE public.customer_verification_requests
  SET
    verification_status = p_decision,
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    review_notes = COALESCE(p_notes, review_notes),
    updated_at = NOW()
  WHERE request_id = p_request_id;

  -- 8. If Approved: Create/activate verified customer record & update profile role
  IF p_decision = 'Approved' THEN
    SELECT customer_id INTO v_existing_customer_id
    FROM public.customers
    WHERE profile_id = v_profile.user_id AND organization_id = v_org_id
    LIMIT 1;

    IF v_existing_customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET customer_status = 'Active'
      WHERE customer_id = v_existing_customer_id;
    ELSE
      v_new_customer_code := 'CUST-' || UPPER(SUBSTRING(v_profile.user_id::text, 1, 8));

      INSERT INTO public.customers (
        customer_id,
        customer_code,
        customer_name,
        organization_id,
        account_type,
        city,
        gender,
        customer_status,
        profile_id,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        v_new_customer_code,
        COALESCE(v_profile.full_name, 'Verified Customer'),
        v_org_id,
        'Individual',
        'Mumbai',
        'Not Specified',
        'Active',
        v_profile.user_id,
        NOW()
      );
    END IF;

    -- Update profile role to verified Customer
    UPDATE public.profiles
    SET role = 'Customer'
    WHERE user_id = v_profile.user_id;
  END IF;

  -- 9. Record in admin_activity_logs using exact schema
  INSERT INTO public.admin_activity_logs (
    log_id,
    user_id,
    organization_id,
    action,
    details,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    auth.uid(),
    v_org_id,
    'Review Verification',
    'Decision: ' || p_decision || ' for applicant ' || COALESCE(v_profile.email, v_profile.user_id::text) || ' (' || COALESCE(p_notes, 'No notes') || ')',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'decision', p_decision,
    'profile_user_id', v_request.profile_user_id,
    'reviewed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_customer_verification(UUID, TEXT, TEXT) TO authenticated;

-- ==============================================================================
-- PART 5: ROLE ASSIGNMENT RPC (change_user_role)
-- ==============================================================================
-- Validates:
-- 1. Authenticated caller is an Admin.
-- 2. Target role is in allowed set.
-- 3. Caller cannot demote their own Admin account.
-- 4. Syncs memberships table if present.
-- 5. Logs to admin_activity_logs using actual columns (log_id, user_id, organization_id, action, details, created_at).
CREATE OR REPLACE FUNCTION public.change_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_role TEXT;
  v_target_profile RECORD;
  v_org_id UUID;
  v_allowed_roles TEXT[] := ARRAY['Applicant', 'Customer', 'Admin', 'Manager', 'Risk Analyst', 'Fraud & Compliance Analyst', 'Support Agent'];
BEGIN
  -- 1. Authentication check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 2. Admin authorization check
  SELECT role INTO v_caller_role
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF v_caller_role IS NULL OR v_caller_role != 'Admin' THEN
    RAISE EXCEPTION 'Access Denied: Only authorized Administrators may assign or modify user roles.';
  END IF;

  -- 3. Validate new_role
  IF new_role IS NULL OR NOT (new_role = ANY(v_allowed_roles)) THEN
    RAISE EXCEPTION 'Invalid role: %. Allowed roles are: %', new_role, array_to_string(v_allowed_roles, ', ');
  END IF;

  -- 4. Locate target user profile
  SELECT * INTO v_target_profile
  FROM public.profiles
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile % not found.', target_user_id;
  END IF;

  -- 5. Prevent Admin lockout
  IF auth.uid() = target_user_id AND new_role != 'Admin' THEN
    RAISE EXCEPTION 'Administrators cannot demote their own account role.';
  END IF;

  -- 6. Apply role change
  UPDATE public.profiles
  SET role = new_role
  WHERE user_id = target_user_id;

  -- 7. Safely resolve organization ID
  SELECT organization_id INTO v_org_id
  FROM public.organizations
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO public.organizations (organization_id, organization_name, created_at)
    VALUES (gen_random_uuid(), 'ABC Finance Bank', NOW())
    RETURNING organization_id INTO v_org_id;
  END IF;

  -- 8. Sync memberships table if present
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'memberships') THEN
    IF new_role IN ('Admin', 'Manager', 'Risk Analyst', 'Fraud & Compliance Analyst', 'Support Agent') THEN
      INSERT INTO public.memberships (membership_id, user_id, organization_id, role, created_at)
      VALUES (gen_random_uuid(), target_user_id, v_org_id, new_role, NOW())
      ON CONFLICT (membership_id) DO NOTHING;
      UPDATE public.memberships SET role = new_role WHERE user_id = target_user_id;
    ELSE
      DELETE FROM public.memberships WHERE user_id = target_user_id;
    END IF;
  END IF;

  -- 9. Log in admin_activity_logs
  INSERT INTO public.admin_activity_logs (
    log_id,
    user_id,
    organization_id,
    action,
    details,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    auth.uid(),
    v_org_id,
    'Update Role',
    'Changed role of ' || COALESCE(v_target_profile.email, target_user_id::text) || ' from ' || COALESCE(v_target_profile.role, 'None') || ' to ' || new_role,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'new_role', new_role,
    'updated_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT) TO authenticated;

-- ==============================================================================
-- PART 6: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 6.1 PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile or bank staff can view all" ON public.profiles;
CREATE POLICY "Users can view own profile or bank staff can view all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_bank_staff()
  );

DROP POLICY IF EXISTS "Users can update own profile name only" ON public.profiles;
CREATE POLICY "Users can update own profile name only"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id 
    -- Prevent modifying own role; role changes must go through change_user_role RPC
    AND role = public.get_auth_user_role()
  );

-- 6.2 CUSTOMER VERIFICATION REQUESTS RLS
ALTER TABLE public.customer_verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants can view own verification request or bank staff can view all" ON public.customer_verification_requests;
CREATE POLICY "Applicants can view own verification request or bank staff can view all"
  ON public.customer_verification_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = profile_user_id
    OR public.is_bank_staff()
  );

DROP POLICY IF EXISTS "Applicants can insert own pending verification" ON public.customer_verification_requests;
CREATE POLICY "Applicants can insert own pending verification"
  ON public.customer_verification_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = profile_user_id
    AND verification_status = 'Pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

DROP POLICY IF EXISTS "Bank staff can update verification requests" ON public.customer_verification_requests;
CREATE POLICY "Bank staff can update verification requests"
  ON public.customer_verification_requests FOR UPDATE
  TO authenticated
  USING (public.is_bank_staff())
  WITH CHECK (public.is_bank_staff());

-- 6.3 CUSTOMERS TABLE RLS (Verified bank customers only)
-- Prevents unverified applicants from viewing financial customer records.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own customer record or bank staff can view all" ON public.customers;
CREATE POLICY "Customers can view own customer record or bank staff can view all"
  ON public.customers FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.is_bank_staff()
  );

DROP POLICY IF EXISTS "Only bank staff can insert customer records" ON public.customers;
CREATE POLICY "Only bank staff can insert customer records"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_bank_staff());

DROP POLICY IF EXISTS "Only bank staff can update customer records" ON public.customers;
CREATE POLICY "Only bank staff can update customer records"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (public.is_bank_staff())
  WITH CHECK (public.is_bank_staff());

-- 6.4 TRANSACTIONS TABLE RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own transactions or bank staff can view all" ON public.transactions;
CREATE POLICY "Customers can view own transactions or bank staff can view all"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    customer_id IN (SELECT customer_id FROM public.customers WHERE profile_id = auth.uid())
    OR public.is_bank_staff()
  );

-- 6.5 ADMIN ACTIVITY LOGS RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view admin activity logs"
  ON public.admin_activity_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Bank staff can insert activity logs" ON public.admin_activity_logs;
CREATE POLICY "Bank staff can insert activity logs"
  ON public.admin_activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_bank_staff());

-- Table grants
GRANT SELECT, INSERT, UPDATE ON public.customer_verification_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.admin_activity_logs TO authenticated;

-- ==============================================================================
-- PART 7: EXPLICIT, DEPENDENCY-SAFE APPLICATION DATA RESET SCRIPT
-- ==============================================================================
-- WARNING: This section is for MANUAL, REVIEWED EXECUTION ONLY.
-- DO NOT RUN AUTOMATICALLY.
--
-- FOREIGN KEY DEPENDENCY HIERARCHY:
-- Child tables (must be deleted first to prevent foreign-key constraint violations):
--   1. fraud_analysis                 (references transactions)
--   2. fraud_alerts                   (references transactions)
--   3. transactions                   (references customers, organizations)
--   4. manager_reviews                (references customers, organizations)
--   5. support_tickets                (references customers, organizations)
--   6. risk_assessments               (references customers, organizations)
--   7. customer_risk_profiles         (references customers, organizations)
--   8. customer_verification_requests (references profiles, organizations)
--   9. admin_activity_logs            (references profiles, organizations)
--  10. memberships                    (references profiles, organizations)
--  11. customers                      (references profiles, organizations)
--
-- Parent tables (retained/safely preserved):
--  12. profiles                       (RETAINS the Admin profile; deletes test accounts)
--  13. organizations                  (RETAINS default bank organization)
--  14. auth.users                     (DO NOT DELETE indiscriminately; retains admin account)
--
-- EXACT SQL BLOCK FOR MANUAL EXECUTION IN SUPABASE SQL EDITOR:
/*
BEGIN;

-- Step 1: Delete transactional & fraud investigation data
DELETE FROM public.fraud_analysis;
DELETE FROM public.fraud_alerts;
DELETE FROM public.transactions;

-- Step 2: Delete operational reviews, tickets, and risk assessments
DELETE FROM public.manager_reviews;
DELETE FROM public.support_tickets;
DELETE FROM public.risk_assessments;
DELETE FROM public.customer_risk_profiles;

-- Step 3: Delete verification requests
DELETE FROM public.customer_verification_requests;

-- Step 4: Delete audit logs and non-admin memberships
DELETE FROM public.admin_activity_logs;
DELETE FROM public.memberships WHERE user_id NOT IN (
  SELECT user_id FROM public.profiles WHERE role = 'Admin'
);

-- Step 5: Delete financial customer records
DELETE FROM public.customers;

-- Step 6: Delete non-admin profiles (preserves the Admin account and prevents lockout)
DELETE FROM public.profiles 
WHERE role != 'Admin' AND email != 'admin@abcfinance.com';

-- Step 7: Ensure Admin profile is explicitly confirmed with Admin role
UPDATE public.profiles 
SET role = 'Admin' 
WHERE email = 'admin@abcfinance.com';

-- Step 8: Ensure default bank organization exists
INSERT INTO public.organizations (organization_id, organization_name, created_at)
SELECT gen_random_uuid(), 'ABC Finance Bank', NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.organizations);

COMMIT;
*/
