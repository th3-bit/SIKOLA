import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  Calculator, 
  Beaker, 
  TrendingUp, 
  Code, 
  Globe, 
  ChevronRight,
  BookOpen,
  Briefcase,
  Scale
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import GlassHeader from '../components/GlassHeader';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';

const { width } = Dimensions.get('window');



export default function SubjectsScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get route params safely
  const params = route.params || {};
  const { selectingForSubscription, plan } = params;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchSubjects().then(() => setRefreshing(false));
  }, []);

  const { courseProgress } = useProgress();

  useEffect(() => {
    fetchSubjects();
  }, [courseProgress]); 

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          *,
          topics (
            id,
            title,
            subject_id,
            lessons (id)
          )
        `)
        .order('name');

      if (subjectsError) throw subjectsError;

      const subjectsMap = new Map();
      
      if (subjectsData) {
        subjectsData.forEach(subject => {
            const style = getSubjectStyle(subject.name);
            const icon = style.icon;
            const color = style.color;
            
            const formattedTopic = (subject.topics || []).map(topic => {
              // Calculate Lesson Count safely
              const lessonCount = topic.lessons ? topic.lessons.length : 0;
              
              // Calculate Progress
              let progress = 0;
              const topicState = courseProgress[topic.id];
              if (topicState?.completed) {
                progress = 100;
              } else if (topicState?.score) {
                progress = topicState.score;
              }

              return {
                id: topic.id,
                title: topic.title,
                count: `${lessonCount} Lessons`,
                progress: progress
              };
            }).sort((a, b) => a.title.localeCompare(b.title));

            if (subjectsMap.has(style.name)) {
               const existing = subjectsMap.get(style.name);
               existing.topics = [...existing.topics, ...formattedTopic];
            } else {
               subjectsMap.set(style.name, {
                 id: subject.id,
                 name: style.name,
                 icon,
                 color,
                 category: 'Academic',
                 topics: formattedTopic
               });
            }
          });
      }

      const formattedSubjects = Array.from(subjectsMap.values());

      setSubjects(formattedSubjects);
      if (formattedSubjects.length > 0 && !selectedSubject) {
        setSelectedSubject(formattedSubjects[0]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const TopicCard = ({ topic, color }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => {
        if (selectingForSubscription) {
          navigation.navigate('Payment', { plan, topic });
        } else {
          navigation.navigate('LessonDetail', { lesson: topic, subject: selectedSubject });
        }
      }}
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
        <GlassHeader 
          showSearch={true} 
          onSearchPress={() => navigation.navigate('Search')}
        />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.textPrimary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading subjects...
            </Text>
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No subjects available yet.
            </Text>
          </View>
        ) : (

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.textPrimary} />
            }
          >
             <View style={styles.headerTitleSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[styles.mainTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {selectingForSubscription ? 'Select a Topic' : 'Subjects'}
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {selectingForSubscription 
                      ? 'Choose the topic you want to unlock' 
                      : 'Choose a subject to see topics'}
                  </Text>
                </View>
                {selectingForSubscription && (
                  <TouchableOpacity 
                    onPress={() => navigation.setParams({ selectingForSubscription: null, plan: null })}
                    style={{ padding: 8, backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: 20 }}
                  >
                    <Text style={{ color: '#EF4444', fontWeight: 'bold' }}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.subjectsContainer}
            >
              {subjects
                .filter(sub => 
                  sub.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => setSelectedSubject(sub)}
                  style={[
                    styles.subjectChip,
                    selectedSubject?.id === sub.id && { 
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
                    color={selectedSubject?.id === sub.id ? '#FFF' : sub.color} 
                    style={{ marginRight: 8 }}
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

            {selectedSubject && (
              <>
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

                <View style={styles.topicsGrid}>
                  {selectedSubject.topics.length > 0 ? (
                    selectedSubject.topics.map((topic) => (
                      <TopicCard key={topic.id} topic={topic} color={selectedSubject.color} />
                    ))
                  ) : (
                    <View style={styles.emptyTopicsContainer}>
                      <Text style={[styles.emptyTopicsText, { color: theme.colors.textSecondary }]}>
                        No topics available for {selectedSubject.name} yet.
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyTopicsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTopicsText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
