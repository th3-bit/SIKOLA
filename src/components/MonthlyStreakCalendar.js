import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';

const { width } = Dimensions.get('window');

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MonthlyStreakCalendar() {
  const { theme, isDark } = useTheme();
  const { sessions } = useProgress();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Extract active dates 'YYYY-MM-DD' from sessions
  const activeDates = useMemo(() => {
    const dates = new Set();
    if (sessions) {
      sessions.forEach(session => {
        if (session.started_at) {
            const dateStr = new Date(session.started_at).toISOString().split('T')[0];
            dates.add(dateStr);
        }
      });
    }
    return dates;
  }, [sessions]);

  // Calendar Generation Logic
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Starting day of the week (0 = Sun, 1 = Mon, etc.)
    // We want Monday as start, so we adjust: (day + 6) % 7 gives Mon=0, Sun=6
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    const daysInMonth = lastDay.getDate();
    
    // Previous month filler
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        key: `prev-${prevMonthLastDay - i}`
      });
    }

    // Current month days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      currentMonthDays.push({
        day: i,
        isCurrentMonth: true,
        isActive: activeDates.has(dateStr),
        isToday: dateStr === new Date().toISOString().split('T')[0],
        key: `curr-${i}`
      });
    }

    // Next month filler to complete the detailed grid (up to 35 or 42 cells)
    const combined = [...prevMonthDays, ...currentMonthDays];
    const remainingSlots = (7 - (combined.length % 7)) % 7;
    const nextMonthDays = [];
    for (let i = 1; i <= remainingSlots; i++) {
        nextMonthDays.push({
            day: i,
            isCurrentMonth: false,
            key: `next-${i}`
        });
    }

    return [...combined, ...nextMonthDays];
  }, [currentDate, activeDates]);

  const changeMonth = (delta) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <View style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
        }
      ]}>
        
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                <ChevronLeft size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <Text style={[styles.monthTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {monthLabel}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        </View>

        {/* Days Header */}
        <View style={styles.daysHeader}>
            {DAYS_OF_WEEK.map(day => (
                <Text key={day} style={[styles.dayLabel, { color: theme.colors.textSecondary }]}>{day}</Text>
            ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
            {calendarGrid.map((item) => (
                <View key={item.key} style={styles.dayCell}>
                    <View style={[
                        styles.dayCircle,
                        item.isActive && styles.activeDayCircle,
                        item.isToday && !item.isActive && styles.todayCircle,
                        { borderColor: item.isToday && !item.isActive ? theme.colors.secondary : 'transparent' }
                    ]}>
                        <Text style={[
                            styles.dayText,
                            { 
                                color: item.isActive ? '#FFF' : (item.isCurrentMonth ? theme.colors.textPrimary : theme.colors.textSecondary),
                                opacity: item.isCurrentMonth ? 1 : 0.3,
                                fontFamily: theme.typography.fontFamily
                            }
                        ]}>
                            {item.day}
                        </Text>
                    </View>
                </View>
            ))}
        </View>

        {/* Summary Footer */}
        <View style={styles.footer}>
             <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF453A' }]} />
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Study Session</Text>
             </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  card: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  navButton: {
    padding: 5,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: '14.28%', // 100% / 7
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeDayCircle: {
    backgroundColor: '#FF453A', // The requested flame color
  },
  todayCircle: {
    borderWidth: 1,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    paddingTop: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  }
});
