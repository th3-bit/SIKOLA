import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  Zap, 
  Brain, 
  Trophy, 
  Timer, 
  RotateCcw, 
  ChevronRight,
  Flame,
  Dumbbell,
  Search,
  BookOpen,
  Beaker,
  Calculator,
  Globe,
  TrendingUp,
  Briefcase,
  Code,
  Scale,
  Clock,
  Award,
  Lock,
  Crown
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import GlassHeader from '../components/GlassHeader';
import StreakCard from '../components/StreakCard';
import LockStatusModal from '../components/LockStatusModal';
import TrialBanner from '../components/TrialBanner';

import FreePassModal from '../components/FreePassModal';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSubjectStyle } from '../constants/SubjectConfig';
import { scale, verticalScale, moderateScale, width } from '../utils/Scaling';

const iconMap = {
  'Timer': Timer,
  'Brain': Brain,
  'RotateCcw': RotateCcw,
  'Trophy': Trophy,
  'Zap': Zap,
  'Flame': Flame,
  'Dumbbell': Dumbbell
};



export default function PracticeScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;
  const { 
    getTopicScore, 
    userStats, 
    sessions, 
    subjects: rawSubjects,
    subscriptions,
    checkAccess,
    checkTrialLimit,
    isTrialExpired,
    subscriptionInfo
  } = useProgress();

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
        <View style={isDesktop ? styles.desktopStatCardInner : { alignItems: 'center', width: '100%' }}>
          <View style={[{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }, isDesktop && { marginBottom: 0, marginRight: 15 }]}>
            <Icon color={color} size={24} />
          </View>
          <View style={isDesktop ? { justifyContent: 'center' } : { alignItems: 'center', width: '100%' }}>
            <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{label}</Text>
          </View>
        </View>
        <View style={[styles.liquidGlow, { backgroundColor: color, opacity: isDark ? 0.08 : 0.1 }]} />
      </View>
    </View>
  );

  // 1. Process subjects for the UI (Memoized)
  const subjects = React.useMemo(() => {
    return rawSubjects.map(subject => {
      const style = getSubjectStyle(subject.name);
      return {
        ...subject,
        icon: style.icon,
        color: subject.color || style.color,
        topics: (subject.topics || [])
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map((topic, tIdx) => ({ ...topic, originalIndex: tIdx }))
      };
    });
  }, [rawSubjects]);

  // Handle selected subject on load or when subjects list changes
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects]);
  
  // State
  const [selectedSubject, setSelectedSubject] = useState(null);
  const loading = false; // Never loading now!
  const [searchQuery, setSearchQuery] = useState('');

  const [showLockModal, setShowLockModal] = useState(false);
  const [lockConfig, setLockConfig] = useState({ type: 'subscription', title: '', message: '', onAction: null });
  const [showFreePassModal, setShowFreePassModal] = useState(false);
  const [pendingTest, setPendingTest] = useState(null);

  const filteredTopics = searchQuery.trim() !== '' 
    ? subjects.flatMap(sub => 
        sub.topics
          .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(topic => ({ ...topic, parentSubject: sub }))
      )
    : (selectedSubject 
        ? selectedSubject.topics.map(t => ({ ...t, parentSubject: selectedSubject }))
        : []);

  const handleStartComprehensiveTest = async (topic, subject) => {
    try {
      const isUnlocked = checkAccess(topic.id, subject.id, topic.originalIndex ?? 0); 
      const hasAnySub = subscriptions && subscriptions.length > 0;

      if (!isUnlocked) {
        if (hasAnySub) {
           setLockConfig({
             type: 'subscription',
             title: "Course Not Included",
             message: "This proficiency test is not included in your current plan. Upgrade to Full Access or purchase this specific course to unlock it.",
             onAction: () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: topic.id, title: topic.title } }); }
           });
        } else {
           setLockConfig({
             type: 'subscription',
             title: "Premium Feature",
             message: "Comprehensive tests are exclusive to Premium members. Please subscribe to unlock.",
             onAction: () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: topic.id, title: topic.title } }); }
           });
        }
        setShowLockModal(true);
        return;
      }

      // Check Trial Daily Limit only for free users
      if (!hasAnySub) {
         const canTakeTest = checkTrialLimit();
         if (!canTakeTest) {
            setLockConfig({
              type: 'limit',
              title: "Daily Limit Reached",
              message: "Trial users are limited to 1 comprehensive test per day. Please come back tomorrow or upgrade for unlimited attempts!",
              onAction: () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: topic.id, title: topic.title } }); }
            });
            setShowLockModal(true);
            return;
         }
      }

      // Always show the Confirmation Modal (StartTestModal/FreePassModal)
      setPendingTest({ topic, subject });
      setShowFreePassModal(true);
      
    } catch (err) {
      logger.error('Error in handleStartComprehensiveTest:', err);
    }
  };

  const launchTest = async (topic, subject, isFreePass) => {
      try {
        // 1. Fetch all lessons and their contents for this topic (Fetch ALL for test)
        const { data: lessonsData, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('topic_id', topic.id)
          .order('created_at', { ascending: true }); // Ensure order

        if (error) throw error;
        if (!lessonsData || lessonsData.length === 0) {
          setLockConfig({
            type: 'info',
            title: 'Coming Soon!',
            message: 'We are currently preparing proficiency questions for this topic. Check back soon for the full experience!',
            onAction: () => setShowLockModal(false),
            actionText: 'Got it'
          });
          setShowLockModal(true);
          return;
        }

      // Use ALL lessons because the Free Pass grants full access to this one test
      let accessibleLessons = lessonsData;
      
      let allQuestions = [];
      let lessonsWithQuestions = [];

      // 2. Extract questions from ACCESSIBLE lessons
      accessibleLessons.forEach(lesson => {
        try {
          const slides = typeof lesson.content === 'string' ? JSON.parse(lesson.content) : lesson.content;
          const quizSlides = slides?.filter(s => s.type === 'quiz') || [];
          
          if (quizSlides.length > 0) {
            lessonsWithQuestions.push({
              lessonId: lesson.id,
              questions: quizSlides.map(q => ({
                ...q,
                lesson_id: lesson.id,
                subject_name: subject.name
              }))
            });
          }
        } catch (parseErr) {
          logger.error(`PracticeScreen: Failed to parse content for lesson ${lesson.id}`, parseErr);
          // Skip corrupt lesson
        }
      });

      if (lessonsWithQuestions.length === 0) {
        setLockConfig({
          type: 'info',
          title: 'Content Update',
          message: 'The questions for this topic are currently being updated. Please try another course in the meantime.',
          onAction: () => setShowLockModal(false),
          actionText: 'Understood'
        });
        setShowLockModal(true);
        return;
      }

      // 3. Selection Logic (The User's New Rule: 5 per lesson, NO total max)
      let selectedQuestions = [];
      
      // Check if we have enough questions per lesson
      lessonsWithQuestions.forEach(lwq => {
        // Shuffle the questions for this lesson
        const shuffled = [...lwq.questions].sort(() => 0.5 - Math.random());
        
        // Take up to 5 questions (or all if less than 5)
        const questionsToTake = shuffled.slice(0, 5);
        
        selectedQuestions.push(...questionsToTake);
      });

      // Final Shuffle of the entire test so questions are mixed
      selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random());

      // 4. Navigate to Quiz screen with the combined questions
      navigation.navigate('Quiz', { 
        questions: selectedQuestions,
        topic: topic,
        subject: subject,
        isComprehensive: true,
        isFree: isFreePass || (subscriptions && subscriptions.length > 0), 
        isFreePass: isFreePass 
      });

    } catch (err) {
      logger.error('Error starting test:', err);
      setLockConfig({
        type: 'info',
        title: 'Connection Error',
        message: 'We encountered a problem loading the test questions. Please check your connection and try again.',
        onAction: () => setShowLockModal(false),
        actionText: 'Try Again'
      });
      setShowLockModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <GlassHeader showSearch={false} />
        
        <ScrollView 
          style={[styles.scrollView, isDesktop && { paddingRight: 100 }]}
          contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={isDesktop ? styles.desktopWrapper : styles.mobileWrapper}>
          <View>
          <TrialBanner />

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
          } : {}}>
            {/* Test Streak Section */}
            <View style={[styles.streakCardSection, isDesktop && { flex: 0.45, marginBottom: 0 }]}>
              <StreakCard />
            </View>

            {/* Stats Row */}
            <View style={[styles.statsRow, isDesktop && styles.desktopStatsRow]}>
              <StatCard icon={BookOpen} label="Lessons" value={userStats?.total_lessons_completed?.toString() || "0"} color="#22C55E" />
              <StatCard icon={Award} label="Points" value={userStats?.total_xp?.toString() || "0"} color="#FACC15" />
              <StatCard icon={Clock} label="Hours" value={Math.floor((sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0) / 60).toString()} color="#3B82F6" />
            </View>
          </View>
          </View>



          {/* Main Desktop Grid */}
          <View style={isDesktop ? styles.desktopGrid : {}}>
            
            {/* Left Sidebar Menu (Option 3: Subject Navigation) */}
            {isDesktop && (
              <View style={styles.desktopSidebar}>
                <View style={[styles.sidebarSticky, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.25)',
                  borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.70)',
                  borderWidth: 1.5,
                  borderRadius: 24,
                  padding: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.04,
                  shadowRadius: 24,
                  ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {}),
                }]}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginBottom: 15 }]}>
                    Search Tests
                  </Text>
                  
                  {/* Search Bar Desktop */}
                  <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', borderColor: 'transparent' }]}>
                      <Search size={scale(20)} color={theme.colors.textSecondary} style={{ marginRight: scale(10) }} />
                      <TextInput
                        placeholder="Search courses..."
                        placeholderTextColor={theme.colors.textSecondary}
                        style={[styles.searchInput, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchCancelButton} activeOpacity={0.8}>
                          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 }}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                  </View>

                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginBottom: 20, marginTop: 10 }]}>
                    Courses
                  </Text>
                  <ScrollView 
                    style={{ maxHeight: windowHeight * 0.6 }} 
                    contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {subjects.map((sub) => (
                      <TouchableOpacity 
                        key={sub.id} 
                        onPress={() => setSelectedSubject(sub)}
                        style={[
                          styles.sidebarSubjectChip,
                          { 
                            backgroundColor: selectedSubject?.id === sub.id ? `${sub.color}15` : 'transparent',
                            borderColor: selectedSubject?.id === sub.id ? sub.color : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
                          }
                        ]}
                      >
                        <sub.icon size={18} color={selectedSubject?.id === sub.id ? sub.color : theme.colors.textSecondary} style={{ marginRight: 12 }} />
                        <Text style={[
                          styles.subjectChipText, 
                          { color: selectedSubject?.id === sub.id ? sub.color : theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }
                        ]}>
                          {sub.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Right Main Content */}
            <View style={isDesktop ? styles.desktopMainContent : { flex: 1 }}>

          {/* Sticky Header Section Mobile */}
          {!isDesktop && (
            <View
              collapsable={false}
              style={[
                styles.stickyHeaderContainer, 
                { 
                  backgroundColor: 'transparent',
                  borderBottomColor: 'transparent'
                }
              ]}>
            {/* Content Browser Section */}
            <View style={[styles.sectionHeader]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Select Course for Test</Text>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', borderColor: 'transparent' }]}>
                <Search size={scale(20)} color={theme.colors.textSecondary} style={{ marginRight: scale(10) }} />
                <TextInput
                placeholder="Search courses..."
                placeholderTextColor={theme.colors.textSecondary}
                style={[styles.searchInput, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery('')}
                    style={styles.searchCancelButton}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 }}>Cancel</Text>
                  </TouchableOpacity>
                )}
            </View>

            {/* Subject Selector */}
            <View style={isDesktop && { alignItems: 'center' }}>
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={[styles.subjectsContainer, isDesktop && styles.desktopSubjectsContainer]}
                style={[styles.subjectsScrollView, isDesktop && { width: '100%', maxWidth: 840 }]}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="always"
            >
                {subjects.map((sub) => (
                <TouchableOpacity
                    key={sub.id}
                    onPress={() => setSelectedSubject(sub)}
                    style={[
                    styles.subjectChip,
                    selectedSubject?.id === sub.id && { 
                        backgroundColor: sub.color,
                        borderColor: sub.color,
                        shadowColor: sub.color,
                        shadowOpacity: 0.5,
                        elevation: 5
                    },
                    { borderColor: theme.colors.glassBorder }
                    ]}
                >
                    <sub.icon 
                    size={scale(16)} 
                    color={selectedSubject?.id === sub.id ? '#FFF' : sub.color} 
                    style={{ marginRight: scale(6) }}
                    />
                    <Text style={[
                    styles.subjectChipText,
                    { color: selectedSubject?.id === sub.id ? '#FFF' : theme.colors.textSecondary,
                        fontFamily: theme.typography.fontFamily }
                    ]}>
                    {sub.name.length > 15 ? sub.name.substring(0, 15) + '...' : sub.name}
                    </Text>
                </TouchableOpacity>
                ))}
            </ScrollView>
            </View>
            </View>
          )}

          {/* Topics List */}
          <View style={[
            styles.revisionList,
            isDesktop && {
              maxWidth: 800,
              width: '100%',
              alignSelf: 'center',
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.25)',
              borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.70)',
              borderWidth: 1.5,
              borderRadius: 24,
              padding: 24,
              marginTop: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.04,
              shadowRadius: 24,
              ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {}),
            }
          ]}>
            {loading ? (
              <ActivityIndicator color={theme.colors.secondary} />
            ) : filteredTopics.length > 0 ? (
              filteredTopics.map((topic, index) => {
                const hasAnySub = subscriptions && subscriptions.length > 0;
                const topicIndex = topic.originalIndex ?? index;
                const isFree = topicIndex < 2 && !hasAnySub && !isTrialExpired; 
                const isUnlocked = checkAccess(topic.id, topic.parentSubject?.id, topicIndex);
                const isLocked = !isUnlocked;
                const isFirst = index === 0;
                const isLast = index === filteredTopics.length - 1;
                const subjectColor = topic.parentSubject?.color || '#3B82F6';

                return (
                  <View key={topic.id} style={styles.timelineRow}>
                    {/* Left Timeline Column */}
                    <View style={styles.timelineColumn}>
                      {!isLast && <View style={[styles.timelineLine, { backgroundColor: subjectColor }]} />}
                      <View style={styles.timelineCircleWrapper}>
                        {/* Halo Ring (Semi-transparent) */}
                        <View style={[styles.timelineCircleOuter, { backgroundColor: subjectColor, opacity: 0.15 }]} />
                        {/* Inner Circle (Solid) */}
                        <View style={[styles.timelineCircle, { backgroundColor: subjectColor }]}>
                          <Text style={styles.timelineNumber}>{index + 1}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Right Card Column */}
                    <TouchableOpacity 
                      onPress={() => handleStartComprehensiveTest(topic, topic.parentSubject)}
                      style={[styles.newTopicCardWrapper]}
                      activeOpacity={0.7}
                    >
                        <View 
                            style={[
                                styles.newTopicCard, 
                                { 
                                    backgroundColor: isDark ? 'rgba(25, 25, 25, 0.9)' : '#FFFFFF',
                                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    opacity: isLocked ? 0.8 : 1
                                }
                            ]}
                        >
                          {/* Absolute Status Badge */}
                          {isFree ? (
                            <View style={[styles.statusBadge, styles.statusBadgeAbsolute, { backgroundColor: '#10B98115' }]}>
                              <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>FREE</Text>
                            </View>
                          ) : (
                            <View style={[styles.statusBadge, styles.statusBadgeAbsolute, { backgroundColor: `${subjectColor}15`, borderColor: `${subjectColor}30`, borderWidth: 0.5 }]}>
                              {isUnlocked ? (
                                <Crown size={moderateScale(10)} color={subjectColor} style={{ marginRight: scale(4) }} />
                              ) : (
                                <Lock size={moderateScale(10)} color={subjectColor} style={{ marginRight: scale(4) }} />
                              )}
                              <Text style={[styles.statusBadgeText, { color: subjectColor }]}>PREMIUM</Text>
                            </View>
                          )}

                          <View style={styles.topicMain}>
                            <Text numberOfLines={2} style={[styles.newTopicName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginBottom: verticalScale(4) }]}>
                              {topic.title}
                            </Text>
                            <View style={styles.newTopicSubRow}>
                              <Clock size={moderateScale(12)} color={theme.colors.textSecondary} style={{ marginRight: scale(4) }} />
                              <Text style={[styles.newTopicSub, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                                {(topic.parentSubject?.name?.length > 15 ? topic.parentSubject.name.substring(0, 15) + '...' : topic.parentSubject?.name)} • Proficiency 
                              </Text>
                              <Text style={[styles.newScoreText, { color: subjectColor }]}>
                                 {getTopicScore(topic.parentSubject?.id, topic.id)}% SCORE
                              </Text>
                            </View>
                          </View>
                          
                          <View style={[styles.newCardAction, { alignItems: 'flex-end', justifyContent: 'center' }]}>
                            <ChevronRight size={moderateScale(20)} color={theme.colors.textSecondary} />
                          </View>
                        </View>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginTop: verticalScale(20) }}>
                {subjects.length === 0 ? "Loading content..." : "No topics found matching your search."}
              </Text>
            )}
          </View>

          <View style={{ height: verticalScale(140) }} />

            </View>
          </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <LockStatusModal 
        visible={showLockModal}
        onClose={() => setShowLockModal(false)}
        type={lockConfig.type}
        title={lockConfig.title}
        message={lockConfig.message}
        onAction={lockConfig.onAction}
      />

      <FreePassModal 
        visible={showFreePassModal}
        isPremium={subscriptions && subscriptions.length > 0}
        onClose={() => {
            setShowFreePassModal(false);
            setPendingTest(null);
        }}
        onStart={() => {
            setShowFreePassModal(false);
            if (pendingTest) {
                const hasAnySub = subscriptions && subscriptions.length > 0;
                // If they are free, this counts as using their daily pass
                launchTest(pendingTest.topic, pendingTest.subject, !hasAnySub);
            }
        }}
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
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
  },
  desktopScrollContent: {
    alignItems: 'center',
    maxWidth: 1500,
    width: '100%',
    paddingHorizontal: 40,
    alignSelf: 'center',
  },
  desktopWrapper: {
    width: '100%',
  },
  mobileWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 1,
  },
  streakCardSection: {
    marginBottom: verticalScale(15),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
  },
  modeGrid: {
    gap: scale(15),
    marginBottom: verticalScale(30),
  },
  modeCardWrapper: {
    borderRadius: scale(20),
    overflow: 'visible',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderRadius: scale(20),
    borderWidth: 1,
    overflow: 'hidden',
  },
  modeIconContainer: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeInfo: {
    flex: 1,
    marginLeft: scale(15),
  },
  modeTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  modeDesc: {
    fontSize: moderateScale(13),
    opacity: 0.7,
  },
  modeXp: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: scale(8),
  },
  modeXpText: {
    fontSize: moderateScale(12),
    fontWeight: '900',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(15),
    height: verticalScale(50),
    borderRadius: scale(16),
    borderWidth: 1,
    marginBottom: verticalScale(20),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
  },
  searchCancelButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(7),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectsContainer: {
    paddingLeft: scale(20),
    paddingRight: scale(20),
    paddingBottom: verticalScale(20),
    gap: scale(12),
  },
  subjectsScrollView: {
    marginHorizontal: -scale(20),
  },
  desktopSubjectsContainer: {
    paddingHorizontal: 0,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(14),
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  subjectChipText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  revisionList: {
    gap: 0, // spacing handled by timelineRow
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: verticalScale(100),
  },
  timelineColumn: {
    width: scale(60),
    alignItems: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: verticalScale(30),
    bottom: -verticalScale(70),
    width: scale(2),
    backgroundColor: '#3B82F6',
  },
  timelineCircleWrapper: {
    width: scale(48),
    height: scale(48),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(6),
    zIndex: 2,
  },
  timelineCircleOuter: {
    position: 'absolute',
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
  },
  timelineCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineNumber: {
    color: '#FFF',
    fontSize: moderateScale(14),
    fontWeight: '800',
  },
  newTopicCardWrapper: {
    flex: 1,
    paddingBottom: verticalScale(20),
    paddingLeft: scale(5),
  },
  newTopicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(20),
    borderRadius: scale(24),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  newTopicName: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    marginBottom: verticalScale(6),
    lineHeight: moderateScale(22),
  },
  newTopicSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  newTopicSub: {
    fontSize: moderateScale(13),
    opacity: 0.7,
  },
  newScoreText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    marginLeft: scale(4),
  },
  topicMain: {
    flex: 1,
    flexShrink: 1,
  },
  newCardAction: {
    marginLeft: scale(10),
    flexShrink: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(30),
  },
  desktopStatsRow: {
    flex: 0.55,
    justifyContent: 'space-around',
    gap: scale(15),
    marginBottom: 0,
  },
  desktopGrid: {
    flexDirection: 'row',
    gap: 40,
    alignItems: 'stretch',
    marginTop: 20,
  },
  desktopSidebar: {
    width: 360,
    flexShrink: 0,
  },
  sidebarSticky: {
    ...(Platform.OS === 'web' ? { position: 'sticky', top: 30 } : {}),
  },
  sidebarSubjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  desktopMainContent: {
    flex: 1,
    minWidth: 0,
  },
  statCardWrapper: {
    flex: 1,
    height: verticalScale(110),
    borderRadius: scale(24),
    overflow: 'visible',
  },
  desktopStatCardWrapper: {
    height: 'auto',
  },
  statCard: {
    flex: 1,
    paddingVertical: verticalScale(15),
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: scale(10),
    borderRadius: scale(24),
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
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontSize: moderateScale(20),
    fontWeight: '800',
  },
  statLabel: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
    fontWeight: '600',
    opacity: 0.8,
  },
  liquidGlow: {
    position: 'absolute',
    bottom: -verticalScale(20),
    right: -scale(20),
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(6),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: verticalScale(8),
    right: scale(8),
    zIndex: 10,
  },
  stickyHeaderContainer: {
    paddingTop: verticalScale(10),
    paddingHorizontal: scale(20),
    marginHorizontal: -scale(20),
    zIndex: 10,
    marginBottom: verticalScale(10),
    borderBottomWidth: scale(1),
  },
});
