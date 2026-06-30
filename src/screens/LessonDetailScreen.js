import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  Alert,
  Platform,
  BackHandler,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';
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
  Sparkles,
  Home,
  Target,
  Zap,
  Crown
} from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';
import LockStatusModal from '../components/LockStatusModal';
import MasteryModal from '../components/MasteryModal';

const { height } = Dimensions.get('window');

export default function LessonDetailScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { theme, isDark } = useTheme();
  const { isTopicCompleted, getTopicScore, checkLessonAccess, checkAccess, subscriptions, isTrialExpired, subscriptionInfo, checkTrialLimit } = useProgress();
  const { lesson: topic, subject, subjectIndex, topicIndex, fromContinueLearning } = route.params;
  const primaryColor = topic.color || subject?.color || theme.colors.secondary;
  
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showMasteryModal, setShowMasteryModal] = useState(false);
  const [masteryModalConfig, setMasteryModalConfig] = useState({ type: 'premium', title: '', message: '', onAction: null });
  const [preparedQuestions, setPreparedQuestions] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockConfig, setLockConfig] = useState(null);
  
  // Animation value for hero
  const heroProgress = useSharedValue(0);

  useEffect(() => {
    heroProgress.value = withTiming(1, { duration: 1000 });
    fetchLessons();
  }, []);

  // Intercept Android hardware back button: always go to SubjectDetail,
  // never back to the finished LearningContent screen.
  useEffect(() => {
    const onHardwareBack = () => {
      navigation.goBack();
      return true; // Prevent default back behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => subscription.remove();
  }, [navigation, subject, subjectIndex, fromContinueLearning]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('topic_id', topic.id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (err) {
      logger.error('Error fetching lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCourseTest = async () => {
    try {
      // 1. Primary Access Check: Does the user have access to this course?
      const hasAccess = checkAccess(topic.id, subject?.id, topicIndex, subjectIndex);
      
      if (!hasAccess) {
        const hasAnySub = subscriptions && subscriptions.length > 0;
        const lockAction = () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: topic.id, title: topic.title } }); };
        
        if (hasAnySub) {
           setLockConfig({
            type: 'subscription',
            title: 'Course Locked',
            message: 'This course is not part of your current plan. Upgrade your subscription to unlock all courses and proficiency exams.',
            onAction: lockAction
          });
        } else {
           setLockConfig({
            type: 'subscription',
            title: 'Premium Required',
            message: 'The Mastery Challenge is an advanced proficiency exam. Get SIKOLA Premium to unlock this test and master the subject!',
            onAction: lockAction
          });
        }
        setShowLockModal(true);
        return;
      }

      // 2. Trial Limit Check
      if (subscriptionInfo.type === 'trial' && !checkTrialLimit()) {
        setMasteryModalConfig({
          type: 'limit',
          title: 'Daily Limit Reached',
          message: "You've completed your free test for today. Upgrade to SIKOLA Premium for unlimited proficiency exams and master your subjects faster!",
          onAction: () => { setShowMasteryModal(false); navigation.navigate('Subscription', { lockedCourse: { id: topic.id, title: topic.title } }); },
          actionText: 'View Premium Plans'
        });
        setShowMasteryModal(true);
        return;
      }

      setLoading(true);
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
          logger.error(`LessonDetailScreen: Failed to parse content for lesson ${lesson.id}`, parseErr);
        }
      });

      if (lessonsWithQuestions.length === 0) {
        Alert.alert("Notice", "No questions found in this course's lessons.");
        setLoading(false);
        return;
      }

      let selectedQuestions = [];
      lessonsWithQuestions.forEach(lwq => {
        const shuffled = [...lwq.questions].sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffled.slice(0, 5));
      });

      selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random());
      setPreparedQuestions(selectedQuestions);
      setLoading(false);

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
              isFree: true,
              subjectIndex,
              topicIndex
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
              isFree: true,
              subjectIndex,
              topicIndex
            });
          },
          actionText: 'Start Exam'
        });
      }
      setShowMasteryModal(true);

    } catch (err) {
      logger.error('Error starting course test:', err);
      Alert.alert("Error", "Failed to load the course test.");
    } finally {
      setLoading(false);
    }
  };

  const TOPIC_LIMIT = 5;
  const topicListStr = lessons.length > 0 
    ? `You will learn about ${lessons.slice(0, TOPIC_LIMIT).map(l => l.title).join(', ')}${lessons.length > TOPIC_LIMIT ? ' and more' : ''} ` 
    : '';
  
  const lessonContent = {
    description: `Master the fundamentals of ${topic.title || 'this subject'}. ${topicListStr}with Learn key concepts, practice with examples, and test your knowledge.`,
    difficulty: 'Intermediate',
    xpReward: 150,
  };

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

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              navigation.goBack();
            }}
            style={[styles.backButton, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'
            }]}
          >
            <View style={styles.backButtonBlur}>
              <ArrowLeft color={theme.colors.textPrimary} size={22} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}
            style={[styles.backButton, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'
            }]}
          >
            <View style={styles.backButtonBlur}>
              <Home color={theme.colors.textPrimary} size={22} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={isLargeScreen ? styles.scrollContentLarge : styles.scrollContent}
        >
          <View style={isLargeScreen ? styles.largeScreenContainer : null}>
            {/* Left Column (or full width on mobile) */}
            <View style={isLargeScreen ? styles.leftColumn : {}}>
              {/* Hero Section */}
              <Animated.View 
            entering={FadeInDown.delay(100).duration(800)}
            style={styles.heroSection}
          >
             <View style={[styles.heroCard, { 
               backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
               borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' 
             }]}>
                <LinearGradient
                  colors={[`${primaryColor}15`, 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                
                <View style={styles.heroTopRow}>
                  <View style={[styles.typeBadge, { backgroundColor: `${primaryColor}20` }]}>
                    <Sparkles size={scale(12)} color={primaryColor} fill={primaryColor} style={{ marginRight: scale(6) }} />
                    <Text style={[styles.typeText, { color: primaryColor, fontSize: moderateScale(11) }]}>COURSE NAME</Text>
                  </View>
                  
                  <View style={[styles.floatingSubjectIcon, { backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }]}>
                    {(() => {
                      const IconComponent = typeof subject?.icon === 'function' 
                        ? subject.icon 
                        : getSubjectStyle(subject?.name || '').icon;
                      return <IconComponent color={primaryColor} size={scale(28)} />;
                    })()}
                  </View>
                </View>

                <Text 
                  style={[styles.lessonTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {topic.title}
                </Text>
                
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <View style={[styles.metaIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Clock size={14} color={theme.colors.textSecondary} />
                    </View>
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontSize: moderateScale(14) }]}>
                      {Math.floor(lessons.reduce((acc, l) => acc + (l.duration || 5), 0))} min
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <View style={[styles.metaIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Zap size={14} color={theme.colors.textSecondary} fill={theme.colors.textSecondary} />
                    </View>
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontSize: moderateScale(14) }]}>{lessonContent.xpReward} XP</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <View style={[styles.metaIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Target size={14} color={theme.colors.textSecondary} />
                    </View>
                    <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontSize: moderateScale(14) }]}>{lessonContent.difficulty}</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                   <View style={styles.progressHeader}>
                      <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                         {completedCount} of {totalCount} items completed
                       </Text>
                      <Text style={[styles.progressValue, { color: theme.colors.textPrimary, fontWeight: '900' }]}>{currentProgress}%</Text>
                   </View>
                   <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
                      <View 
                        style={[styles.progressBarFill, { 
                           width: `${currentProgress}%`, 
                           backgroundColor: primaryColor,
                        }]} 
                      />
                   </View>
                </View>
             </View>
          </Animated.View>

          {/* About Section */}
          <Animated.View 
            entering={FadeInDown.delay(200).duration(800)}
            style={styles.sectionHeader}
          >
             <Info size={18} color={primaryColor} />
             <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>About Course</Text>
          </Animated.View>
          
          <Animated.View 
            entering={FadeInDown.delay(250).duration(800)}
            style={[styles.descriptionCard, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)' 
            }]}
          >
            <Text style={[styles.descriptionText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, lineHeight: 22 }]}>
              {lessonContent.description}
            </Text>
          </Animated.View>
            </View>

            {/* Right Column (or full width on mobile) */}
            <View style={isLargeScreen ? [styles.rightColumnGlass, { 
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.6)',
                borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'
              }] : { marginTop: verticalScale(10) }}>
              {/* Curriculum Section */}
              <Animated.View 
            entering={FadeInDown.delay(300).duration(800)}
            style={styles.sectionHeader}
          >
             <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Course Curriculum</Text>
             <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' }}>{lessons.length} LESSONS</Text>
             </View>
          </Animated.View>

          {loading ? (
            <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 20 }} />
          ) : lessons.length === 0 ? (
             <View style={{ padding: 40, alignItems: 'center' }}>
               <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }}>No lessons added to this course yet.</Text>
             </View>
          ) : (
            <View style={styles.topicsList}>
                {lessons.map((lessonItem, index) => {
                  const actualTopicIndex = topicIndex ?? 0;
                  const hasAccess = checkLessonAccess(index, topic.id, subject?.id, actualTopicIndex); 
                  const isCompleted = isTopicCompleted(topic.id, lessonItem.id);
                  const isSeqLocked = hasAccess && index > 0 && !isTopicCompleted(topic.id, lessons[index-1].id);
                  const isLocked = !hasAccess || isSeqLocked;

                  const isFreeLesson = !isTrialExpired && actualTopicIndex < 2 && index < 2;
                  
                  let accessTypeLabel = null;
                  const hasActiveSub = subscriptions && subscriptions.length > 0;
                  if (hasActiveSub && hasAccess) {
                     const isAllAccess = subscriptions.some(s => !s.topic_id && !s.subject_id);
                     const isSubjectAccess = subscriptions.some(s => s.subject_id === subject?.id);
                     const isSpecificAccess = subscriptions.some(s => s.topic_id === topic.id);
                     
                     if (isAllAccess) accessTypeLabel = 'ALL ACCESS';
                     else if (isSubjectAccess || isSpecificAccess) accessTypeLabel = 'SUBSCRIBED';
                  }
                  
                  return (
                   <Animated.View 
                     key={lessonItem.id}
                     entering={FadeInDown.delay(350 + (index * 80)).duration(600)}
                   >
                     <TouchableOpacity 
                       activeOpacity={0.7}
                       onPress={() => {
                          if (!hasAccess) {
                             const hasAnySub = subscriptions && subscriptions.length > 0;
                             const lockAction = () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: topic.id, title: topic.title } }); };
                             if (hasAnySub) {
                                setLockConfig({
                                 type: 'subscription',
                                 title: 'Course Locked',
                                 message: 'This course is not part of your current plan. Upgrade your subscription to unlock all courses in this subject.',
                                 onAction: lockAction
                               });
                             } else {
                                setLockConfig({
                                 type: 'subscription',
                                 title: 'Premium Course',
                                 message: 'Purchase this course or upgrade to Premium to unlock all topics.',
                                 onAction: lockAction
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
                            navigation.navigate('LearningContent', { 
                              lesson: lessonItem, 
                              subject, 
                              topic,
                              subjectIndex,
                              topicIndex: actualTopicIndex
                            });
                          }
                       }}
                     >
                        <View style={[styles.topicCard, { 
                          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.8)',
                          borderColor: isCompleted ? `${primaryColor}40` : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)'), 
                          opacity: isLocked ? 0.6 : 1 
                        }]}>
                           <View style={[styles.topicNumber, { 
                             backgroundColor: isCompleted ? '#10B981' : (isLocked ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)') : `${primaryColor}15`),
                             borderColor: isCompleted ? '#10B981' : (isLocked ? 'transparent' : `${primaryColor}30`),
                             borderWidth: 1
                           }]}>
                              {isCompleted ? (
                                <CheckCircle size={scale(14)} color="#FFF" />
                              ) : isLocked ? (
                                <Lock size={scale(14)} color={theme.colors.textSecondary} />
                              ) : (
                                <Text style={[styles.topicNumberText, { color: primaryColor, fontSize: moderateScale(14) }]}>{index + 1}</Text>
                              )}
                           </View>
                           
                           <View style={styles.topicInfo}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                                <Text 
                                  style={[styles.topicName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                                  numberOfLines={2}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.8}
                                >
                                  {lessonItem.title}
                                </Text>
                                
                                {isFreeLesson ? (
                                  <View style={[styles.curriculumBadge, { backgroundColor: '#10B98115' }]}>
                                    <Text style={[styles.curriculumBadgeText, { color: '#10B981' }]}>FREE</Text>
                                  </View>
                                ) : accessTypeLabel ? (
                                  <View style={[styles.curriculumBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' }]}>
                                    <Crown size={10} color="#F59E0B" style={{ marginRight: 4 }} />
                                    <Text style={[styles.curriculumBadgeText, { color: '#F59E0B' }]}>{accessTypeLabel}</Text>
                                  </View>
                                ) : !hasAccess ? (
                                  <View style={[styles.curriculumBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
                                    <Lock size={10} color={theme.colors.textSecondary} style={{ marginRight: 4 }} />
                                    <Text style={[styles.curriculumBadgeText, { color: theme.colors.textSecondary }]}>PREMIUM</Text>
                                  </View>
                                ) : (
                                  <View style={[styles.curriculumBadge, { backgroundColor: `${primaryColor}15` }]}>
                                    <Crown size={10} color={primaryColor} style={{ marginRight: 4 }} />
                                    <Text style={[styles.curriculumBadgeText, { color: primaryColor }]}>PREMIUM</Text>
                                  </View>
                                )}
                              </View>

                               <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6), marginTop: verticalScale(4) }}>
                                  <Clock size={scale(12)} color={theme.colors.textSecondary} style={{ opacity: 0.6 }} />
                                  <Text style={[styles.topicSub, { color: theme.colors.textSecondary, fontSize: moderateScale(12) }]}>{lessonItem.duration || 5} min</Text>
                                  <View style={{ width: scale(3), height: scale(3), borderRadius: scale(1.5), backgroundColor: theme.colors.textSecondary, opacity: 0.3 }} />
                                  <Text style={[styles.topicSub, { color: theme.colors.textSecondary, fontSize: moderateScale(12) }]}>Lesson {index + 1}</Text>
                              </View>
                           </View>
                           
                           <View style={styles.topicActionContainer}>
                             {isCompleted ? (
                                <View style={[styles.completedIndicator, { backgroundColor: '#10B98120' }]}>
                                   <CheckCircle size={18} color="#10B981" />
                                </View>
                             ) : (
                                <ChevronRight size={18} color={isLocked ? theme.colors.textSecondary : theme.colors.textPrimary} style={{ opacity: isLocked ? 0.3 : 0.8 }} />
                             )}
                           </View>
                        </View>
                     </TouchableOpacity>
                   </Animated.View>
                  );
                })}

                {/* Course Mastery Test CTA */}
                <Animated.View 
                  entering={FadeInDown.delay(700).duration(800)}
                  style={[styles.courseTestCard, { shadowColor: primaryColor }]}
                >
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={handleStartCourseTest}
                  >
                    <LinearGradient
                      colors={[primaryColor, (primaryColor) + 'BB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.courseTestGradient}
                    >
                      <View style={styles.courseTestLeft}>
                        <View style={styles.testIconContainer}>
                          <Award color="#FFF" size={24} fill="rgba(255,255,255,0.4)" />
                        </View>
                        <View>
                          <Text style={styles.courseTestTitle}>Mastery Challenge</Text>
                          <Text style={styles.courseTestSubtitle}>Final proficiency test for this course</Text>
                        </View>
                      </View>
                      <View style={styles.testEnterIcon}>
                         <ChevronRight color="#FFF" size={20} />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
            </View>
          )}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Action Button */}
        {lessons.length > 0 && (
          <Animated.View 
            entering={FadeInRight.delay(900).duration(800)}
            style={styles.footer}
          >
             <TouchableOpacity 
               activeOpacity={0.9}
               style={[styles.startButton]}
               onPress={() => {
                 const firstUnfinished = lessons.find(l => !isTopicCompleted(topic.id, l.id)) || lessons[0];
                 const firstUnfinishedIndex = lessons.indexOf(firstUnfinished);
                 const actualTopicIndex = topicIndex ?? 0;
                 const hasAccess = checkLessonAccess(firstUnfinishedIndex, topic.id, subject?.id, actualTopicIndex);

                 if (!hasAccess) {
                    const hasAnySub = subscriptions && subscriptions.length > 0;
                    const lockAction = () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: topic.id, title: topic.title } }); };
                    if (hasAnySub) {
                       setLockConfig({
                        type: 'subscription',
                        title: 'Course Locked',
                        message: 'This course is not part of your current plan. Upgrade your subscription to unlock all courses in this subject.',
                        onAction: lockAction
                      });
                    } else {
                       setLockConfig({
                        type: 'subscription',
                        title: 'Premium Course',
                        message: 'Purchase this course or upgrade to Premium to unlock all topics.',
                        onAction: lockAction
                      });
                    }
                    setShowLockModal(true);
                 } else {
                   navigation.navigate('LearningContent', { 
                     lesson: firstUnfinished, 
                     subject, 
                     topic,
                     subjectIndex,
                     topicIndex: actualTopicIndex
                   });
                 }
               }}
             >
                <LinearGradient
                  colors={[primaryColor, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startGradient}
                >
                   <Play size={22} color="#FFF" fill="#FFF" />
                   <Text style={styles.startText}>CONTINUE JOURNEY</Text>
                   <View style={styles.startGlow} />
                </LinearGradient>
             </TouchableOpacity>
          </Animated.View>
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
  curriculumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(6),
  },
  curriculumBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    width: 250,
    width: scale(250),
    height: scale(250),
    borderRadius: scale(125),
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(6),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(14),
    borderWidth: 1,
    overflow: 'hidden',
  },
  backButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
  },
  scrollContentLarge: {
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(10),
  },
  largeScreenContainer: {
    flexDirection: 'row',
    gap: scale(20),
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    maxWidth: 400,
    position: Platform.OS === 'web' ? 'sticky' : 'relative',
    top: verticalScale(10),
    zIndex: 10,
  },
  rightColumnGlass: {
    flex: 1.5,
    borderRadius: scale(32),
    borderWidth: 1,
    padding: scale(20),
    marginTop: verticalScale(10),
    overflow: 'hidden',
  },
  heroSection: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(25),
    borderRadius: scale(32),
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  heroCard: {
    padding: scale(24),
    borderRadius: scale(32),
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  floatingSubjectIcon: {
    width: scale(54),
    height: scale(54),
    borderRadius: scale(18),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
  },
  typeText: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    letterSpacing: 1,
  },
  lessonTitle: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    lineHeight: moderateScale(34),
    marginBottom: verticalScale(20),
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: scale(12),
    marginBottom: verticalScale(25),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIconBg: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  metaText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  progressLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  progressValue: {
    fontSize: moderateScale(14),
  },
  progressBarBg: {
    height: verticalScale(10),
    borderRadius: scale(5),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: scale(5),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  descriptionCard: {
    padding: scale(20),
    borderRadius: scale(24),
    borderWidth: 1,
    marginBottom: verticalScale(15),
  },
  descriptionText: {
    fontSize: moderateScale(14),
  },
  countBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
  },
  topicsList: {
    gap: verticalScale(12),
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderRadius: scale(24),
    borderWidth: 1.5,
  },
  topicNumber: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  topicNumberText: {
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    lineHeight: moderateScale(20),
  },
  topicSub: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    opacity: 0.6,
  },
  topicActionContainer: {
    marginLeft: scale(10),
  },
  completedIndicator: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(8),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subscribedBadge: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  subscribedBadgeText: {
    color: '#F59E0B',
    fontSize: moderateScale(10),
    fontWeight: '900',
  },
  premiumBadge: {
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  premiumBadgeText: {
    color: 'rgba(128, 128, 128, 0.8)',
    fontSize: moderateScale(10),
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    bottom: verticalScale(Platform.OS === 'ios' ? 40 : 30),
    left: scale(20),
    right: scale(20),
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
    maxWidth: 400,
    borderRadius: scale(24),
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(12) },
    shadowOpacity: 0.3,
    shadowRadius: scale(15),
    elevation: 12,
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    borderRadius: scale(24),
    gap: scale(14),
  },
  startText: {
    color: '#FFF',
    fontSize: moderateScale(17),
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  startGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  courseTestCard: {
    marginTop: verticalScale(25),
    borderRadius: scale(24),
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.2,
    shadowRadius: scale(15),
  },
  courseTestGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(22),
  },
  courseTestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
  },
  testIconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(16),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTestTitle: {
    color: '#FFF',
    fontSize: moderateScale(20),
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  courseTestSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(13),
    fontWeight: '600',
    marginTop: verticalScale(2),
  },
  testEnterIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

