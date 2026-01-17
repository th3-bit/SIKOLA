import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';

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
  const [weeklyActivity, setWeeklyActivity] = useState(new Array(7).fill(false));
  const [isLoading, setIsLoading] = useState(true);

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
        return;
      }

      // 1. Fetch user progress (completed/in-progress lessons)
      console.log('ProgressContext: Fetching user_progress');
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false }); // Get most recent first
      
      console.log('ProgressContext: user_progress fetched', progressData?.length, progressError);

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
            console.log('ProgressContext: Fetching recent lessons details');
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('lessons')
              .select(`
                *,
                topics (
                  id,
                  title,
                  subjects (
                    id,
                    name,
                    color,
                    icon
                  )
                )
              `)
              .in('id', lessonIds);
            
            console.log('ProgressContext: lessonsData fetched', lessonsData?.length, lessonsError);

            if (lessonsError) throw lessonsError;

            if (lessonsData) {
              // Process Recent Lessons
              const processedRecent = lessonsData.map(lesson => {
                // Handle potential singular/plural response from Supabase
                const topicData = Array.isArray(lesson.topics) ? lesson.topics[0] : lesson.topics;
                const subjectData = topicData ? (Array.isArray(topicData.subjects) ? topicData.subjects[0] : topicData.subjects) : null;
                
                  const style = getSubjectStyle(subjectData?.name);
                  const progressEntry = progressData.find(p => p.topic_id === lesson.topic_id); // Find original progress entry for timestamp
                  
                  return {
                    id: lesson.id,
                    title: lesson.title,
                    category: subjectData?.name || 'General',
                    progress: formattedProgress[lesson.id]?.completed ? 100 : (formattedProgress[lesson.id]?.score || 0),
                    duration: lesson.duration || 15,
                    color: style.color,
                    icon: style.icon,
                    completed_at: progressEntry?.completed_at, // Add timestamp
                    // Helper props for navigation
                    topic_id: lesson.topic_id,
                    topic_title: topicData?.title
                };
              }).sort((a, b) => {
                const aIdx = progressData.findIndex(p => p.topic_id === a.id);
                const bIdx = progressData.findIndex(p => p.topic_id === b.id);
                return aIdx - bIdx;
              });
              setRecentLessons(processedRecent);

              // Process Continue Learning (Group by Topic)
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
                    title: topicData?.title || 'Unknown Topic',
                    category: subjectData?.name || 'General',
                    progress,
                    duration: total * 15,
                    color: style.color,
                    icon: style.icon
                  };
                });
                setContinueLearning(topicStats.filter(t => t.progress < 100)); 
              }
            }
          } catch (err) {
            console.error('Error fetching recent lessons details:', err);
          }
        }
      }

      // Fetch user stats
      console.log('ProgressContext: Fetching user_stats');
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (statsData) {
        setUserStats(statsData);
      } else if (statsError && statsError.code === 'PGRST116') {
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
      console.log('ProgressContext: Fetching learning_sessions');
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
  const completeTopic = async (courseId, topicId, score = 0, duration = 15) => {
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

      // Log learning session automatically for topic completion
      await supabase.from('learning_sessions').insert([{
        user_id: user.id,
        subject_id: courseId,
        duration_minutes: duration,
        started_at: new Date().toISOString()
      }]);

      setUserStats(prev => ({ ...prev, ...newStats }));
      
      // Update local state for immediate UI feedback
      setCourseProgress(prev => ({
        ...prev,
        [topicId]: { completed: true, score }
      }));
      
      // Reload lists to update Home Screen
      loadProgress();

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
      recentLessons,
      continueLearning,
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
