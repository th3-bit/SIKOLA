import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  BookOpen
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import StreakCard from '../components/StreakCard';
import Svg, { Circle } from 'react-native-svg';
import { getSubjectStyle } from '../constants/SubjectConfig';

const { width } = Dimensions.get('window');

export default function LearningProgressScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userStats, sessions: allSessions, isLoading: contextLoading } = useProgress();
  const [timeRange, setTimeRange] = useState('weekly'); // daily, weekly, monthly
  const [loading, setLoading] = useState(true);
  const [rangeSessions, setRangeSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, allSessions]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Filter sessions for the time range
      let dateFilter = new Date();
      if (timeRange === 'daily') dateFilter.setHours(0, 0, 0, 0);
      else if (timeRange === 'weekly') dateFilter.setDate(dateFilter.getDate() - 7);
      else if (timeRange === 'monthly') dateFilter.setMonth(dateFilter.getMonth() - 1);

      const filteredSessions = allSessions.filter(s => new Date(s.started_at) >= dateFilter);
      setRangeSessions(filteredSessions);

      // 2. Fetch Subjects and Progress for Donut Chart & Detailed List
      const { data: subjects } = await supabase
        .from('subjects')
        .select(`
          *,
          topics (id)
        `);
      
      if (subjects) {
        // Fetch all completed topics for this user to calculate completion %
        const { data: userProgress } = await supabase
          .from('user_progress')
          .select('topic_id')
          .eq('user_id', user.id);
        
        const completedTopicIds = new Set(userProgress?.map(p => p.topic_id) || []);
        const totalMinutesActive = filteredSessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
        
        const breakdown = subjects.map(s => {
          const style = getSubjectStyle(s.name);
          const subjectTime = filteredSessions
            .filter(ses => ses.subject_id === s.id)
            .reduce((acc, curr) => acc + curr.duration_minutes, 0);
          
          const subjectTopics = s.topics || [];
          const completedInSubject = subjectTopics.filter(t => completedTopicIds.has(t.id)).length;

          return {
            id: s.id,
            name: s.name,
            color: style.color,
            minutes: subjectTime,
            percentage: totalMinutesActive > 0 ? Math.round((subjectTime / totalMinutesActive) * 100) : 0,
            totalTopics: subjectTopics.length,
            completedTopics: completedInSubject,
            icon: style.icon
          };
        })
        .sort((a, b) => b.completedTopics - a.completedTopics || a.name.localeCompare(b.name));

        setCategories(breakdown);
      }

      // 3. Recent Activity (Global, not just range)
      const { data: activity } = await supabase
        .from('user_progress')
        .select('topic_id, completed_at, score')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (activity) {
        const topicIds = activity.map(a => a.topic_id);
        const { data: topics } = await supabase
          .from('topics')
          .select('id, title')
          .in('id', topicIds);

        const mappedActivity = activity.map(a => {
          const topic = topics?.find(t => t.id === a.topic_id);
          return {
            id: a.topic_id,
            title: `Completed "${topic?.title || 'Lesson'}"`,
            time: new Date(a.completed_at).toLocaleDateString(),
            score: a.score
          };
        });
        setRecentActivity(mappedActivity);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalMinutes = rangeSessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
  
  // Donut Chart Params
  const radius = 70;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

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
                   timeRange === bg && { backgroundColor: theme.colors.secondary }
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

          {loading || contextLoading ? (
            <ActivityIndicator size="large" color={theme.colors.secondary} style={{ marginTop: 50 }} />
          ) : (
            <>
              {/* Donut Chart Card */}
              <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.donutCard, { borderColor: theme.colors.glassBorder }]}>
                <View style={styles.donutRow}>
                  <View style={styles.chartSection}>
                    <Svg width={160} height={160}>
                      {totalMinutes === 0 ? (
                        <Circle cx="80" cy="80" r={radius} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} strokeWidth={strokeWidth} fill="none" />
                      ) : (
                        categories.filter(c => c.minutes > 0).map((cat, i, filtered) => {
                          const activeCats = filtered;
                          const prevPerc = activeCats.slice(0, i).reduce((sum, c) => sum + c.percentage, 0);
                          return (
                            <Circle
                              key={cat.id}
                              cx="80"
                              cy="80"
                              r={radius}
                              stroke={cat.color}
                              strokeWidth={strokeWidth}
                              fill="none"
                              strokeDasharray={`${(cat.percentage / 100) * circumference} ${circumference}`}
                              strokeDashoffset={-((prevPerc / 100) * circumference)}
                              strokeLinecap="round"
                            />
                          );
                        })
                      )}
                    </Svg>
                    <View style={styles.centerContent}>
                      <Text style={[styles.centerLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Total</Text>
                      <Text style={[styles.centerValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{totalMinutes}<Text style={{ fontSize: 16 }}>min</Text></Text>
                    </View>
                  </View>

                  <View style={styles.legendGrid}>
                    {categories.filter(c => c.minutes > 0).slice(0, 4).map(cat => (
                      <View key={cat.id} style={styles.legendItem}>
                        <View style={[styles.legendBar, { backgroundColor: cat.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={[styles.legendName, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{cat.name}</Text>
                          <Text style={[styles.legendValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{cat.percentage}%</Text>
                        </View>
                      </View>
                    ))}
                    {totalMinutes === 0 && <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: theme.typography.fontFamily }}>No data for this period</Text>}
                    {categories.filter(c => c.minutes > 0).length > 4 && (
                      <Text style={{ color: theme.colors.secondary, fontSize: 11, fontWeight: '600', fontFamily: theme.typography.fontFamily }}>
                        +{categories.filter(c => c.minutes > 0).length - 4} more active
                      </Text>
                    )}
                  </View>
                </View>
              </BlurView>

              {/* Stats Grid */}
              <StreakCard />
              
              <View style={styles.statsGrid}>
                <StatCard icon={CheckCircle} label="XP" value={userStats?.total_xp || 0} color="#10B981" />
              </View>

              {/* Subject Breakdown */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Subject Progress</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Overall Curriculum Completion</Text>
                </View>
                
                <View style={styles.subjectList}>
                  {categories.map((subject) => {
                    const completedCount = subject.completedTopics || 0;
                    const totalCount = subject.totalTopics || 0;
                    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                    
                    return (
                      <BlurView 
                        key={subject.id} 
                        intensity={20} 
                        tint={isDark ? "dark" : "light"} 
                        style={[styles.subjectProgressCard, { borderColor: theme.colors.glassBorder }]}
                      >
                        <View style={styles.subjectHeaderRow}>
                          <View style={[styles.subjectIconBox, { backgroundColor: `${subject.color}15` }]}>
                            {subject.icon ? <subject.icon size={18} color={subject.color} /> : <BookOpen size={18} color={subject.color} />}
                          </View>
                          <View style={styles.subjectMeta}>
                            <Text numberOfLines={1} style={[styles.subjectName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                              {subject.name}
                            </Text>
                            <Text style={[styles.subjectStats, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                              {completedCount} of {totalCount} topics completed
                            </Text>
                          </View>
                          <Text style={[styles.subjectPercentage, { color: subject.color, fontFamily: theme.typography.fontFamily }]}>
                            {progress}%
                          </Text>
                        </View>
                        
                        <View style={styles.progressBarBg}>
                          <LinearGradient
                            colors={[subject.color, subject.color + '80']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressBarFill, { width: `${progress}%` }]}
                          />
                        </View>
                      </BlurView>
                    );
                  })}
                </View>
              </View>

              {/* Activity Timeline */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Recent Activity</Text>
                <View style={[styles.timelineContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', borderColor: theme.colors.glassBorder }]}>
                  {recentActivity.map((activity, index) => (
                    <View key={index} style={[styles.activityRow, index !== recentActivity.length - 1 && styles.activityBorder]}>
                      <View style={[styles.activityIcon, { backgroundColor: theme.colors.glass }]}>
                        <BookOpen size={16} color={theme.colors.secondary} />
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={[styles.activityTitle, { color: theme.colors.textPrimary }]}>{activity.title}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>{activity.time}</Text>
                          <Text style={[styles.activityTime, { color: theme.colors.secondary, fontWeight: 'bold' }]}>{activity.score}%</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  {recentActivity.length === 0 && (
                    <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>No recent activity found</Text>
                  )}
                </View>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
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
  headerTitle: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 10 },
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
  tabText: { fontWeight: '600', fontSize: 14 },
  donutCard: {
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  chartSection: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  centerLabel: { fontSize: 12, fontWeight: '600' },
  centerValue: { fontSize: 28, fontWeight: '800' },
  legendGrid: {
    flex: 1,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendBar: {
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  legendName: { fontSize: 12, fontWeight: '500' },
  legendValue: { fontSize: 14, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
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
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  timelineContainer: { borderRadius: 20, padding: 20, borderWidth: 1 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
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
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  activityTime: { fontSize: 12 },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  subjectList: {
    gap: 12,
  },
  subjectProgressCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subjectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  subjectMeta: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subjectStats: {
    fontSize: 11,
    fontWeight: '500',
  },
  subjectPercentage: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
