import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

export default function CategoryCard({ category, onPress }) {
  const { theme, isDark } = useTheme();

  // Progress Circle config
  const size = 60;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = category.progress || 0; // Use progress if available, otherwise default logic
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={[styles.cardWrapper, { shadowColor: category.color }]}
    >
      <View style={[
        styles.card, 
        { 
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
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
                stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
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
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 32,
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
  rightSection: {
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    width: 60,
    height: 60,
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
    fontSize: 12,
    fontWeight: '800',
  },
});
