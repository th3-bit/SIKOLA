import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  TextInput,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  Search, 
  Filter, 
  Calculator, 
  Beaker, 
  TrendingUp, 
  Palette, 
  Code, 
  Globe, 
  ChevronRight,
  Star
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import GlassHeader from '../components/GlassHeader';

const { width } = Dimensions.get('window');

const subjects = [
  { 
    id: 1, 
    name: 'Mathematics', 
    icon: Calculator, 
    color: '#FACC15', 
    category: 'Academic',
    topics: [
      { id: 101, title: 'Linear Algebra', count: '12 Lessons', progress: 45 },
      { id: 102, title: 'Calculus Essentials', count: '18 Lessons', progress: 10 },
      { id: 103, title: 'Advanced Geometry', count: '15 Lessons', progress: 0 },
      { id: 104, title: 'Statistics 101', count: '10 Lessons', progress: 80 },
    ]
  },
  { 
    id: 2, 
    name: 'Science', 
    icon: Beaker, 
    color: '#EC4899', 
    category: 'Science',
    topics: [
      { id: 201, title: 'Organic Chemistry', count: '22 Lessons', progress: 15 },
      { id: 202, title: 'Quantum Physics', count: '30 Lessons', progress: 5 },
      { id: 203, title: 'Cell Biology', count: '25 Lessons', progress: 60 },
    ]
  },
  { 
    id: 3, 
    name: 'Economics', 
    icon: TrendingUp, 
    color: '#8B5CF6', 
    category: 'Academic',
    topics: [
      { id: 301, title: 'Microeconomics', count: '15 Lessons', progress: 90 },
      { id: 302, title: 'Macroeconomics', count: '14 Lessons', progress: 20 },
      { id: 303, title: 'Financial Markets', count: '20 Lessons', progress: 0 },
    ]
  },
  { 
    id: 4, 
    name: 'Coding', 
    icon: Code, 
    color: '#10B981', 
    category: 'Technology',
    topics: [
      { id: 401, title: 'React Native', count: '40 Lessons', progress: 30 },
      { id: 402, title: 'Python for Data Science', count: '35 Lessons', progress: 0 },
      { id: 403, title: 'Algorithm Mastery', count: '28 Lessons', progress: 10 },
    ]
  },
  { 
    id: 5, 
    name: 'Arts', 
    icon: Palette, 
    color: '#F97316', 
    category: 'Creative',
    topics: [
      { id: 501, title: 'Digital Illustration', count: '12 Lessons', progress: 50 },
      { id: 502, title: 'Color Theory', count: '10 Lessons', progress: 100 },
      { id: 503, title: 'UI/UX Design', count: '24 Lessons', progress: 5 },
    ]
  },
];

export default function SubjectsScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const TopicCard = ({ topic, color }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('LessonDetail', { lesson: topic, subject: selectedSubject })}
      style={[styles.topicCardWrapper, { shadowColor: color }]}
    >
      <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.topicCard, { borderColor: theme.colors.glassBorder }]}>
        <View style={styles.topicHeader}>
          <Text style={[styles.topicTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
            {topic.title}
          </Text>
          <ChevronRight color={theme.colors.textSecondary} size={18} />
        </View>
        
        <View style={styles.topicFooter}>
          <Text style={[styles.topicCount, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
            {topic.count}
          </Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={[styles.progressFill, { width: `${topic.progress}%`, backgroundColor: color }]} />
            </View>
            <Text style={[styles.progressVal, { color: theme.colors.textSecondary }]}>{topic.progress}%</Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <GlassHeader />
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.headerTitleSection}>
            <Text style={[styles.mainTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              Subjects
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
              Choose a subject to see topics
            </Text>
          </View>

          {/* Subject Selection (Horizontal Scroll like the image) */}
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
                  selectedSubject.id === sub.id && { 
                    backgroundColor: sub.color,
                    borderColor: sub.color,
                    elevation: 10,
                    shadowColor: sub.color,
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                  },
                  { borderColor: theme.colors.glassBorder }
                ]}
              >
                <sub.icon 
                  size={18} 
                  color={selectedSubject.id === sub.id ? '#FFF' : sub.color} 
                  style={{ marginRight: 8 }}
                />
                <Text style={[
                  styles.subjectChipText,
                  { color: selectedSubject.id === sub.id ? '#FFF' : theme.colors.textSecondary,
                    fontFamily: theme.typography.fontFamily }
                ]}>
                  {sub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Selected Subject Header */}
          <View style={styles.topicHeaderSection}>
            <Text style={[styles.topicHeaderTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              {selectedSubject.name} Topics
            </Text>
            <View style={[styles.badge, { backgroundColor: `${selectedSubject.color}20` }]}>
              <Text style={[styles.badgeText, { color: selectedSubject.color }]}>
                {selectedSubject.topics.length} Available
              </Text>
            </View>
          </View>

          {/* Topics Grid */}
          <View style={styles.topicsGrid}>
            {selectedSubject.topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} color={selectedSubject.color} />
            ))}
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
  headerTitleSection: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    opacity: 0.7,
  },
  subjectsContainer: {
    paddingBottom: 25,
    gap: 12,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  subjectChipText: {
    fontSize: 15,
    fontWeight: '700',
  },
  topicHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  topicHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  topicsGrid: {
    gap: 15,
  },
  topicCardWrapper: {
    borderRadius: 20,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  topicCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicCount: {
    fontSize: 13,
    opacity: 0.6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 0.6,
  },
  progressBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressVal: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 35,
    textAlign: 'right',
  },
});
