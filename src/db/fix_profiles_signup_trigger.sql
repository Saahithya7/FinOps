-- ==============================================================================
-- FINOPS AI: AUTOMATED SUPABASE PROFILES TRIGGER & ROW LEVEL SECURITY (RLS) FIX
-- ==============================================================================
-- Purpose:
-- Fixes the issue where customer signups (Email/Password & Google OAuth) do not
-- insert a corresponding record into public.profiles.
--
-- This script:
-- 1. Verifies/creates the public.profiles table (user_id PK, full_name, email, created_at).
-- 2. Creates a SECURITY DEFINER trigger function handle_new_user() on auth.users.
-- 3. Attaches on_auth_user_created AFTER INSERT trigger to auth.users.
-- 4. Enforces strict Row Level Security (RLS) on public.profiles.
-- 5. Backfills any existing auth.users missing a profile record.
-- 6. Provides verification queries to test the implementation.
-- ==============================================================================

-- STEP 1: Ensure public.profiles table schema exists and is structured properly
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure column names match user_id if previously defined as 'id'
DO $$
BEGIN
  -- If 'id' exists and 'user_id' does not, rename id to user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN id TO user_id;
  END IF;

  -- Ensure user_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Ensure full_name column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;

  -- Ensure email column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;

  -- Ensure created_at column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

-- STEP 2: Create or Replace the Trigger Function
-- Critical Security Guidelines:
-- - Uses SECURITY DEFINER so it runs with database owner privileges to insert
--   into public.profiles without requiring direct INSERT privileges for users.
-- - Sets explicit search_path to prevent search_path injection attacks.
-- - Safely extracts full_name from standard email signups or Google OAuth metadata.
-- - Gracefully falls back to email username prefix or default label if missing.
-- - Uses ON CONFLICT (user_id) DO UPDATE to prevent duplicate key errors.
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
  -- Extract full_name across all potential auth providers:
  -- 1. options.data.full_name (Standard email signup)
  -- 2. raw_user_meta_data.name (Google OAuth)
  -- 3. given_name + family_name (Google OAuth alternate)
  -- 4. raw_user_meta_data.display_name (Other OAuth providers)
  -- 5. Email username prefix fallback
  extracted_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(CONCAT_WS(' ', NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'family_name')), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    NULLIF(TRIM(split_part(NEW.email, '@', 1)), ''),
    'Valued Customer'
  );

  extracted_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');

  -- Insert or update the public.profiles record
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

-- Function permissions: Grant execute to postgres, service_role, authenticated, anon, and supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
    GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;
  END IF;
END $$;

-- STEP 3: Attach the Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Enable Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 5: Drop legacy or conflicting policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by self" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updatable by self" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read of profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated read of profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users insert own profile" ON public.profiles;

-- STEP 6: Enforce Least-Privilege Policies
-- Policy 1: Authenticated users can SELECT their own profile only
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Authenticated users can INSERT their own profile only (matches auth.uid)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Authenticated users can UPDATE their own profile only
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- STEP 7: Table Level Privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- STEP 8: Backfill existing auth.users who do not yet have a record in public.profiles
INSERT INTO public.profiles (user_id, full_name, email, created_at)
SELECT 
  u.id AS user_id,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(u.raw_user_meta_data->>'name'), ''),
    NULLIF(TRIM(split_part(u.email, '@', 1)), ''),
    'Valued Customer'
  ) AS full_name,
  u.email,
  COALESCE(u.created_at, timezone('utc'::text, now()))
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================================
-- VERIFICATION QUERIES (Run these in Supabase SQL Editor to verify setup)
-- ==============================================================================

-- 1. Check profiles table columns:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'profiles';

-- 2. Check trigger status on auth.users:
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created';

-- 3. Check Row Level Security and Policies on public.profiles:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles';
-- SELECT policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'profiles';

-- 4. Verify matched profiles and users count:
-- SELECT count(*) AS auth_users_count FROM auth.users;
-- SELECT count(*) AS public_profiles_count FROM public.profiles;
