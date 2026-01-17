import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import Svg, { Circle } from 'react-native-svg';
import { getSubjectStyle } from '../constants/SubjectConfig';

const { width } = Dimensions.get('window');

export default function DailyProgressCard() {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { sessions, isLoading } = useProgress();
  const [categories, setCategories] = useState([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [currentMonth, setCurrentMonth] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    processData();
  }, [sessions]);

  const processData = async () => {
    try {
      setDataLoading(true);
      
      // Get current month
      const now = new Date();
      setCurrentMonth(now.toLocaleString('default', { month: 'short' }));

      // Fetch subjects to get names and colors
      const { data: subjects } = await supabase.from('subjects').select('*');
      if (!subjects) return;

      // Filter sessions for current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlySessions = sessions.filter(s => new Date(s.started_at) >= startOfMonth);

      const total = monthlySessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
      setTotalMinutes(total);
      if (total === 0) {
        // Default empty state or mock-like but zeroed
        setCategories(subjects.slice(0, 6).map(s => {
          const style = getSubjectStyle(s.name);
          return {
            name: s.name,
            percentage: 0,
            color: style.color
          };
        }));
      } else {
        // Calculate percentages
        const breakdown = subjects.map(s => {
          const style = getSubjectStyle(s.name);
          const subjectTime = monthlySessions
            .filter(ses => ses.subject_id === s.id)
            .reduce((acc, curr) => acc + curr.duration_minutes, 0);
          
          return {
            name: s.name,
            color: style.color,
            minutes: subjectTime,
            percentage: Math.round((subjectTime / total) * 100)
          };
        })
        .filter(c => c.minutes > 0)
        .sort((a, b) => b.minutes - a.minutes);

        setCategories(breakdown);
      }
    } catch (error) {
      console.error('Error processing progress data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  if (isLoading || dataLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.secondary} />
      </View>
    );
  }

  // Calculate circle segments
  const radius = 70;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={[styles.cardWrapper, { shadowColor: theme.colors.secondary }]}>
      <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[styles.card, { borderColor: theme.colors.glassBorder }]}>
        <LinearGradient
          colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Learning Progress
          </Text>
          <View style={[styles.monthBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Text style={[styles.monthText, { color: theme.colors.textPrimary }]}>
              {currentMonth}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Segmented Ring Chart */}
          <View style={styles.chartSection}>
            <Svg width={180} height={180} style={styles.svg}>
              {totalMinutes === 0 ? (
                // Empty state ring
                <Circle
                  cx="90"
                  cy="90"
                  r={radius}
                  stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
              ) : (
                categories.map((category, index) => {
                  const previousPercentages = categories.slice(0, index).reduce((sum, cat) => sum + cat.percentage, 0);
                  return (
                    <Circle
                      key={index}
                      cx="90"
                      cy="90"
                      r={radius}
                      stroke={category.color}
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={`${(category.percentage / 100) * circumference} ${circumference}`}
                      strokeDashoffset={-((previousPercentages / 100) * circumference)}
                      strokeLinecap="round"
                    />
                  );
                })
              )}
            </Svg>
            
            {/* Center Content */}
            <View style={styles.centerContent}>
              <Text style={[styles.centerLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                Total
              </Text>
              <Text style={[styles.centerValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {totalMinutes}
                <Text style={[styles.centerUnit, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>min</Text>
              </Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {categories.slice(0, 5).map((category, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: category.color }]} />
                <View style={styles.legendText}>
                  <Text numberOfLines={1} style={[styles.legendName, { color: theme.colors.textSecondary, flex: 1, fontFamily: theme.typography.fontFamily }]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.legendPercentage, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {category.percentage}%
                  </Text>
                </View>
              </View>
            ))}
            {categories.length > 5 && (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('LearningProgress')}
                style={styles.moreButton}
              >
                <Text style={[styles.moreText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>
                  +{categories.length - 5} more subjects
                </Text>
              </TouchableOpacity>
            )}
            {categories.length === 0 && (
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: theme.typography.fontFamily }}>No session data yet</Text>
            )}
          </View>
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LearningProgress')}
          style={[styles.footerButton, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Text style={[styles.footerButtonText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>
            View Detailed Analytics
          </Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    borderRadius: 28,
    overflow: 'visible',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  monthBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flexDirection: 'row',
    gap: 20,
  },
  chartSection: {
    position: 'relative',
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  centerValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  centerUnit: {
    fontSize: 20,
    fontWeight: '400',
  },
  legend: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 3,
    height: 16,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: 13,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  moreButton: {
    marginTop: 4,
    paddingVertical: 2,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerButton: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
