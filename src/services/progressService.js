import { supabase } from '../lib/supabase';
import { cacheService } from './cacheService';
import { offlineQueue } from './offlineQueue';
import NetInfo from '@react-native-community/netinfo';

/**
 * progressService.js
 * Handles reading and writing user progress, statistics, and learning sessions.
 * Offline strategy:
 *   - Reads: serve from cache, fall back to stale cache
 *   - Writes: queue operations for later sync when offline
 */

const USER_TTL  = 5 * 60 * 1000; // 5 minutes for user-specific data

async function _isOnline() {
  const state = await NetInfo.fetch();
  // Use ONLY isConnected — isInternetReachable is unreliable on Android
  // and often returns null/false even when the device is fully online.
  return state.isConnected === true;
}

export const progressService = {

  // ─── READ METHODS ─────────────────────────────────────────────────────────

  async getUserProgress(userId) {
    if (!userId) throw new Error('userId is required');
    const cacheKey = `progress_${userId}`;

    if (!(await _isOnline())) {
      const cached = await cacheService.get(cacheKey, USER_TTL)
                  || await cacheService.getStale(cacheKey);
      if (cached) return { data: cached, error: null };
      return { data: [], error: null };
    }

    const result = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (!result.error && result.data) {
      await cacheService.set(cacheKey, result.data);
    }
    return result;
  },

  async getUserStats(userId) {
    if (!userId) throw new Error('userId is required');
    const cacheKey = `stats_${userId}`;

    if (!(await _isOnline())) {
      const cached = await cacheService.get(cacheKey, USER_TTL)
                  || await cacheService.getStale(cacheKey);
      if (cached) return { data: cached, error: null };
      return { data: null, error: null };
    }

    const result = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!result.error && result.data) {
      await cacheService.set(cacheKey, result.data);
    }
    return result;
  },

  async getLearningSessions(userId) {
    if (!userId) throw new Error('userId is required');
    const cacheKey = `sessions_${userId}`;

    if (!(await _isOnline())) {
      const cached = await cacheService.get(cacheKey, USER_TTL)
                  || await cacheService.getStale(cacheKey);
      if (cached) return { data: cached, error: null };
      return { data: [], error: null };
    }

    const result = await supabase
      .from('learning_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (!result.error && result.data) {
      await cacheService.set(cacheKey, result.data);
    }
    return result;
  },

  // ─── WRITE METHODS ────────────────────────────────────────────────────────

  async upsertProgress(userId, topicId, score) {
    if (!userId || !topicId) throw new Error('userId and topicId are required');

    if (!(await _isOnline())) {
      // Queue the write; the optimistic UI update in ProgressContext already reflects it
      await offlineQueue.enqueue({
        type: 'UPSERT_PROGRESS',
        userId,
        topicId,
        score,
        completedAt: new Date().toISOString(),
      });
      return { data: null, error: null }; // Pretend success — will sync later
    }

    return await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        topic_id: topicId,
        score,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,topic_id' });
  },

  async incrementUserStats(userId, xpGained) {
    if (!userId) throw new Error('userId is required');

    if (!(await _isOnline())) {
      await offlineQueue.enqueue({
        type: 'INCREMENT_STATS',
        userId,
        xpGained,
        date: new Date().toISOString().split('T')[0],
      });
      return { data: null, error: null };
    }

    // Fetch current stats
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    const today = new Date().toISOString().split('T')[0];
    return await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_xp: (currentStats?.total_xp || 0) + xpGained,
        total_lessons_completed: (currentStats?.total_lessons_completed || 0) + 1,
        last_activity_date: today,
      }, { onConflict: 'user_id' });
  },

  async logSession(userId, subjectId, durationMinutes, sessionType) {
    if (!userId) throw new Error('userId is required');

    const startedAt = new Date(Date.now() - durationMinutes * 60000).toISOString();

    if (!(await _isOnline())) {
      await offlineQueue.enqueue({
        type: 'LOG_SESSION',
        userId,
        subjectId,
        durationMinutes,
        sessionType,
        startedAt,
      });
      return { data: null, error: null };
    }

    return await supabase.from('learning_sessions').insert({
      user_id: userId,
      subject_id: subjectId,
      duration_minutes: durationMinutes,
      session_type: sessionType,
      started_at: startedAt,
    });
  },
};
