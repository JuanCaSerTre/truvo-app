import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { User, UserProfileInput } from '@/types/models';
import { supabase } from '@/lib/supabase';
import { SUPABASE_AUTH_STORAGE_KEY, supabaseAuthStorage } from '@/lib/supabaseStorage';
import { assertApiRecord, assertStringField, logApiWarning, throwApiServiceError } from '@/utils/apiErrors';
import { pushNotificationService } from './pushNotificationService';

const requireSupabase = () => {
  if (!supabase) throw new Error('Authentication is not configured for this build.');
  return supabase;
};

// Deep link that Supabase redirects to after the user taps the confirmation email.
// Resolves to `truvo://auth-callback` in a build, or the exp:// dev URL in Expo Go.
export const authRedirectUrl = Linking.createURL('auth-callback');

// Supabase returns tokens either as query params (PKCE `?code=`) or in the URL
// fragment (`#access_token=...`). Parse both so we can restore the session.
const parseAuthParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const hashIndex = url.indexOf('#');
  const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';
  const beforeHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = beforeHash.indexOf('?');
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex + 1) : '';

  [query, fragment].forEach((section) => {
    if (!section) return;
    section.split('&').forEach((pair) => {
      if (!pair) return;
      const eq = pair.indexOf('=');
      const key = eq >= 0 ? pair.slice(0, eq) : pair;
      const value = eq >= 0 ? pair.slice(eq + 1) : '';
      try {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      } catch {
        params[key] = value;
      }
    });
  });

  return params;
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
    // Keep `truvo:onboardingComplete:${userId}` across sign-outs: the "How TRUVO works"
    // intro should only show on a user's very first session, not every time they log back in.
    globalThis.localStorage?.removeItem(`truvo:${userId}:notificationSettings`);
  }
};

type ProfileRow = {
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
};

const assertProfileRow = (data: ProfileRow) => {
  const value = data as unknown;
  assertApiRecord(value, 'profile');
  ['id', 'name', 'subscription_status', 'created_at'].forEach((field) => assertStringField(value, field, 'profile'));
};

const mapProfileToUser = (data: ProfileRow): User => {
  assertProfileRow(data);
  return {
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
  };
};

const profileSelect =
  'id, name, phone, email, country, currency, timezone, contact_preference, user_role, avatar_url, subscription_status, created_at';

const getOrCreateProfile = async (email: string, name?: string): Promise<User> => {
  const client = requireSupabase();
  const { data: authData, error: userError } = await client.auth.getUser();
  if (userError) throwApiServiceError(userError, 'Could not load authenticated user.');
  const authUser = authData.user;
  if (!authUser) throw new Error('No authenticated Supabase user found.');

  const { data: existingProfile, error: existingProfileError } = await client
    .from('profiles')
    .select(profileSelect)
    .eq('id', authUser.id)
    .maybeSingle();

  if (existingProfileError) throwApiServiceError(existingProfileError, 'Could not load user profile.');
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

  if (error) throwApiServiceError(error, 'Could not create user profile.');
  if (!data) throwApiServiceError(undefined, 'Profile service returned an invalid response.');

  return mapProfileToUser(data as ProfileRow);
};

export const authService = {
  async signUpWithPassword(email: string, password: string, name: string): Promise<{ user?: User; needsEmailConfirmation: boolean }> {
    const client = requireSupabase();

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authRedirectUrl,
        data: {
          name: name.trim() || email.split('@')[0] || 'TRUVO user',
        },
      },
    });

    if (error) throwApiServiceError(error, 'Could not create account.');
    if (!data.session) return { needsEmailConfirmation: true };

    return { user: await getOrCreateProfile(email, name), needsEmailConfirmation: false };
  },

  async signInWithPassword(email: string, password: string): Promise<User> {
    const client = requireSupabase();

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throwApiServiceError(error, 'Could not sign in.');
    return getOrCreateProfile(email);
  },

  async resendSignupConfirmation(email: string): Promise<void> {
    const client = requireSupabase();
    const { error } = await client.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: authRedirectUrl,
      },
    });
    if (error) throwApiServiceError(error, 'Could not resend signup confirmation.');
  },

  async sendPasswordReset(email: string): Promise<void> {
    const client = requireSupabase();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl,
    });
    if (error) throwApiServiceError(error, 'Could not send password reset email.');
  },

  // Called when the app is opened via the email confirmation deep link. Exchanges
  // the code/tokens in the URL for a session, then returns the confirmed profile.
  async completeSessionFromUrl(url: string): Promise<User | null> {
    const client = requireSupabase();
    const params = parseAuthParams(url);

    if (params.error) {
      throw new Error(params.error_description || params.error);
    }

    if (params.code) {
      const { data, error } = await client.auth.exchangeCodeForSession(params.code);
      if (error) throwApiServiceError(error, 'Could not confirm email.');
      const email = data.session?.user.email;
      if (!email) return null;
      return getOrCreateProfile(email);
    }

    if (params.access_token && params.refresh_token) {
      const { data, error } = await client.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (error) throwApiServiceError(error, 'Could not confirm email.');
      const email = data.session?.user.email;
      if (!email) return null;
      return getOrCreateProfile(email);
    }

    return null;
  },

  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throwApiServiceError(error, 'Could not restore session.');
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
    if (userError) throwApiServiceError(userError, 'Could not load authenticated user.');
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

    if (error) throwApiServiceError(error, 'Could not update profile.');
    if (!data) throwApiServiceError(undefined, 'Profile service returned an invalid response.');
    return mapProfileToUser(data as ProfileRow);
  },

  async sendOtp(email: string): Promise<{ requestId: string }> {
    const client = requireSupabase();
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    if (error) throwApiServiceError(error, 'Could not send email code.');
    return { requestId: `otp-${Date.now()}` };
  },

  async verifyOtp(email: string, code: string): Promise<User> {
    const client = requireSupabase();
    const { error } = await client.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error) throwApiServiceError(error, 'Could not verify email code.');
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
            logApiWarning('Unable to delete push tokens during logout', error);
          });
        }
        const { error } = await supabase.auth.signOut();
        if (error) throwApiServiceError(error, 'Could not sign out.');
      }
    } finally {
      await clearLocalAuthStorage(userId);
    }
  },
};
