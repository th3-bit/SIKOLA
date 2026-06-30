import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

export default function CategoryCard({ category, onPress }) {
  const { theme, isDark, hapticsEnabled } = useTheme();
  
  // Animation ref
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Progress Circle config (Scaled)
  const size = scale(60);
  const strokeWidth = scale(5);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = category.progress || 0; 
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[styles.cardWrapper, { shadowColor: category.color }]}
      >
        <View style={[
          styles.card, 
          { 
            backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)',
          }
        ]}>
          {/* Left Side: Subject Info */}
          <View style={styles.leftSection}>
            <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              {category.name}
            </Text>
            <Text style={[styles.count, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
              {category.topicCount || 0} Topics Available
            </Text>
          </View>

          {/* Right Side: Pie Progress Chart */}
          <View style={styles.rightSection}>
            <View style={styles.chartContainer}>
              <Svg width={size} height={size} style={styles.svg}>
                {/* Background Circle */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress Circle */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={category.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              </Svg>
              <View style={styles.percentageContainer}>
                <Text style={[styles.percentageText, { color: theme.colors.textPrimary }]}>
                  {Math.round(progress)}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginBottom: verticalScale(8),
    borderRadius: moderateScale(28),
  },
  card: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(28),
    borderWidth: scale(1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: verticalScale(64),
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    marginBottom: verticalScale(1),
    letterSpacing: -0.5,
  },
  count: {
    fontSize: moderateScale(10),
    fontWeight: '500',
    opacity: 0.6,
  },
  rightSection: {
    marginLeft: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    width: scale(60),
    height: scale(60),
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  percentageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
  },
});

