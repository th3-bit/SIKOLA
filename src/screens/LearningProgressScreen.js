import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Platform,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  BookOpen,
  Trophy,
  Medal,
  Zap,
  Award
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import StreakCard from '../components/StreakCard';
import MonthlyStreakCalendar from '../components/MonthlyStreakCalendar';
import Svg, { Circle } from 'react-native-svg';
import { getSubjectStyle } from '../constants/SubjectConfig';

const { width } = Dimensions.get('window');

const formatRelativeTime = (date) => {
  const now = new Date();
  const activityDate = new Date(date);
  const diff = now - activityDate;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return activityDate.toLocaleDateString();
  if (days > 1) return `${days} days ago`;
  if (days === 1) return 'Yesterday';
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

export default function LearningProgressScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userStats, sessions: allSessions, isLoading: contextLoading } = useProgress();
  const [timeRange, setTimeRange] = useState('weekly'); // daily, weekly, monthly
  const [loading, setLoading] = useState(true);
  const [rangeSessions, setRangeSessions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

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
            color: s.color || style.color,
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
          const hasScore = a.score > 0;
          
          let title = `Completed "${topic?.title || 'Lesson'}"`;
          let icon = CheckCircle;
          let iconColor = '#10B981';

          if (hasScore) {
            title = `Scored ${a.score}% in ${topic?.title || 'Quiz'}`;
            icon = Trophy;
            iconColor = '#F59E0B';
          }

          return {
            id: a.topic_id,
            title,
            time: formatRelativeTime(a.completed_at),
            score: a.score,
            icon,
            iconColor
          };
        });
        
        // Let's also fetch sessions to see if there are "Started" activities
        // In a real app, we'd have a dedicated activity log. 
        // For now, we mix these in.
        const { data: recentSessions } = await supabase
          .from('learning_sessions')
          .select('*, subjects(name, color)')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(3);
        
        if (recentSessions) {
          const sessionsAsActivity = recentSessions.map(s => {
            const isJustStarted = s.duration_minutes === 0;
            return {
              id: s.id,
              title: isJustStarted ? `Started "${s.subjects?.name || 'New Topic'}"` : `Studied "${s.subjects?.name || 'Topic'}"`,
              time: formatRelativeTime(s.started_at),
              icon: isJustStarted ? BookOpen : Clock,
              iconColor: s.subjects?.color || theme.colors.secondary,
              isSession: true,
              rawTime: s.started_at
            };
          });
          
          setRecentActivity([...mappedActivity, ...sessionsAsActivity]
            .sort((a, b) => new Date(b.rawTime || b.completed_at) - new Date(a.rawTime || a.completed_at))
            .slice(0, 5)
          );
        } else {
          setRecentActivity(mappedActivity);
        }
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

  const StatCard = ({ icon: Icon, label, value, color = theme.colors.secondary, shadowColor = color }) => (
    <View style={[styles.statCardWrapper, isDesktop && styles.desktopStatCardWrapper, { shadowColor: shadowColor }]}>
      <View style={[
        styles.statCard, 
        isDesktop && styles.desktopStatCard,
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
        <View style={isDesktop ? styles.desktopStatCardInner : { alignItems: 'center' }}>
          <View style={[styles.statIconContainer, isDesktop && { marginBottom: 0, marginRight: 15 }]}>
            <Icon color={color} size={24} />
          </View>
          <View style={isDesktop && { justifyContent: 'center' }}>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{label}</Text>
          </View>
        </View>
        <View style={[styles.liquidGlow, { backgroundColor: color, opacity: isDark ? 0.08 : 0.1 }]} />
      </View>
    </View>
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
              <View style={[styles.donutCard, { 
                backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
              }]}>
                <LinearGradient
                   colors={isDark ? ['rgba(255, 255, 255, 0.03)', 'transparent'] : ['rgba(0, 0, 0, 0.01)', 'transparent']}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 1 }}
                   style={StyleSheet.absoluteFill}
                />
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
              </View>

              {/* Desktop/Mobile Wrapper exactly like PracticeScreen */}
              <View style={isDesktop ? { 
                flexDirection: 'row', 
                gap: 20, 
                alignItems: 'stretch', 
                marginBottom: 30,
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.25)',
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                borderWidth: 1.5,
                borderRadius: 28,
                padding: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.04,
                shadowRadius: 24,
                ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {}),
              } : { marginBottom: 20 }}>
                {/* Streak Section */}
                <View style={[styles.streakCardSection, isDesktop && { flex: 0.45, marginBottom: 0 }]}>
                  {timeRange === 'monthly' ? (
                    <MonthlyStreakCalendar />
                  ) : (
                    <StreakCard mode={timeRange} />
                  )}
                </View>

                {/* Stats Row */}
                <View style={[styles.statsRow, isDesktop && styles.desktopStatsRow]}>
                  <StatCard icon={BookOpen} label="Lessons" value={userStats?.total_lessons_completed?.toString() || "0"} color="#22C55E" />
                  <StatCard icon={Award} label="Points" value={userStats?.total_xp?.toString() || "0"} color="#FACC15" />
                  <StatCard icon={Clock} label="Hours" value={Math.floor((allSessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0) / 60).toString()} color="#3B82F6" />
                </View>
              </View>

              {/* Subject Breakdown */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Topic Progress</Text>
                  <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Overall Topic Completion</Text>
                </View>
                
                <View style={styles.subjectList}>
                  {categories.map((subject) => {
                    const completedCount = subject.completedTopics || 0;
                    const totalCount = subject.totalTopics || 0;
                    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                    
                    return (
                      <View 
                        key={subject.id} 
                        style={[styles.subjectProgressCard, { 
                          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
                        }]}
                      >
                        <LinearGradient
                          colors={isDark ? [`${subject.color}08`, 'transparent'] : [`${subject.color}04`, 'transparent']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.subjectHeaderRow}>
                          <View style={[styles.subjectIconBox, { backgroundColor: `${subject.color}15` }]}>
                            {subject.icon ? <subject.icon size={18} color={subject.color} /> : <BookOpen size={18} color={subject.color} />}
                          </View>
                          <View style={styles.subjectMeta}>
                            <Text numberOfLines={1} style={[styles.subjectName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                              {subject.name}
                            </Text>
                            <Text style={[styles.subjectStats, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                              {completedCount} of {totalCount} sub-topics completed
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
                      </View>
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
                      <View style={[styles.activityIconBox, { backgroundColor: `${activity.iconColor}15` }]}>
                        {React.createElement(activity.icon, { size: 18, color: activity.iconColor })}
                      </View>
                      <View style={styles.activityInfo}>
                        <Text style={[styles.activityTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                          {activity.title}
                        </Text>
                        <Text style={[styles.activityTime, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                          {activity.time}
                        </Text>
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
  statCardWrapper: {
    flex: 1,
    height: 110,
    borderRadius: 24,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  desktopStatCardWrapper: {
    height: 'auto',
  },
  statCard: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  desktopStatCard: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  desktopStatCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    opacity: 0.8,
  },
  liquidGlow: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
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
  activityIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  activityTime: { fontSize: 13, opacity: 0.6 },
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
    transform: [{ translateZ: 0 }],
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  desktopStatsRow: {
    flex: 0.55,
  },
  streakCardSection: {
    marginBottom: 15,
  },
});
