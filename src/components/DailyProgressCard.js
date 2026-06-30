import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';

export default function DailyProgressCard() {
  const navigation = useNavigation();
  const { theme, isDark, hapticsEnabled } = useTheme();
  const { subjectBreakdown, sessions, isLoading } = useProgress();
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    // Get current month for the badge
    const now = new Date();
    setCurrentMonth(now.toLocaleString('default', { month: 'short' }));
  }, []);

  const handleMorePress = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('LearningProgress');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.secondary} />
      </View>
    );
  }

  // Use pre-calculated breakdown from context
  // Filter for subjects that have at least some progress to show a cleaner chart
  const activeCategories = subjectBreakdown.filter(c => c.minutes > 0 || c.completedTopics > 0);
  
  // If no sessions yet, show the first few subjects as empty states (matching original design)
  const displayCategories = activeCategories.length > 0 
    ? activeCategories 
    : subjectBreakdown.slice(0, 6);

  const totalMinutes = sessions.reduce((acc, curr) => acc + (Number(curr.duration_minutes) || 0), 0);

  // Calculate circle segments (Scaled)
  const radius = scale(48);
  const strokeWidth = scale(12);
  const circumference = 2 * Math.PI * radius;
  const chartSize = scale(130);
  const chartCenter = chartSize / 2;

  return (
    <View style={[styles.cardWrapper, { shadowColor: theme.colors.secondary }]}>
      <View style={[
        styles.card, 
        { 
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)',
        }
      ]}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Learning Progress
          </Text>
          <View style={[styles.monthBadge, { backgroundColor: theme.colors.secondary }]}>
            <Text style={[styles.monthText, { color: '#FFF' }]}>
              Overall
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Segmented Ring Chart */}
          <View style={[styles.chartSection, { width: chartSize, height: chartSize }]}>
            <Svg width={chartSize} height={chartSize} style={styles.svg}>
              {totalMinutes === 0 ? (
                // Empty state ring
                <Circle
                  cx={chartCenter}
                  cy={chartCenter}
                  r={radius}
                  stroke={isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.1)'}
                  strokeWidth={strokeWidth}
                  fill="none"
                />
              ) : (
                displayCategories.map((category, index) => {
                  const previousPercentages = displayCategories.slice(0, index).reduce((sum, cat) => sum + cat.percentage, 0);
                  return (
                    <Circle
                      key={index}
                      cx={chartCenter}
                      cy={chartCenter}
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
              <Text style={[styles.centerValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, fontSize: moderateScale(20) }]}>
                {Math.round(totalMinutes)}
                <Text style={[styles.centerUnit, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, fontSize: moderateScale(10) }]}>min</Text>
              </Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {displayCategories.slice(0, 5).map((category, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: category.color }]} />
                <View style={styles.legendText}>
                  <Text numberOfLines={1} style={[styles.legendName, { color: theme.colors.textSecondary, flex: 1, fontFamily: theme.typography.fontFamily }]}>
                    {category.name.length > 15 ? category.name.substring(0, 15) + '...' : category.name}
                  </Text>
                  <Text style={[styles.legendPercentage, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {category.percentage}%
                  </Text>
                </View>
              </View>
            ))}
            {displayCategories.length > 5 && (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={handleMorePress}
                style={styles.moreButton}
              >
                <Text style={[styles.moreText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>
                  +{displayCategories.length - 5} more subjects
                </Text>
              </TouchableOpacity>
            )}
            {totalMinutes === 0 && displayCategories.length === 0 && (
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: theme.typography.fontFamily }}>No session data yet</Text>
            )}
          </View>
        </View>

      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  loadingContainer: {
    height: verticalScale(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
    width: '100%',
    borderRadius: moderateScale(28),
    overflow: 'visible',
  },
  card: {
    padding: scale(20),
    borderWidth: 1,
    borderRadius: moderateScale(28),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
  },
  monthBadge: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
  },
  monthText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  content: {
    flexDirection: 'row',
    gap: scale(10),
  },
  chartSection: {
    position: 'relative',
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
    fontSize: moderateScale(14),
    marginBottom: verticalScale(4),
  },
  centerValue: {
    fontSize: moderateScale(36),
    fontWeight: '800',
  },
  centerUnit: {
    fontSize: moderateScale(20),
    fontWeight: '400',
  },
  legend: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: verticalScale(10),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  legendColor: {
    width: scale(3),
    height: verticalScale(16),
    borderRadius: moderateScale(2),
    marginRight: scale(8),
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: moderateScale(13),
  },
  legendPercentage: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginLeft: scale(8),
  },
  moreButton: {
    marginTop: verticalScale(4),
    paddingVertical: verticalScale(2),
  },
  moreText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  footerButton: {
    marginTop: verticalScale(10),
    paddingTop: verticalScale(15),
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
