import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, LayoutAnimation } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import logger from '../utils/logger';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  const [hapticsEnabled, setHapticsEnabled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('user-theme');
          // Load haptics preference
          const savedHaptics = await AsyncStorage.getItem('user-haptics');
          if (savedHaptics !== null) {
            setHapticsEnabled(savedHaptics === 'true');
          } else {
            setHapticsEnabled(false); // Default to OFF
          }

          if (savedTheme !== null) {
            setIsDark(savedTheme === 'dark');
          } else {
            // Fallback to system
            setIsDark(systemColorScheme === 'dark');
          }
      } catch (error) {
        logger.error('Error loading theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    // Add smooth layout transition for an "instinctive" feel
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newMode = !isDark;
    setIsDark(newMode);
    try {
      await AsyncStorage.setItem('user-theme', newMode ? 'dark' : 'light');
    } catch (error) {
      logger.error('Error saving theme:', error);
    }
  };

  const toggleHaptics = async () => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled(newValue);
    try {
      await AsyncStorage.setItem('user-haptics', newValue ? 'true' : 'false');
    } catch (error) {
      logger.error('Error saving haptics preference:', error);
    }
  };

  const currentTheme = isDark ? theme.dark : theme.light;

  // Prevent flash by waiting for load
  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      theme: currentTheme, 
      toggleTheme,
      hapticsEnabled,
      toggleHaptics
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
