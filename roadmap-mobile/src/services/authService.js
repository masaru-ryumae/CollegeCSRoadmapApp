import supabase from '../config/supabaseClient';

export const authService = {
  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const user = await this.getCurrentUser();
    return !!user;
  },

  /**
   * Sign out user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error };
    }
  },

  /**
   * Sign in with Google
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'com.collegecsroadmap://auth-callback',
          skipBrowserRedirect: false,
        },
      });

      if (error) throw error;
      return { success: true, user: data?.user };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error };
    }
  },

  /**
   * Sign in anonymously
   */
  async signInAnonymously() {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) throw error;
      return { success: true, user: data?.user };
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      return { success: false, error };
    }
  },

  /**
   * Get user profile from database
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(session?.user || null);
      }
    );

    return subscription;
  },
};

export default authService;
