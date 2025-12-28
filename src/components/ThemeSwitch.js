import React, { useEffect, useRef } from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  Animated, 
  View, 
  Dimensions 
} from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

export default function ThemeSwitch() {
  const { isDark, toggleTheme, theme } = useTheme();
  const animatedValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  }, [isDark]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 44], // Adjusted for the pill size
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#60A5FA', '#FACC15'], // Cool blue for sun, warm gold for moon
  });

  const thumbGlow = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(96, 165, 250, 0.3)', 'rgba(250, 204, 21, 0.3)'],
  });

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={toggleTheme}
      style={styles.container}
    >
      <BlurView intensity={20} tint="dark" style={styles.pill}>
        <Animated.View 
          style={[
            styles.thumb, 
            { 
              transform: [{ translateX }],
              backgroundColor: thumbColor,
              shadowColor: thumbColor,
              elevation: 10,
            }
          ]}
        >
          {isDark ? (
            <Moon color="#000" size={16} />
          ) : (
            <Sun color="#fff" size={16} />
          )}
        </Animated.View>
        
        {/* Static background icons for the depth effect if needed, but the thumb covers them */}
        <View style={styles.backgroundIcons}>
           <Sun color="rgba(255,255,255,0.1)" size={16} style={{ marginLeft: 10 }} />
           <Moon color="rgba(255,255,255,0.1)" size={16} style={{ marginRight: 10 }} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  backgroundIcons: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    zIndex: 1,
  }
});
