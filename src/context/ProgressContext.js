import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';
import NotificationService from '../NotificationService';
import logger from '../utils/logger';

// On web, we flag that progress was successfully loaded.
// Using localStorage (not sessionStorage) so the flag survives full page reloads (F5).
// The data itself is also cached so the UI can hydrate instantly before Supabase responds.
const PROGRESS_LOADED_KEY = '@sikola_progress_loaded';
const PROGRESS_DATA_CACHE_KEY = '@sikola_progress_data_cache';

function readLocalCache(key) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (_) {}
  return null;
}
function writeLocalCache(key, value) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  } catch (_) {}
}

function isProgressCached() {
  return readLocalCache(PROGRESS_LOADED_KEY) === '1';
}
function markProgressCached() {
  writeLocalCache(PROGRESS_LOADED_KEY, '1');
}

// Read/write the cached snapshot of user data
function readCachedProgressData() {
  try {
    const raw = readLocalCache(PROGRESS_DATA_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {}
  return null;
}
function writeCachedProgressData(snapshot) {
  try {
    writeLocalCache(PROGRESS_DATA_CACHE_KEY, JSON.stringify(snapshot));
  } catch (_) {}
}

// Service Imports (Phase 1)
import { userService } from '../services/userService';
import { courseService } from '../services/courseService';
import { progressService } from '../services/progressService';

// Utilities Imports (Phase 2)
import { AccessControl } from '../utils/AccessControl';
import { AchievementEngine } from '../utils/AchievementEngine';

const ProgressContext = createContext();

export function useProgress() {
  return useContext(ProgressContext);
}

// Modals extracted to GlobalModals (Phase 4)

export const ProgressProvider = ({ children }) => {
  // ── INSTANT HYDRATION FROM CACHE ──────────────────────────────────────────
  // On web reloads, read the last-known data snapshot from localStorage.
  // This seeds state immediately (synchronously) so React renders real data
  // on the very first frame — no blank screen / spinner at all.
  const _cached = readCachedProgressData();

  const [courseProgress, setCourseProgress] = useState(_cached?.courseProgress || {});
  const [userStats, setUserStats] = useState(_cached?.userStats || {
    current_streak: 0,
    max_streak: 0,
    total_xp: 0,
    total_lessons_completed: 0
  });
  const [recentLessons, setRecentLessons] = useState(_cached?.recentLessons || []);
  const [continueLearning, setContinueLearning] = useState(_cached?.continueLearning || []);
  const [sessions, setSessions] = useState([]);
  const [userActivities, setUserActivities] = useState([]);
  const [userProfile, setUserProfile] = useState(_cached?.userProfile || { name: 'Sikola Student', email: '' });
  const [weeklyActivity, setWeeklyActivity] = useState(_cached?.weeklyActivity || new Array(7).fill(false));
  const [subscriptions, setSubscriptions] = useState(_cached?.subscriptions || []);
  const [isTrialExpired, setIsTrialExpired] = useState(_cached?.isTrialExpired || false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(_cached?.trialDaysRemaining || 0);
  const [levelInfo, setLevelInfo] = useState(_cached?.levelInfo || AchievementEngine.getLevelInfo(0));
  const [subscriptionInfo, setSubscriptionInfo] = useState(_cached?.subscriptionInfo || { type: 'trial', label: 'Loading...', subLabel: '' });
  const [isLoading, setIsLoading] = useState(!isProgressCached()); // skip loading screen on cached reload
  const [achievements, setAchievements] = useState([]);
  const [subjects, setSubjects] = useState(_cached?.subjects || []); 
  const [subjectBreakdown, setSubjectBreakdown] = useState(_cached?.subjectBreakdown || []); 
  
  // Modals state
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardConfig, setRewardConfig] = useState({ xp: 0, title: '', subTitle: '', type: 'lesson', onAction: null });
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const lastAchievementStatuses = useRef({});
  // Guard against concurrent loadProgress calls (prevents TOKEN_REFRESHED cascade)
  const isLoadingRef = useRef(false);
  // Debounce TOKEN_REFRESHED — only allow one silent refresh every 10 seconds
  const lastTokenRefreshRef = useRef(0);
  // Cooldown for AppState foreground refresh — max once every 60 seconds
  const lastForegroundRefreshRef = useRef(0);

  useEffect(() => {
    // ─── RACE CONDITION FIX ───────────────────────────────────────────────────
    // Problem: loadProgress() was called immediately on mount. At that moment,
    // supabase.auth.getUser() could return null because the session hasn't been
    // restored from AsyncStorage yet (it's async). So data appeared empty.
    //
    // The SIGNED_IN event only fires on a FRESH login — it does NOT fire when
    // restoring an existing session on app launch. So returning users would see
    // empty data until they logged out and back in (which triggers a fresh SIGNED_IN).
    //
    // Fix: Explicitly call getSession() first. If a session already exists (returning
    // user), load data immediately. Then set up the listener for future auth events.
    // ─────────────────────────────────────────────────────────────────────────

    const bootstrap = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (initialSession?.user) {
        // Session already exists (returning user) — load data straight away
        // Pass user directly to avoid a second getUser() round-trip
        loadProgress(false, initialSession.user);
      } else {
        // No session yet — stop loading spinner so the login screen can show
        setIsLoading(false);
      }
    };

    bootstrap();

    // Listen for auth state changes to handle fresh logins and logouts
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.log(`ProgressContext: Auth event detected: ${event}`);
      if (event === 'SIGNED_IN') {
        // Fresh login — force-reset the guard so this always loads,
        // even if a bootstrap() call was in flight and already held the lock.
        isLoadingRef.current = false;
        if (session?.user) {
          loadProgress(false, session.user);
        } else {
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession?.user) loadProgress(false, retrySession.user);
          }, 500);
        }
      } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // ── TOKEN_REFRESHED DEBOUNCE ─────────────────────────────────────────────
        // React Strict Mode causes two onAuthStateChange listeners to exist briefly.
        // When the Supabase lock is stolen between them, AbortErrors fire which
        // trigger MORE TOKEN_REFRESHED events → infinite cascade → logout.
        // Fix: Only allow one silent refresh every 10 seconds.
        const now = Date.now();
        if (now - lastTokenRefreshRef.current < 10000) {
          logger.log('ProgressContext: TOKEN_REFRESHED debounced, skipping.');
          return;
        }
        lastTokenRefreshRef.current = now;
        if (session?.user) {
          loadProgress(true, session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear data on sign out and reset the loading guard
        // so the next SIGNED_IN event can always trigger a fresh load.
        isLoadingRef.current = false;
        setCourseProgress({});
        setUserProfile({ name: 'Guest Student', email: '' });
        setRecentLessons([]);
        setContinueLearning([]);
        setSubscriptions([]);
        setSessions([]);
        setUserActivities([]);
        setIsLoading(false);

        // Tear down subscription realtime channel on logout
        if (subscriptionChannel) {
          supabase.removeChannel(subscriptionChannel);
          subscriptionChannel = null;
        }
      }
    });

    // FIX 3: Realtime listener on user_subscriptions table
    // When the payment Edge Function writes a new subscription row,
    // this fires immediately and refreshes the context — no logout/login needed.
    let subscriptionChannel = null;

    const setupSubscriptionListener = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        subscriptionChannel = supabase
          .channel('user-subscriptions-realtime')
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT or UPDATE
              schema: 'public',
              table: 'user_subscriptions',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              logger.log('ProgressContext: Subscription change detected, refreshing...', payload.eventType);
              // Pass user directly — no extra getUser() round-trip needed
              setTimeout(() => loadProgress(true, user), 500);
            }
          )
          .subscribe((status) => {
            logger.log('ProgressContext: Subscription realtime status:', status);
          });
      } catch (err) {
        logger.warn('ProgressContext: Failed to set up subscription listener:', err);
      }
    };

    setupSubscriptionListener();

    // ── WEB VISIBILITY FIX ───────────────────────────────────────────────────────
    // On web, switching tabs and coming back can cause Supabase's TOKEN_REFRESHED
    // to re-fire and trigger the loading screen. Instead, we listen for the page
    // becoming visible again and do a silent background data refresh only.
    let visibilityHandler = null;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          logger.log('ProgressContext: Tab became visible, doing silent refresh.');
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s?.user) loadProgress(true, s.user); // silent = true, no loading spinner
          });
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);
    }

    // ── NATIVE APP STATE FIX (iOS / Android) ─────────────────────────────────────
    // On native, when the app comes back to foreground, do a silent refresh.
    // Cooldown: max once every 60 seconds — prevents a full network call every
    // time the user switches apps briefly (e.g. copy-paste from another app).
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && Platform.OS !== 'web') {
        const now = Date.now();
        if (now - lastForegroundRefreshRef.current < 60000) {
          logger.log('ProgressContext: Foreground refresh skipped (cooldown active).');
          return;
        }
        lastForegroundRefreshRef.current = now;
        logger.log('ProgressContext: App came to foreground, doing silent refresh.');
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (s?.user) loadProgress(true, s.user);
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
      if (subscriptionChannel) {
        supabase.removeChannel(subscriptionChannel);
      }
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
      }
      appStateSubscription?.remove();
    };
  }, []);

  // Accept an optional `knownUser` to avoid an extra getUser() round-trip.
  // All callers now pass the user they already have, eliminating the race
  // where getUser() could return null milliseconds after SIGNED_IN fires.
  const loadProgress = async (silent = false, knownUser = null) => {
    // ── CONCURRENT CALL GUARD ───────────────────────────────────────────────────
    // Prevent two simultaneous loadProgress calls (e.g. from double TOKEN_REFRESHED).
    // The second call is simply dropped — the first one has the latest data.
    if (isLoadingRef.current) {
      logger.log('ProgressContext: loadProgress already running, skipping duplicate call.');
      return;
    }
    isLoadingRef.current = true;
    try {
      // On a cached reload we start silent (no spinner) to avoid the loading screen,
      // but still refresh all data in the background.
      const effectivelySilent = silent || isProgressCached();
      if (!effectivelySilent) setIsLoading(true);

      // Use the provided user, or fall back to getUser() as a last resort
      let user = knownUser;
      if (!user) {
        const { data } = await supabase.auth.getUser();
        user = data?.user ?? null;
      }

      if (!user) {
        setIsLoading(false);
        setUserProfile({ name: 'Guest Student', email: '' });
        return;
      }

      // Parallelize All Main Data Fetches via Services
      const [
        profileRes,
        subRes,
        progressRes,
        statsRes,
        sessionRes,
        subjectsRes
      ] = await Promise.all([
        userService.getProfile(user.id),
        userService.getActiveSubscriptions(user.id),
        progressService.getUserProgress(user.id),
        progressService.getUserStats(user.id).catch(() => ({ data: null })), // Handle PGRST116 safely
        progressService.getLearningSessions(user.id),
        courseService.getFullCurriculum(),
      ]);

      // 1. Process Profile
      const profileData = profileRes.data;
      if (profileData) {
        setUserProfile({ name: profileData.full_name || 'Sikola Student', email: profileData.email || user.email });
      }

      // 2. Process Trial Status
      let daysLeft = 0;
      let expired = false;
      if (user.created_at) {
        const diffDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
        expired = diffDays > 3;
        daysLeft = Math.max(0, Math.ceil(3 - diffDays));
      }
      setIsTrialExpired(expired);
      setTrialDaysRemaining(daysLeft);

      // 3. Process Subscriptions
      const subData = subRes.data || [];
      setSubscriptions(subData);
      setSubscriptionInfo(AccessControl.getSubscriptionInfo(subData, expired, daysLeft));

      // 4. Process Progress & Analytics
      const progressData = progressRes.data || [];
      const formattedProgress = {};
      progressData.forEach(item => {
        formattedProgress[item.topic_id] = { completed: true, score: item.score };
      });
      setCourseProgress(formattedProgress);

      const subjectsData = subjectsRes.data || [];
      const sessionData = sessionRes.data || [];
      setSessions(sessionData);

      const topicMap = new Map();
      const lessonMap = new Map();
      
      if (subjectsData) {
        subjectsData.forEach((s, sIdx) => {
          if (s.topics) {
            s.topics.forEach((t, tIdx) => {
              topicMap.set(t.id, { topic: t, subject: s, subjectIndex: sIdx, topicIndex: tIdx });
              if (t.lessons) {
                t.lessons.forEach(l => {
                  lessonMap.set(l.id, { lesson: l, topic: t, subject: s, subjectIndex: sIdx, topicIndex: tIdx });
                });
              }
            });
          }
        });
      }

      const completedTopicIds = new Set();
      progressData.forEach(p => {
        completedTopicIds.add(p.topic_id);
        const lessonEntry = lessonMap.get(p.topic_id);
        if (lessonEntry) completedTopicIds.add(lessonEntry.topic.id);
      });
      const totalMinutes = sessionData.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
      
      const breakdown = subjectsData.map(s => {
        const style = getSubjectStyle(s.name);
        const subjectTime = sessionData
          .filter(ses => ses.subject_id === s.id)
          .reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
        
        const subjectTopics = s.topics || [];
        const completedCount = subjectTopics.filter(t => completedTopicIds.has(t.id)).length;
        const subjectLessonCount = subjectTopics.reduce((acc, t) => acc + (t.lessons?.length || 0), 0);

        return {
          id: s.id,
          name: s.name,
          color: s.color || style.color,
          minutes: subjectTime,
          percentage: totalMinutes > 0 ? Math.round((subjectTime / totalMinutes) * 100) : 0,
          totalTopics: subjectTopics.length,
          completedTopics: completedCount,
          totalLessons: subjectLessonCount,
          icon: style.icon
        };
      }).sort((a, b) => b.completedTopics - a.completedTopics || a.name.localeCompare(b.name));
      
      setSubjectBreakdown(breakdown);
      setSubjects(subjectsData);

      // 4.5. Process Recent Topics (Phase 3)
      let accessedTopics = {};
      try {
        const stored = await AsyncStorage.getItem('accessedTopics');
        if (stored) accessedTopics = JSON.parse(stored);
      } catch (e) {}

      const topicProgressMap = new Map();
      const progressKeys = new Set((progressData || []).map(p => p.topic_id));

      (progressData || []).forEach(p => {
        const entry = lessonMap.get(p.topic_id) || topicMap.get(p.topic_id);
        if (!entry) return;
        
        const topic = entry.topic;
        const subject = entry.subject;
        
        const accessedAt = accessedTopics[topic.id] || p.completed_at;
        const lastActiveAt = new Date(Math.max(new Date(p.completed_at).getTime(), new Date(accessedAt).getTime())).toISOString();

        if (!topicProgressMap.has(topic.id)) {
          // Calculate progress for this topic
          const totalLessons = topic.lessons?.length || 0;
          const completedLessons = (topic.lessons || []).filter(l => progressKeys.has(l.id)).length;
          
          // Heuristic: If there are lessons, use lesson completion. 
          // If the topic itself is in progressKeys (e.g. test passed), it's 100%.
          let progressPerc = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          if (progressKeys.has(topic.id)) progressPerc = 100;

          const style = getSubjectStyle(subject?.name);
          
          topicProgressMap.set(topic.id, {
            id: topic.id,
            title: topic.title, // Course Name
            category: subject?.name || 'Education', // Course
            progress: Math.min(progressPerc, 100),
            duration: totalLessons * 15, 
            color: subject?.color || style.color,
            icon: style.icon,
            completed_at: lastActiveAt,
            subject_id: subject?.id,
            subjectIndex: entry.subjectIndex,
            topicIndex: entry.topicIndex
          });
        }
      });

      // Now add any topics that were accessed but NEVER completed a lesson
      Object.entries(accessedTopics).forEach(([tId, timestamp]) => {
         if (!topicProgressMap.has(tId)) {
            const entry = topicMap.get(tId);
            if (!entry) return;
            const topic = entry.topic;
            const subject = entry.subject;
            const style = getSubjectStyle(subject?.name);
            topicProgressMap.set(topic.id, {
              id: topic.id,
              title: topic.title, // Course Name
              category: subject?.name || 'Education', // Course
              progress: 0,
              duration: (topic.lessons?.length || 0) * 15,
              color: subject?.color || style.color,
              icon: style.icon,
              completed_at: timestamp,
              subject_id: subject?.id,
              subjectIndex: entry.subjectIndex,
              topicIndex: entry.topicIndex
            });
         }
      });

      const processedRecentTopics = Array.from(topicProgressMap.values())
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

      setRecentLessons(processedRecentTopics);
      // For "Continue Learning", show ONLY in-progress topics (less than 100%) and remove limit
      setContinueLearning(processedRecentTopics.filter(t => t.progress < 100));

      // 4.6. UNIFIED Activities Timeline (Phase 2)
      const activityFromProgress = (progressData || []).map(p => {
        const entry = lessonMap.get(p.topic_id) || topicMap.get(p.topic_id);
        const subject = entry?.subject;
        const style = getSubjectStyle(subject?.name);
        return {
          id: `prog-${p.topic_id}-${p.completed_at}`,
          title: `Mastered ${entry?.lesson?.title || entry?.topic?.title || 'Topic'}`,
          time: p.completed_at,
          type: 'score',
          color: subject?.color || style.color,
          timestamp: new Date(p.completed_at).getTime()
        };
      });

      const activityFromSessions = (sessionData || []).map(s => {
        const subject = subjectsData.find(subj => subj.id === s.subject_id);
        const style = getSubjectStyle(subject?.name);
        return {
          id: `sess-${s.id}`,
          title: `${s.session_type === 'test' ? 'Tested' : 'Studied'} ${subject?.name || 'Lessons'}`,
          time: s.started_at,
          type: s.session_type === 'test' ? 'score' : 'start',
          color: subject?.color || style.color,
          timestamp: new Date(s.started_at).getTime()
        };
      });

      const unifiedActivities = [...activityFromProgress, ...activityFromSessions]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);

      setUserActivities(unifiedActivities);

      // 5. Process Stats via AchievementEngine
      if (statsRes.data) {
        setUserStats(statsRes.data);
        setLevelInfo(AchievementEngine.getLevelInfo(statsRes.data.total_xp));
      }

      // 6. Activities & Achievements (Delegated to AchievementEngine)
      setWeeklyActivity(AchievementEngine.calculateWeeklyActivity(sessionData, progressData));
      
      const calculatedAchievements = AchievementEngine.calculateWeeklyAchievements(sessionData, progressData);
      setAchievements(calculatedAchievements);

      calculatedAchievements.forEach(achievement => {
        const wasUnlocked = lastAchievementStatuses.current[achievement.id];
        const isNowUnlocked = achievement.unlocked;

        if (wasUnlocked === false && isNowUnlocked === true) {
          setSelectedAchievement(achievement);
          setTimeout(() => setShowAchievementModal(true), 1500); 
        }
        lastAchievementStatuses.current[achievement.id] = isNowUnlocked;
      });

      // 7. Notifications
      setTimeout(async () => {
        try {
          await NotificationService.initialize();
          const firstName = (profileData?.full_name || user.user_metadata?.full_name || 'Student').split(' ')[0];
          const lastSubName = breakdown?.length > 0 ? breakdown[0].name : 'Subjects';
          
          await NotificationService.scheduleDailyReminder(4, 0, firstName, lastSubName);
          await NotificationService.scheduleStreakAlert();
          await NotificationService.scheduleWeekendBonus();
          await NotificationService.scheduleInactivityNudge(firstName);
          await NotificationService.scheduleSmartNudge(statsRes.data?.total_lessons_completed || 0);
          
          if (daysLeft === 1) await NotificationService.scheduleTrialExpiryWarning(1);
        } catch (e) {
          logger.warn('Full notification sync failure', e);
        }
      }, 1000);

      // 8. Persist a lightweight snapshot to localStorage so the next page reload
      //    can hydrate the UI instantly (no blank screen / spinner).
      //    We skip icon functions and heavy session arrays to keep the payload small.
      try {
        const snapshot = {
          courseProgress: formattedProgress,
          userStats: statsRes.data || userStats,
          recentLessons: recentTopics,
          continueLearning: continueTopics,
          userProfile: profileData ? { name: profileData.full_name || 'Sikola Student', email: profileData.email || user.email } : userProfile,
          weeklyActivity: AchievementEngine.calculateWeeklyActivity(sessionData, progressData),
          subscriptions: subData,
          isTrialExpired: expired,
          trialDaysRemaining: daysLeft,
          levelInfo: AchievementEngine.getLevelInfo(statsRes.data?.total_xp || 0),
          subscriptionInfo: AccessControl.getSubscriptionInfo(subData, expired, daysLeft),
          subjectBreakdown: breakdown.map(b => ({ ...b, icon: undefined })), // strip non-serializable icon
          subjects: subjectsData.map(s => ({ id: s.id, name: s.name, color: s.color })),
        };
        writeCachedProgressData(snapshot);
      } catch (cacheErr) {
        logger.warn('ProgressContext: Failed to write data cache', cacheErr);
      }

    } catch (error) {
      // AbortError is expected when React Strict Mode causes a lock-steal between
      // two competing Supabase listeners. It is NOT a real error — ignore it silently.
      if (error?.name === 'AbortError' || error?.message?.includes('Lock broken')) {
        logger.log('ProgressContext: loadProgress aborted by lock-steal (React Strict Mode). Ignoring.');
      } else {
        logger.error('Failed to parallel load progress', error);
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      // Mark that progress was loaded this session — future reloads skip the spinner
      markProgressCached();
    }
  };

  const saveProgress = async (newProgress) => {
    try {
      await AsyncStorage.setItem('userProgress', JSON.stringify(newProgress));
    } catch (error) {
      logger.error('Failed to save progress', error);
    }
  };

  const completeTopic = (courseId, topicId, score = 0, duration = 15, sessionType = 'lesson', onAction = null) => {
    try {
      const xpGained = score >= 90 ? 150 : score >= 70 ? 100 : 50;
      const oldXP = userStats.total_xp || 0;
      const updatedXP = oldXP + xpGained;
      const oldLevelInfo = AchievementEngine.getLevelInfo(oldXP);
      const newLevelInfo = AchievementEngine.getLevelInfo(updatedXP);

      if (newLevelInfo.current.level > oldLevelInfo.current.level) {
        setLevelUpData(newLevelInfo);
        setTimeout(() => setShowLevelUpModal(true), 1200); 
      }

      // 1. OPTIMISTIC UPDATES (Instant UI)
      if (topicId) {
        setCourseProgress(prev => ({
          ...prev,
          [topicId]: { completed: true, score: score }
        }));
      }

      setUserStats(prev => {
        setLevelInfo(newLevelInfo);
        return {
          ...prev,
          total_xp: updatedXP,
          total_lessons_completed: (prev?.total_lessons_completed || 0) + 1,
          last_activity_date: new Date().toISOString().split('T')[0]
        };
      });

      // 2. TRIGGER REWARD INSTANTLY
      setRewardConfig({
        xp: xpGained,
        title: sessionType === 'test' ? 'Mastery Achieved!' : 'Lesson Complete!',
        subTitle: score >= 90 ? "Legendary! Your performance is outstanding." : "Great job! You've mastered this topic.",
        type: sessionType,
        onAction: onAction
      });
      setShowRewardModal(true);

      // 3. BACKGROUND PERSISTENCE using ProgressService
      const persistProgress = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (topicId) await progressService.upsertProgress(user.id, topicId, score);
          await progressService.incrementUserStats(user.id, xpGained);
          await progressService.logSession(user.id, courseId, duration, sessionType);
          loadProgress(true); // Silent refresh
        } catch (dbErr) {
          logger.error("Critical: Failed to persist progress to DB", dbErr);
          Alert.alert("Sync Error", "Progress saved locally but failed to sync to cloud.");
        }
      };
      
      // Fire and forget
      persistProgress();

    } catch (error) {
      logger.error('Error in completeTopic flow:', error);
    }
  };

  const markTopicAsAccessed = async (topicId) => {
    try {
      const now = new Date().toISOString();
      const stored = await AsyncStorage.getItem('accessedTopics');
      const data = stored ? JSON.parse(stored) : {};
      data[topicId] = now;
      await AsyncStorage.setItem('accessedTopics', JSON.stringify(data));

      // Instantly move this topic to the front of continueLearning
      setContinueLearning(prev => {
        const existing = [...prev];
        const idx = existing.findIndex(t => t.id === topicId);
        if (idx !== -1) {
          const item = existing.splice(idx, 1)[0];
          item.completed_at = now;
          return [item, ...existing];
        } else {
          // If it wasn't in continueLearning (e.g. brand new course), trigger loadProgress
          setTimeout(() => loadProgress(true), 100);
          return prev;
        }
      });
    } catch (e) {
      logger.warn('Failed to mark topic as accessed', e);
    }
  };

  const isTopicCompleted = (courseId, topicId) => courseProgress[topicId]?.completed === true;
  const getTopicScore = (courseId, topicId) => courseProgress[topicId]?.score || 0;

  // Delegated Access Control functions
  const checkTrialLimit = () => AccessControl.checkTrialLimit(subscriptions, isTrialExpired, sessions);
  const checkSubjectAccess = (subjectId, subjectIndex) => true; 
  const checkAccess = (topicId, subjectId, topicIndex, subjectIndex) => {
    return AccessControl.checkCourseAccess(topicId, subjectId, topicIndex, subscriptions, isTrialExpired);
  };
  const checkLessonAccess = (lessonIndex, topicId, subjectId, topicIndex) => {
    return AccessControl.checkLessonAccess(lessonIndex, topicId, subjectId, topicIndex, subscriptions, isTrialExpired);
  };

  return (
    <ProgressContext.Provider value={{ 
      courseProgress, 
      userStats,
      sessions,
      weeklyActivity,
      recentLessons,
      userActivities,
      continueLearning,
      userProfile,
      levelInfo,
      completeTopic, 
      markTopicAsAccessed,
      isTopicCompleted,
      getTopicScore,
      checkAccess,
      checkLessonAccess, 
      checkSubjectAccess, 
      checkTrialLimit,
      isLoading,
      subjectBreakdown,
      saveProgress,
      achievements,
      subjects,
      subscriptions,
      isTrialExpired,
      subscriptionInfo,
      refreshProgress: loadProgress,
      refreshStats: loadProgress, // Added for compatibility with other screens
      refreshData: loadProgress,  // FIX 1: Alias used by PaymentScreen after payment completes
      // Modals State
      showRewardModal, setShowRewardModal, rewardConfig,
      showLevelUpModal, setShowLevelUpModal, levelUpData,
      showAchievementModal, setShowAchievementModal, selectedAchievement
    }}>
      {children}
    </ProgressContext.Provider>
  );
};
