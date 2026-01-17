import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  Play, 
  BookOpen, 
  Award, 
  Clock, 
  Star, 
  ChevronRight,
  Zap,
  Lock,
  Trophy,
  Target,
  CheckCircle2,
  Calendar
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import GlassHeader from '../components/GlassHeader';

const { width } = Dimensions.get('window');

export default function LearnScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userStats, continueLearning, recentLessons, courseProgress, sessions } = useProgress();

  const [activePathSubject, setActivePathSubject] = useState(null);
  const [learningPath, setLearningPath] = useState([]);
  const [loadingPath, setLoadingPath] = useState(false);

  // Calculate Level (Every 1000 XP = 1 Level)
  const currentLevel = Math.floor((userStats?.total_xp || 0) / 1000) + 1;
  const xpIntoLevel = (userStats?.total_xp || 0) % 1000;
  const xpTarget = 1000;
  const progressPercent = (xpIntoLevel / xpTarget) * 100;

  // Helper function for time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Real Data Calculation for Achievements
  const achievements = [
    { 
      id: 1, 
      title: 'Early Bird', 
      icon: Zap, 
      color: '#FACC15', 
      unlocked: sessions?.some(s => {
        const h = new Date(s.started_at).getHours();
        return h >= 5 && h < 9;
      }), 
      desc: 'Complete a lesson before 9AM' 
    },
    { 
      id: 2, 
      title: '7-Day Streak', 
      icon: FlameIcon, 
      color: '#FF453A', 
      unlocked: (userStats?.current_streak || 0) >= 7, 
      desc: 'Study for 7 days in a row' 
    },
    { 
      id: 3, 
      title: 'Quiz Master', 
      icon: Star, 
      color: '#8B5CF6', 
      unlocked: recentLessons?.filter(l => l.progress === 100).length >= 3, 
      desc: 'Score 100% on 3 quizzes' 
    },
    { 
      id: 4, 
      title: 'Bookworm', 
      icon: BookOpen, 
      color: '#10B981', 
      unlocked: (userStats?.total_lessons_completed || 0) >= 5, 
      desc: 'Complete 5 lessons' 
    },
  ];

  // Helper for Flame icon since it might not be imported or custom
  function FlameIcon(props) {
    return <Zap {...props} />; // reusing Zap as placeholder if Flame not available or use another
  }

  // Real Data Calculation for Recent Activity
  // We limit to the top 5 most recent from the context
  const recentActivity = recentLessons?.slice(0, 5).map((lesson, index) => ({
    id: lesson.id || index,
    title: lesson.topic_title || lesson.title, // Use topic title if available for better context
    type: lesson.progress > 0 ? 'quiz' : 'lesson', // Heuristic: if score exists, it's a quiz/assessed lesson
    time: getTimeAgo(lesson.completed_at),
    score: lesson.progress ? `${lesson.progress}%` : 'Completed',
    color: lesson.color || theme.colors.secondary
  })) || [];


  // Determine which subject path to show
  useEffect(() => {
    loadActivePath();
  }, [recentLessons, continueLearning]);

  const loadActivePath = async () => {
    // 1. Find a target topic ID to trace back to a subject
    let targetTopicId = null;
    
    if (recentLessons?.length > 0) {
      targetTopicId = recentLessons[0].topic_id;
    } else if (continueLearning?.length > 0) {
      targetTopicId = continueLearning[0].id;
    }

    if (!targetTopicId) {
      // Fallback: If no activity, try to fetch the first available subject's topics? 
      // Or just leave empty.
      return;
    }

    try {
      setLoadingPath(true);
      
      // 2. Fetch Subject details using the topic
      const { data: topicData, error } = await supabase
        .from('topics')
        .select(`
          subject_id,
          subjects (
            id,
            name,
            color,
            icon
          )
        `)
        .eq('id', targetTopicId)
        .single();
        
      if (error || !topicData?.subjects) return;

      const subject = Array.isArray(topicData.subjects) ? topicData.subjects[0] : topicData.subjects;
      setActivePathSubject(subject);

      // 3. Fetch all topics for this subject to build the path
      const { data: allTopics } = await supabase
        .from('topics')
        .select(`
          *,
          lessons (duration)
        `)
        .eq('subject_id', subject.id)
        .order('id'); // You might want a 'sequence' column here later

      if (allTopics) {
        const path = allTopics.map((topic, index) => {
          const isCompleted = courseProgress[topic.id]?.completed;
          
          // Determine status
          let status = 'locked';
          if (isCompleted) {
            status = 'completed';
          } else {
            // It's the first uncompleted one, OR the previous one is completed
            const prevTopic = index > 0 ? allTopics[index - 1] : null;
            if (!prevTopic || courseProgress[prevTopic.id]?.completed) {
              status = 'in-progress';
            }
          }

          // Calculate duration
          const durationMins = topic.lessons?.reduce((sum, l) => sum + (l.duration || 15), 0) || 15;

          return {
            id: topic.id,
            title: topic.title,
            status,
            duration: `${durationMins}m`,
            originalTopic: topic // Keep ref for nav
          };
        });

        setLearningPath(path);
      }

    } catch (err) {
      console.error('Failed to load learning path:', err);
    } finally {
      setLoadingPath(false);
    }
  };

  const PathStep = ({ step, index, isLast }) => {
    const isCompleted = step.status === 'completed';
    const isInProgress = step.status === 'in-progress';
    const isLocked = step.status === 'locked';

    return (
      <View style={styles.pathItemContainer}>
        {/* Connection Line */}
        {!isLast && (
          <View style={[
            styles.connectionLine, 
            { backgroundColor: isCompleted ? theme.colors.secondary : 'rgba(255,255,255,0.1)' }
          ]} />
        )}
        
        <View style={styles.pathContentRow}>
          <View style={[
            styles.stepIconContainer, 
            { 
              backgroundColor: isCompleted ? theme.colors.secondary : (isInProgress ? 'transparent' : 'rgba(255,255,255,0.05)'),
              borderColor: isInProgress ? theme.colors.secondary : 'transparent',
              borderWidth: isInProgress ? 2 : 0
            }
          ]}>
            {isCompleted ? (
              <Star size={16} color="#FFF" fill="#FFF" />
            ) : isLocked ? (
              <Lock size={14} color={theme.colors.textSecondary} />
            ) : (
              <Text style={[styles.stepNumber, { color: isInProgress ? theme.colors.secondary : theme.colors.textSecondary }]}>
                {index + 1}
              </Text>
            )}
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            disabled={isLocked}
            onPress={() => {
              if (activePathSubject) {
                // Navigate to lesson detail or topic view
                navigation.navigate('SubjectDetail', { subject: activePathSubject });
              }
            }}
            style={[
              styles.stepCardWrapper, 
              { opacity: isLocked ? 0.5 : 1 }
            ]}
          >
            <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.stepCard, { borderColor: theme.colors.glassBorder }]}>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {step.title}
                </Text>
                <View style={styles.stepMeta}>
                  <Clock size={12} color={theme.colors.textSecondary} />
                  <Text style={[styles.stepMetaText, { color: theme.colors.textSecondary }]}>{step.duration}</Text>
                </View>
              </View>
              {!isLocked && <ChevronRight size={20} color={theme.colors.textSecondary} />}
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <GlassHeader />
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Overall Stats */}
          <View style={styles.statsOverview}>
             <BlurView intensity={25} tint={isDark ? "dark" : "light"} style={[styles.statsBlur, { borderColor: theme.colors.glassBorder }]}>
                <View style={styles.statsHeader}>
                   <View>
                      <Text style={[styles.statsWelcome, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Overall Mastery</Text>
                      <Text style={[styles.statsLevel, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                        Level {currentLevel} Learner
                      </Text>
                   </View>
                   <View style={[styles.xpBadge, { backgroundColor: theme.colors.secondary }]}>
                      <Zap size={14} color="#FFF" fill="#FFF" />
                      <Text style={[styles.xpText, { fontFamily: theme.typography.fontFamily }]}>{(userStats?.total_xp || 0).toLocaleString()} XP</Text>
                   </View>
                </View>
                
                <View style={styles.progressSection}>
                   <View style={styles.progressBarBg}>
                      <LinearGradient
                        colors={['#8B5CF6', '#EC4899']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
                      />
                   </View>
                   <Text style={[styles.progressRatio, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                     {xpIntoLevel}/{xpTarget} to next level
                   </Text>
                </View>
             </BlurView>
          </View>

          {/* Continue Learning Section */}
          {continueLearning?.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Keep Going</Text>
                <TouchableOpacity><Text style={{ color: theme.colors.secondary, fontWeight: 'bold', fontFamily: theme.typography.fontFamily }}>See Favorites</Text></TouchableOpacity>
              </View>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.continueList}
              >
                {continueLearning.map((item) => (
                  <TouchableOpacity 
                    key={item.id}
                    activeOpacity={0.9} 
                    style={[styles.continueCardWrapper, { shadowColor: item.color || theme.colors.secondary, marginRight: 20 }]}
                    onPress={() => {
                         navigation.navigate('SubjectDetail', { 
                           subject: { name: item.category, color: item.color, id: item.id } 
                         });
                    }}
                  >
                    <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.continueCard, { borderColor: theme.colors.glassBorder }]}>
                      <LinearGradient
                        colors={[`${item.color || '#8B5CF6'}40`, 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.continueCardLeft}>
                        <View style={[styles.subBadge, { backgroundColor: `${item.color || '#8B5CF6'}20` }]}>
                          <Text style={[styles.subBadgeText, { color: item.color || '#8B5CF6', fontFamily: theme.typography.fontFamily }]}>{item.category}</Text>
                        </View>
                        <Text style={[styles.continueTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.timeLeftRow}>
                          <Clock size={14} color={theme.colors.textSecondary} />
                          <Text style={[styles.timeLeftText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{item.duration}m total</Text>
                        </View>
                      </View>
                      
                      <View style={styles.continueCardRight}>
                        <View style={styles.playIconContainer}>
                          <Play size={24} color="#FFF" fill="#FFF" />
                        </View>
                      </View>

                      <View style={styles.cardProgressLine}>
                        <View style={[styles.cardProgressFill, { width: `${item.progress}%`, backgroundColor: item.color || '#8B5CF6' }]} />
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* 🏆 Achievements Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Achievements</Text>
            <TouchableOpacity><Text style={{ color: theme.colors.secondary, fontWeight: 'bold', fontFamily: theme.typography.fontFamily }}>View All</Text></TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesList}>
            {achievements.map((badge) => (
              <View key={badge.id} style={[styles.badgeCard, { opacity: badge.unlocked ? 1 : 0.6 }]}>
                 <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.badgeInner, { borderColor: badge.unlocked ? badge.color : theme.colors.glassBorder, backgroundColor: badge.unlocked ? `${badge.color}10` : 'transparent' }]}>
                    <View style={[styles.badgeIconBg, { backgroundColor: badge.unlocked ? `${badge.color}20` : 'rgba(255,255,255,0.05)' }]}>
                       <badge.icon size={24} color={badge.unlocked ? badge.color : theme.colors.textSecondary} />
                    </View>
                    <Text style={[styles.badgeTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]} numberOfLines={1}>{badge.title}</Text>
                    {badge.unlocked && (
                      <View style={[styles.glowDot, { backgroundColor: badge.color, shadowColor: badge.color }]} />
                    )}
                 </BlurView>
              </View>
            ))}
          </ScrollView>

          {/* Learning Path */}
          {activePathSubject && (
            <>
              <View style={[styles.sectionHeader, { marginTop: 30 }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{activePathSubject.name} Path</Text>
                <View style={[styles.smallBadge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontFamily: theme.typography.fontFamily }}>{learningPath.length} Steps</Text>
                </View>
              </View>

              {loadingPath ? (
                 <ActivityIndicator color={theme.colors.secondary} style={{ marginTop: 20 }} />
              ) : (
                <View style={styles.pathGrid}>
                  {learningPath.map((step, index) => (
                    <PathStep 
                      key={step.id} 
                      step={step} 
                      index={index} 
                      isLast={index === learningPath.length - 1} 
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {/* 📜 Recent Activity Section */}
          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Recent History</Text>
          </View>
          
          <View style={styles.activityContainer}>
            {recentActivity.map((activity, index) => (
              <View key={activity.id} style={styles.activityItemWrapper}>
                 {index !== recentActivity.length - 1 && (
                    <View style={[styles.activityLine, { backgroundColor: theme.colors.glassBorder }]} />
                 )}
                 <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.activityCard, { borderColor: theme.colors.glassBorder }]}>
                    <View style={[styles.activityIconBox, { backgroundColor: `${activity.color}20` }]}>
                       {activity.type === 'quiz' ? <Trophy size={18} color={activity.color} /> : <CheckCircle2 size={18} color={activity.color} />}
                    </View>
                    <View style={styles.activityInfo}>
                       <Text style={[styles.activityTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{activity.title}</Text>
                       <Text style={[styles.activityTime, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                         {activity.time} • <Text style={{ color: activity.color }}>{activity.score}</Text>
                       </Text>
                    </View>
                 </BlurView>
              </View>
            ))}
          </View>

          {/* Empty State if nothing */}
          {!activePathSubject && continueLearning.length === 0 && (
             <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }}>Start a lesson to see your path here!</Text>
                <TouchableOpacity 
                   style={{ marginTop: 20, padding: 10, backgroundColor: theme.colors.secondary, borderRadius: 10 }}
                   onPress={() => navigation.navigate('Subjects')}
                >
                   <Text style={{ fontWeight: 'bold', fontFamily: theme.typography.fontFamily }}>Explore Subjects</Text>
                </TouchableOpacity>
             </View>
          )}

          <View style={{ height: 120 }} />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  statsOverview: {
    marginBottom: 25,
  },
  statsBlur: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statsWelcome: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsLevel: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  xpText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  progressSection: {
    marginTop: 5,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressRatio: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  continueList: {
    paddingRight: 20,
    marginBottom: 10,
  },
  continueCardWrapper: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    width: width * 0.8,
  },
  continueCard: {
    flexDirection: 'row',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    height: 140,
  },
  continueCardLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  subBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  subBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  continueTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  timeLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLeftText: {
    fontSize: 13,
    fontWeight: '600',
  },
  continueCardRight: {
     justifyContent: 'center',
     alignItems: 'center',
  },
  playIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardProgressLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardProgressFill: {
    height: '100%',
  },
  badgesList: {
    paddingRight: 20,
    gap: 15,
    marginBottom: 10,
  },
  badgeCard: {
    width: 100,
    marginBottom: 10,
  },
  badgeInner: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  badgeIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 10,
    right: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  pathGrid: {
    paddingLeft: 10,
  },
  pathItemContainer: {
    position: 'relative',
    paddingBottom: 25,
  },
  connectionLine: {
    position: 'absolute',
    left: 17,
    top: 34,
    width: 2,
    height: '100%',
    opacity: 0.3,
  },
  pathContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepCardWrapper: {
    flex: 1,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  smallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityContainer: {
    marginTop: 0,
    gap: 15,
  },
  activityItemWrapper: {
    position: 'relative',
  },
  activityLine: {
    position: 'absolute',
    left: 20,
    top: 40,
    bottom: -20,
    width: 2,
    zIndex: 0,
    opacity: 0.3,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activityIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.7,
  }
});
