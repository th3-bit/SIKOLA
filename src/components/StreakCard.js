import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Zap, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';

const { width } = Dimensions.get('window');

/**
 * StreakCard component updated to match PracticeScreen design
 */
export default function StreakCard({ mode = 'weekly', showHeader = true }) {
  const { theme, isDark } = useTheme();
  const { userStats, weeklyActivity } = useProgress();
  
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
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
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
              <Flame color="#FF453A" size={32} fill="#FF453A" />
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
            {dayData.map((day, index) => (
              <View 
                key={index} 
                style={[
                  styles.dayChip,
                  { 
                    backgroundColor: day.active ? "#FF453A" : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                    borderColor: day.active ? "#FF453A" : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                  }
                ]}
              >
                <Zap 
                  size={14} 
                  color={day.active ? "#FFFFFF" : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')} 
                  fill={day.active ? "#FFFFFF" : (isDark ? 'rgba(255,255,255,0.1)' : 'transparent')} 
                />
                <Text style={[
                  styles.dayChipText, 
                  { 
                    color: day.active ? "#FFFFFF" : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)'),
                    fontFamily: theme.typography.fontFamily 
                  }
                ]}>
                  {day.label[0]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  streakCardWrapper: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
  },
  streakCard: {
    flex: 1,
    padding: 20,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  streakTextContainer: {
    justifyContent: 'center',
    flex: 1, 
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  streakSub: {
    fontSize: 12,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    alignItems: 'center',
    marginTop: 5,
  },
  dayChip: {
    width: (width - 80) / 7, // width - 40 (screen padding) - 40 (card padding) / 7 items
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
