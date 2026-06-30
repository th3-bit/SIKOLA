import { supabase } from '../lib/supabase';
import { cacheService } from './cacheService';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';

/**
 * courseService.js
 * Handles all database operations relating to educational content.
 * Offline strategy: Cache-first when offline, network-first when online with cache update.
 */

const CURRICULUM_KEY = 'curriculum';
const CURRICULUM_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const courseService = {
  /**
   * Fetches the entire curriculum tree (Subjects -> Topics -> Lessons).
   * Uses AsyncStorage cache when offline.
   */
  async getFullCurriculum() {
    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected && netState.isInternetReachable !== false;

    if (!isOnline) {
      // Offline: try fresh cache, then fall back to any stale cache
      const cached = await cacheService.get(CURRICULUM_KEY, CURRICULUM_TTL)
                  || await cacheService.getStale(CURRICULUM_KEY);
      if (cached) {
        logger.log('courseService: serving curriculum from cache (offline)');
        return { data: cached, error: null };
      }
      logger.warn('courseService: offline and no cached curriculum available');
      return { data: [], error: null };
    }

    // Online: fetch from Supabase and update cache
    const result = await supabase
      .from('subjects')
      .select('*, topics(*, lessons(*))')
      .order('order_index', { ascending: true })
      .order('order_index', { foreignTable: 'topics', ascending: true })
      .order('order_index', { foreignTable: 'topics.lessons', ascending: true });

    if (!result.error && result.data) {
      await cacheService.set(CURRICULUM_KEY, result.data);
    }

    return result;
  },
};
