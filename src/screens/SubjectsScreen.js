import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  RefreshControl,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Animated,
  Pressable
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
  Scale,
  Lock,
  Crown,
  Play
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import GlassHeader from '../components/GlassHeader';
import Skeleton from '../components/Skeleton';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';

const { width, height } = Dimensions.get('window');
const { scale, verticalScale, moderateScale } = require('../utils/Scaling');



export default function SubjectsScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;
  const { 
    subjects: rawSubjects, 
    courseProgress, 
    isLoading: contextLoading,
    checkAccess,
    isTrialExpired
  } = useProgress();

  // 1. Process and group subjects for the UI (Memoized)
  const subjects = React.useMemo(() => {
    const subjectsMap = new Map();
    
    rawSubjects.forEach(subject => {
      const style = getSubjectStyle(subject.name);
      const icon = style.icon;
      const color = subject.color || style.color;
      
      const formattedTopics = (subject.topics || []).map((topic, index) => {
        const lessonCount = topic.lessons ? topic.lessons.length : 0;
        
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
          progress: progress,
          order_index: topic.order_index,
          created_at: topic.created_at,
          index: index // Inject index for access check
        };
      }).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      if (subjectsMap.has(subject.name)) {
        const existing = subjectsMap.get(subject.name);
        existing.topics = [...existing.topics, ...formattedTopics];
      } else {
        subjectsMap.set(subject.name, {
          id: subject.id,
          name: subject.name,
          icon,
          color,
          category: 'Academic',
          topics: formattedTopics
        });
      }
    });

    return Array.from(subjectsMap.values());
  }, [rawSubjects, courseProgress]);

  // Handle initial selection
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects]);

  // State
  const [selectedSubject, setSelectedSubject] = useState(null);
  const loading = contextLoading && subjects.length === 0;
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get route params safely
  const params = route.params || {};
  const { selectingForSubscription, plan } = params;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // ProgressContext handles refresh internally if needed, 
    // but here we just simulate a delay or rely on background sync
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const TopicCard = ({ topic, color }) => {
    const sIndex = subjects.indexOf(selectedSubject);
    const isUnlocked = checkAccess(topic.id, selectedSubject.id, topic.index, sIndex);
    const isFree = !isTrialExpired && topic.index < 2;

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const translateYAnim = useRef(new Animated.Value(30)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: isUnlocked ? 1 : 0.85,
          duration: 400,
          delay: topic.index * 100,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          delay: topic.index * 100,
          useNativeDriver: true,
        })
      ]).start();
    }, [topic.id, isUnlocked]);

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
      <Pressable 
        onPress={() => {
          if (selectingForSubscription) {
            navigation.navigate('Payment', { plan, topic, subject: selectedSubject });
          } else {
            navigation.navigate('LessonDetail', { 
              lesson: topic, 
              subject: selectedSubject,
              subjectIndex: sIndex,
              topicIndex: topic.index
            });
          }
        }}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        style={styles.topicCardWrapper}
      >
        <Animated.View style={[
          styles.topicCard, 
          { 
            backgroundColor: isDark ? 'rgba(30, 30, 30, 1)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim }
            ],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.05,
            shadowRadius: 4,
            elevation: 3,
          }
        ]}>
          <View style={styles.topicHeader}>
            <View style={{ flex: 1 }}>
              <Text 
                numberOfLines={2} 
                adjustsFontSizeToFit 
                minimumFontScale={0.8}
                style={[styles.topicTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
              >
                {topic.title}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginLeft: 10 }}>
                {isFree ? (
                  <View style={[styles.statusBadge, { backgroundColor: '#10B98115' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>FREE</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: `${color}15`, borderColor: `${color}30`, borderWidth: 0.5 }]}>
                    {isUnlocked ? (
                      <Crown size={10} color={color} style={{ marginRight: 4 }} />
                    ) : (
                      <Lock size={10} color={color} style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.statusBadgeText, { color: color }]}>PREMIUM</Text>
                  </View>
                )}
                <View style={[styles.statusBorder, { 
                  backgroundColor: `${color}15`,
                  borderColor: `${color}40`,
                  borderWidth: 1.5,
                }]}>
                   <Play size={16} color={color} fill={color} />
                </View>
            </View>
          </View>
          
          <View style={styles.topicFooter}>
            <Text style={[styles.topicCount, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
              {topic.count}
            </Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}>
                <View style={[styles.progressFill, { width: `${topic.progress}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.progressVal, { color: theme.colors.textSecondary }]}>{topic.progress}%</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    );
  };

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
          <ScrollView 
            style={[{ flex: 1 }, isDesktop && { paddingRight: 100 }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Skeleton */}
            <View style={[styles.headerTitleSection, isDesktop && styles.desktopHeaderTitleSection]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Skeleton width={180} height={32} borderRadius={8} style={{ marginBottom: 8 }} />
                  <Skeleton width={240} height={20} borderRadius={6} />
                </View>
              </View>
            </View>

            {/* Pills Skeleton */}
            <View style={isDesktop && { alignItems: 'center' }}>
              <View style={[{ width: '100%', flexDirection: 'row', paddingHorizontal: scale(20), gap: scale(12), marginBottom: verticalScale(20), overflow: 'hidden' }, isDesktop && { paddingHorizontal: scale(40), gap: scale(16) }]}>
                <Skeleton width={120} height={44} borderRadius={22} />
                <Skeleton width={100} height={44} borderRadius={22} />
                <Skeleton width={140} height={44} borderRadius={22} />
                <Skeleton width={110} height={44} borderRadius={22} />
              </View>
            </View>

            {/* Main Cards Skeleton */}
            <View style={isDesktop && { alignItems: 'center' }}>
              <View style={isDesktop ? styles.desktopWrapper : { width: '100%' }}>
                <View style={[styles.dashboardContainer, { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' 
                }]}>
                  <View style={styles.topicHeaderSection}>
                    <Skeleton width={150} height={24} borderRadius={6} />
                    <Skeleton width={80} height={24} borderRadius={12} />
                  </View>

                  <View style={[styles.topicsGrid, isDesktop && styles.desktopTopicsGrid]}>
                    {[1, 2, 3, 4, 5, 6].map((key) => (
                      <View key={key} style={isDesktop ? styles.desktopTopicItem : { width: '100%' }}>
                        <View style={[styles.topicCard, { padding: scale(16), backgroundColor: isDark ? '#1a1a2e' : '#ffffff' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: verticalScale(16) }}>
                            <Skeleton width={44} height={44} borderRadius={22} style={{ marginRight: scale(12) }} />
                            <View style={{ flex: 1 }}>
                              <Skeleton width="80%" height={18} borderRadius={6} style={{ marginBottom: 6 }} />
                              <Skeleton width="50%" height={14} borderRadius={4} />
                            </View>
                          </View>
                          <View style={styles.topicFooter}>
                            <Skeleton width={60} height={14} borderRadius={4} />
                            <Skeleton width={80} height={10} borderRadius={5} />
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        ) : subjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No courses available yet.
            </Text>
          </View>
        ) : (

          <>
            {/* 2. Fixed Header Layer */}
            <View style={[
              styles.stickyHeaderContainer,
              { 
                backgroundColor: theme.colors.primary,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.15)' 
              }
            ]}>
              <View style={[styles.headerTitleSection, isDesktop && styles.desktopHeaderTitleSection]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={[
                      styles.mainTitle, 
                      isDesktop && styles.desktopMainTitle,
                      { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }
                    ]}>
                      {selectingForSubscription ? 'Select a Course' : 'Course'}
                    </Text>
                    <Text style={[
                      styles.subtitle, 
                      isDesktop && styles.desktopSubtitle,
                      { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }
                    ]}>
                      {selectingForSubscription 
                        ? 'Choose the course you want to unlock' 
                        : 'Choose a Subject to see Courses'}
                    </Text>
                  </View>
                  {selectingForSubscription && (
                    <TouchableOpacity 
                      onPress={() => navigation.setParams({ selectingForSubscription: null, plan: null })}
                      style={{ padding: scale(8), backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: scale(20) }}
                    >
                      <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: moderateScale(14) }}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={isDesktop && { alignItems: 'center' }}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={[styles.subjectsContainer, isDesktop && styles.desktopSubjectsContainer]}
                  style={isDesktop && { width: '100%' }}
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
                        isDesktop && styles.desktopSubjectChip,
                        isDesktop && isDark && styles.desktopSubjectChipDark,
                        selectedSubject?.id === sub.id && { 
                          backgroundColor: sub.color,
                          borderColor: sub.color,
                        },
                        selectedSubject?.id === sub.id && isDesktop && [styles.desktopSelectedChip, { shadowColor: sub.color }],
                        !isDesktop && { borderColor: theme.colors.glassBorder }
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
                        {sub.name.length > 16 ? sub.name.substring(0, 16) + '...' : sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <ScrollView 
              style={[{ flex: 1 }, isDesktop && { paddingRight: 100 }]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.textPrimary} />
              }
            >
            {/* 3. Bottom Content Layer */}
            <View style={isDesktop && { alignItems: 'center' }}>
              <View style={isDesktop ? styles.desktopWrapper : { width: '100%' }}>
                {selectedSubject && (
                  <View style={[styles.dashboardContainer, { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' 
                  }]}>
                    <View style={styles.topicHeaderSection}>
                      <Text style={[styles.topicHeaderTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                        {(selectedSubject.name.length > 16 ? selectedSubject.name.substring(0, 16) + '...' : selectedSubject.name)} Courses
                      </Text>
                      <View style={[styles.badge, { backgroundColor: `${selectedSubject.color}20` }]}>
                        <Text style={[styles.badgeText, { color: selectedSubject.color }]}>
                          {selectedSubject.topics.length} Available
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.topicsGrid, isDesktop && styles.desktopTopicsGrid]}>
                      {selectedSubject.topics.length > 0 ? (
                        selectedSubject.topics.map((topic) => (
                          <View key={topic.id} style={isDesktop ? styles.desktopTopicItem : { width: '100%' }}>
                            <TopicCard topic={topic} color={selectedSubject.color} />
                          </View>
                        ))
                      ) : (
                        <View style={styles.emptyTopicsContainer}>
                          <Text style={[styles.emptyTopicsText, { color: theme.colors.textSecondary }]}>
                            No courses available for {selectedSubject.name} yet.
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
            
            <View style={{ height: verticalScale(140) }} />
          </ScrollView>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dashboardContainer: {
    paddingTop: scale(24),
    paddingBottom: scale(24),
    paddingHorizontal: scale(10),
    borderRadius: scale(24),
    borderWidth: 1,
    marginHorizontal: scale(10),
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: verticalScale(10),
  },
  headerTitleSection: {
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(20),
  },
  desktopHeaderTitleSection: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1200,
  },
  desktopWrapper: {
    width: '100%',
    maxWidth: 1200,
  },
  desktopSubjectsContainer: {
    paddingHorizontal: scale(40),
    gap: scale(16),
  },
  desktopTopicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: '2%',
    paddingHorizontal: 0,
  },
  desktopTopicItem: {
    width: '32%',
  },
  mainTitle: {
    fontSize: moderateScale(24),
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  desktopMainTitle: {
    fontSize: moderateScale(36),
    letterSpacing: -1,
    marginBottom: verticalScale(4),
  },
  subtitle: {
    fontSize: moderateScale(15),
    marginTop: verticalScale(4),
    opacity: 0.7,
  },
  desktopSubtitle: {
    fontSize: moderateScale(16),
    opacity: 0.6,
  },
  subjectsContainer: {
    paddingHorizontal: scale(20), 
    paddingBottom: verticalScale(15),
    gap: scale(12),
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderRadius: scale(14),
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  desktopSubjectChip: {
    paddingHorizontal: scale(24),
    paddingVertical: verticalScale(12),
    borderRadius: 100,
    borderWidth: 0,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  desktopSubjectChipDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  desktopSelectedChip: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 0,
  },
  subjectChipText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  topicHeaderSection: {
    paddingHorizontal: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(15),
  },
  topicHeaderTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
  },
  badgeText: {
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  topicsGrid: {
    paddingHorizontal: scale(20),
    gap: verticalScale(15),
  },
  topicCardWrapper: {
    borderRadius: scale(20), 
    overflow: 'visible',
  },
  topicCard: {
    padding: scale(20),
    borderRadius: scale(20), 
    borderWidth: 1,
    overflow: 'hidden',
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  topicTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    marginRight: scale(10),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(3),
    borderRadius: scale(6),
  },
  statusBorder: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  topicFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  topicCount: {
    fontSize: moderateScale(13),
    opacity: 0.6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    flex: 0.6,
  },
  progressBg: {
    flex: 1,
    height: verticalScale(8),
    borderRadius: scale(4),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(4),
  },
  progressVal: {
    fontSize: moderateScale(12),
    fontWeight: 'bold',
    width: scale(35),
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  emptyText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
  },
  emptyTopicsContainer: {
    padding: scale(40),
    alignItems: 'center',
  },
  emptyTopicsText: {
    fontSize: moderateScale(15),
    textAlign: 'center',
    lineHeight: moderateScale(22),
  },
  stickyHeaderContainer: {
    paddingTop: 0,
    marginHorizontal: 0, 
    zIndex: 10,
    marginBottom: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
  },
});
