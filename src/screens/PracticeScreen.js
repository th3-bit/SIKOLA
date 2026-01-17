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
  Award
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import GlassHeader from '../components/GlassHeader';
import { supabase } from '../lib/supabase';
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
  const { getTopicScore, userStats, weeklyActivity, sessions } = useProgress();

  const StatCard = ({ icon: Icon, label, value, color = theme.colors.secondary, shadowColor = color }) => (
    <View style={[styles.statCardWrapper, { shadowColor: shadowColor }]}>
      <BlurView intensity={isDark ? 20 : 30} tint={isDark ? "dark" : "light"} style={[styles.statCard, { borderColor: theme.colors.glassBorder }]}>
        <LinearGradient
          colors={isDark 
            ? [`${color}30`, `${color}10`, 'transparent'] 
            : [`${color}20`, `${color}10`, `${color}05`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.statIconContainer, { backgroundColor: `${color}${isDark ? '20' : '30'}` }]}>
          <Icon color={color} size={18} />
        </View>
        <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{label}</Text>
        <View style={[styles.liquidGlow, { backgroundColor: color, opacity: isDark ? 0.15 : 0.2 }]} />
      </BlurView>
    </View>
  );

  const StreakCard = () => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = dayLabels.map((label, index) => ({
      label,
      active: weeklyActivity[index] || false
    }));
    
    const streak = userStats?.current_streak || 0;

    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.streakCardWrapper}>
        <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[styles.streakCard, { borderColor: theme.colors.glassBorder }]}>
          <LinearGradient
            colors={isDark ? ['rgba(255, 69, 58, 0.15)', 'transparent'] : ['rgba(255, 69, 58, 0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.streakContent}>
            <View style={styles.streakInfo}>
              <View style={styles.streakIconCircle}>
                <Flame color="#FF453A" size={32} fill="#FF453A" />
              </View>
              <View style={styles.streakTextContainer}>
                <Text style={[styles.streakTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Test Streak: {streak} Days</Text>
                <Text style={[styles.streakSub, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{streak < 7 ? `Practice daily to reach 7 days!` : 'You are on fire! Keep it up!'}</Text>
              </View>
            </View>
            <View style={styles.streakBadge}>
              <Zap color="#FF453A" size={16} fill="#FF453A" />
              <Text style={[styles.streakValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>ACTIVE</Text>
            </View>
          </View>
          
          {/* Progress Days Chips */}
          <View style={styles.streakDaysContainer}>
            {days.map((day, index) => (
              <View 
                key={index} 
                style={[
                  styles.dayChip,
                  { 
                    backgroundColor: day.active ? "#FF453A" : (isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                    borderColor: day.active ? "#FF453A" : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  }
                ]}
              >
                <Zap 
                  size={14} 
                  color={day.active ? "#FFFFFF" : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')} 
                  fill={day.active ? "#FFFFFF" : (isDark ? 'rgba(255,255,255,0.1)' : 'transparent')} 
                />
                <Text style={[
                  styles.dayChipText, 
                  { 
                    color: day.active ? "#FFFFFF" : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)'),
                    fontFamily: theme.typography.fontFamily 
                  }
                ]}>
                  {day.label[0]}
                </Text>
              </View>
            ))}
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };
  
  // State
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
            subject_id
          )
        `)
        .order('name');

      if (!error && subjectsData) {
        const formattedSubjects = subjectsData.map(subject => {
          const style = getSubjectStyle(subject.name);
          return {
            ...subject,
            icon: style.icon,
            color: style.color,
            topics: (subject.topics || []).sort((a, b) => a.title.localeCompare(b.title))
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
      // 1. Fetch all lessons and their contents for this topic
      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('topic_id', topic.id);

      if (error) throw error;
      if (!lessonsData || lessonsData.length === 0) {
        alert('No questions available for this topic yet.');
        return;
      }

      let allQuestions = [];
      let lessonsWithQuestions = [];

      // 2. Extract questions from each lesson
      lessonsData.forEach(lesson => {
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
      });

      if (lessonsWithQuestions.length === 0) {
        alert('No questions found in the lessons of this topic.');
        return;
      }

      // 3. Selection Logic (The User's Rule: 2 per lesson, total max 20)
      let selectedQuestions = [];
      
      // Step A: Pick 2 questions from every lesson that has questions
      lessonsWithQuestions.forEach(lwq => {
        const shuffled = [...lwq.questions].sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffled.slice(0, 2));
      });

      // Step B: If we need more to reach 20, fill from the remaining pool
      if (selectedQuestions.length < 20) {
        let remainingPool = [];
        lessonsWithQuestions.forEach(lwq => {
          // Add questions not already selected
          const notTaken = lwq.questions.filter(q => !selectedQuestions.includes(q));
          remainingPool.push(...notTaken);
        });

        // Shuffle and fill up to 20
        const extraNeeded = 20 - selectedQuestions.length;
        const shuffledPool = remainingPool.sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffledPool.slice(0, extraNeeded));
      } else if (selectedQuestions.length > 20) {
        // Technically this might happen if there are more than 10 lessons.
        // We trim to 20
        selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, 20);
      }

      // 4. Navigate to Quiz screen with the combined questions
      navigation.navigate('Quiz', { 
        questions: selectedQuestions,
        topic: topic,
        subject: subject,
        isComprehensive: true
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Select Course for Test</Text>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.colors.glassBorder }]}>
            <Search size={20} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Search courses..."
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
              filteredTopics.map((topic) => (
                <TouchableOpacity 
                  key={topic.id} 
                  onPress={() => handleStartComprehensiveTest(topic, topic.parentSubject)}
                  style={[styles.topicRowWrapper, { shadowColor: topic.parentSubject?.color }]}
                >
                  <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.topicRow, { borderColor: theme.colors.glassBorder }]}>
                    <View style={styles.topicMain}>
                      <Text style={[styles.topicName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                        {topic.title}
                      </Text>
                      <Text style={[styles.topicSub, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                        {topic.parentSubject?.name} • Start Proficiency Test
                      </Text>
                    </View>
                    <View style={styles.scoreInfo}>
                      <Text style={[styles.scorePercent, { color: topic.parentSubject?.color || theme.colors.secondary }]}>
                        {getTopicScore(topic.parentSubject?.id, topic.id)}%
                      </Text>
                      <Zap size={18} color={topic.parentSubject?.color || theme.colors.secondary} />
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginTop: 20 }}>
                {subjects.length === 0 ? "Loading content..." : "No courses found matching your search."}
              </Text>
            )}
          </View>

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
  streakCardSection: {
    marginBottom: 25,
  },
  streakCardWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  streakCard: {
    flex: 1,
    padding: 20,
    borderWidth: 1,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  streakTextContainer: {
    justifyContent: 'center',
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  streakSub: {
    fontSize: 12,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    alignItems: 'center',
    marginTop: 5,
  },
  dayChip: {
    width: (width - 80) / 7,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '800',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
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
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
});
