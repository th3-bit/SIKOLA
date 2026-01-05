import { supabase } from './supabase';

/**
 * Check if user has an active subscription
 * @param {string} userId - The user's ID
 * @returns {Promise<{hasAccess: boolean, subscription: object|null, plan: object|null}>}
 */
export const checkSubscriptionStatus = async (userId) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (subscriptions && subscriptions.length > 0) {
      return {
        hasAccess: true,
        subscription: subscriptions[0],
        plan: subscriptions[0].plan,
      };
    }

    return {
      hasAccess: false,
      subscription: null,
      plan: null,
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      hasAccess: false,
      subscription: null,
      plan: null,
    };
  }
};

/**
 * Check if user can access a specific topic
 * @param {string} userId - The user's ID
 * @param {string} topicId - The topic ID to check access for
 * @returns {Promise<boolean>}
 */
export const canAccessTopic = async (userId, topicId) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString());

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return false;
    }

    // Check if user has an all-access plan
    const hasAllAccess = subscriptions.some(
      sub => sub.plan.access_type === 'all_courses'
    );

    if (hasAllAccess) {
      return true;
    }

    // Check if user has access to this specific topic
    const hasTopicAccess = subscriptions.some(
      sub => sub.plan.access_type === 'single_course' && sub.topic_id === topicId
    );

    return hasTopicAccess;
  } catch (error) {
    console.error('Error checking topic access:', error);
    return false;
  }
};

/**
 * Get user's active subscriptions
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>}
 */
export const getUserSubscriptions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*),
        topic:topics(id, title)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    return [];
  }
};

/**
 * Check if user is on free trial
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>}
 */
export const isOnFreeTrial = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString());

    if (error) throw error;

    return data?.some(sub => sub.plan.plan_type === 'free_trial') || false;
  } catch (error) {
    console.error('Error checking free trial:', error);
    return false;
  }
};

/**
 * Get time remaining on subscription
 * @param {string} expiresAt - ISO date string
 * @returns {string} Human-readable time remaining
 */
export const getTimeRemaining = (expiresAt) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  }
};

/**
 * Deactivate expired subscriptions (should be called periodically)
 * @param {string} userId - The user's ID
 */
export const deactivateExpiredSubscriptions = async (userId) => {
  try {
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (error) throw error;
  } catch (error) {
    console.error('Error deactivating subscriptions:', error);
  }
};
