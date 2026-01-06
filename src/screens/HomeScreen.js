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

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  
  // Mock data
  const continueLearning = [
    { id: 1, title: 'Introduction to Algebra', category: 'Mathematics', progress: 65, duration: 25, color: '#FACC15' },
    { id: 2, title: 'Chemical Reactions', category: 'Science', progress: 40, duration: 30, color: '#EC4899' },
    { id: 3, title: 'Economics Fundamentals', category: 'Economics', progress: 80, duration: 20, color: '#8B5CF6' },
    { id: 10, title: 'Javascript Basics', category: 'Coding', progress: 25, duration: 45, color: '#10B981' },
    { id: 11, title: 'Renaissance Art', category: 'Arts', progress: 10, duration: 35, color: '#F97316' },
  ];

  const categories = [
    { id: 1, name: 'Mathematics', icon: Calculator, color: '#FACC15', lessonCount: 24 },
    { id: 2, name: 'Science', icon: Beaker, color: '#EC4899', lessonCount: 18 },
    { id: 3, name: 'Economics', icon: TrendingUp, color: '#8B5CF6', lessonCount: 32 },
    { id: 4, name: 'History', icon: Globe, color: '#3B82F6', lessonCount: 22 },
    { id: 5, name: 'Arts', icon: Palette, color: '#F97316', lessonCount: 15 },
    { id: 6, name: 'Coding', icon: Code, color: '#10B981', lessonCount: 28 },
  ];

  const recentLessons = [
    { id: 4, title: 'World Geography', category: 'History', progress: 100, duration: 15, color: '#3B82F6' },
    { id: 5, title: 'Physical Fitness', category: 'Health', progress: 30, duration: 20, color: '#EF4444' },
    { id: 6, title: 'Ancient Civilizations', category: 'History', progress: 75, duration: 25, color: '#3B82F6' },
    { id: 7, title: 'Digital Art Basics', category: 'Arts', progress: 50, duration: 30, color: '#F97316' },
    { id: 8, title: 'Macroeconomics', category: 'Economics', progress: 90, duration: 40, color: '#8B5CF6' },
    { id: 9, title: 'Organic Chemistry', category: 'Science', progress: 15, duration: 55, color: '#EC4899' },
    { id: 15, title: 'Geometry Proofs', category: 'Mathematics', progress: 60, duration: 30, color: '#FACC15' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <GlassHeader showSearch={true} />
        
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
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              Continue Learning
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {continueLearning.map((lesson) => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  shadowColor={lesson.color}
                  onPress={() => navigation.navigate('LessonDetail', { lesson })}
                />
              ))}
            </ScrollView>
          </View>

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
                  onPress={() => navigation.navigate('LessonDetail', { lesson })}
                />
              ))}
            </ScrollView>
          </View>

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
