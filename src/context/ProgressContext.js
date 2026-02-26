import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';
import NotificationService from '../services/NotificationService';
import { getLevelInfo } from '../constants/LevelConfig';
import RewardModal from '../components/RewardModal';

const ProgressContext = createContext();

export const useProgress = () => {
  return useContext(ProgressContext);
};

export const ProgressProvider = ({ children }) => {
  const [courseProgress, setCourseProgress] = useState({});
  const [userStats, setUserStats] = useState({
    current_streak: 0,
    max_streak: 0,
    total_xp: 0,
    total_lessons_completed: 0
  });
  const [recentLessons, setRecentLessons] = useState([]);
  const [continueLearning, setContinueLearning] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: 'Sikola Student', email: '' });
  const [weeklyActivity, setWeeklyActivity] = useState(new Array(7).fill(false));
    const [subscriptions, setSubscriptions] = useState([]);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [levelInfo, setLevelInfo] = useState(getLevelInfo(0));
  const [subscriptionInfo, setSubscriptionInfo] = useState({ type: 'trial', label: 'Loading...', subLabel: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardConfig, setRewardConfig] = useState({ 
    xp: 0, 
    title: '', 
    subTitle: '', 
    type: 'lesson',
    onAction: null 
  });

  // Load progress from storage on mount
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    console.log('ProgressContext: loadProgress started');
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('ProgressContext: User fetched', user?.id, userError);
      
      if (!user) {
        setIsLoading(false);
        setUserProfile({ name: 'Guest Student', email: '' });
        return;
      }

      // Fetch Profile Details
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setUserProfile({
            name: profileData.full_name || 'Sikola Student',
            email: profileData.email || user.email
          });
        } else {
          setUserProfile({
            name: user.user_metadata?.full_name || 'Sikola Student',
            email: user.email
          });
        }
      } catch (e) {
        console.error("Error fetching user profile", e);
        setUserProfile({ name: 'Sikola Student', email: user.email });
      }

      // Check Trial Status & Countdown
      let expired = false;
      let daysLeft = 0;
      if (user.created_at) {
        try {
          const createdAt = new Date(user.created_at).getTime();
          const now = Date.now();
          if (!isNaN(createdAt)) {
             const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
             expired = diffDays > 3;
             daysLeft = Math.max(0, Math.ceil(3 - diffDays));
             console.log('ProgressContext: Trial Status', { diffDays, expired, daysLeft });
          }
        } catch (e) {
          console.error("Error calculating trial expiry", e);
        }
      }
      setIsTrialExpired(expired);
      setTrialDaysRemaining(daysLeft);

      // 0. Fetch User Subscriptions
      let currentSubs = [];
      try {
          console.log('ProgressContext: Fetching subscriptions');
          const { data: subData, error: subError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`); // Support permanent or timed subs

          if (subData) {
            setSubscriptions(subData);
            currentSubs = subData;
          }
      } catch (e) {
         console.error("Error fetching subscriptions", e);
      }

      // 0b. Process Final Subscription/Trial Status
      // FIX: Use fresh currentSubs instead of potentially stale 'subscriptions' state
      const info = getSubscriptionInfo(currentSubs, daysLeft, expired, user.created_at);
      setSubscriptionInfo(info);

      // 1. Fetch user progress
      console.log('ProgressContext: Fetching user_progress');
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false }); // Get most recent first
      
      console.log('ProgressContext: user_progress fetched', progressData?.length);

      if (progressData) {
        // Map for internal lookups
        const formattedProgress = {};
        progressData.forEach(item => {
          formattedProgress[item.topic_id] = { completed: true, score: item.score };
        });
        setCourseProgress(formattedProgress);

        // 2. Fetch Lesson Details for Recent Activity
        // extract unique lesson IDs (stored as 'topic_id' in user_progress based on previous usage)
        const lessonIds = [...new Set(progressData.map(p => p.topic_id))].slice(0, 10); // Limit to 10
        console.log('ProgressContext: processing lessonIds', lessonIds);
        
        if (lessonIds.length > 0) {
          try {
            console.log('ProgressContext: Fetching recent activity details (lessons/topics)');
            
            // Fetch everything we might need in parallel
            const [lessonsRes, topicsRes] = await Promise.all([
              supabase.from('lessons').select('*, topics(*, subjects(*))').in('id', lessonIds),
              supabase.from('topics').select('*, subjects(*)').in('id', lessonIds)
            ]);

            const lessonsData = lessonsRes.data || [];
            const topicsAsActivity = topicsRes.data || [];

            // Combine and map based on original progress order
            const processedRecent = lessonIds.map(id => {
              const progressEntry = progressData.find(p => p.topic_id === id);
              const lesson = lessonsData.find(l => l.id === id);
              
              if (lesson) {
                const topicNav = Array.isArray(lesson.topics) ? lesson.topics[0] : lesson.topics;
                const subjectNav = topicNav ? (Array.isArray(topicNav.subjects) ? topicNav.subjects[0] : topicNav.subjects) : null;
                const style = getSubjectStyle(subjectNav?.name);
                
                return {
                  id: lesson.id,
                  title: lesson.title,
                  category: subjectNav?.name || 'General',
                  progress: 100, // If it's in progressData sorted by completed_at, it's completed
                  duration: lesson.duration || 15,
                  color: subjectNav?.color || style.color,
                  icon: style.icon,
                  completed_at: progressEntry?.completed_at,
                  topic_id: lesson.topic_id,
                  topic_title: topicNav?.title,
                  subject_id: subjectNav?.id,
                  type: 'lesson'
                };
              }

              const topicAsAct = topicsAsActivity.find(t => t.id === id);
              if (topicAsAct) {
                const subjectNav = Array.isArray(topicAsAct.subjects) ? topicAsAct.subjects[0] : topicAsAct.subjects;
                const style = getSubjectStyle(subjectNav?.name);
                
                return {
                  id: topicAsAct.id,
                  title: topicAsAct.title,
                  category: subjectNav?.name || 'General',
                  progress: 100,
                  duration: 30, // Default for topic
                  color: subjectNav?.color || style.color,
                  icon: style.icon,
                  completed_at: progressEntry?.completed_at,
                  topic_id: topicAsAct.id,
                  topic_title: topicAsAct.title,
                  type: 'topic'
                };
              }

              return null;
            }).filter(Boolean);

            // Only show actual lessons in Recent Lessons, not topics
            setRecentLessons(processedRecent.filter(item => item && item.type === 'lesson'));

            // Process Continue Learning (Keep previous logic but ensure it uses the fetched lessonsData)
            const uniqueTopicIds = [...new Set(lessonsData.map(l => l.topic_id).filter(Boolean))];
              
              console.log('ProgressContext: fetching topicLessons for stats', uniqueTopicIds);
              const { data: topicLessons } = await supabase
                .from('lessons')
                .select('id, topic_id')
                .in('topic_id', uniqueTopicIds);
              
              if (topicLessons) {
                const topicStats = uniqueTopicIds.map(tId => {
                  const topicLessonList = topicLessons.filter(l => l.topic_id === tId);
                  const total = topicLessonList.length;
                  const completed = topicLessonList.filter(l => formattedProgress[l.id]?.completed).length;
                  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                  
                  // Find a lesson example to get metadata
                  const exampleLesson = lessonsData.find(l => l.topic_id === tId);
                  const topicData = Array.isArray(exampleLesson?.topics) ? exampleLesson.topics[0] : exampleLesson?.topics;
                  const subjectData = topicData ? (Array.isArray(topicData.subjects) ? topicData.subjects[0] : topicData.subjects) : null;

                  const style = getSubjectStyle(subjectData?.name);

                  return {
                    id: tId,
                    subject_id: subjectData?.id,
                    title: topicData?.title || 'Unknown Topic',
                    category: subjectData?.name || 'General',
                    progress,
                    duration: total * 15,
                    color: subjectData?.color || style.color,
                    icon: style.icon
                  };
                });
                setContinueLearning(topicStats.filter(t => t && t.progress < 100)); 
              }
          } catch (err) {
            console.error('Error fetching recent lessons details:', err);
          }
        }
      }

      // Fetch user stats
      try {
        console.log('ProgressContext: Fetching user_stats');
        const { data: statsData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (statsData) {
          setUserStats(statsData);
          setLevelInfo(getLevelInfo(statsData.total_xp));
        } else {
          const initialStats = {
            user_id: user.id,
            current_streak: 0,
            max_streak: 0,
            total_xp: 0,
            total_lessons_completed: 0
          };
          // Try insert, ignore error if duplicate
          await supabase.from('user_stats').insert([initialStats]).catch(e => console.log('Insert stats error', e));
          setUserStats(initialStats);
        }
      } catch (e) {
        console.log("Stats fetch error", e);
      }
      
      // Fetch learning sessions
      try {
        console.log('ProgressContext: Fetching learning_sessions');
        const { data: sessionData } = await supabase
          .from('learning_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false });
        
        if (sessionData) {
          setSessions(sessionData);
          
          // Calculate weekly activity (Mon-Sun)
          const activity = new Array(7).fill(false);
          const now = new Date();
          const firstDayOfWeek = new Date(now);
          // Set to Monday of current week
          const day = now.getDay(); // 0 is Sun, 1 is Mon...
          const diff = (day === 0 ? -6 : 1) - day;
          firstDayOfWeek.setDate(now.getDate() + diff);
          firstDayOfWeek.setHours(0, 0, 0, 0);

          sessionData.forEach(s => {
            try {
              const sessionDate = new Date(s.started_at);
              if (sessionDate >= firstDayOfWeek && !isNaN(sessionDate)) {
                const dayIdx = (sessionDate.getDay() + 6) % 7; // Map 0-6 (Sun-Sat) to 0-6 (Mon-Sun)
                activity[dayIdx] = true;
              }
            } catch (err) { console.error('Date parse error', err); }
          });
          setWeeklyActivity(activity);
        }
      } catch (e) {
        console.log("Sessions fetch error", e);
      }
      // Initialize and schedule notifications
      try {
        await NotificationService.initialize();
        
        // 1. Personalized Daily Reminder (using name and last subject)
        const firstName = userProfile.name.split(' ')[0];
        const lastSubject = recentLessons.length > 0 ? recentLessons[0].category : null;
        await NotificationService.scheduleDailyReminder(9, 0, firstName, lastSubject);

        // 2. Smart Nudge (using total lessons completed)
        const lessonsCount = userStats.total_lessons_completed || 0;
        await NotificationService.scheduleSmartNudge(lessonsCount);

        // 3. Streak Alert (standard)
        await NotificationService.scheduleStreakAlert();

        // Phase 2: Engagement Notifications
        
        // 4. Inactivity Safety Net
        await NotificationService.scheduleInactivityNudge(firstName);

        // 5. Weekend Warrior (Only schedule if it's not already the weekend)
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          await NotificationService.scheduleWeekendBonus();
        }

        // 6. Trial Countdown (If user is in trial and has 1 day left)
        if (subscriptionInfo.type === 'trial' && trialDaysRemaining <= 1) {
          await NotificationService.scheduleTrialExpiryWarning(trialDaysRemaining);
        }
        
      } catch (notiError) {
        console.warn('Silent notification init failure:', notiError);
      }

      console.log('ProgressContext: loadProgress finished');
    } catch (error) {
      console.error('Failed to load progress from Supabase', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async (newProgress) => {
    try {
      await AsyncStorage.setItem('userProgress', JSON.stringify(newProgress));
    } catch (error) {
      console.error('Failed to save progress', error);
    }
  };

  // Mark a topic as completed
  const completeTopic = async (courseId, topicId, score = 0, duration = 15, sessionType = 'lesson', onAction = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const xpGained = score >= 90 ? 150 : score >= 70 ? 100 : 50;

      // 1. OPTIMISTIC UPDATES (Immediate UI feedback)
      if (topicId) {
        setCourseProgress(prev => ({
          ...prev,
          [topicId]: { completed: true, score: score }
        }));
      }

      setUserStats(prev => {
        const updatedXP = (prev?.total_xp || 0) + xpGained;
        // Update level info concurrently
        setLevelInfo(getLevelInfo(updatedXP));
        return {
          ...prev,
          total_xp: updatedXP,
          total_lessons_completed: (prev?.total_lessons_completed || 0) + 1,
          last_activity_date: new Date().toISOString().split('T')[0]
        };
      });

      // 2. TRIGGER REWARD FEEDBACK IMMEDIATELY
      const feedbackTitle = sessionType === 'test' ? 'Mastery Achieved!' : (sessionType === 'exam' ? 'Exam Success!' : 'Lesson Complete!');
      const feedbackSubTitle = score >= 90 
        ? "Legendary! Your performance is outstanding." 
        : score >= 70 
          ? "Great job! You've mastered this topic." 
          : "Well done! Keep practicing to reach the top.";
      
      setRewardConfig({
        xp: xpGained,
        title: feedbackTitle,
        subTitle: feedbackSubTitle,
        type: sessionType,
        onAction: onAction
      });
      
      // Use a very short delay for impact (150ms instead of 1500ms)
      setTimeout(() => setShowRewardModal(true), 150);

      // 3. BACKGROUND PERSISTENCE (Don't await these in the main UI flow)
      const persistProgress = async () => {
        try {
          // Update user_progress
          if (topicId) {
            await supabase
              .from('user_progress')
              .upsert({
                user_id: user.id,
                topic_id: topicId,
                score: score,
                completed_at: new Date().toISOString()
              }, { onConflict: 'user_id,topic_id' });
          }

          // Fetch current DB stats to ensure accuracy (handling potential race conditions)
          const { data: currentStats } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

          const today = new Date().toISOString().split('T')[0];
          const newStats = {
            total_xp: (currentStats?.total_xp || 0) + xpGained,
            total_lessons_completed: (currentStats?.total_lessons_completed || 0) + 1,
            last_activity_date: today
          };

          await supabase.from('user_stats').update(newStats).eq('user_id', user.id);

          // Log learning session
          await supabase.from('learning_sessions').insert([{
            user_id: user.id,
            subject_id: courseId,
            duration_minutes: duration,
            started_at: new Date().toISOString(),
            session_type: sessionType
          }]);

          // Silently sync local state with source of truth eventually
          // This ensures everything is consistent without blocking the modal
          loadProgress();
        } catch (err) {
          console.error('Background save error:', err);
        }
      };

      persistProgress();

    } catch (error) {
      console.error('Error in completeTopic flow:', error);
    }
  };

  /**
   * isTopicCompleted: Checks if a TOPIC (DB: lesson) is completed.
   */
  const isTopicCompleted = (courseId, topicId) => {
    return courseProgress[topicId]?.completed === true;
  };

  /**
   * getTopicScore: Gets the score for a COURSE (DB: topic) or Subject.
   */
  const getTopicScore = (courseId, topicId) => {
    return courseProgress[topicId]?.score || 0;
  };

  /**
   * checkTrialLimit: Checks if a trial user has exceeded their daily quota.
   */
  const checkTrialLimit = () => {
    const hasActiveSub = subscriptions && subscriptions.length > 0;
    if (hasActiveSub) return true; 

    if (isTrialExpired) return false;

    const today = new Date().toISOString().split('T')[0];
    const testToday = sessions.some(s => 
      s.session_type === 'test' && 
      s.started_at && s.started_at.startsWith(today)
    );

    return !testToday;
  };

  /**
   * checkSubjectAccess: Allows browsing of subjects.
   */
  const checkSubjectAccess = (subjectId, subjectIndex) => {
    return true; // Subjects are always browsable
  };

  /**
   * checkAccess: Decides if a COURSE (DB: topic) is unlocked.
   * Rules:
   * 1. First 2 topics are free if trial not expired.
   * 2. If subscribed to "ALL ACCESS", current course is unlocked.
   * 3. If subscribed to specific course, current course is unlocked.
   */
  const checkAccess = (topicId, subjectId, topicIndex, subjectIndex) => {
    // 0. Safety Check
    if (!topicId) {
      console.warn('ProgressContext: checkAccess called without topicId');
      return false;
    }

    // 1. Subscription Check
    if (subscriptions && subscriptions.length > 0) {
        // 1a. All Access (No IDs in subscription record)
        const hasAllAccess = subscriptions.some(s => !s.topic_id && !s.subject_id);
        if (hasAllAccess) {
          console.log(`ProgressContext: Access GRANTED (All Access) for topic: ${topicId}`);
          return true;
        }

        // 1b. Targeted Access (Course/Topic or Subject)
        const hasTargetedAccess = subscriptions.some(s => {
          // If subscription targets a specific Course (DB topic_id), 
          // it MUST match exactly. We don't check subject_id in this case
          // to prevent per-course subs from unlocking the whole subject.
          if (s.topic_id) {
            return s.topic_id === topicId;
          }

          // If it ONLY targets a Subject (no specific topic_id), 
          // it unlocks the entire subject.
          if (s.subject_id) {
            return s.subject_id === subjectId;
          }
          
          return false;
        });

        if (hasTargetedAccess) {
          console.log(`ProgressContext: Access GRANTED (Targeted) for topic: ${topicId}`);
          return true;
        }
    }

    // 2. Free Tier: First 2 Courses (DB Topics) are free if trial not expired
    const isFree = !isTrialExpired && topicIndex < 2;
    if (isFree) {
      console.log(`ProgressContext: Access GRANTED (Free Tier) for topic: ${topicId}`);
      return true;
    }

    console.log(`ProgressContext: Access DENIED for topic: ${topicId}. Subscriptions: ${subscriptions?.length || 0}, Trial Expired: ${isTrialExpired}`);
    return false;
  };

  /**
   * checkLessonAccess: Decides if a TOPIC (DB: lesson) is unlocked inside a course.
   * Hierarchy: Subject > Course (topic_id) > Topic (lessonIndex)
   */
  const checkLessonAccess = (lessonIndex, topicId, subjectId, topicIndex) => {
     // 1. Must have access to the Course (Topic) first
     // We now pass the actual topicIndex to ensure Free Tier rules are consistent
     const hasCourseAccess = checkAccess(topicId, subjectId, topicIndex); 
     if (!hasCourseAccess) return false;

     // 2. Targeted Subscription Check
     // Only unlock all lessons if the subscription specifically covers this content
     const hasTargetedSub = subscriptions && subscriptions.length > 0 && subscriptions.some(s => {
        // 1a. All Access
        if (!s.topic_id && !s.subject_id) return true;

        // 1b. Targeted (Course specificity prioritised)
        if (s.topic_id) {
          return s.topic_id === topicId;
        }

        // 1c. Subject Level
        if (s.subject_id) {
          return s.subject_id === subjectId;
        }

        return false;
     });

     if (hasTargetedSub) {
       console.log(`ProgressContext: Lesson Access GRANTED (Subscribed) for topic: ${topicId}, index: ${lessonIndex}`);
       return true;
     }

     // 3. Free Tier: First 2 Lessons (Topics in DB) are free if trial not expired
     // AND the parent course must also be in the free tier (first 2 topics)
     const isFree = !isTrialExpired && topicIndex < 2 && lessonIndex < 2;
     
     if (isFree) {
       console.log(`ProgressContext: Lesson Access GRANTED (Free Tier) for topic: ${topicId}, lessonIndex: ${lessonIndex}`);
       return true;
     }

     console.log(`ProgressContext: Lesson Access DENIED for topic: ${topicId}, lessonIndex: ${lessonIndex}. Subscribed: ${hasTargetedSub}, Trial Expired: ${isTrialExpired}`);
     return false;
  };

  /**
   * getSubscriptionInfo: Helper to format status for UI
   */
  const getSubscriptionInfo = (subs, trialDays, trialExpired, userCreatedAt) => {
    if (subs && subs.length > 0) {
      // Find most comprehensive subscription or soonest expiring
      const sub = subs[0]; 
      let label = 'Sikola+ Member';
      let subLabel = 'Full Access Active';
      
      if (sub.expires_at) {
        const expiry = new Date(sub.expires_at);
        subLabel = `Renews on ${expiry.toLocaleDateString()}`;
      }
      return { type: 'premium', label, subLabel };
    }

    if (trialExpired) {
      return { 
        type: 'expired', 
        label: 'Trial Expired', 
        subLabel: 'Upgrade to unlock everything' 
      };
    }

    // Precise trial countdown
    const createdAt = new Date(userCreatedAt).getTime();
    const now = Date.now();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const remainingMs = Math.max(0, (createdAt + threeDaysMs) - now);
    
    let timeStr = '';
    const hours = Math.ceil(remainingMs / (1000 * 60 * 60));
    const minutes = Math.ceil(remainingMs / (1000 * 60));
    const days = Math.floor(hours / 24);

    if (days >= 1) {
      timeStr = `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours >= 1) {
      timeStr = `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      timeStr = `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }

    return { 
      type: 'trial', 
      label: 'Free Trial Active', 
      subLabel: `${timeStr} • Tap to upgrade` 
    };
  };

  return (
    <ProgressContext.Provider value={{ 
      courseProgress, 
      userStats,
      sessions,
      weeklyActivity,
      recentLessons,
      continueLearning,
      userProfile,
      levelInfo,
      completeTopic, 
      isTopicCompleted,
      getTopicScore,
      checkAccess,
      checkLessonAccess, // Exported
      checkSubjectAccess, // Exported
      isLoading,
      refreshStats: loadProgress,
      refreshData: loadProgress, // Alias for clearer external use
      subscriptions,
      isTrialExpired,
      trialDaysRemaining,
      subscriptionInfo,
      checkTrialLimit
    }}>
      {children}
      <RewardModal
        visible={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        xp={rewardConfig.xp}
        title={rewardConfig.title}
        subTitle={rewardConfig.subTitle}
        type={rewardConfig.type}
        onAction={rewardConfig.onAction}
      />
    </ProgressContext.Provider>
  );
};
