import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calculator, Beaker, TrendingUp, Palette, Music, Code, Globe, Dumbbell } from 'lucide-react-native';
import GlassHeader from '../components/GlassHeader';
import DailyProgressCard from '../components/DailyProgressCard';
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
          <DailyProgressCard />

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
                  onPress={() => {}}
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
                  onPress={() => {}}
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
});
