import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calculator, Beaker, TrendingUp, Palette, Music, Code, Globe, Dumbbell, Crown, ChevronRight, Lock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';
import GlassHeader from '../components/GlassHeader';
import DailyProgressCard from '../components/DailyProgressCard';
import CategoryCard from '../components/CategoryCard';
import LessonCard from '../components/LessonCard';
import TrialBanner from '../components/TrialBanner';
import MarketingCarousel from '../components/MarketingCarousel';

export default function HomeScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { recentLessons, continueLearning, isLoading, courseProgress, checkSubjectAccess } = useProgress();
  
  // Fetch categories (subjects) dynamically
  const [categories, setCategories] = React.useState([]);

  React.useEffect(() => {
    fetchCategories();
  }, [courseProgress]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          topics (
            id,
            lessons (id)
          )
        `)
        .order('order_index', { ascending: true });
    
      if (data) {
        const formatted = data.map(sub => {
          const style = getSubjectStyle(sub.name);
          
          // Flatten all lesson IDs for this subject
          const allLessonIds = [];
          if (sub.topics) {
            sub.topics.forEach(topic => {
              if (topic.lessons) {
                topic.lessons.forEach(lesson => {
                  allLessonIds.push(lesson.id);
                });
              }
            });
          }

          const completedCount = allLessonIds.filter(id => courseProgress?.[id]?.completed).length;
          const progress = allLessonIds.length > 0 ? (completedCount / allLessonIds.length) * 100 : 0;

          return {
            id: sub.id,
            name: sub.name, 
            icon: style.icon,
            color: sub.color || style.color,
            topicCount: sub.topics?.length || 0, // Number of study units (topics)
            lessonCount: allLessonIds.length,
            progress: progress
          };
        });
        setCategories(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <GlassHeader 
          showSearch={true} 
          onSearchPress={() => navigation.navigate('Search')}
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TrialBanner />
          <MarketingCarousel navigation={navigation} />

          {/* Daily Progress */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('LearningProgress')}>
            <DailyProgressCard />
          </TouchableOpacity>

          {/* Subscription Banner */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => navigation.navigate('Subscription')}
            style={styles.subscriptionBannerWrapper}
          >
            <View style={[styles.subscriptionBanner, { 
              backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.1)',
              borderColor: '#FACC15',
              borderWidth: 1.5
            }]}>
              <View style={styles.subscriptionContent}>
                <View style={styles.subscriptionLeft}>
                  <View style={styles.crownContainer}>
                    <Crown size={28} color="#FACC15" fill="#FACC15" />
                  </View>
                  <View style={styles.subscriptionText}>
                    <Text style={[styles.subscriptionTitle, { color: theme.colors.textPrimary }]}>
                      Unlock Premium Access
                    </Text>
                    <Text style={[styles.subscriptionSubtitle, { color: theme.colors.textSecondary }]}>
                      View all subscription plans
                    </Text>
                  </View>
                </View>
                <ChevronRight size={24} color="#FACC15" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Continue Learning */}
          {continueLearning.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                Continue Learning
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {continueLearning.map((topic) => (
                  <LessonCard 
                    key={topic.id} 
                    lesson={topic} 
                    shadowColor={topic.color}
                    onPress={() => navigation.navigate('LessonDetail', { 
                       lesson: topic,
                       subject: { id: topic.subject_id, name: topic.category, color: topic.color }
                    })}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              Explore Subjects
            </Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category, index) => {
                const isUnlocked = checkSubjectAccess(category.id, index);
                
                return (
                  <View key={category.id} style={{ position: 'relative' }}>
                    <CategoryCard 
                      category={category}
                      onPress={() => {
                        if (isUnlocked) {
                          navigation.navigate('SubjectDetail', { subject: category, subjectIndex: index });
                        } else {
                          // Locked - Go to Subscription with specific subject context if possible
                          navigation.navigate('Subscription', { reason: 'Unlock Subject', subject: category });
                        }
                      }}
                      style={{ opacity: isUnlocked ? 1 : 0.6 }}
                    />
                    {!isUnlocked && (
                      <View style={[styles.lockOverlay, { backgroundColor: 'rgba(0,0,0,0.3)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', borderRadius: 20 }]}>
                         <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 }}>
                            <Lock size={24} color="#FFF" />
                         </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Lessons */}
          {recentLessons.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                Recent Lessons
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {recentLessons.map((lesson) => (
                  <LessonCard 
                    key={lesson.id} 
                    lesson={lesson} 
                    shadowColor={lesson.color}
                    onPress={() => navigation.navigate('LessonDetail', { 
                       lesson: { id: lesson.topic_id, title: lesson.topic_title, color: lesson.color },
                       subject: { id: lesson.subject_id, name: lesson.category, color: lesson.color }
                    })}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Elite Circle Call to Action */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Subscription')}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.ctaCard}
            >
              <View style={styles.ctaContent}>
                <Text style={styles.ctaTitle}>Become a Sikola Legend</Text>
                <Text style={styles.ctaDesc}>Get unlimited access to everything and join the elite circle of learners.</Text>
                <View style={[styles.ctaButton, { backgroundColor: '#FFF' }]}>
                   <Text style={[styles.ctaButtonText, { color: '#8B5CF6' }]}>Join the Elite Circle</Text>
                   <ChevronRight size={16} color="#8B5CF6" />
                </View>
              </View>
              <View style={styles.ctaIconContainer}>
                 <Crown size={80} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Bottom padding for tab bar */}
          <View style={{ height: 100 }} />
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
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingRight: 20,
    paddingLeft: 4,
  },
  categoriesGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  recentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recentItem: {
    width: '48%',
    marginBottom: 16,
  },
  subscriptionBannerWrapper: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'visible',
  },
  subscriptionBanner: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 20,
    overflow: 'hidden',
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  crownContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionText: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  subscriptionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  ctaWrapper: {
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  ctaCard: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ctaContent: {
    flex: 1,
    zIndex: 1,
  },
  ctaTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
  },
  ctaDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  ctaIconContainer: {
    position: 'absolute',
    right: -20,
    bottom: -10,
  },
});
