import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  BarChart,
  BookOpen
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

// Mock Data
const progressData = {
  daily: {
    totalTime: '45 min',
    lessonsCompleted: 2,
    streak: 5,
    subtitle: 'Great start today!',
    courses: [
      { id: 1, name: 'Mathematics', progress: 15, time: '20 min', color: '#FACC15' },
      { id: 2, name: 'Physics', progress: 10, time: '15 min', color: '#8B5CF6' },
      { id: 3, name: 'Economics', progress: 5, time: '10 min', color: '#EF4444' },
    ],
    activities: [
      { id: 1, title: 'Finished "Algebra Basics"', time: '10:30 AM', type: 'lesson' },
      { id: 2, title: 'Scored 80% in Physics Quiz', time: '09:15 AM', type: 'quiz' },
    ]
  },
  weekly: {
    totalTime: '5.2 hrs',
    lessonsCompleted: 14,
    streak: 5,
    subtitle: 'You are crushing it this week!',
    courses: [
      { id: 1, name: 'Mathematics', progress: 45, time: '2.5 hrs', color: '#FACC15' },
      { id: 2, name: 'Physics', progress: 30, time: '1.5 hrs', color: '#8B5CF6' },
      { id: 3, name: 'Economics', progress: 20, time: '1.2 hrs', color: '#EF4444' },
      { id: 4, name: 'Chemistry', progress: 10, time: '45 min', color: '#EC4899' },
    ],
    activities: [
      { id: 1, title: 'Finished "Calculus I"', time: 'Yesterday', type: 'lesson' },
      { id: 2, title: 'Started "Market Structures"', time: 'Tue', type: 'lesson' },
      { id: 3, title: 'Weekly Challenge Badge', time: 'Mon', type: 'achievement' },
    ]
  },
  monthly: {
    totalTime: '24 hrs',
    lessonsCompleted: 48,
    streak: 12,
    subtitle: 'Consistency is key!',
    courses: [
      { id: 1, name: 'Mathematics', progress: 75, time: '10 hrs', color: '#FACC15' },
      { id: 2, name: 'Physics', progress: 60, time: '6 hrs', color: '#8B5CF6' },
      { id: 3, name: 'Economics', progress: 40, time: '5 hrs', color: '#EF4444' },
      { id: 4, name: 'Chemistry', progress: 30, time: '3 hrs', color: '#EC4899' },
      { id: 5, name: 'Geography', progress: 15, time: '1 hr', color: '#10B981' },
    ],
    activities: [
      { id: 1, title: 'Course Completed: "Basic Math"', time: 'Dec 15', type: 'achievement' },
      { id: 2, title: 'Top 10% in Quiz Leaderboard', time: 'Dec 10', type: 'achievement' },
      { id: 3, title: 'Joined "Science Club"', time: 'Dec 05', type: 'group' },
    ]
  }
};

export default function LearningProgressScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [timeRange, setTimeRange] = useState('weekly'); // daily, weekly, monthly

  const currentData = progressData[timeRange];

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.statCard, { borderColor: theme.colors.glassBorder }]}>
       <View style={[styles.iconBox, { backgroundColor: `${color}20` }]}>
         <Icon size={20} color={color} />
       </View>
       <View>
         <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{value}</Text>
         <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
       </View>
    </BlurView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Learning Progress</Text>
          <View style={{ width: 44 }} /> 
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          
          {/* Time Filters */}
          <View style={[styles.tabsContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }]}>
            {['daily', 'weekly', 'monthly'].map((bg) => (
               <TouchableOpacity 
                 key={bg} 
                 onPress={() => setTimeRange(bg)}
                 style={[
                   styles.tab, 
                   timeRange === bg && { backgroundColor: theme.colors.secondary, shadowColor: theme.colors.secondary }
                 ]}
               >
                 <Text style={[
                   styles.tabText, 
                   { color: timeRange === bg ? '#FFF' : theme.colors.textSecondary, textTransform: 'capitalize' }
                 ]}>
                   {bg}
                 </Text>
               </TouchableOpacity>
            ))}
          </View>

          {/* Subtitle */}
          <Text style={[styles.motivationalText, { color: theme.colors.textSecondary }]}>
            {currentData.subtitle}
          </Text>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard icon={Clock} label="Time Spent" value={currentData.totalTime} color="#3B82F6" />
            <StatCard icon={CheckCircle} label="Completed" value={`${currentData.lessonsCompleted} Lessons`} color="#10B981" />
            <StatCard icon={TrendingUp} label="Streak" value={`${currentData.streak} Days`} color="#FACC15" />
          </View>

          {/* Per Course Progress */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Course Progress</Text>
            {currentData.courses.map((course) => (
               <View key={course.id} style={styles.courseRow}>
                 <View style={styles.courseHeader}>
                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                     <View style={[styles.courseDot, { backgroundColor: course.color }]} />
                     <Text style={[styles.courseName, { color: theme.colors.textPrimary }]}>{course.name}</Text>
                   </View>
                   <Text style={[styles.courseTime, { color: theme.colors.textSecondary }]}>{course.time}</Text>
                 </View>
                 
                 <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                   <View style={[styles.progressBarFill, { width: `${course.progress}%`, backgroundColor: course.color }]} />
                 </View>
               </View>
            ))}
          </View>

          {/* Activity Timeline */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Activity</Text>
            <View style={[styles.timelineContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', borderColor: theme.colors.glassBorder }]}>
              {currentData.activities.map((activity, index) => (
                <View key={activity.id} style={[styles.activityRow, index !== currentData.activities.length - 1 && styles.activityBorder]}>
                  <View style={[styles.activityIcon, { backgroundColor: theme.colors.glass }]}>
                    <BookOpen size={16} color={theme.colors.secondary} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityTitle, { color: theme.colors.textPrimary }]}>{activity.title}</Text>
                    <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>{activity.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  motivationalText: {
    fontSize: 15,
    marginBottom: 20,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row', // or column based on preference
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  courseRow: {
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '600',
  },
  courseTime: {
    fontSize: 13,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timelineContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  activityBorder: {
    paddingBottom: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
});
