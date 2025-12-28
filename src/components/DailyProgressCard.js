import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

export default function DailyProgressCard() {
  const { theme, isDark } = useTheme();
  
  // Mock data - learning categories with percentages
  const categories = [
    { name: 'Mathematics', percentage: 30, color: '#FACC15' },
    { name: 'Science', percentage: 10, color: '#EC4899' },
    { name: 'Economics', percentage: 10, color: '#8B5CF6' },
    { name: 'History', percentage: 15, color: '#3B82F6' },
    { name: 'Arts', percentage: 20, color: '#F97316' },
    { name: 'Coding', percentage: 15, color: '#10B981' },
  ];

  const totalMinutes = 124;
  const currentMonth = 'Dec';

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
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
            Learning Progress
          </Text>
          <View style={[styles.monthBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Text style={[styles.monthText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              {currentMonth}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Segmented Ring Chart */}
          <View style={styles.chartSection}>
            <Svg width={180} height={180} style={styles.svg}>
              {categories.map((category, index) => {
                const previousPercentages = categories.slice(0, index).reduce((sum, cat) => sum + cat.percentage, 0);
                const startAngle = (previousPercentages / 100) * 360 - 90;
                const endAngle = ((previousPercentages + category.percentage) / 100) * 360 - 90;
                const largeArcFlag = category.percentage > 50 ? 1 : 0;

                const startX = 90 + radius * Math.cos((startAngle * Math.PI) / 180);
                const startY = 90 + radius * Math.sin((startAngle * Math.PI) / 180);
                const endX = 90 + radius * Math.cos((endAngle * Math.PI) / 180);
                const endY = 90 + radius * Math.sin((endAngle * Math.PI) / 180);

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
              })}
            </Svg>
            
            {/* Center Content */}
            <View style={styles.centerContent}>
              <Text style={[styles.centerLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                Total
              </Text>
              <Text style={[styles.centerValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {totalMinutes}
                <Text style={[styles.centerUnit, { color: theme.colors.textSecondary }]}>min</Text>
              </Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {categories.map((category, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: category.color }]} />
                <View style={styles.legendText}>
                  <Text style={[styles.legendName, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {category.name}
                  </Text>
                  <Text style={[styles.legendPercentage, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {category.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
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
  },
});
