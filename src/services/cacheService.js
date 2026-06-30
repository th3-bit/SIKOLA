import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

/**
 * cacheService.js
 * A thin AsyncStorage wrapper that stores data with a timestamp for TTL-based invalidation.
 * All cache keys are prefixed with 'sikola_cache_' to avoid collisions.
 */

const CACHE_PREFIX = 'sikola_cache_';

export const cacheService = {
  /**
   * Store data in cache with current timestamp.
   * @param {string} key
   * @param {any} data
   */
  async set(key, data) {
    try {
      const entry = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      logger.warn('cacheService.set failed:', e);
    }
  },

  /**
   * Retrieve cached data if it is still fresh.
   * @param {string} key
   * @param {number} maxAgeMs - Maximum age in milliseconds before data is considered stale
   * @returns {any|null} Cached data, or null if missing/stale
   */
  async get(key, maxAgeMs = 24 * 60 * 60 * 1000) {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      const age = Date.now() - entry.timestamp;
      if (age > maxAgeMs) {
        logger.log(`cacheService: '${key}' is stale (${Math.round(age / 60000)}m old), ignoring`);
        return null;
      }
      return entry.data;
    } catch (e) {
      logger.warn('cacheService.get failed:', e);
      return null;
    }
  },

  /**
   * Retrieve cached data regardless of age (useful for offline fallback).
   * @param {string} key
   * @returns {any|null}
   */
  async getStale(key) {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw).data;
    } catch (e) {
      logger.warn('cacheService.getStale failed:', e);
      return null;
    }
  },

  /**
   * Remove a specific cache entry.
   * @param {string} key
   */
  async clear(key) {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {
      logger.warn('cacheService.clear failed:', e);
    }
  },
};
