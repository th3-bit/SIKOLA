import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Play } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

import { scale, verticalScale, moderateScale } from '../utils/Scaling';

export default function LessonCard({ lesson, onPress, shadowColor = '#3B82F6' }) {
  const { theme, isDark, hapticsEnabled } = useTheme();

  // Animation ref
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[styles.cardWrapper, { shadowColor }]}
      >
        <View style={[
          styles.card, 
          { 
            backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.16)',
            flexDirection: 'row',
            alignItems: 'center'
          }
        ]}>
          
          <View style={styles.mainContent}>
            {/* Top: Category Name (Muted) */}
            <View style={styles.header}>
              <View style={[styles.subBadge, { backgroundColor: `${shadowColor}20` }]}>
                <Text style={[styles.subBadgeText, { color: shadowColor, fontFamily: theme.typography.fontFamily }]}>
                  {lesson.category?.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Middle: Lesson Title (Bold) */}
            <View style={styles.content}>
              <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, fontSize: moderateScale(16) }]} numberOfLines={2}>
                {lesson.title}
              </Text>
            </View>

            {/* Bottom: Progress Info & Bar */}
            <View style={styles.footer}>
               <Text style={[styles.durationText, { color: theme.colors.textSecondary, fontSize: moderateScale(10) }]}>
                  {lesson.duration}m
               </Text>
               <View style={styles.progressRow}>
                 <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
                   <View style={[styles.progressFill, { width: `${lesson.progress}%`, backgroundColor: shadowColor }]} />
                 </View>
                 <Text style={[styles.progressVal, { color: shadowColor, fontSize: moderateScale(11), fontWeight: '900' }]}>
                   {lesson.progress}%
                 </Text>
               </View>
            </View>
          </View>

          <View style={styles.rightActionColumn}>
             <View style={[styles.playButton, { backgroundColor: shadowColor }]}>
               <Play size={18} color="#FFF" fill="#FFF" />
             </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: scale(280),
    marginRight: scale(16),
    borderRadius: moderateScale(28),
  },
  card: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(14),
    borderRadius: scale(24),
    borderWidth: 1,
    height: verticalScale(152),
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  header: {
    marginBottom: 0,
  },
  subBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(10),
    alignSelf: 'flex-start',
    marginBottom: moderateScale(4),
  },
  subBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    letterSpacing: -0.5,
  },
  footer: {
    marginTop: 0,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  rightActionColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(36),
  },
  playButton: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.6,
  },
  progressVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  progressBg: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
});

