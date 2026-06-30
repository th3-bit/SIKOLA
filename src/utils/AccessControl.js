/**
 * AccessControl.js
 * Centralized business logic for evaluating user access to courses, lessons, and trial limits.
 * Pure javascript functions (No React State or Database calls).
 */

export const AccessControl = {

  /**
   * Evaluates if a specific course (topic_id) is unlocked for the user.
   * hierarchy: subscriptions -> Free Tier rules -> lock.
   */
  checkCourseAccess(topicId, subjectId, topicIndex, subscriptions, isTrialExpired) {
    if (!topicId) return false;

    // 1. Subscription Check (Premium Users)
    if (subscriptions && subscriptions.length > 0) {
      // 1a. All Access (No specific IDs means full access)
      const hasAllAccess = subscriptions.some(s => !s.topic_id && !s.subject_id);
      if (hasAllAccess) return true;

      // 1b. Targeted Access (Course/Topic or Subject)
      const hasTargetedAccess = subscriptions.some(s => {
        if (s.topic_id) return s.topic_id === topicId;
        if (s.subject_id) return s.subject_id === subjectId;
        return false;
      });

      if (hasTargetedAccess) return true;
    }

    // 2. Free Tier Check (First 2 courses are free if trial not expired)
    const isFree = !isTrialExpired && topicIndex < 2;
    if (isFree) return true;

    return false;
  },

  /**
   * Evaluates if a specific lesson is unlocked inside a course.
   */
  checkLessonAccess(lessonIndex, topicId, subjectId, topicIndex, subscriptions, isTrialExpired) {
    // 1. Must have access to the Course (Topic) first
    const hasCourseAccess = this.checkCourseAccess(topicId, subjectId, topicIndex, subscriptions, isTrialExpired); 
    if (!hasCourseAccess) return false;

    // 2. Targeted Subscription Check
    const hasTargetedSub = subscriptions && subscriptions.length > 0 && subscriptions.some(s => {
      if (!s.topic_id && !s.subject_id) return true;
      if (s.topic_id) return s.topic_id === topicId;
      if (s.subject_id) return s.subject_id === subjectId;
      return false;
    });

    if (hasTargetedSub) return true;

    // 3. Free Tier Check (First 2 courses AND First 2 lessons)
    const isFree = !isTrialExpired && topicIndex < 2 && lessonIndex < 2;
    if (isFree) return true;

    return false;
  },

  /**
   * Checks if a trial user has used up their daily testing limit.
   */
  checkTrialLimit(subscriptions, isTrialExpired, sessionsToday) {
    const hasActiveSub = subscriptions && subscriptions.length > 0;
    if (hasActiveSub) return true; // Subscribers bypassed

    if (isTrialExpired) return false; // Expired trial blocks everything

    // Returns false if they already took a test today
    const testToday = sessionsToday && sessionsToday.some(s => 
      s.session_type === 'test'
    );

    return !testToday;
  },

  /**
   * Formats subscription data into readable UI states.
   */
  getSubscriptionInfo(subscriptions, isTrialExpired, trialDaysRemaining) {
    if (subscriptions && subscriptions.length > 0) {
      const sub = subscriptions[0]; 
      let label = 'Sikola+ Member';
      let subLabel = 'Full Access Active';
      
      if (sub.expires_at) {
        const expiry = new Date(sub.expires_at);
        subLabel = `Renews on ${expiry.toLocaleDateString()}`;
      }
      return { type: 'premium', label, subLabel };
    }

    if (isTrialExpired) {
      return { 
        type: 'expired', 
        label: 'Trial Expired', 
        subLabel: 'Upgrade to unlock everything' 
      };
    }

    // Trial is active
    let label = 'Trial Active';
    let subLabel = trialDaysRemaining > 0 
      ? `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} remaining`
      : 'Trial expires today';

    return { type: 'trial', label, subLabel };
  }

};
