import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Animated,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Award, 
  Lock,
  ChevronRight,
  Info
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function LessonDetailScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { isTopicCompleted, isTopicLocked, getTopicScore } = useProgress();
  const { lesson: topic, subject } = route.params; // Rename 'lesson' param to 'topic' for clarity
  const primaryColor = topic.color || subject?.color || theme.colors.secondary;
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

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
        .order('id', { ascending: true }); // Assume 'id' order or add a separate 'order' column later

      if (error) throw error;
      setLessons(data || []);
    } catch (err) {
      console.error('Error fetching lessons:', err);
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
            style={[styles.backButton, { borderColor: theme.colors.glassBorder }]}
          >
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.backButtonBlur}>
              <ArrowLeft color={theme.colors.textPrimary} size={22} />
            </BlurView>
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
            {/* Hero Section */}
            <View style={[styles.heroSection, { shadowColor: primaryColor }]}>
               <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.heroCard, { borderColor: theme.colors.glassBorder }]}>
                  <View style={[styles.typeBadge, { backgroundColor: `${primaryColor}20` }]}>
                    <Text style={[styles.typeText, { color: primaryColor }]}>COURSE</Text>
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
                        <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Your Progress</Text>
                        <Text style={[styles.progressValue, { color: theme.colors.textPrimary }]}>{currentProgress}%</Text>
                     </View>
                     <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={[styles.progressBarFill, { width: `${currentProgress}%`, backgroundColor: primaryColor }]} />
                     </View>
                  </View>
               </BlurView>
            </View>

            {/* About Section */}
            <View style={styles.sectionHeader}>
               <Info size={18} color={theme.colors.secondary} />
               <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>About Course</Text>
            </View>
            
            <BlurView intensity={10} tint={isDark ? "dark" : "light"} style={[styles.descriptionCard, { borderColor: theme.colors.glassBorder }]}>
              <Text style={[styles.descriptionText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                {lessonContent.description}
              </Text>
            </BlurView>

            {/* Curriculum Section */}
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Curriculum</Text>
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
                   // Ensure backward compatibility or dynamic defaults
                   const isCompleted = isTopicCompleted(topic.id, lessonItem.id);
                   const isLocked = index > 0 && !isTopicCompleted(topic.id, lessons[index-1].id); // Simple sequential lock
                   
                   return (
                     <TouchableOpacity 
                       key={lessonItem.id} 
                       activeOpacity={isLocked ? 1 : 0.7}
                       disabled={isLocked}
                       onPress={() => navigation.navigate('LearningContent', { lesson: lessonItem, subject, topic })}
                     >
                        <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.topicCard, { borderColor: theme.colors.glassBorder, opacity: isLocked ? 0.6 : 1 }]}>
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
                              <Text style={[styles.topicName, { color: theme.colors.textPrimary }]}>{lessonItem.title}</Text>
                               <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={[styles.topicSub, { color: theme.colors.textSecondary }]}>Topic {index + 1}</Text>
                                  <Text style={[styles.topicSub, { color: theme.colors.textSecondary }]}>• {lessonItem.duration || 5} min</Text>
                                 {isLocked && <Text style={{ fontSize: 10, color: theme.colors.textSecondary, fontStyle: 'italic' }}>Locked</Text>}
                              </View>
                           </View>
                           {isCompleted ? (
                             <View style={{ alignItems: 'flex-end' }}>
                                <CheckCircle size={18} color="#10B981" />
                             </View>
                           ) : (
                             <ChevronRight size={18} color={isLocked ? theme.colors.textSecondary : theme.colors.textPrimary} opacity={isLocked ? 0.5 : 1} />
                           )}
                        </BlurView>
                     </TouchableOpacity>
                   );
                 })}
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
               style={[styles.startButton, { shadowColor: primaryColor }]}
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
});
