import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

let supabaseClient: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized. Call initSupabase() first.');
  }
  return supabaseClient;
}

export interface AuthUser {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export async function signUpWithEmail(data: SignUpData): Promise<{ user: AuthUser; session: Session }> {
  const supabase = getSupabase();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        display_name: data.displayName || data.email.split('@')[0]
      }
    }
  });

  if (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }

  if (!authData.user || !authData.session) {
    throw new Error('Sign up succeeded but user or session is missing');
  }

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email,
      displayName: data.displayName,
      isAnonymous: false
    },
    session: authData.session
  };
}

export async function loginWithEmail(data: LoginData): Promise<{ user: AuthUser; session: Session }> {
  const supabase = getSupabase();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password
  });

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }

  if (!authData.user || !authData.session) {
    throw new Error('Login succeeded but user or session is missing');
  }

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email,
      displayName: authData.user.user_metadata?.display_name,
      photoURL: authData.user.user_metadata?.avatar_url,
      isAnonymous: false
    },
    session: authData.session
  };
}

export async function loginWithGoogle(): Promise<{ user: AuthUser; session: Session | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    throw new Error(`Google login failed: ${error.message}`);
  }

  // OAuth redirect will complete in callback
  return {
    user: {
      id: '',
      isAnonymous: false
    },
    session: null
  };
}

export async function loginWithGitHub(): Promise<{ user: AuthUser; session: Session | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });

  if (error) {
    throw new Error(`GitHub login failed: ${error.message}`);
  }

  // OAuth redirect will complete in callback
  return {
    user: {
      id: '',
      isAnonymous: false
    },
    session: null
  };
}

export async function loginAnonymously(): Promise<{ user: AuthUser; session: Session | null }> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    throw new Error(`Anonymous login failed: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Anonymous login succeeded but user is missing');
  }

  return {
    user: {
      id: data.user.id,
      email: undefined,
      displayName: 'Anonymous User',
      isAnonymous: true
    },
    session: data.session
  };
}

export async function logout(): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = getSupabase();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
    photoURL: user.user_metadata?.avatar_url,
    isAnonymous: user.is_anonymous || false
  };
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabase();

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

export function onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
  const supabase = getSupabase();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
        photoURL: session.user.user_metadata?.avatar_url,
        isAnonymous: session.user.is_anonymous || false
      });
    } else {
      callback(null);
    }
  });

  return () => {
    subscription?.unsubscribe();
  };
}

export function changePassword(newPassword: string): Promise<void> {
  const supabase = getSupabase();

  return supabase.auth.updateUser({ password: newPassword })
    .then(({ error }) => {
      if (error) {
        throw new Error(`Password change failed: ${error.message}`);
      }
    });
}

export async function updateUserMetadata(metadata: Record<string, any>): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.auth.updateUser({
    data: metadata
  });

  if (error) {
    throw new Error(`Update user metadata failed: ${error.message}`);
  }
}
