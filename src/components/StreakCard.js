import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { scale, verticalScale, moderateScale, width } from '../utils/Scaling';
import { Zap, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';

// Replaced hardcoded Dimensions with scaling utility

/**
 * StreakCard component updated to match PracticeScreen design
 */
export default function StreakCard({ mode = 'weekly', showHeader = true }) {
  const { theme, isDark } = useTheme();
  const { userStats, weeklyActivity } = useProgress();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Create day objects with activity status specific to the week mapping logic
  // ProgressContext returns weeklyActivity as [Mon, Tue, ..., Sun] boolean array
  const dayData = days.map((label, index) => ({
    label,
    active: weeklyActivity[index] || false
  }));

  const streak = userStats?.current_streak || 0;
  
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.streakCardWrapper}>
      <View style={[
        styles.streakCard, 
        { 
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)' 
        },
        isDesktop && {
          backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.25)',
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
          borderWidth: 1.5,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {}),
        }
      ]}>
        <LinearGradient
          colors={isDark ? ['rgba(255, 69, 58, 0.08)', 'transparent'] : ['rgba(255, 69, 58, 0.04)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.streakContent}>
          <View style={styles.streakInfo}>
            <View style={styles.streakIconCircle}>
              <Flame color="#FF453A" size={24} fill="#FF453A" />
            </View>
            <View style={styles.streakTextContainer}>
              <Text style={[styles.streakTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {streak} Day Streak!
              </Text>
              <Text style={[styles.streakSub, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                {streak < 7 ? `Practice daily to reach 7 days!` : 'You are on fire! Keep it up!'}
              </Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Zap color="#FF453A" size={16} fill="#FF453A" />
            <Text style={[styles.streakValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              +50 XP
            </Text>
          </View>
        </View>
        
        {/* Progress Days Chips - only in weekly mode */}
        {mode === 'weekly' && (
          <View style={styles.streakDaysContainer}>
            {dayData.map((day, index) => {
              const activeBg = isDark ? '#FF453A' : '#FF3B30';
              const inactiveBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
              const inactiveBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
              const inactiveColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';

              return (
                <View 
                  key={index} 
                  style={[
                    styles.dayChip,
                    { 
                      backgroundColor: day.active ? activeBg : inactiveBg,
                      borderColor: day.active ? activeBg : inactiveBorder,
                      borderWidth: 1,
                    },
                    day.active && {
                      shadowColor: activeBg,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 4
                    }
                  ]}
                >
                  <Zap 
                    size={14} 
                    color={day.active ? "#FFFFFF" : inactiveColor} 
                    fill={day.active ? "#FFFFFF" : 'transparent'} 
                  />
                  <Text style={[
                    styles.dayChipText, 
                    { 
                      color: day.active ? "#FFFFFF" : inactiveColor,
                      fontFamily: theme.typography.fontFamily 
                    }
                  ]}>
                    {day.label[0]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  streakCardWrapper: {
    width: '100%',
    borderRadius: moderateScale(28),
    overflow: 'hidden',
  },
  streakCard: {
    padding: scale(12),
    borderWidth: 1,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Ensure text doesn't push badge off if too long
  },
  streakIconCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  streakTextContainer: {
    justifyContent: 'center',
    flex: 1, 
  },
  streakTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  streakSub: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
  },
  streakValue: {
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  streakDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(10),
    gap: scale(5),
  },
  dayChip: {
    flex: 1,
    height: verticalScale(44),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    gap: verticalScale(2),
  },
  dayChipText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
  },
});
