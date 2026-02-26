import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  TextInput,
  ActivityIndicator
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
  Lock
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

const { width } = Dimensions.get('window');

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
  const { 
    getTopicScore, 
    userStats, 
    weeklyActivity, 
    sessions, 
    subscriptions,
    checkAccess,
    checkTrialLimit,
    isTrialExpired 
  } = useProgress();

  const StatCard = ({ icon: Icon, label, value, color = theme.colors.secondary, shadowColor = color }) => (
    <View style={[styles.statCardWrapper, { shadowColor: shadowColor }]}>
      <View style={[
        styles.statCard, 
        { 
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
        }
      ]}>
        <View style={styles.statIconContainer}>
          <Icon color={color} size={24} />
        </View>
        <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{label}</Text>
        <View style={[styles.liquidGlow, { backgroundColor: color, opacity: isDark ? 0.08 : 0.1 }]} />
      </View>
    </View>
  );
  
  // State
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showLockModal, setShowLockModal] = useState(false);
  const [lockConfig, setLockConfig] = useState({ type: 'subscription', title: '', message: '', onAction: null });
  const [showFreePassModal, setShowFreePassModal] = useState(false);
  const [pendingTest, setPendingTest] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      // Fetch subjects and their topics
      const { data: subjectsData, error } = await supabase
        .from('subjects')
        .select(`
          *,
          topics (
            id,
            title,
            subject_id,
            created_at
          )
        `)
        .order('name');

      if (!error && subjectsData) {
        const formattedSubjects = subjectsData.map(subject => {
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
        
        setSubjects(formattedSubjects);
        if (formattedSubjects.length > 0) {
          setSelectedSubject(formattedSubjects[0]);
        }
      }
    } catch (error) {
      console.log('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      setLoading(true);
      
      const isUnlocked = checkAccess(topic.id, subject.id, topic.originalIndex ?? 0); 
      const hasAnySub = subscriptions && subscriptions.length > 0;

      if (!isUnlocked) {
        if (hasAnySub) {
           setLockConfig({
             type: 'subscription',
             title: "Course Not Included",
             message: "This proficiency test is not included in your current plan. Upgrade to Full Access or purchase this specific course to unlock it.",
             onAction: () => { setShowLockModal(false); navigation.navigate('Subscription'); }
           });
        } else {
           setLockConfig({
             type: 'subscription',
             title: "Premium Feature",
             message: "Comprehensive tests are exclusive to Premium members. Please subscribe to unlock.",
             onAction: () => { setShowLockModal(false); navigation.navigate('Subscription'); }
           });
        }
        setShowLockModal(true);
        setLoading(false);
        return;
      }

       // Check Trial Daily Limit
      if (!hasAnySub) {
         const canTakeTest = checkTrialLimit();
         if (!canTakeTest) {
            setLockConfig({
              type: 'limit',
              title: "Daily Limit Reached",
              message: "Trial users are limited to 1 comprehensive test per day. Please come back tomorrow or upgrade for unlimited attempts!",
              onAction: () => { setShowLockModal(false); navigation.navigate('Subscription'); }
            });
            setShowLockModal(true);
            setLoading(false);
            return;
         } else {
            // Show Free Pass Modal for confirmation (now serves as Daily Pass)
            setPendingTest({ topic, subject });
            setShowFreePassModal(true);
            setLoading(false);
            return;
         }
      }

      // If subscribed, go straight to launch
      launchTest(topic, subject, false);
      
    } catch (err) {
      console.error('Error in handleStartComprehensiveTest:', err);
      setLoading(false);
    }
  };

  const launchTest = async (topic, subject, isFreePass) => {
      try {
        setLoading(true);

      // 1. Fetch all lessons and their contents for this topic (Fetch ALL for test)
      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('topic_id', topic.id)
        .order('created_at', { ascending: true }); // Ensure order

      if (error) throw error;
      if (!lessonsData || lessonsData.length === 0) {
        alert('No questions available for this topic yet.');
        setLoading(false);
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
          console.error(`PracticeScreen: Failed to parse content for lesson ${lesson.id}`, parseErr);
          // Skip corrupt lesson
        }
      });

      if (lessonsWithQuestions.length === 0) {
        alert('No questions found in the accessible lessons of this topic.');
        setLoading(false);
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
      console.error('Error starting test:', err);
      alert('Failed to load test questions.');
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
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TrialBanner />

          {/* Test Streak Section */}
          <View style={styles.streakCardSection}>
            <StreakCard />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard icon={BookOpen} label="Lessons" value={userStats?.total_lessons_completed?.toString() || "0"} color="#22C55E" />
            <StatCard icon={Award} label="Points" value={userStats?.total_xp?.toString() || "0"} color="#FACC15" />
            <StatCard icon={Clock} label="Hours" value={Math.floor((sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0) / 60).toString()} color="#3B82F6" />
          </View>

          {/* Content Browser Section */}
          <View style={[styles.sectionHeader]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Select Topic for Test</Text>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.colors.glassBorder }]}>
            <Search size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search topics..."
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.searchInput, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Subject Selector */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.subjectsContainer}
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
                  size={16} 
                  color={selectedSubject?.id === sub.id ? '#FFF' : sub.color} 
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  styles.subjectChipText,
                  { color: selectedSubject?.id === sub.id ? '#FFF' : theme.colors.textSecondary,
                    fontFamily: theme.typography.fontFamily }
                ]}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Topics List */}
          <View style={styles.revisionList}>
            {loading ? (
              <ActivityIndicator color={theme.colors.secondary} />
            ) : filteredTopics.length > 0 ? (
              filteredTopics.map((topic, index) => {
                const hasAnySub = subscriptions && subscriptions.length > 0;
                // FIX: Use originalIndex instead of current map index to prevent search-based bypass
                const topicIndex = topic.originalIndex ?? index;
                const isFree = topicIndex < 2 && !hasAnySub && !isTrialExpired; 
                const isUnlocked = checkAccess(topic.id, topic.parentSubject?.id, topicIndex);
                const isLocked = !isUnlocked;

                return (
                  <TouchableOpacity 
                    key={topic.id} 
                    onPress={() => handleStartComprehensiveTest(topic, topic.parentSubject)}
                    style={[styles.topicRowWrapper, { shadowColor: topic.parentSubject?.color }]}
                    activeOpacity={0.7}
                  >
                    <BlurView 
                        intensity={15} 
                        tint={isDark ? "dark" : "light"} 
                        style={[
                            styles.topicRow, 
                            { 
                                borderColor: theme.colors.glassBorder,
                                opacity: isLocked ? 0.6 : 1
                            }
                        ]}
                    >
                      <View style={styles.topicMain}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Text style={[styles.topicName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginRight: 8 }]}>
                            {topic.title}
                          </Text>
                          {isFree && (
                            <View style={[styles.freeBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                              <Text style={styles.freeBadgeText}>FREE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.topicSub, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                          {topic.parentSubject?.name} • Start Proficiency Test
                        </Text>
                      </View>
                      <View style={styles.scoreInfo}>
                        <Text style={[styles.scorePercent, { color: isLocked ? theme.colors.textSecondary : (topic.parentSubject?.color || theme.colors.secondary), opacity: isLocked ? 0.5 : 1 }]}>
                          {getTopicScore(topic.parentSubject?.id, topic.id)}%
                        </Text>
                        {isLocked ? (
                          <Lock size={18} color={theme.colors.textSecondary} opacity={0.5} />
                        ) : (
                          <Zap size={18} color={topic.parentSubject?.color || theme.colors.secondary} />
                        )}
                      </View>
                    </BlurView>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginTop: 20 }}>
                {subjects.length === 0 ? "Loading content..." : "No topics found matching your search."}
              </Text>
            )}
          </View>

          <View style={{ height: 120 }} />
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
        onClose={() => {
            setShowFreePassModal(false);
            setPendingTest(null);
        }}
        onStart={() => {
            setShowFreePassModal(false);
            if (pendingTest) {
                launchTest(pendingTest.topic, pendingTest.subject, true);
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
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  streakCardSection: {
    marginBottom: 25,
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
  modeGrid: {
    gap: 15,
    marginBottom: 30,
  },
  modeCardWrapper: {
    borderRadius: 20,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  modeTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  modeDesc: {
    fontSize: 13,
    opacity: 0.7,
  },
  modeXp: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  modeXpText: {
    fontSize: 12,
    fontWeight: '900',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  subjectsContainer: {
    paddingBottom: 15,
    gap: 10,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  revisionList: {
    gap: 12,
  },
  topicRowWrapper: {
    borderRadius: 18,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 15,
  },
  topicMain: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  topicSub: {
    fontSize: 12,
    opacity: 0.6,
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scorePercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCardWrapper: {
    width: (width - 60) / 3,
    height: 110,
    borderRadius: 24,
    overflow: 'visible',
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
  freeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  freeBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
