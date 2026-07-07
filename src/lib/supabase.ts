import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_AUTH_STORAGE_KEY, supabaseAuthStorage } from './supabaseStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const isValidSupabaseUrl = (value?: string) => {
  if (!value || value.includes('your-project-ref')) return false;
  try {
    const url = new URL(value);
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    return url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && isLocal);
  } catch {
    return false;
  }
};

const isValidAnonKey = (value?: string) => Boolean(value && value !== 'your-anon-key');

export const isSupabaseConfigured = isValidSupabaseUrl(supabaseUrl) && isValidAnonKey(supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storage: supabaseAuthStorage,
        storageKey: SUPABASE_AUTH_STORAGE_KEY,
      },
    })
  : null;
