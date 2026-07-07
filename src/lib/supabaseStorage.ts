import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const SUPABASE_AUTH_STORAGE_KEY = 'truvo.supabase.auth';

const webStorage = {
  getItem: (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: (key: string, value: string) => {
    globalThis.localStorage?.setItem(key, value);
  },
  removeItem: (key: string) => {
    globalThis.localStorage?.removeItem(key);
  },
};

export const supabaseAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      webStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

