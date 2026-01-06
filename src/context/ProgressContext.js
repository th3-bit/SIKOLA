import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

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
  const [sessions, setSessions] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState(new Array(7).fill(false));
  const [isLoading, setIsLoading] = useState(true);

  // Load progress from storage on mount
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressData) {
        // Group by course (we might need to fetch course_id from topic_id if not stored)
        // For now, let's keep a flatter structure or adjust based on how courseId is used
        const formattedProgress = {};
        progressData.forEach(item => {
          // Note: In a real app, you'd join with topics to get course_id
          // For this MVP, we'll store topic-level scores
          formattedProgress[item.topic_id] = { completed: true, score: item.score };
        });
        setCourseProgress(formattedProgress);
      }

      // Fetch user stats
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsData) {
        setUserStats(statsData);
      } else if (statsError && statsError.code === 'PGRST116') {
        // Create initial stats if not found
        const initialStats = {
          user_id: user.id,
          current_streak: 0,
          max_streak: 0,
          total_xp: 0,
          total_lessons_completed: 0
        };
        await supabase.from('user_stats').insert([initialStats]);
        setUserStats(initialStats);
      }
      // Fetch learning sessions
      const { data: sessionData } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('user_id', user.id);
      
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
          const sessionDate = new Date(s.started_at);
          if (sessionDate >= firstDayOfWeek) {
            const dayIdx = (sessionDate.getDay() + 6) % 7; // Map 0-6 (Sun-Sat) to 0-6 (Mon-Sun)
            activity[dayIdx] = true;
          }
        });
        setWeeklyActivity(activity);
      }
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
  const completeTopic = async (courseId, topicId, score = 0) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user_progress
      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          topic_id: topicId,
          score: score,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,topic_id' });

      if (progressError) throw progressError;

      // Update user_stats (XP and counts)
      const xpGained = score >= 90 ? 150 : score >= 70 ? 100 : 50;
      
      const { data: currentStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const newStats = {
        total_xp: (currentStats?.total_xp || 0) + xpGained,
        total_lessons_completed: (currentStats?.total_lessons_completed || 0) + 1,
        last_activity_date: new Date().toISOString().split('T')[0]
      };

      // Streak logic
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (currentStats?.last_activity_date === yesterday) {
        newStats.current_streak = (currentStats?.current_streak || 0) + 1;
      } else if (currentStats?.last_activity_date !== today) {
        newStats.current_streak = 1;
      } else {
        newStats.current_streak = currentStats.current_streak;
      }
      
      if (newStats.current_streak > (currentStats?.max_streak || 0)) {
        newStats.max_streak = newStats.current_streak;
      }

      await supabase
        .from('user_stats')
        .update(newStats)
        .eq('user_id', user.id);

      setUserStats(prev => ({ ...prev, ...newStats }));
      
      // Update local state for immediate UI feedback
      setCourseProgress(prev => ({
        ...prev,
        [topicId]: { completed: true, score }
      }));

    } catch (error) {
      console.error('Error saving progress to Supabase:', error);
    }
  };

  // Check if a topic is completed
  const isTopicCompleted = (courseId, topicId) => {
    return courseProgress[topicId]?.completed === true;
  };

  // Get score for a topic
  const getTopicScore = (courseId, topicId) => {
    return courseProgress[topicId]?.score || 0;
  };

  // Check if a topic should be locked
  const isTopicLocked = (courseId, topicId, allTopics) => {
    const topicIndex = allTopics.findIndex(t => t.id === topicId);
    if (topicIndex === 0) return false;
    const previousTopicId = allTopics[topicIndex - 1].id;
    return !isTopicCompleted(courseId, previousTopicId);
  };

  return (
    <ProgressContext.Provider value={{ 
      courseProgress, 
      userStats,
      sessions,
      weeklyActivity,
      completeTopic, 
      isTopicCompleted,
      getTopicScore,
      isTopicLocked,
      isLoading,
      refreshStats: loadProgress
    }}>
      {children}
    </ProgressContext.Provider>
  );
};
