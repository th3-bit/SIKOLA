import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Animated,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Award, 
  Lock,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import LockStatusModal from '../components/LockStatusModal';
import MasteryModal from '../components/MasteryModal';

const { width, height } = Dimensions.get('window');

export default function LessonDetailScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { isTopicCompleted, getTopicScore, checkLessonAccess, subscriptions, isTrialExpired, subscriptionInfo, checkTrialLimit } = useProgress();
  const { lesson: topic, subject, subjectIndex, topicIndex } = route.params; // Rename 'lesson' param to 'topic' for clarity
  const primaryColor = topic.color || subject?.color || theme.colors.secondary;
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showMasteryModal, setShowMasteryModal] = useState(false);
  const [masteryModalConfig, setMasteryModalConfig] = useState({ type: 'premium', title: '', message: '', onAction: null });
  const [preparedQuestions, setPreparedQuestions] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockConfig, setLockConfig] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('topic_id', topic.id)
        .order('order_index', { ascending: true }); // Use order_index for custom manual order

      if (error) throw error;
      setLessons(data || []);
    } catch (err) {
      console.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourseTest = async () => {
    try {
      // 0. Check Trial Limit
      if (subscriptionInfo.type === 'trial' && !checkTrialLimit()) {
        setMasteryModalConfig({
          type: 'limit',
          title: 'Daily Limit Reached',
          message: "You've completed your free test for today. Upgrade to SIKOLA Premium for unlimited proficiency exams and master your subjects faster!",
          onAction: () => { setShowMasteryModal(false); navigation.navigate('Subscription'); },
          actionText: 'View Premium Plans'
        });
        setShowMasteryModal(true);
        return;
      }

      setLoading(true);
      
      // 1. Fetch all lessons and their contents for this topic
      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('topic_id', topic.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (!lessonsData || lessonsData.length === 0) {
        Alert.alert("Notice", "No questions available for this course yet.");
        setLoading(false);
        return;
      }

      let lessonsWithQuestions = [];
      lessonsData.forEach(lesson => {
        try {
          const slides = typeof lesson.content === 'string' ? JSON.parse(lesson.content) : lesson.content;
          const quizSlides = slides?.filter(s => s.type === 'quiz') || [];
          
          if (quizSlides.length > 0) {
            lessonsWithQuestions.push({
              lessonId: lesson.id,
              questions: quizSlides.map(q => ({
                ...q,
                lesson_id: lesson.id,
                subject_name: subject?.name || 'Course'
              }))
            });
          }
        } catch (parseErr) {
          console.error(`LessonDetailScreen: Failed to parse content for lesson ${lesson.id}`, parseErr);
          // Skip this lesson and continue with others
        }
      });

      if (lessonsWithQuestions.length === 0) {
        Alert.alert("Notice", "No questions found in this course's lessons.");
        setLoading(false);
        return;
      }

      // 2. Selection Logic (Similar to PracticeScreen: 5 questions per lesson)
      let selectedQuestions = [];
      lessonsWithQuestions.forEach(lwq => {
        const shuffled = [...lwq.questions].sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffled.slice(0, 5));
      });

      // Final Shuffle
      selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random());
      setPreparedQuestions(selectedQuestions);
      setLoading(false);

      // 3. Show Premium Mastery Modal
      if (subscriptionInfo.type === 'trial') {
        setMasteryModalConfig({
          type: 'trial',
          title: 'Mastery Challenge',
          message: `You are about to start the proficiency test for "${topic.title}". Prove your skills and earn extra XP!`,
          onAction: () => {
            setShowMasteryModal(false);
            navigation.navigate('Quiz', { 
              questions: selectedQuestions,
              topic: topic,
              subject: subject,
              isComprehensive: true,
              isFree: true 
            });
          }
        });
      } else {
        setMasteryModalConfig({
          type: 'premium',
          title: 'Mastery Awaits',
          message: `Show off what you've learned in "${topic.title}"! This exam covers all lessons in this course. Good luck!`,
          onAction: () => {
            setShowMasteryModal(false);
            navigation.navigate('Quiz', { 
              questions: selectedQuestions,
              topic: topic,
              subject: subject,
              isComprehensive: true,
              isFree: true 
            });
          },
          actionText: 'Start Exam'
        });
      }
      setShowMasteryModal(true);

    } catch (err) {
      console.error('Error starting course test:', err);
      Alert.alert("Error", "Failed to load the course test.");
    } finally {
      setLoading(false);
    }
  };

  // Static meta for now, ideally this comes from the Topic table too
  const lessonContent = {
    description: `Master the fundamentals of ${topic.title || 'this subject'}. Learn key concepts, practice with examples, and test your knowledge.`,
    difficulty: 'Intermediate',
    xpReward: 150,
  };

  // Calculate dynamic progress
  const completedCount = lessons.filter(l => isTopicCompleted(topic.id, l.id)).length;
  const totalCount = lessons.length;
  const currentProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      {/* Liquid Glows */}
      <View style={[styles.glow, { top: -100, left: -50, backgroundColor: primaryColor, opacity: 0.15 }]} />
      <View style={[styles.glow, { bottom: 100, right: -100, width: 300, height: 300, backgroundColor: theme.colors.secondary, opacity: 0.1 }]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
            }]}
          >
            <View style={styles.backButtonBlur}>
              <ArrowLeft color={theme.colors.textPrimary} size={22} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            {/* Hero Section */}
            <View style={[styles.heroSection]}>
               <View style={[styles.heroCard, { 
                 backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                 borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
               }]}>
                  <View style={[styles.typeBadge, { backgroundColor: `${primaryColor}20` }]}>
                    <Text style={[styles.typeText, { color: primaryColor }]}>COURSE CONTENT</Text>
                  </View>
                  <Text style={[styles.lessonTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {topic.title}
                  </Text>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                        {Math.floor(lessons.reduce((acc, l) => acc + (l.duration || 5), 0))} min
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Award size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{lessonContent.xpReward} XP</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <BookOpen size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>{lessonContent.difficulty}</Text>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                     <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                           {completedCount} of {totalCount} topics completed
                         </Text>
                        <Text style={[styles.progressValue, { color: theme.colors.textPrimary }]}>{currentProgress}%</Text>
                     </View>
                     <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={[styles.progressBarFill, { width: `${currentProgress}%`, backgroundColor: primaryColor }]} />
                     </View>
                  </View>
               </View>
            </View>

            {/* About Section */}
            <View style={styles.sectionHeader}>
               <Info size={18} color={theme.colors.secondary} />
               <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>About Course</Text>
            </View>
            
            <View style={[styles.descriptionCard, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
            }]}>
              <Text style={[styles.descriptionText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                {lessonContent.description}
              </Text>
            </View>

            {/* Curriculum Section */}
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Detailed Curriculum</Text>
               <View style={[styles.countBadge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{lessons.length} topics</Text>
               </View>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.secondary} style={{ marginTop: 20 }} />
            ) : lessons.length === 0 ? (
               <View style={{ padding: 20, alignItems: 'center' }}>
                 <Text style={{ color: theme.colors.textSecondary }}>No lessons added yet.</Text>
               </View>
            ) : (
              <View style={styles.topicsList}>
                  {lessons.map((lessonItem, index) => {
                    // Check base Course-level access
                    // FIX: Pass the actual topicIndex from route.params
                    const actualTopicIndex = topicIndex ?? 0;
                    const hasAccess = checkLessonAccess(index, topic.id, subject?.id, actualTopicIndex); 
                    
                    // Enforce sequential Topic locking (within Course)
                    const isCompleted = isTopicCompleted(topic.id, lessonItem.id);
                    const isSeqLocked = hasAccess && index > 0 && !isTopicCompleted(topic.id, lessons[index-1].id);
                    
                    const isLocked = !hasAccess || isSeqLocked;

                    // Granular Subscription Badge logic
                    let accessType = null;
                    const hasActiveSub = subscriptions && subscriptions.length > 0;
                    if (hasActiveSub && hasAccess) {
                       const isAllAccess = subscriptions.some(s => !s.topic_id && !s.subject_id);
                       const isSubjectAccess = subscriptions.some(s => s.subject_id === subject?.id);
                       const isSpecificAccess = subscriptions.some(s => s.topic_id === topic.id);
                       
                       if (isAllAccess) accessType = 'ALL ACCESS';
                       else if (isSubjectAccess) accessType = 'SUBSCRIBED';
                       else if (isSpecificAccess) accessType = 'SUBSCRIBED';
                    }
                    
                    return (
                     <TouchableOpacity 
                       key={lessonItem.id} 
                       activeOpacity={0.7}
                       onPress={() => {
                          if (!hasAccess) {
                             const hasAnySub = subscriptions && subscriptions.length > 0;
                             if (hasAnySub) {
                                setLockConfig({
                                 type: 'subscription',
                                 title: 'Course Locked',
                                 message: 'This course is not part of your current plan. Upgrade your subscription to unlock all courses in this subject.',
                                 onAction: () => { setShowLockModal(false); navigation.navigate('Subscription'); }
                               });
                             } else {
                                setLockConfig({
                                 type: 'subscription',
                                 title: 'Premium Course',
                                 message: 'Purchase this course or upgrade to Premium to unlock all topics.',
                                 onAction: () => { setShowLockModal(false); navigation.navigate('Subscription'); }
                               });
                             }
                             setShowLockModal(true);
                          } else if (isSeqLocked) {
                             setLockConfig({
                               type: 'sequential',
                               title: 'Topic Locked',
                               message: `Please complete "${lessons[index-1].title}" first to unlock this content and continue your learning journey.`,
                               onAction: () => setShowLockModal(false)
                             });
                             setShowLockModal(true);
                          } else {
                            navigation.navigate('LearningContent', { lesson: lessonItem, subject, topic });
                          }
                       }}
                     >
                        <View style={[styles.topicCard, { 
                          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', 
                          opacity: isLocked ? 0.6 : 1 
                        }]}>
                           <View style={[styles.topicNumber, { backgroundColor: isCompleted ? '#10B981' : (isLocked ? theme.colors.glassBorder : `${primaryColor}20`) }]}>
                              {isCompleted ? (
                                <CheckCircle size={14} color="#FFF" />
                              ) : isLocked ? (
                                <Lock size={14} color={theme.colors.textSecondary} />
                              ) : (
                                <Text style={[styles.topicNumberText, { color: primaryColor }]}>{index + 1}</Text>
                              )}
                           </View>
                           <View style={styles.topicInfo}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <Text style={[styles.topicName, { color: theme.colors.textPrimary }]}>{lessonItem.title}</Text>
                                
                                {/* Access Badges */}
                                {accessType ? (
                                  <View style={[styles.badge, styles.subscribedBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' }]}>
                                    <Sparkles size={10} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                                    <Text style={styles.subscribedBadgeText}>{accessType}</Text>
                                  </View>
                                ) : !hasAccess ? (
                                  <View style={[styles.badge, styles.premiumBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                                  </View>
                                ) : null}
                              </View>

                               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={[styles.topicSub, { color: theme.colors.textSecondary }]}>Topic {index + 1}</Text>
                                  <Text style={[styles.topicSub, { color: theme.colors.textSecondary }]}>• {lessonItem.duration || 5} min</Text>
                                 {isSeqLocked && <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontStyle: 'italic' }}>Locked</Text>}
                              </View>
                           </View>
                           {isCompleted ? (
                             <View style={{ alignItems: 'flex-end' }}>
                                <CheckCircle size={18} color="#10B981" />
                             </View>
                           ) : (
                             <ChevronRight size={18} color={isLocked ? theme.colors.textSecondary : theme.colors.textPrimary} opacity={isLocked ? 0.5 : 1} />
                           )}
                        </View>
                     </TouchableOpacity>
                    );
                  })}

                  {/* Course Mastery Test CTA (Integrated) */}
                  <TouchableOpacity 
                    style={[styles.courseTestCard, { shadowColor: primaryColor }]}
                    activeOpacity={0.9}
                    onPress={handleStartCourseTest}
                  >
                    <LinearGradient
                      colors={[primaryColor, (primaryColor) + 'CC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.courseTestGradient}
                    >
                      <View style={styles.courseTestLeft}>
                        <View style={styles.testIconContainer}>
                          <Award color="#FFF" size={24} />
                        </View>
                        <View>
                          <Text style={styles.courseTestTitle}>Course Proficiency Test</Text>
                          <Text style={styles.courseTestSubtitle}>Test your mastery of all topics</Text>
                        </View>
                      </View>
                      <ChevronRight color="#FFF" size={20} />
                    </LinearGradient>
                  </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Action Button */}
        {lessons.length > 0 && (
          <View style={styles.footer}>
             <TouchableOpacity 
               activeOpacity={0.9}
               style={[styles.startButton]}
               onPress={() => {
                 // Start first uncompleted lesson
                 const firstUnfinished = lessons.find(l => !isTopicCompleted(topic.id, l.id)) || lessons[0];
                 navigation.navigate('LearningContent', { lesson: firstUnfinished, subject, topic });
               }}
             >
                <LinearGradient
                  colors={[primaryColor, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startGradient}
                >
                   <Play size={20} color="#FFF" fill="#FFF" />
                   <Text style={styles.startText}>CONTINUE LEARNING</Text>
                </LinearGradient>
             </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {lockConfig && (
        <LockStatusModal
          visible={showLockModal}
          onClose={() => setShowLockModal(false)}
          type={lockConfig.type}
          title={lockConfig.title}
          message={lockConfig.message}
          onAction={lockConfig.onAction}
          actionText={lockConfig.actionText}
        />
      )}

      <MasteryModal
        visible={showMasteryModal}
        onClose={() => setShowMasteryModal(false)}
        type={masteryModalConfig.type}
        title={masteryModalConfig.title}
        message={masteryModalConfig.message}
        onAction={masteryModalConfig.onAction}
        actionText={masteryModalConfig.actionText}
      />
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
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    filter: 'blur(80px)', // Will be ignored on some RN versions but provides intent
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  backButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    marginTop: 10,
    marginBottom: 25,
    borderRadius: 32,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  heroCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 15,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  lessonTitle: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    marginBottom: 15,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '900',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  descriptionCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 25,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    opacity: 0.8,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  topicsList: {
    gap: 12,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topicNumber: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicNumberText: {
    fontSize: 14,
    fontWeight: '900',
  },
  topicInfo: {
    flex: 1,
    marginLeft: 15,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  topicSub: {
    fontSize: 12,
    opacity: 0.6,
  },
  completedTag: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  startButton: {
    borderRadius: 24,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 24,
    gap: 12,
  },
  startText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  courseTestCard: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  courseTestGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  courseTestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTestTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  courseTestSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  freeBadge: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  freeBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subscribedBadge: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  subscribedBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  premiumBadgeText: {
    color: 'rgba(128, 128, 128, 0.8)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
