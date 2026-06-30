import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// These are securely loaded from the .env file
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL; 
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// On web, Supabase must use localStorage (not AsyncStorage) to persist sessions
// across page reloads. AsyncStorage is a no-op on web for Supabase auth.
// detectSessionInUrl must be true on web so that the access_token in the
// URL hash (used after email confirmation / OAuth) is captured properly.
const isWeb = Platform.OS === 'web';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: isWeb ? undefined : AsyncStorage, // undefined = use default localStorage on web
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // true on web, false on native
  },
});
