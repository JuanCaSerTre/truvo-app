import { User } from '@/types/models';
import { currentUser } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

const fallbackUser = (phone: string): User => ({ ...currentUser, phone });

const getOrCreateProfile = async (phone: string): Promise<User> => {
  if (!supabase) return fallbackUser(phone);
  const { data: authData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const authUser = authData.user;
  if (!authUser) throw new Error('No authenticated Supabase user found.');

  const profile = {
    id: authUser.id,
    name: authUser.user_metadata?.name || 'TRUVO user',
    phone,
    subscription_status: 'free' as const,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, { onConflict: 'id' })
    .select('id, name, phone, avatar_url, subscription_status, created_at')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    avatarUrl: data.avatar_url || undefined,
    subscription_status: data.subscription_status,
    createdAt: data.created_at,
  };
};

export const authService = {
  async sendOtp(phone: string): Promise<{ requestId: string }> {
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
    } else {
      console.log('Supabase is not configured yet. Using placeholder OTP flow.', phone);
    }
    return { requestId: `otp-${Date.now()}` };
  },

  async verifyOtp(phone: string, code: string): Promise<User> {
    if (!supabase) return fallbackUser(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error) throw error;
    return getOrCreateProfile(phone);
  },

  async signOut(): Promise<void> {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
  },
};
