import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserProfileInput } from '@/types/models';
import { supabase } from '@/lib/supabase';
import { SUPABASE_AUTH_STORAGE_KEY, supabaseAuthStorage } from '@/lib/supabaseStorage';
import { pushNotificationService } from './pushNotificationService';

const requireSupabase = () => {
  if (!supabase) throw new Error('Authentication is not configured for this build.');
  return supabase;
};

const clearLocalAuthStorage = async (userId?: string) => {
  const storage = globalThis.localStorage;
  if (storage) {
    const authKeys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
      (key): key is string => Boolean(key && (key.startsWith('sb-') || key.includes('supabase.auth'))),
    );

    authKeys.forEach((key) => storage.removeItem(key));
  }

  const asyncKeys = await AsyncStorage.getAllKeys();
  const authKeys = asyncKeys.filter((key) => key.startsWith('sb-') || key.includes('supabase.auth'));
  if (authKeys.length) await AsyncStorage.multiRemove(authKeys);
  await supabaseAuthStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);

  if (userId) {
    await AsyncStorage.removeItem(`truvo:onboardingComplete:${userId}`);
    globalThis.localStorage?.removeItem(`truvo:${userId}:notificationSettings`);
  }
};

const mapProfileToUser = (data: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  country?: string | null;
  currency?: string | null;
  timezone?: string | null;
  contact_preference?: User['contactPreference'] | null;
  user_role?: User['userRole'] | null;
  avatar_url: string | null;
  subscription_status: User['subscription_status'];
  created_at: string;
}): User => ({
  id: data.id,
  name: data.name,
  phone: data.phone || '',
  email: data.email || undefined,
  country: data.country || undefined,
  currency: data.currency || undefined,
  timezone: data.timezone || undefined,
  contactPreference: data.contact_preference || undefined,
  userRole: data.user_role || undefined,
  avatarUrl: data.avatar_url || undefined,
  subscription_status: data.subscription_status,
  createdAt: data.created_at,
});

const profileSelect =
  'id, name, phone, email, country, currency, timezone, contact_preference, user_role, avatar_url, subscription_status, created_at';

const getOrCreateProfile = async (email: string, name?: string): Promise<User> => {
  const client = requireSupabase();
  const { data: authData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  const authUser = authData.user;
  if (!authUser) throw new Error('No authenticated Supabase user found.');

  const { data: existingProfile, error: existingProfileError } = await client
    .from('profiles')
    .select(profileSelect)
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingProfileError) throw existingProfileError;
  if (existingProfile) return mapProfileToUser(existingProfile);

  const profile = {
    id: authUser.id,
    name: name?.trim() || authUser.user_metadata?.name || email.split('@')[0] || 'TRUVO user',
    email,
    phone: authUser.phone || null,
    country: null,
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    contact_preference: 'email' as const,
    user_role: 'both' as const,
    subscription_status: 'free' as const,
  };

  const { data, error } = await client
    .from('profiles')
    .insert(profile)
    .select(profileSelect)
    .single();

  if (error) throw error;

  return mapProfileToUser(data);
};

export const authService = {
  async signUpWithPassword(email: string, password: string, name: string): Promise<{ user?: User; needsEmailConfirmation: boolean }> {
    const client = requireSupabase();

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name.trim() || email.split('@')[0] || 'TRUVO user',
        },
      },
    });

    if (error) throw error;
    if (!data.session) return { needsEmailConfirmation: true };

    return { user: await getOrCreateProfile(email, name), needsEmailConfirmation: false };
  },

  async signInWithPassword(email: string, password: string): Promise<User> {
    const client = requireSupabase();

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return getOrCreateProfile(email);
  },

  async resendSignupConfirmation(email: string): Promise<void> {
    const client = requireSupabase();
    const { error } = await client.auth.resend({
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

  async updateProfile(input: UserProfileInput): Promise<User> {
    const normalized: UserProfileInput = {
      ...input,
      name: input.name.trim(),
      phone: input.phone?.trim() || '',
      country: input.country?.trim() || undefined,
      currency: input.currency?.trim().toUpperCase() || undefined,
      timezone: input.timezone?.trim() || undefined,
      contactPreference: input.contactPreference || 'email',
      userRole: input.userRole || 'both',
    };

    if (!normalized.name) throw new Error('Name is required.');
    const client = requireSupabase();

    const { data: authData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    const authUser = authData.user;
    if (!authUser?.email) throw new Error('No authenticated Supabase user found.');

    const { data, error } = await client
      .from('profiles')
      .update({
        name: normalized.name,
        phone: normalized.phone || null,
        country: normalized.country || null,
        currency: normalized.currency || null,
        timezone: normalized.timezone || null,
        contact_preference: normalized.contactPreference,
        user_role: normalized.userRole,
      })
      .eq('id', authUser.id)
      .select(profileSelect)
      .single();

    if (error) throw error;
    return mapProfileToUser(data);
  },

  async sendOtp(email: string): Promise<{ requestId: string }> {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
    return { requestId: `otp-${Date.now()}` };
  },

  async verifyOtp(email: string, code: string): Promise<User> {
    const client = requireSupabase();
    const { error } = await client.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error) throw error;
    return getOrCreateProfile(email);
  },

  async signOut(): Promise<void> {
    let userId: string | undefined;
    try {
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        userId = data.user?.id;
        if (userId) {
          await pushNotificationService.deleteRegisteredDevices(userId).catch((error) => {
            console.warn('Unable to delete push tokens during logout', error);
          });
        }
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
    } finally {
      await clearLocalAuthStorage(userId);
    }
  },
};
