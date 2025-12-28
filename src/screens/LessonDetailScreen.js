import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Animated 
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

const { width, height } = Dimensions.get('window');

export default function LessonDetailScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { lesson, subject } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const lessonContent = {
    description: `Master the fundamentals of ${lesson.name || 'this subject'} with this comprehensive lesson. Learn key concepts, practice with examples, and test your knowledge.`,
    topics: [
      { id: 1, title: 'Introduction & Basics', duration: '5m', isCompleted: true },
      { id: 2, title: 'Core Mechanics', duration: '12m', isCompleted: false },
      { id: 3, title: 'Real-world Application', duration: '15m', isCompleted: false },
      { id: 4, title: 'Advanced Strategies', duration: '10m', isCompleted: false },
    ],
    difficulty: 'Intermediate',
    xpReward: 150,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      {/* Liquid Glows */}
      <View style={[styles.glow, { top: -100, left: -50, backgroundColor: lesson.color, opacity: 0.15 }]} />
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
            <View style={[styles.heroSection, { shadowColor: lesson.color }]}>
               <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.heroCard, { borderColor: theme.colors.glassBorder }]}>
                  <View style={[styles.typeBadge, { backgroundColor: `${lesson.color}20` }]}>
                    <Text style={[styles.typeText, { color: lesson.color }]}>MASTERCLASS</Text>
                  </View>
                  <Text style={[styles.lessonTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {lesson.title}
                  </Text>
                  
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Clock size={16} color={theme.colors.textSecondary} />
                      <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>42 min</Text>
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
                        <Text style={[styles.progressValue, { color: theme.colors.textPrimary }]}>{lesson.progress || 0}%</Text>
                     </View>
                     <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={[styles.progressBarFill, { width: `${lesson.progress || 0}%`, backgroundColor: lesson.color }]} />
                     </View>
                  </View>
               </BlurView>
            </View>

            {/* About Section */}
            <View style={styles.sectionHeader}>
               <Info size={18} color={theme.colors.secondary} />
               <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>About Lesson</Text>
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
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{lessonContent.topics.length} steps</Text>
               </View>
            </View>

            <View style={styles.topicsList}>
               {lessonContent.topics.map((topic, index) => (
                 <TouchableOpacity key={topic.id} activeOpacity={0.7}>
                    <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.topicCard, { borderColor: theme.colors.glassBorder }]}>
                       <View style={[styles.topicNumber, { backgroundColor: topic.isCompleted ? '#10B981' : `${lesson.color}20` }]}>
                          {topic.isCompleted ? (
                            <CheckCircle size={14} color="#FFF" />
                          ) : (
                            <Text style={[styles.topicNumberText, { color: lesson.color }]}>{index + 1}</Text>
                          )}
                       </View>
                       <View style={styles.topicInfo}>
                          <Text style={[styles.topicName, { color: theme.colors.textPrimary }]}>{topic.title}</Text>
                          <Text style={[styles.topicSub, { color: theme.colors.textSecondary }]}>{topic.duration}</Text>
                       </View>
                       {topic.isCompleted ? (
                         <Text style={styles.completedTag}>Done</Text>
                       ) : (
                         <ChevronRight size={18} color={theme.colors.textSecondary} />
                       )}
                    </BlurView>
                 </TouchableOpacity>
               ))}
            </View>
          </Animated.View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Action Button */}
        <View style={styles.footer}>
           <TouchableOpacity 
             activeOpacity={0.9}
             style={[styles.startButton, { shadowColor: lesson.color }]}
             onPress={() => navigation.navigate('LessonOverview', { lesson, subject })}
           >
              <LinearGradient
                colors={[lesson.color, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startGradient}
              >
                 <Play size={20} color="#FFF" fill="#FFF" />
                 <Text style={styles.startText}>START JOURNEY</Text>
              </LinearGradient>
           </TouchableOpacity>
        </View>
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
