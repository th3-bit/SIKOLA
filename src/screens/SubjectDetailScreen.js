import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowLeft, BookOpen, Clock, Award } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import LessonCard from '../components/LessonCard';

const { width } = Dimensions.get('window');

export default function SubjectDetailScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { subject } = route.params;

  // Mock lessons data for the subject
  const lessons = [
    { id: 1, title: 'Introduction to ' + subject.name, category: subject.name, progress: 100, duration: 20, color: subject.color },
    { id: 2, title: 'Basic Concepts', category: subject.name, progress: 80, duration: 25, color: subject.color },
    { id: 3, title: 'Intermediate Topics', category: subject.name, progress: 60, duration: 30, color: subject.color },
    { id: 4, title: 'Advanced Techniques', category: subject.name, progress: 40, duration: 35, color: subject.color },
    { id: 5, title: 'Practice Problems', category: subject.name, progress: 20, duration: 40, color: subject.color },
    { id: 6, title: 'Final Assessment', category: subject.name, progress: 0, duration: 45, color: subject.color },
  ];

  const completedLessons = lessons.filter(l => l.progress === 100).length;
  const totalDuration = lessons.reduce((sum, l) => sum + l.duration, 0);
  const avgProgress = Math.round(lessons.reduce((sum, l) => sum + l.progress, 0) / lessons.length);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={[styles.subjectIcon, { backgroundColor: `${subject.color}15` }]}>
              {React.createElement(subject.icon, { color: subject.color, size: 32 })}
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.subjectName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {subject.name}
              </Text>
              <Text style={[styles.lessonCount, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                {subject.lessonCount} lessons available
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View style={[styles.statsCardWrapper, { shadowColor: subject.color }]}>
          <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[styles.statsCard, { borderColor: theme.colors.glassBorder }]}>
            <LinearGradient
              colors={isDark ? ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.01)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
              style={StyleSheet.absoluteFill}
            />
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: `${subject.color}15` }]}>
                  <BookOpen color={subject.color} size={20} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {completedLessons}/{lessons.length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                  Completed
                </Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: `${subject.color}15` }]}>
                  <Clock color={subject.color} size={20} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {totalDuration}m
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                  Total Time
                </Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIconContainer, { backgroundColor: `${subject.color}15` }]}>
                  <Award color={subject.color} size={20} />
                </View>
                <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {avgProgress}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                  Progress
                </Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* Lessons List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.lessonsContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
            All Lessons
          </Text>
          
          <View style={styles.lessonsList}>
            {lessons.map((lesson) => (
              <View key={lesson.id} style={styles.lessonItem}>
                <LessonCard 
                  lesson={lesson}
                  shadowColor={subject.color}
                  onPress={() => navigation.navigate('LessonDetail', { lesson, subject })}
                />
              </View>
            ))}
          </View>

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
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  subjectName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  lessonCount: {
    fontSize: 14,
  },
  statsCardWrapper: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  statsCard: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  lessonsContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  lessonsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  lessonItem: {
    width: (width - 56) / 2,
    marginBottom: 0,
  },
});
