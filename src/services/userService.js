import { supabase } from '../lib/supabase';
import { cacheService } from './cacheService';
import NetInfo from '@react-native-community/netinfo';

/**
 * userService.js
 * Handles all database operations related to the user profile and subscriptions.
 * Offline strategy: Cache reads for 5 minutes; serve stale cache when offline.
 */

const USER_TTL = 5 * 60 * 1000; // 5 minutes

async function _isOnline() {
  const state = await NetInfo.fetch();
  // Use ONLY isConnected — isInternetReachable is unreliable on Android
  // and often returns null/false even when the device is fully online.
  return state.isConnected === true;
}

export const userService = {
  /**
   * Fetches the profile data for a specific user.
   */
  async getProfile(userId) {
    if (!userId) throw new Error('userId is required to fetch profile');
    const cacheKey = `profile_${userId}`;

    if (!(await _isOnline())) {
      const cached = await cacheService.get(cacheKey, USER_TTL)
                  || await cacheService.getStale(cacheKey);
      if (cached) return { data: cached, error: null };
      return { data: null, error: null };
    }

    const result = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    if (!result.error && result.data) {
      await cacheService.set(cacheKey, result.data);
    }
    return result;
  },

  /**
   * Fetches active subscriptions for a specific user.
   */
  async getActiveSubscriptions(userId) {
    if (!userId) throw new Error('userId is required to fetch subscriptions');
    const cacheKey = `subscriptions_${userId}`;

    if (!(await _isOnline())) {
      const cached = await cacheService.get(cacheKey, USER_TTL)
                  || await cacheService.getStale(cacheKey);
      if (cached) return { data: cached, error: null };
      return { data: [], error: null };
    }

    const now = new Date().toISOString();
    const result = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`expires_at.gt.${now},expires_at.is.null`);

    if (!result.error && result.data) {
      await cacheService.set(cacheKey, result.data);
    }
    return result;
  },
};
