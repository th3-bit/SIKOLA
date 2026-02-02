import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function LessonCard({ lesson, onPress, shadowColor = '#3B82F6' }) {
  const { theme, isDark } = useTheme();

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={[styles.cardWrapper, { shadowColor }]}
    >
      <View style={[
        styles.card, 
        { 
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        }
      ]}>
        
        {/* Top: Category Name (Muted) */}
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]} numberOfLines={1}>
            {lesson.category?.toUpperCase()}
          </Text>
        </View>

        {/* Middle: Lesson Title (Bold) */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]} numberOfLines={2}>
            {lesson.title}
          </Text>
        </View>

        {/* Bottom: Progress Info & Bar */}
        <View style={styles.footer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.durationText, { color: theme.colors.textSecondary }]}>
              {lesson.duration}m
            </Text>
            <Text style={[styles.progressVal, { color: shadowColor }]}>
              {lesson.progress}%
            </Text>
          </View>
          
          {/* Edge Progress Bar */}
          <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={[styles.progressFill, { width: `${lesson.progress}%`, backgroundColor: shadowColor }]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: 200,
    marginRight: 16,
    borderRadius: 28,
    borderRadius: 28,
  },
  card: {
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    height: 160,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  header: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  footer: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  progressVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
