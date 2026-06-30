import React, { useState, useEffect, useRef } from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Platform, useWindowDimensions, Animated, Pressable } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassHeader from '../components/GlassHeader';
import { supabase } from '../lib/supabase';
import { BookOpen, Hash, FileText, ChevronRight, Crown, Lock, SearchX } from 'lucide-react-native';
import { useProgress } from '../context/ProgressContext';
import LockStatusModal from '../components/LockStatusModal';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

export default function SearchScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ subjects: [], topics: [], lessons: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const { checkAccess, checkLessonAccess, subscriptions } = useProgress();
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockConfig, setLockConfig] = useState({ type: 'subscription', title: '', message: '', onAction: null });

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
      logger.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const ResultCard = ({ item, isLast, subjectColor, titleText, subtitleText, isUnlocked, isFree, type, Icon, isLocked }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleHoverIn = () => {
      if (isDesktop) {
        Animated.spring(scaleAnim, { toValue: 1.02, useNativeDriver: true, friction: 5 }).start();
      }
    };

    const handleHoverOut = () => {
      if (isDesktop) {
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
      }
    };

    return (
      <View key={item.id} style={styles.timelineRow}>
        <Pressable 
          onPress={() => handleNavigate(type, item)}
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          style={styles.newTopicCardWrapper}
        >
          <Animated.View 
              style={[
                  styles.newTopicCard, 
                  { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.12)',
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                      opacity: isLocked ? 0.8 : 1,
                      transform: [{ scale: scaleAnim }]
                  }
              ]}
          >
            {type !== 'subject' && (
              isFree ? (
                <View style={[styles.statusBadge, styles.statusBadgeAbsolute, { backgroundColor: '#10B98115' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>FREE</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.statusBadgeAbsolute, { backgroundColor: `${subjectColor}15`, borderColor: `${subjectColor}30`, borderWidth: 0.5 }]}>
                  {isUnlocked ? (
                    <Crown size={scale(10)} color={subjectColor} style={{ marginRight: scale(4) }} />
                  ) : (
                    <Lock size={scale(10)} color={subjectColor} style={{ marginRight: scale(4) }} />
                  )}
                  <Text style={[styles.statusBadgeText, { color: subjectColor }]}>PREMIUM</Text>
                </View>
              )
            )}

            <View style={[styles.cardIconWrapper, { backgroundColor: subjectColor }]}>
              <Icon size={scale(16)} color="#FFF" />
            </View>

            <View style={styles.topicMain}>
              <Text numberOfLines={2} style={[styles.newTopicName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginBottom: 4 }]}>
                {titleText}
              </Text>
              <View style={styles.newTopicSubRow}>
                <Text style={[styles.newTopicSub, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                  {subtitleText}
                </Text>
              </View>
            </View>
            
            <View style={[styles.newCardAction, { alignItems: 'flex-end', justifyContent: 'center' }]}>
              <ChevronRight size={scale(20)} color={theme.colors.textSecondary} />
            </View>
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  const ResultSection = ({ title, data, icon: Icon, type }) => {
    if (!data.length) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{title}</Text>
        <View style={styles.revisionList}>
          {data.map((item, index) => {
            const isLast = index === data.length - 1;
            const subjectColor = type === 'subject' ? (item.color || theme.colors.secondary) : 
                               type === 'topic' ? (item.subjects?.color || theme.colors.secondary) : 
                               (item.topics?.subjects?.color || theme.colors.secondary);
            
            const titleText = type === 'subject' ? item.name : item.title;
            const subtitleText = type === 'subject' ? 'Subject' : 
                                 type === 'topic' ? (item.subjects?.name || 'Course') : 
                                 `${item.topics?.subjects?.name} • ${item.topics?.title}`;

            let isUnlocked = true;
            let isFree = false;
            
            if (type === 'topic') {
                const subjectId = item.subjects?.id;
                isUnlocked = checkAccess(item.id, subjectId, item.order_index);
                const hasAnySub = subscriptions && subscriptions.length > 0;
                isFree = item.order_index < 2 && !hasAnySub;
            } else if (type === 'lesson') {
                const subjectId = item.topics?.subjects?.id;
                const topicId = item.topics?.id;
                isUnlocked = checkLessonAccess(item.order_index, topicId, subjectId);
                const hasAnySub = subscriptions && subscriptions.length > 0;
                isFree = item.order_index === 0 && !hasAnySub; 
            }

            const isLocked = !isUnlocked && type !== 'subject';

            return (
              <ResultCard 
                key={item.id}
                item={item}
                isLast={isLast}
                subjectColor={subjectColor}
                titleText={titleText}
                subtitleText={subtitleText}
                isUnlocked={isUnlocked}
                isFree={isFree}
                type={type}
                Icon={Icon}
                isLocked={isLocked}
              />
            );
          })}
        </View>
      </View>
    );
  };

  const handleNavigate = (type, item) => {
    try {
      if (type === 'subject') {
        navigation.navigate('SubjectDetail', { subject: item });
      } else if (type === 'topic') {
        const subjectId = item.subjects?.id;
        const topicId = item.id;
        const isAccessible = checkAccess(topicId, subjectId, item.order_index); 
        
        if (isAccessible) {
          navigation.navigate('LessonDetail', { 
            lesson: { ...item, category: item.subjects?.name, color: item.subjects?.color },
            subject: { id: item.subjects?.id, name: item.subjects?.name, color: item.subjects?.color }
          });
        } else {
          showLockedContent(item);
        }
      } else if (type === 'lesson') {
        const subjectId = item.topics?.subjects?.id;
        const topicId = item.topics?.id;
        
        const isAccessible = checkLessonAccess(item.order_index, topicId, subjectId); 
        
        if (isAccessible) {
          navigation.navigate('LearningContent', {
            lesson: item,
            topic: item.topics,
            subject: item.topics?.subjects
          });
        } else {
          showLockedContent(item);
        }
      }
    } catch (err) {
      logger.error("Navigation error", err);
    }
  };

  const showLockedContent = (item) => {
    const hasAnySub = subscriptions && subscriptions.length > 0;
    if (hasAnySub) {
      setLockConfig({
        type: 'subscription',
        title: "Course Not Included",
        message: "This specific course is not part of your current plan. Purchase this course individually or upgrade to a Full Access plan to unlock all content.",
        onAction: () => { 
          setShowLockModal(false); 
          navigation.navigate('Subscription', { lockedCourse: { id: item.id, title: item.title } }); 
        }
      });
    } else {
      setLockConfig({
        type: 'subscription',
        title: "Unlock Premium Content",
        message: "Get unlimited access to all topics, detailed notes, comprehensive tests, and more with SIKOLA Premium.",
        onAction: () => { 
          setShowLockModal(false); 
          navigation.navigate('Subscription', { lockedCourse: { id: item.id, title: item.title } }); 
        }
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

        <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]} style={isDesktop && { paddingRight: 100 }} keyboardShouldPersistTaps="handled">
          <View style={isDesktop ? styles.desktopWrapper : styles.mobileWrapper}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.secondary} style={{ marginTop: verticalScale(40) }} />
            ) : (
              <>
                {hasSearched && !loading && 
                 !results.subjects.length && !results.topics.length && !results.lessons.length && (
                  <View style={[styles.emptyState, { marginTop: verticalScale(60) }]}>
                    <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]}>
                      <SearchX size={scale(40)} color={theme.colors.textSecondary} opacity={0.6} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                      No Results Found
                    </Text>
                    <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, textAlign: 'center' }]}>
                      We couldn't find any courses or topics matching your search in our current curriculum.
                    </Text>
                  </View>
                )}
                
                <ResultSection title="Subjects" data={results.subjects} icon={BookOpen} type="subject" />
                <ResultSection title="Courses" data={results.topics} icon={Hash} type="topic" />
                <ResultSection title="Topics" data={results.lessons} icon={FileText} type="lesson" />
              </>
            )}
          </View>
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
    padding: scale(20),
    paddingBottom: verticalScale(100),
  },
  desktopContent: {
    alignItems: 'center',
  },
  desktopWrapper: {
    width: '100%',
    maxWidth: 800,
  },
  mobileWrapper: {
    width: '100%',
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    marginBottom: verticalScale(15),
  },
  revisionList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  newTopicCardWrapper: {
    flex: 1,
    paddingBottom: verticalScale(16),
  },
  newTopicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderRadius: scale(20),
    borderWidth: scale(1),
  },
  cardIconWrapper: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  newTopicName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginBottom: verticalScale(6),
    lineHeight: moderateScale(22),
  },
  newTopicSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  newTopicSub: {
    fontSize: moderateScale(13),
    opacity: 0.7,
  },
  topicMain: {
    flex: 1,
    flexShrink: 1,
  },
  newCardAction: {
    marginLeft: scale(10),
    flexShrink: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(6),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: scale(16),
    right: scale(16),
    zIndex: 10,
  },
  emptyState: {
    padding: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(16),
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  emptyText: {
    fontSize: moderateScale(14),
    lineHeight: 22,
    maxWidth: '80%',
  },
});
