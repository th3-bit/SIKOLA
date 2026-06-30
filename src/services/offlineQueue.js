import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

/**
 * offlineQueue.js
 * Queues database write operations when the device is offline.
 * On reconnection, NetworkContext calls flush() to replay them in order.
 */

const QUEUE_KEY = 'sikola_offline_queue';

export const offlineQueue = {
  /**
   * Add a pending operation to the queue.
   * @param {object} operation - Must include a `type` string and relevant payload fields.
   */
  async enqueue(operation) {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push({ ...operation, queuedAt: Date.now() });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      logger.log(`offlineQueue: enqueued '${operation.type}' (${queue.length} total)`);
    } catch (e) {
      logger.warn('offlineQueue.enqueue failed:', e);
    }
  },

  /**
   * Returns the number of pending operations.
   */
  async getCount() {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (!raw) return 0;
      return JSON.parse(raw).length;
    } catch {
      return 0;
    }
  },

  /**
   * Execute all queued operations against Supabase.
   * Keeps any that fail so they can be retried next time.
   */
  async flush() {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (queue.length === 0) return;

      logger.log(`offlineQueue: flushing ${queue.length} queued operations...`);
      const failed = [];

      for (const op of queue) {
        try {
          await _execute(op);
          logger.log(`offlineQueue: ✓ executed '${op.type}'`);
        } catch (e) {
          logger.warn(`offlineQueue: ✗ failed '${op.type}'`, e.message);
          failed.push(op);
        }
      }

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
      logger.log(`offlineQueue: flush complete. ${failed.length} operations still pending.`);
    } catch (e) {
      logger.warn('offlineQueue.flush failed:', e);
    }
  },
};

/**
 * Internal: Execute a single queued operation.
 */
async function _execute(op) {
  switch (op.type) {
    case 'UPSERT_PROGRESS': {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: op.userId,
          topic_id: op.topicId,
          score: op.score,
          completed_at: op.completedAt,
        }, { onConflict: 'user_id,topic_id' });
      if (error) throw error;
      break;
    }

    case 'INCREMENT_STATS': {
      // Fetch current stats first so we don't overwrite with stale values
      const { data: current } = await supabase
        .from('user_stats')
        .select('total_xp, total_lessons_completed')
        .eq('user_id', op.userId)
        .single();

      const { error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: op.userId,
          total_xp: (current?.total_xp || 0) + op.xpGained,
          total_lessons_completed: (current?.total_lessons_completed || 0) + 1,
          last_activity_date: op.date,
        }, { onConflict: 'user_id' });
      if (error) throw error;
      break;
    }

    case 'LOG_SESSION': {
      const { error } = await supabase
        .from('learning_sessions')
        .insert({
          user_id: op.userId,
          subject_id: op.subjectId,
          duration_minutes: op.durationMinutes,
          session_type: op.sessionType,
          started_at: op.startedAt,
        });
      if (error) throw error;
      break;
    }

    default:
      logger.warn('offlineQueue: unknown operation type:', op.type);
  }
}
