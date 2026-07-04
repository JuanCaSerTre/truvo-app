import { User } from '@/types/models';
import { currentUser } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

const fallbackUser = (email: string): User => ({ ...currentUser, email });

const getOrCreateProfile = async (email: string): Promise<User> => {
  if (!supabase) return fallbackUser(email);
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const authUser = authData.user;
  if (!authUser) throw new Error('No authenticated Supabase user found.');

  const profile = {
    id: authUser.id,
    name: authUser.user_metadata?.name || email.split('@')[0] || 'TRUVO user',
    email,
    phone: authUser.phone || null,
    subscription_status: 'free' as const,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select('id, name, phone, email, avatar_url, subscription_status, created_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    phone: data.phone || '',
    email: data.email || undefined,
    avatarUrl: data.avatar_url || undefined,
    subscription_status: data.subscription_status,
    createdAt: data.created_at,
  };
};

export const authService = {
  async signUpWithPassword(email: string, password: string): Promise<{ user?: User; needsEmailConfirmation: boolean }> {
    if (!supabase) return { user: fallbackUser(email), needsEmailConfirmation: false };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: email.split('@')[0] || 'TRUVO user',
        },
      },
    });

    if (error) throw error;
    if (!data.session) return { needsEmailConfirmation: true };

    return { user: await getOrCreateProfile(email), needsEmailConfirmation: false };
  },

  async signInWithPassword(email: string, password: string): Promise<User> {
    if (!supabase) return fallbackUser(email);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return getOrCreateProfile(email);
  },

  async resendSignupConfirmation(email: string): Promise<void> {
    if (!supabase) return;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const email = data.session?.user.email;
    if (!email) return null;
    return getOrCreateProfile(email);
  },

  async sendOtp(email: string): Promise<{ requestId: string }> {
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
    }
    return { requestId: `otp-${Date.now()}` };
  },

  async verifyOtp(email: string, code: string): Promise<User> {
    if (!supabase) return fallbackUser(email);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error) throw error;
    return getOrCreateProfile(email);
  },

  async signOut(): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  },
};
