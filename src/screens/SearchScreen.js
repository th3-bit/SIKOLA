import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassHeader from '../components/GlassHeader';
import { supabase } from '../lib/supabase';
import { BookOpen, Hash, FileText, ChevronRight } from 'lucide-react-native';

export default function SearchScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  
  console.log('SearchScreen mounted');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ subjects: [], topics: [], lessons: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
        supabase.from('subjects').select('*').ilike('name', searchTerm).limit(5),
        supabase.from('topics').select('*, subjects(name, color)').ilike('title', searchTerm).limit(5),
        supabase.from('lessons').select('*, topics(title, subjects(name, color))').ilike('title', searchTerm).limit(10)
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
                <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary }]}>
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
        navigation.navigate('LessonDetail', { 
          lesson: { ...item, category: item.subjects?.name, color: item.subjects?.color },
          subject: { name: item.subjects?.name, color: item.subjects?.color }
        });
      } else if (type === 'lesson') {
         navigation.navigate('LearningContent', {
           lesson: item,
           topic: item.topics,
           subject: item.topics?.subjects
         });
      }
    } catch (err) {
      console.error("Navigation error", err);
    }
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
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    No results found for "{query}"
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
