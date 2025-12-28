import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Clock, BookOpen } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function LessonCard({ lesson, onPress, shadowColor = '#3B82F6' }) {
  const { theme, isDark } = useTheme();

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={[styles.cardWrapper, { shadowColor }]}
    >
      <BlurView intensity={isDark ? 20 : 30} tint={isDark ? "dark" : "light"} style={[styles.card, { borderColor: theme.colors.glassBorder }]}>
        <LinearGradient
          colors={isDark 
            ? [`${shadowColor}30`, `${shadowColor}10`, 'transparent'] 
            : [`${shadowColor}20`, `${shadowColor}10`, `${shadowColor}05`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Thumbnail */}
        <View style={[styles.thumbnail, { backgroundColor: `${shadowColor}${isDark ? '15' : '20'}` }]}>
          <BookOpen color={shadowColor} size={32} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]} numberOfLines={2}>
            {lesson.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]} numberOfLines={1}>
            {lesson.category}
          </Text>

          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
            <View style={[styles.progressFill, { width: `${lesson.progress}%`, backgroundColor: shadowColor }]} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.timeContainer}>
              <Clock color={theme.colors.textSecondary} size={14} />
              <Text style={[styles.timeText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                {lesson.duration} min
              </Text>
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              {lesson.progress}%
            </Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: 200,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
