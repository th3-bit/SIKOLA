import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassHeader from '../components/GlassHeader';
import { supabase } from '../lib/supabase';
import { BookOpen, Hash, FileText, ChevronRight } from 'lucide-react-native';
import { useProgress } from '../context/ProgressContext';
import LockStatusModal from '../components/LockStatusModal';

export default function SearchScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  
  console.log('SearchScreen mounted');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ subjects: [], topics: [], lessons: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { checkAccess, checkLessonAccess, subscriptions } = useProgress();
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockConfig, setLockConfig] = useState({ type: 'subscription', title: '', message: '', onAction: null });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 1) {
        performSearch(query);
      } else {
        setResults({ subjects: [], topics: [], lessons: [] });
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (text) => {
    setLoading(true);
    setHasSearched(true);
    const searchTerm = `%${text}%`;
    
    try {
      const [subjectsRes, topicsRes, lessonsRes] = await Promise.all([
        supabase.from('subjects').select('*').ilike('name', searchTerm).order('order_index', { ascending: true }).limit(5),
        supabase.from('topics').select('*, subjects(id, name, color)').ilike('title', searchTerm).order('order_index', { ascending: true }).limit(5),
        supabase.from('lessons').select('*, topics(id, title, subjects(id, name, color))').ilike('title', searchTerm).order('order_index', { ascending: true }).limit(10)
      ]);

      setResults({
        subjects: subjectsRes.data || [],
        topics: topicsRes.data || [],
        lessons: lessonsRes.data || []
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const ResultSection = ({ title, data, icon: Icon, type }) => {
    if (!data.length) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
        {data.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.resultItem, { borderBottomColor: theme.colors.glassBorder }]}
            onPress={() => handleNavigate(type, item)}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <Icon size={20} color={theme.colors.secondary} />
            </View>
            <View style={styles.resultInfo}>
              <Text style={[styles.resultTitle, { color: theme.colors.textPrimary }]}>
                {type === 'subject' ? item.name : item.title}
              </Text>
              {(type === 'topic' || type === 'lesson') && (
                <Text numberOfLines={1} style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
                  {type === 'topic' ? item.subjects?.name : `${item.topics?.subjects?.name} • ${item.topics?.title}`}
                </Text>
              )}
            </View>
            <ChevronRight size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleNavigate = (type, item) => {
    try {
      if (type === 'subject') {
        navigation.navigate('SubjectDetail', { subject: item });
      } else if (type === 'topic') {
        // For search results, we'll try to determine access. 
        // If it's a newer course/topic, we might want to be strict.
        const isAccessible = checkAccess(topicId, subjectId); 
        
        if (isAccessible) {
          navigation.navigate('LessonDetail', { 
            lesson: { ...item, category: item.subjects?.name, color: item.subjects?.color },
            subject: { id: item.subjects?.id, name: item.subjects?.name, color: item.subjects?.color }
          });
        } else {
          showLockedContent();
        }
      } else if (type === 'lesson') {
         const subjectId = item.topics?.subjects?.id;
         const topicId = item.topics?.id;
         
         const isAccessible = checkLessonAccess(0, topicId, subjectId); // Use 0 for lesson index if unknown
         
         if (isAccessible) {
           navigation.navigate('LearningContent', {
             lesson: item,
             topic: item.topics,
             subject: item.topics?.subjects
           });
         } else {
           showLockedContent();
         }
      }
    } catch (err) {
      console.error("Navigation error", err);
    }
  };

  const showLockedContent = () => {
    const hasAnySub = subscriptions && subscriptions.length > 0;
    if (hasAnySub) {
      setLockConfig({
        type: 'subscription',
        title: "Course Not Included",
        message: "This specific course is not part of your current plan. Purchase this course individually or upgrade to a Full Access plan to unlock all content.",
        onAction: () => { setShowLockModal(false); navigation.navigate('Subscription'); }
      });
    } else {
      setLockConfig({
        type: 'subscription',
        title: "Unlock Premium Content",
        message: "Get unlimited access to all topics, detailed notes, comprehensive tests, and more with SIKOLA Premium.",
        onAction: () => { setShowLockModal(false); navigation.navigate('Subscription'); }
      });
    }
    setShowLockModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safeArea}>
        <GlassHeader 
          showSearch={true} 
          initialExpanded={true}
          onSearch={setQuery}
          overrideBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.secondary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {hasSearched && !loading && 
               !results.subjects.length && !results.topics.length && !results.lessons.length && (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
                    The content you are searching for is not available in our current curriculum.
                  </Text>
                </View>
              )}
              
              <ResultSection title="Subjects" data={results.subjects} icon={BookOpen} type="subject" />
              <ResultSection title="Courses" data={results.topics} icon={Hash} type="topic" />
              <ResultSection title="Topics" data={results.lessons} icon={FileText} type="lesson" />
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <LockStatusModal 
        visible={showLockModal}
        onClose={() => setShowLockModal(false)}
        type={lockConfig.type}
        title={lockConfig.title}
        message={lockConfig.message}
        onAction={lockConfig.onAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
  }
});
