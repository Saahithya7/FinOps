-- ==============================================================================
-- FINOPS BANKING PLATFORM: SECURE ADMIN APPROVAL & ROLE MANAGEMENT MIGRATION
-- ==============================================================================
-- This script configures hardened, production-grade security for the Admin Portal:
-- 1. Helper function public.is_admin() to check caller's role against trusted profiles table.
-- 2. RLS policy allowing Admins to update user profiles (status and role).
-- 3. Security-definer RPC function public.admin_update_customer_status().
-- 4. Security-definer RPC function public.admin_change_user_role().
-- 5. Preserves existing RLS policies and table structures without deleting data.
-- ==============================================================================

-- 1. HELPER: public.is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = 'Admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. PROFILES RLS POLICIES FOR ADMIN ACCESS
-- Ensures verified administrators can view and update all profiles, while normal users are strictly limited to their own record.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles or users view own profile" ON public.profiles;
CREATE POLICY "Admins can view all profiles or users view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Admins can update all profiles or users update own name" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.profiles;

CREATE POLICY "Admins can update user profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR auth.uid() = user_id
  );

-- 2.1 ADMIN ACTIVITY LOGS RLS POLICY
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view and insert activity logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can view and insert activity logs"
  ON public.admin_activity_logs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. SECURE RPC: public.admin_update_customer_status
CREATE OR REPLACE FUNCTION public.admin_update_customer_status(
  target_user_id UUID,
  new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
  target_email TEXT;
  target_name TEXT;
  v_org_id UUID;
BEGIN
  -- 1. Verify caller authentication
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to execute administrative actions.';
  END IF;

  -- 2. Verify caller is an active Admin from trusted database profiles
  SELECT role INTO caller_role FROM public.profiles WHERE user_id = caller_id;
  IF caller_role IS NULL OR caller_role != 'Admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only platform Administrators can update account statuses.';
  END IF;

  -- 3. Validate requested status
  IF new_status NOT IN ('Pending', 'Active', 'Rejected') THEN
    RAISE EXCEPTION 'Invalid account status. Permitted values: Pending, Active, Rejected.';
  END IF;

  -- 4. Retrieve target profile info
  SELECT email, full_name INTO target_email, target_name FROM public.profiles WHERE user_id = target_user_id;
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'Target user profile not found.';
  END IF;

  -- 5. Update profiles.account_status
  UPDATE public.profiles
  SET account_status = new_status
  WHERE user_id = target_user_id;

  -- 6. Synchronize customers table if Active or Rejected
  SELECT organization_id INTO v_org_id FROM public.organizations LIMIT 1;
  IF v_org_id IS NULL THEN
    v_org_id := 'cb5831e7-a0df-4f7b-8800-af49387fb82d'::UUID;
  END IF;

  IF new_status = 'Active' THEN
    UPDATE public.customers
    SET customer_status = 'Active'
    WHERE profile_id = target_user_id;
  ELSIF new_status = 'Rejected' THEN
    UPDATE public.customers
    SET customer_status = 'Rejected'
    WHERE profile_id = target_user_id;
  END IF;

  -- 7. Synchronize customer_verification_requests table if present
  UPDATE public.customer_verification_requests
  SET 
    verification_status = CASE 
      WHEN new_status = 'Active' THEN 'Approved'
      WHEN new_status = 'Rejected' THEN 'Rejected'
      ELSE 'Pending'
    END,
    reviewed_by = caller_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE profile_user_id = target_user_id;

  -- 8. Record in admin_activity_logs using existing schema
  INSERT INTO public.admin_activity_logs (
    log_id,
    user_id,
    organization_id,
    action,
    details,
    ip_address,
    created_at
  ) VALUES (
    gen_random_uuid(),
    caller_id,
    v_org_id,
    'Update Account Status',
    format('Updated customer %s (%s) account status to %s', target_name, target_email, new_status),
    '127.0.0.1',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', target_user_id,
    'account_status', new_status,
    'updated_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_customer_status(UUID, TEXT) TO authenticated;

-- 4. SECURE RPC: public.admin_change_user_role
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
  target_email TEXT;
  target_name TEXT;
  prev_role TEXT;
  v_org_id UUID;
BEGIN
  -- 1. Verify caller authentication
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- 2. Verify caller is an active Admin
  SELECT role INTO caller_role FROM public.profiles WHERE user_id = caller_id;
  IF caller_role IS NULL OR caller_role != 'Admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only platform Administrators can change user roles.';
  END IF;

  -- 3. Prevent self-role modification
  IF caller_id = target_user_id THEN
    RAISE EXCEPTION 'Security Policy: Administrators cannot modify their own role.';
  END IF;

  -- 4. Validate permitted roles
  IF new_role NOT IN ('Customer', 'Admin', 'Manager', 'Risk Analyst', 'Fraud & Compliance Analyst', 'Support Agent') THEN
    RAISE EXCEPTION 'Invalid role. Permitted values: Customer, Admin, Manager, Risk Analyst, Fraud & Compliance Analyst, Support Agent.';
  END IF;

  -- 5. Retrieve target user details
  SELECT email, full_name, role INTO target_email, target_name, prev_role FROM public.profiles WHERE user_id = target_user_id;
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'Target user not found.';
  END IF;

  -- 6. Protect primary Admin account from demotion
  IF (target_email = 'admin@abcfinance.com' OR target_user_id = 'e2ff607e-69ad-4027-bd00-69afb0516396'::UUID) AND new_role != 'Admin' THEN
    RAISE EXCEPTION 'Security Policy Violation: Cannot demote the primary administrator account (admin@abcfinance.com).';
  END IF;

  -- 7. Update profiles.role
  UPDATE public.profiles
  SET role = new_role
  WHERE user_id = target_user_id;

  -- 8. Resolve organization
  SELECT organization_id INTO v_org_id FROM public.organizations LIMIT 1;
  IF v_org_id IS NULL THEN
    v_org_id := 'cb5831e7-a0df-4f7b-8800-af49387fb82d'::UUID;
  END IF;

  -- 9. Insert audit log
  INSERT INTO public.admin_activity_logs (
    log_id,
    user_id,
    organization_id,
    action,
    details,
    ip_address,
    created_at
  ) VALUES (
    gen_random_uuid(),
    caller_id,
    v_org_id,
    'Update Role',
    format('Changed role of %s (%s) from %s to %s', target_name, target_email, prev_role, new_role),
    '127.0.0.1',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', target_user_id,
    'previous_role', prev_role,
    'new_role', new_role,
    'updated_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_change_user_role(UUID, TEXT) TO authenticated;
