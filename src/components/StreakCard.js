import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';

const { width } = Dimensions.get('window');

/**
 * StreakCard component matching requirements in uploaded_image_0
 */
export default function StreakCard() {
  const { theme, isDark } = useTheme();
  const { userStats, weeklyActivity } = useProgress();
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIdx = (new Date().getDay() + 6) % 7; // Map Sun-Sat (0-6) to Mon-Sun (0-6)

  const streak = userStats?.current_streak || 0;
  
  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.card, { borderColor: theme.colors.glassBorder }]}>
        <LinearGradient
          colors={isDark ? ['rgba(255,107,107,0.1)', 'rgba(255,107,107,0.02)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Upper row: Flame and Streak Count */}
        <View style={styles.topRow}>
          <View style={[styles.flameContainer, { backgroundColor: '#FF4D4D20' }]}>
             <View style={styles.flameIcon}>
                <Text style={{ fontSize: 32 }}>🔥</Text>
             </View>
          </View>
          
          <View style={styles.streakInfo}>
            <Text style={[styles.streakTitle, { color: theme.colors.textPrimary }]}>
              {streak} Day Streak!
            </Text>
            <Text style={[styles.streakSubtitle, { color: theme.colors.textSecondary }]}>
              {streak < 7 ? `Keep studying to reach 7 days!` : 'You are on fire! Keep it up!'}
            </Text>
          </View>
          
          <View style={styles.xpBadge}>
            <LinearGradient
              colors={['#FF4D4D30', '#FF4D4D10']}
              style={styles.xpGradient}
            >
               <Zap size={14} color="#FF4D4D" fill="#FF4D4D" />
               <Text style={styles.xpText}>+50 XP</Text>
            </LinearGradient>
          </View>
        </View>
        
        {/* Lower row: Day Indicators */}
        <View style={styles.daysRow}>
          {days.map((day, index) => {
             const isActive = weeklyActivity[index];
             const isToday = index === todayIdx;
             
             return (
               <View key={day} style={styles.dayItem}>
                 <View style={[
                   styles.dayBox, 
                   isActive ? styles.dayBoxActive : styles.dayBoxInactive,
                   isActive ? { backgroundColor: '#FF4D4D' } : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                 ]}>
                   <Zap 
                     size={16} 
                     color={isActive ? '#FFF' : theme.colors.textSecondary} 
                     fill={isActive ? '#FFF' : 'transparent'} 
                   />
                   <Text style={[
                     styles.dayText, 
                     { color: isActive ? '#FFF' : theme.colors.textSecondary }
                   ]}>
                     {day}
                   </Text>
                 </View>
               </View>
             );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  card: {
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  flameContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flameIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakInfo: {
    flex: 1,
    marginLeft: 16,
  },
  streakTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: 'serif', // Trying to match the elegant font in image
  },
  streakSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  xpBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  xpGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  xpText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
  },
  dayBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dayBoxActive: {
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayBoxInactive: {},
  dayText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
