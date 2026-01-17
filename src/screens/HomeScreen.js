import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calculator, Beaker, TrendingUp, Palette, Music, Code, Globe, Dumbbell, Crown, ChevronRight } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import GlassHeader from '../components/GlassHeader';
import DailyProgressCard from '../components/DailyProgressCard';
import StreakCard from '../components/StreakCard';
import LessonCard from '../components/LessonCard';
import CategoryCard from '../components/CategoryCard';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { recentLessons, continueLearning, isLoading } = useProgress();
  
  console.log('HomeScreen mounted. isLoading:', isLoading, 'Recent:', recentLessons?.length);

  // Fetch categories (subjects) dynamically
  const [categories, setCategories] = React.useState([]);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
        const { data, error } = await supabase
          .from('subjects')
          .select(`
            *,
            topics (id)
          `)
          .order('name');
      
      if (data) {
        const formatted = data.map(sub => {
          const style = getSubjectStyle(sub.name);
          return {
            id: sub.id,
            name: sub.name, 
            icon: style.icon,
            color: style.color,
            topicCount: sub.topics ? sub.topics.length : 0
          };
        });
        setCategories(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  };

  /* 
  // Old Static Data
  const categories = [ ... ]
  */

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
          {/* Daily Progress */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate('LearningProgress')}>
            <DailyProgressCard />
          </TouchableOpacity>

          {/* Subscription Banner */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Subscription')}
            style={styles.subscriptionBannerWrapper}
          >
            <BlurView
              intensity={isDark ? 30 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.subscriptionBanner, { borderColor: '#FACC15' }]}
            >
              <LinearGradient
                colors={['rgba(250, 204, 21, 0.2)', 'rgba(250, 204, 21, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
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
            </BlurView>
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
                       lesson: topic, // Passing topic as lesson since LessonDetail expects topic object structure
                       subject: { name: topic.category, color: topic.color } // Construct subject object
                    })}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Explore Subjects */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              Explore Subjects
            </Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <CategoryCard 
                  key={category.id} 
                  category={category}
                  onPress={() => navigation.navigate('SubjectDetail', { subject: category })}
                />
              ))}
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
                    onPress={() => navigation.navigate('LearningContent', { 
                      lesson: lesson,
                      // We need to pass topic and subject if possible, or fetch them in LearningContent
                      // For now, let's assume LearningContent can handle missing parents or we limit this
                      // Since we didn't fetch full hierarchy in recentLessons properly, we might need a fetch or passed props
                      // Edit: ProgressContext now fetches topic and subject!
                      subject: { name: lesson.category, color: lesson.color },
                      topic: { id: lesson.topic_id, title: lesson.topic_title } // Correctly mapping to Topic properties
                    })}
                  />
                ))}
              </ScrollView>
            </View>
          )}

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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
});
