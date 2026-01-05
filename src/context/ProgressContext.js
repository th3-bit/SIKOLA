import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProgressContext = createContext();

export const useProgress = () => {
  return useContext(ProgressContext);
};

export const ProgressProvider = ({ children }) => {
  const [courseProgress, setCourseProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load progress from storage on mount
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const storedProgress = await AsyncStorage.getItem('userProgress');
      if (storedProgress) {
        setCourseProgress(JSON.parse(storedProgress));
      }
    } catch (error) {
      console.error('Failed to load progress', error);
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
  const completeTopic = (courseId, topicId, score = 0) => {
    setCourseProgress(prev => {
      const currentCourse = prev[courseId] || { completedTopics: [], topicScores: {} };
      
      const updatedCompletedTopics = currentCourse.completedTopics.includes(topicId) 
        ? currentCourse.completedTopics 
        : [...currentCourse.completedTopics, topicId];

      const updatedTopicScores = {
        ...currentCourse.topicScores,
        [topicId]: score > (currentCourse.topicScores?.[topicId] || 0) ? score : (currentCourse.topicScores?.[topicId] || 0)
      };

      const updatedCourse = {
        ...currentCourse,
        completedTopics: updatedCompletedTopics,
        topicScores: updatedTopicScores
      };

      const newProgress = {
        ...prev,
        [courseId]: updatedCourse
      };

      saveProgress(newProgress);
      return newProgress;
    });
  };

  // Check if a topic is completed
  const isTopicCompleted = (courseId, topicId) => {
    return courseProgress[courseId]?.completedTopics.includes(topicId);
  };

  // Get score for a topic
  const getTopicScore = (courseId, topicId) => {
    return courseProgress[courseId]?.topicScores?.[topicId] || 0;
  };

  // Check if a topic should be locked
  // A topic is locked if the previous topic in the list hasn't been completed
  const isTopicLocked = (courseId, topicId, allTopics) => {
    const topicIndex = allTopics.findIndex(t => t.id === topicId);
    
    // First topic is never locked
    if (topicIndex === 0) return false;
    
    // If previous topic is completed, this one is unlocked
    const previousTopicId = allTopics[topicIndex - 1].id;
    return !isTopicCompleted(courseId, previousTopicId);
  };

  return (
    <ProgressContext.Provider value={{ 
      courseProgress, 
      completeTopic, 
      isTopicCompleted,
      getTopicScore,
      isTopicLocked,
      isLoading 
    }}>
      {children}
    </ProgressContext.Provider>
  );
};
