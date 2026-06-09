import { supabase } from '../config/supabaseClient';

/**
 * Sign in with Google OAuth
 * @returns {Promise<{user, session, error}>} User and session data
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Google sign-in error:', error);
      return { user: null, session: null, error };
    }

    return { user: data?.user, session: data?.session, error: null };
  } catch (err) {
    console.error('Unexpected error during Google sign-in:', err);
    return { user: null, session: null, error: err };
  }
}

/**
 * Handle OAuth callback after redirect from provider
 * @returns {Promise<{user, session, error}>} User and session data
 */
export async function handleAuthCallback() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth callback error:', error);
      return { user: null, session: null, error };
    }

    return {
      user: data?.session?.user,
      session: data?.session,
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in auth callback:', err);
    return { user: null, session: null, error: err };
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error}>} Error if sign-out fails
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign-out error:', error);
      return { error };
    }

    return { error: null };
  } catch (err) {
    console.error('Unexpected error during sign-out:', err);
    return { error: err };
  }
}

/**
 * Get the current authenticated user
 * @returns {Promise<{user, error}>} Current user or error
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Get current user error:', error);
      return { user: null, error };
    }

    return { user: data?.user, error: null };
  } catch (err) {
    console.error('Unexpected error getting current user:', err);
    return { user: null, error: err };
  }
}

/**
 * Check if the application is invite-only
 * @returns {Promise<{isInviteOnly, error}>} Whether the app requires invite codes
 */
export async function isInviteOnly() {
  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('required')
      .limit(1);

    if (error) {
      console.error('Check invite-only error:', error);
      return { isInviteOnly: false, error };
    }

    return { isInviteOnly: data && data.length > 0, error: null };
  } catch (err) {
    console.error('Unexpected error checking invite-only status:', err);
    return { isInviteOnly: false, error: err };
  }
}

/**
 * Validate an invite code
 * @param {string} code - The invite code to validate
 * @returns {Promise<{valid, inviteData, error}>} Validation result and invite data
 */
export async function validateInviteCode(code) {
  try {
    if (!code || typeof code !== 'string') {
      return { valid: false, inviteData: null, error: 'Invalid code format' };
    }

    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { valid: false, inviteData: null, error: 'Invite code not found' };
      }
      console.error('Validate invite code error:', error);
      return { valid: false, inviteData: null, error };
    }

    const now = new Date();
    const expiresAt = data?.expires_at ? new Date(data.expires_at) : null;

    if (expiresAt && expiresAt < now) {
      return { valid: false, inviteData: null, error: 'Invite code has expired' };
    }

    if (data?.uses_remaining !== null && data?.uses_remaining <= 0) {
      return { valid: false, inviteData: null, error: 'Invite code has no uses remaining' };
    }

    return { valid: true, inviteData: data, error: null };
  } catch (err) {
    console.error('Unexpected error validating invite code:', err);
    return { valid: false, inviteData: null, error: err };
  }
}
