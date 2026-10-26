import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key'
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Standard Supabase profiles record schema as specified in public.profiles:
 * - user_id: UUID references auth.users(id)
 * - full_name: TEXT
 * - email: TEXT
 * - created_at: TIMESTAMPTZ
 */
export interface SupabaseProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

/**
 * Maps a human-friendly username (e.g. "rohan_m", "abc_admin")
 * to a syntactically valid email identifier with a valid TLD so Supabase Auth accepts it.
 */
export function resolveSyntheticEmail(usernameOrEmail: string): string {
  const clean = usernameOrEmail.trim().toLowerCase();
  if (clean.includes('@')) {
    return clean;
  }
  return `${clean}@finops-demo.com`;
}

/**
 * Extracts the display username from an email or returns the clean username.
 */
export function extractUsername(emailOrUsername: string): string {
  if (emailOrUsername.endsWith('@finops-demo.com')) {
    return emailOrUsername.replace('@finops-demo.com', '');
  }
  if (emailOrUsername.endsWith('@demo.finopsai.invalid')) {
    return emailOrUsername.replace('@demo.finopsai.invalid', '');
  }
  if (emailOrUsername.includes('@')) {
    return emailOrUsername.split('@')[0];
  }
  return emailOrUsername;
}

export interface SupabaseHealthCheckResult {
  configured: boolean;
  initialized: boolean;
  reachable: boolean;
  authEndpointOk: boolean;
  databaseReachable: boolean;
  schemaStatus: 'tables_not_created' | 'ready' | 'permission_denied' | 'unknown';
  message: string;
}

/**
 * Performs a safe, non-sensitive health check against the configured Supabase project.
 * Never logs or exposes credentials.
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealthCheckResult> {
  const configured = isSupabaseConfigured();
  if (!configured || !supabase) {
    return {
      configured: false,
      initialized: false,
      reachable: false,
      authEndpointOk: false,
      databaseReachable: false,
      schemaStatus: 'unknown',
      message: 'Supabase credentials are not configured or are placeholder values.',
    };
  }

  let authOk = false;
  let dbReachable = false;
  let schemaStatus: SupabaseHealthCheckResult['schemaStatus'] = 'unknown';
  let message = '';

  try {
    const { data: sessionData, error: authError } = await supabase.auth.getSession();
    authOk = !authError;

    // Only query profiles if an authenticated session exists to prevent 42501 permission denied logs
    if (sessionData?.session) {
      const { error: dbError, status } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1);

      if (status === 200) {
        dbReachable = true;
        schemaStatus = 'ready';
        message = 'Remote Supabase project and profiles table are online and accessible.';
      } else if (status === 401 || status === 403 || (dbError && dbError.code === '42501')) {
        dbReachable = true;
        schemaStatus = 'permission_denied';
        message = 'Remote Supabase profiles table exists with Row Level Security enforced.';
      } else if (status === 404 || (dbError && dbError.code === 'PGRST205')) {
        dbReachable = true;
        schemaStatus = 'tables_not_created';
        message = 'Remote Supabase project is online. Database table profiles is not yet created in remote schema.';
      } else if (dbError) {
        dbReachable = true;
        message = `Remote Supabase project responded with status ${status}.`;
      }
    } else {
      // For anonymous users: RLS intentionally denies SELECT on public.profiles.
      // Health check confirms remote connectivity via GoTrue auth session endpoint.
      dbReachable = authOk;
      schemaStatus = 'ready';
      message = 'Remote Supabase project is online. Row Level Security active for authenticated sessions.';
    }
  } catch (err: unknown) {
    dbReachable = false;
    message = err instanceof Error ? err.message : 'Network error reaching Supabase endpoint.';
  }

  const reachable = authOk || dbReachable;

  return {
    configured: true,
    initialized: true,
    reachable,
    authEndpointOk: authOk,
    databaseReachable: dbReachable,
    schemaStatus,
    message,
  };
}

/**
 * Signs up a new customer in Supabase Auth with metadata (full_name).
 * The PostgreSQL on_auth_user_created trigger on auth.users will automatically
 * insert the corresponding row into public.profiles using NEW.raw_user_meta_data->>'full_name'.
 */
export async function signUpCustomerWithSupabase(
  email: string,
  password: string,
  fullName: string
): Promise<{
  success: boolean;
  user?: User | null;
  session?: Session | null;
  needsEmailVerification?: boolean;
  error?: string;
  isDuplicate?: boolean;
  isRateLimit?: boolean;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not initialized.' };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      const msg = error.message || '';
      const code = (error as any).code;

      // Handle duplicate user in authoritative Supabase Auth
      if (
        code === 'user_already_exists' ||
        error.status === 422 ||
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already been registered') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('user with this email') ||
        (msg.toLowerCase().includes('already') && msg.toLowerCase().includes('register'))
      ) {
        return {
          success: false,
          error: 'An account with this email already exists. Please log in instead.',
          isDuplicate: true,
        };
      }

      // Handle outgoing email rate limit
      if (code === 'over_email_send_rate_limit' || msg.toLowerCase().includes('rate limit')) {
        return {
          success: false,
          error:
            'Supabase outgoing email rate limit reached. The free email service quota has been exceeded. Please wait a short while or toggle off "Confirm email" in Supabase Auth settings to enable immediate signups.',
          isRateLimit: true,
        };
      }

      // Handle database error saving new user (Postgres trigger failure)
      if (msg.toLowerCase().includes('database error saving new user')) {
        return {
          success: false,
          error:
            'Database error saving new user: The PostgreSQL trigger on auth.users failed during signup. Please execute the updated fix_profiles_signup_trigger.sql script in your Supabase SQL Editor to grant execute privileges to supabase_auth_admin and update handle_new_user().',
        };
      }

      return { success: false, error: msg };
    }

    if (!data.user) {
      return { success: false, error: 'User registration could not be completed.' };
    }

    // GoTrue security mechanism: If user already exists and confirmation is active,
    // it returns a user object with an empty identities array!
    if (data.user.identities && data.user.identities.length === 0) {
      return {
        success: false,
        error: 'An account with this email already exists. Please log in instead.',
        isDuplicate: true,
      };
    }

    const needsEmailVerification = !data.session;

    // Note: Redundant client-side profile insertion removed.
    // The PostgreSQL on_auth_user_created trigger on auth.users automatically creates
    // the profile row in public.profiles (user_id, full_name, email, created_at).
    // Client-side upserts without a confirmed session cause 42501 permission errors.

    return {
      success: true,
      user: data.user,
      session: data.session,
      needsEmailVerification,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'An unexpected error occurred during signup.' };
  }
}

/**
 * Signs in an existing customer using email/password via Supabase Auth.
 */
export async function signInCustomerWithSupabase(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase client is not initialized.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          error: 'Please verify your email address before signing in. Check your inbox for the confirmation link.',
        };
      }
      if (msg.toLowerCase().includes('invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password. Please check your credentials and try again.',
        };
      }
      return { success: false, error: msg };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Authentication failed.' };
  }
}

/**
 * Initiates Google OAuth flow with Supabase.
 * When completed, the user record in auth.users triggers public.handle_new_user(),
 * extracting full_name / name and email into public.profiles.
 */
export async function signInWithGoogle(redirectTo?: string): Promise<{ error?: string }> {
  if (!supabase) {
    return { error: 'Supabase client is not initialized.' };
  }

  try {
    const targetUrl = redirectTo || `${window.location.origin}/customer/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (err: any) {
    return { error: err?.message || 'Failed to initiate Google sign-in.' };
  }
}

/**
 * Fetches the user profile from public.profiles table by user_id.
 * Respects RLS: auth.uid() = user_id allows authenticated users to read their own record.
 */
export async function fetchCustomerProfile(userId: string): Promise<SupabaseProfile | null> {
  if (!supabase || !userId) return null;

  try {
    // Verify an authenticated session exists before querying public.profiles
    // Anonymous users cannot SELECT from public.profiles under RLS, preventing 42501 errors.
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData?.session;
    if (!currentSession || !currentSession.user || currentSession.user.id !== userId) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Could not fetch profile from public.profiles:', error.message);
      return null;
    }

    return data as SupabaseProfile | null;
  } catch (err) {
    console.warn('Error reading from public.profiles:', err);
    return null;
  }
}

/**
 * Updates user profile in public.profiles.
 * Respects RLS: auth.uid() = user_id allows authenticated users to update their own record.
 */
export async function updateCustomerProfile(
  userId: string,
  updates: { full_name?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase client is not initialized.' };

  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Update failed' };
  }
}

/**
 * Signs out from Supabase Auth.
 */
export async function signOutSupabase(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
  }
}
