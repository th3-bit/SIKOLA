import React, { useState, useEffect, useRef } from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Animated, BackHandler, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Clock, Award, Search, Lock, Sparkles, Play } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';
import LessonCard from '../components/LessonCard';
import LockStatusModal from '../components/LockStatusModal';
import Skeleton from '../components/Skeleton';

const { width } = Dimensions.get('window');

export default function SubjectDetailScreen({ route, navigation }) {
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  const { theme, isDark } = useTheme();
  // Safe params destructuring
  const params = route.params || {};
  const subject = params.subject || {};
  const subjectIndex = params.subjectIndex;
  
  const { courseProgress, checkAccess, subscriptions, isTrialExpired, subjects } = useProgress();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completed: 0,
    total: 0,
    totalDuration: 0,
    avgProgress: 0
  });
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockConfig, setLockConfig] = useState({ type: 'subscription', title: '', message: '', onAction: null });

  // LED pulse animation for subscribed cards
  const ledPulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(ledPulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(ledPulse, { toValue: 0.45, duration: 1800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (subject.id) {
      fetchSubjectContent();
    }
  }, [subject.id, courseProgress]);

  // Mirror the UI back button: hardware back returns to wherever the user came from
  useEffect(() => {
    const onHardwareBack = () => {
      navigation.goBack();
      return true; // Prevent default back behavior
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [navigation]);

  const fetchSubjectContent = async () => {
    try {
      setLoading(true);
      
      const fullSubject = subjects?.find(s => s.id === subject.id);
      const topics = fullSubject?.topics || [];

      if (topics.length > 0) {
        let totalCompleted = 0;
        let totalDuration = 0;

        // Fetch lessons for ALL topics in one query for accuracy
        const topicIds = topics.map(t => t.id);
        const { data: allLessons } = await supabase
          .from('lessons')
          .select('id, topic_id, duration')
          .in('topic_id', topicIds);

        const lessonsByTopic = {};
        (allLessons || []).forEach(l => {
          if (!lessonsByTopic[l.topic_id]) lessonsByTopic[l.topic_id] = [];
          lessonsByTopic[l.topic_id].push(l);
        });

        const infoList = topics.map(topic => {
           // Use fresh Supabase lesson list for accurate counts
           const subLessons = lessonsByTopic[topic.id] || topic.lessons || [];
           
           // courseProgress is keyed by lesson.id (set in completeTopic(subject.id, lesson.id))
           const completedCount = subLessons.filter(l => courseProgress[l.id]?.completed === true).length;
           const progress = subLessons.length > 0 ? Math.round((completedCount / subLessons.length) * 100) : 0;
           
           if (progress === 100) totalCompleted++;
           
           const topicDuration = subLessons.reduce((sum, l) => sum + (l.duration || 15), 0);
           totalDuration += topicDuration;

           return {
             ...topic,
             category: subject.name,
             progress,
             duration: topicDuration,
             color: subject.color,
           };
        });

        setLessons(infoList);
        
        const avg = infoList.length > 0 
           ? Math.round(infoList.reduce((acc, curr) => acc + curr.progress, 0) / infoList.length) 
           : 0;

        setStats({
          completed: totalCompleted,
          total: infoList.length,
          totalDuration,
          avgProgress: avg
        });
      }
    } catch (error) {
      logger.error('Error fetching subject details:', error);
    } finally {
      setLoading(false);
    }
  };


  const SubjectDetailSkeleton = () => (
    <View style={{ flex: 1 }}>
      {/* Stats Card Skeleton */}
      <View style={[styles.statsCardWrapper, { opacity: 0.6 }]}>
        <View style={[styles.statsCard, { 
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)'
        }]}>
          <View style={styles.statsRow}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.statItem}>
                <Skeleton width={scale(36)} height={verticalScale(36)} borderRadius={scale(12)} style={{ marginBottom: verticalScale(4) }} />
                <Skeleton width={scale(36)} height={verticalScale(16)} style={{ marginBottom: verticalScale(2) }} />
                <Skeleton width={scale(50)} height={verticalScale(10)} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Curriculum List Skeleton */}
      <View style={styles.lessonsContent}>
        <View style={styles.sectionHeaderRow}>
          <Skeleton width={scale(100)} height={verticalScale(24)} />
          <Skeleton width={scale(80)} height={verticalScale(18)} />
        </View>

        <View style={styles.curriculumList}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.curriculumItemWrapper}>
              <View style={styles.curriculumItemLeft}>
                <Skeleton width={scale(30)} height={verticalScale(30)} style={{ marginRight: scale(10) }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width="60%" height={verticalScale(18)} style={{ marginBottom: verticalScale(8) }} />
                  <Skeleton width="40%" height={verticalScale(14)} />
                </View>
              </View>
              <Skeleton width={scale(28)} height={verticalScale(28)} borderRadius={scale(14)} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={isLargeScreen ? styles.scrollContentLarge : styles.scrollContent}
        >
          <View style={isLargeScreen ? styles.largeScreenContainer : null}>
            
            {/* Left Column (Sticky Header & Stats) */}
            <View style={isLargeScreen ? [styles.leftColumn, { 
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.6)',
              borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)',
              borderWidth: 1,
              borderRadius: scale(32),
              padding: scale(20),
            }] : null}>
              <View style={[styles.header, isLargeScreen && { paddingHorizontal: 0, paddingTop: 10 }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
            >
              <ArrowLeft color={theme.colors.textPrimary} size={24} />
            </TouchableOpacity>
 
             <TouchableOpacity 
               onPress={() => navigation.navigate('Search')}
               style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
             >
               <Search color={theme.colors.textPrimary} size={scale(24)} />
             </TouchableOpacity>
           </View>
           
           <View style={styles.headerMainContent}>
             <View style={[styles.subjectIcon, { backgroundColor: `${subject.color || '#8B5CF6'}15`, borderColor: `${subject.color || '#8B5CF6'}30`, borderWidth: scale(2) }]}>
               {(() => {
                 const IconComponent = typeof subject.icon === 'function' 
                   ? subject.icon 
                   : getSubjectStyle(subject.name).icon;
                 return <IconComponent color={subject.color || '#8B5CF6'} size={moderateScale(32)} />;
               })()}
             </View>
             <View style={styles.headerText}>
                <Text numberOfLines={1} style={[styles.subjectName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {subject.name || 'Topic'}
                </Text>
               <View style={styles.headerStatsLabelRow}>
                  <BookOpen size={scale(14)} color={theme.colors.textSecondary} />
                  <Text style={[styles.lessonCount, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, fontSize: moderateScale(12) }]}>
                    {stats.total} Courses Available
                  </Text>
               </View>
             </View>
           </View>
              </View>

              {/* Stats Card (only show if not loading) */}
              {!loading && (
                <View style={[styles.statsRow, { marginBottom: verticalScale(25) }, isLargeScreen && { flexDirection: 'column', gap: 12, paddingHorizontal: 0 }]}>
                  <View style={[styles.statItem, { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : `${subject.color || '#8B5CF6'}08`,
                    borderColor: isDark ? 'rgba(255,255,255,0.20)' : `${subject.color || '#8B5CF6'}15`,
                    borderWidth: scale(1.5),
                    padding: scale(10),
                    borderRadius: moderateScale(16),
                    marginHorizontal: isLargeScreen ? 0 : scale(4),
                    width: isLargeScreen ? '100%' : undefined
                  }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${subject.color || '#8B5CF6'}15` }]}>
                      <BookOpen color={subject.color || '#8B5CF6'} size={scale(18)} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, fontSize: moderateScale(15) }]}>
                      {stats.completed}/{stats.total}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, opacity: isDark ? 0.6 : 0.8, fontSize: moderateScale(10) }]}>
                      Done
                    </Text>
                  </View>

                  <View style={[styles.statItem, { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : `${subject.color || '#8B5CF6'}08`,
                    borderColor: isDark ? 'rgba(255,255,255,0.20)' : `${subject.color || '#8B5CF6'}15`,
                    borderWidth: scale(1.5),
                    padding: scale(10),
                    borderRadius: moderateScale(16),
                    marginHorizontal: isLargeScreen ? 0 : scale(4),
                    width: isLargeScreen ? '100%' : undefined
                  }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${subject.color || '#8B5CF6'}15` }]}>
                      <Clock color={subject.color || '#8B5CF6'} size={scale(18)} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, fontSize: moderateScale(15) }]}>
                      {stats.totalDuration}m
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, opacity: isDark ? 0.6 : 0.8, fontSize: moderateScale(10) }]}>
                      Duration
                    </Text>
                  </View>

                  <View style={[styles.statItem, { 
                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : `${subject.color || '#8B5CF6'}08`,
                    borderColor: isDark ? 'rgba(255,255,255,0.20)' : `${subject.color || '#8B5CF6'}15`,
                    borderWidth: scale(1.5),
                    padding: scale(10),
                    borderRadius: moderateScale(16),
                    marginHorizontal: isLargeScreen ? 0 : scale(4),
                    width: isLargeScreen ? '100%' : undefined
                  }]}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${subject.color || '#8B5CF6'}15` }]}>
                      <Award color={subject.color || '#8B5CF6'} size={scale(18)} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, fontSize: moderateScale(15) }]}>
                      {stats.avgProgress}%
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, opacity: isDark ? 0.6 : 0.8, fontSize: moderateScale(10) }]}>
                      Progress
                    </Text>
                  </View>
              </View>
              )}
            </View>

            {/* Right Column (Courses List & Skeleton) */}
            <View style={isLargeScreen ? [styles.rightColumnGlass, { 
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.4)' : 'rgba(255, 255, 255, 0.6)',
              borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)'
            }] : { flex: 1 }}>
              
              {loading ? (
                <SubjectDetailSkeleton />
              ) : (
              <View style={[styles.scrollView, isLargeScreen && { paddingHorizontal: 0 }]}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  Courses
                </Text>
                <Text style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }}>
                  {lessons.length} Courses
                </Text>
              </View>
              
              <View style={styles.curriculumList}>
                {lessons.map((lesson, index) => {
                   const hasSubscriptionAccess = checkAccess(lesson.id, subject.id, index, subjectIndex);
                   // A Course is only locked if they don't have subscription/free access
                   const isLocked = !hasSubscriptionAccess;
                   
                   const hasActiveSub = subscriptions && subscriptions.length > 0;
                   const isFree = index < 2 && !hasActiveSub && !isTrialExpired;

                   // Granular Subscription Badge logic
                   let accessType = null;
                   if (hasActiveSub && hasSubscriptionAccess) {
                      const isAllAccess = subscriptions.some(s => !s.topic_id && !s.subject_id);
                      const isSubjectAccess = subscriptions.some(s => s.subject_id === subject.id);
                      const isSpecificAccess = subscriptions.some(s => s.topic_id === lesson.id);
                      
                      if (isAllAccess) accessType = 'ALL ACCESS';
                      else if (isSubjectAccess) accessType = 'SUBSCRIBED';
                      else if (isSpecificAccess) accessType = 'SUBSCRIBED';
                   }

                   // Subscribed LED glow: wrap card with outer shadow, add pulsing inner border
                   const isSubscribed = accessType !== null;
                   const cardColor = subject.color || '#8B5CF6';

                   return (
                     <View
                       key={lesson.id}
                       style={isSubscribed ? {
                         borderRadius: moderateScale(20),
                         // Tight outer glow that hugs the card shape — the LED backlight
                         shadowColor: cardColor,
                         shadowOffset: { width: 0, height: 0 },
                         shadowOpacity: 0.55,
                         shadowRadius: scale(7),
                         elevation: 10,
                       } : null}
                     >
                       <TouchableOpacity
                         activeOpacity={0.7}
                          onPress={() => {
                            if (!isLocked) {
                              navigation.navigate('LessonDetail', { 
                                lesson: lesson, 
                                subject: subject, 
                                subjectIndex: subjectIndex,
                                topicIndex: index 
                              });
                            } else {
                               const hasAnySub = subscriptions && subscriptions.length > 0;
                               if (hasAnySub) {
                                  setLockConfig({
                                    type: 'subscription',
                                    title: "Course Not Included",
                                    message: "This specific course is not part of your current plan. Purchase this course individually or upgrade to a Full Access plan to unlock all content.",
                                    onAction: () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: lesson.id, title: lesson.title } }); }
                                  });
                               } else {
                                  setLockConfig({
                                    type: 'subscription',
                                    title: "Unlock Premium Content",
                                    message: "Get unlimited access to all topics, detailed notes, comprehensive tests, and more with SIKOLA Premium.",
                                    onAction: () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: lesson.id, title: lesson.title } }); }
                                  });
                               }
                               setShowLockModal(true);
                            }
                          }}
                         style={[styles.curriculumItemCard, { 
                           backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                           // Subscribed: colored border = the LED strip; others: subtle border
                           borderColor: isSubscribed ? cardColor : (isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.16)'),
                           borderWidth: isSubscribed ? scale(1.5) : scale(2),
                           // Shadow moved to wrapper for subscribed cards
                           shadowColor: isSubscribed ? 'transparent' : (isLocked ? '#000' : cardColor),
                           shadowOpacity: isSubscribed ? 0 : (isLocked ? 0.05 : 0.08),
                           elevation: isSubscribed ? 0 : 4,
                         }]}
                       >
                          {/* Background gradient */}
                          <LinearGradient
                            colors={isLocked ? ['transparent', 'transparent'] : [`${cardColor}${isDark ? '10' : '05'}`, 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                          />

                          {/* LED inner ambient glow — fills corners with subject color */}
                          {isSubscribed && (
                            <LinearGradient
                              colors={[
                                `${cardColor}22`,
                                `${cardColor}08`,
                                `${cardColor}08`,
                                `${cardColor}18`,
                              ]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={StyleSheet.absoluteFill}
                              pointerEvents="none"
                            />
                          )}

                          {/* Pulsing LED border overlay — contained by overflow:hidden */}
                          {isSubscribed && (
                            <Animated.View
                              pointerEvents="none"
                              style={{
                                position: 'absolute',
                                top: 0, left: 0, right: 0, bottom: 0,
                                borderRadius: moderateScale(19),
                                borderWidth: scale(2),
                                borderColor: cardColor,
                                opacity: ledPulse,
                              }}
                            />
                          )}

                          <View style={styles.curriculumItemLeft}>
                            <Text style={[styles.indexText, { color: isLocked ? theme.colors.textSecondary : cardColor, opacity: isSubscribed ? 0.6 : (isDark ? 0.2 : 0.4), fontFamily: theme.typography.fontFamily }]}>
                              {(index + 1).toString().padStart(2, '0')}
                            </Text>
                            <View style={styles.curriculumTextContent}>
                                <Text numberOfLines={1} style={[styles.curriculumTitle, { color: isLocked ? (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)') : theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, flexShrink: 1, marginBottom: verticalScale(2) }]}>
                                  {lesson.title}
                                </Text>
                                <Text style={[styles.curriculumSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, opacity: isDark ? 0.5 : 0.7 }]}>
                                  {lesson.duration} mins • {lesson.category}
                                </Text>
                                
                                <View style={styles.progressRow}>
                                   <View style={styles.progressBarWrapper}>
                                      <View style={[styles.progressBarFill, { width: `${lesson.progress}%`, backgroundColor: isLocked ? theme.colors.textSecondary : cardColor, opacity: isLocked ? 0.3 : (isDark ? 1 : 0.9) }]} />
                                   </View>
                                   <Text style={[styles.progressValText, { color: theme.colors.textSecondary, opacity: isDark ? 1 : 0.8 }]}>{lesson.progress}%</Text>
                                </View>
                            </View>
                          </View>
    
                          <View style={[styles.curriculumItemRight, { alignItems: 'flex-end', gap: scale(6) }]}>
                             {/* Access Badges */}
                             {isFree ? (
                               <View style={[styles.badge, styles.freeBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)' }]}>
                                 <Text style={styles.freeBadgeText}>FREE</Text>
                               </View>
                             ) : accessType ? (
                               <View style={[styles.badge, { backgroundColor: `${cardColor}25`, borderColor: `${cardColor}60`, borderWidth: 1 }]}>
                                 <Sparkles size={scale(10)} color={cardColor} fill={cardColor} style={{ marginRight: scale(4) }} />
                                 <Text style={[styles.subscribedBadgeText, { color: cardColor, fontSize: moderateScale(9) }]}>{accessType}</Text>
                               </View>
                             ) : isLocked && (
                               <View style={[styles.badge, styles.premiumBadge, { backgroundColor: `${cardColor}15`, borderColor: `${cardColor}30`, borderWidth: scale(0.5) }]}>
                                 <Text style={[styles.premiumBadgeText, { color: cardColor }]}>PREMIUM</Text>
                               </View>
                             )}

                             {lesson.progress >= 100 ? (
                                 <View style={[styles.statusIcon, { backgroundColor: '#10B981', shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: scale(5), elevation: 3 }]}>
                                    <Award size={scale(14)} color="#FFF" />
                                 </View>
                             ) : isLocked ? (
                                 <View style={[styles.statusIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
                                    <Lock size={scale(12)} color={theme.colors.textSecondary} /> 
                                 </View>
                              ) : (
                                 <View style={[styles.statusBorder, { 
                                   backgroundColor: `${cardColor}20`,
                                   borderColor: isSubscribed ? `${cardColor}80` : `${cardColor}40`,
                                   borderWidth: scale(1.5)
                                 }]}>
                                     <Play size={scale(16)} color={cardColor} fill={cardColor} />
                                  </View>
                              )}
                          </View>
                        </TouchableOpacity>
                      </View>
                   );
                })}
              </View>

              {/* Learning Tip / Motivation */}
              <View style={[styles.tipCard, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)', borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)', borderWidth: scale(1.5) }]}>
                 <Sparkles size={scale(20)} color="#8B5CF6" />
                 <View style={styles.tipContent}>
                    <Text style={[styles.tipTitle, { color: theme.colors.textPrimary }]}>Pro Learning Tip</Text>
                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                       Did you know? Reviewing a course within 24 hours of first studying it increases memory retention by up to 80%!
                    </Text>
                 </View>
              </View>


              <View style={{ height: verticalScale(140) }} />
              </View>
              )}
            </View>

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
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: verticalScale(120),
  },
  scrollContentLarge: {
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(120),
  },
  largeScreenContainer: {
    flexDirection: 'row',
    gap: scale(30),
    alignItems: 'flex-start',
  },
  leftColumn: {
    flex: 1,
    maxWidth: 350,
    position: 'sticky',
    top: verticalScale(10),
    zIndex: 10,
  },
  rightColumnGlass: {
    flex: 2,
    borderRadius: scale(32),
    borderWidth: 1,
    padding: scale(20),
    overflow: 'hidden',
  },

  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(8),
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  iconButton: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: verticalScale(12),
  },
  subjectIcon: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(16),
  },
  headerText: {
    flex: 1,
  },
  subjectName: {
    fontSize: moderateScale(22),
    fontWeight: '900',
    marginBottom: verticalScale(2),
    letterSpacing: -0.5,
  },
  headerStatsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  lessonCount: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  statIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontSize: moderateScale(15),
    fontWeight: '900',
    marginBottom: 0,
  },
  statLabel: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  lessonsContent: {
    paddingHorizontal: scale(20),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  curriculumList: {
    gap: verticalScale(10),
  },
  curriculumItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: verticalScale(12),
    borderRadius: moderateScale(20),
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  curriculumItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: scale(12),
  },
  tipCard: {
    marginTop: verticalScale(20),
    padding: verticalScale(14),
    borderRadius: moderateScale(24),
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: scale(15),
    alignItems: 'flex-start',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    marginBottom: verticalScale(4),
  },
  tipText: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontWeight: '500',
  },
  indexText: {
    fontSize: moderateScale(24),
    fontWeight: '900',
    width: scale(40), 
    textAlign: 'center',
  },
  curriculumTextContent: {
    flex: 1,
  },
  curriculumTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  curriculumSubtitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    opacity: 0.5,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginTop: verticalScale(4),
  },
  progressBarWrapper: {
    flex: 1,
    height: verticalScale(6),
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: scale(3),
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: scale(3),
  },
  progressValText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
  },
  curriculumItemRight: {
    paddingLeft: scale(8),
  },
  statusIcon: {
    width: moderateScale(28),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBorder: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(6),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeBadge: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  freeBadgeText: {
    color: '#10B981',
    fontSize: moderateScale(9),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subscribedBadge: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  subscribedBadgeText: {
    color: '#F59E0B',
    fontSize: moderateScale(9),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  premiumBadgeText: {
    color: 'rgba(128, 128, 128, 0.8)',
    fontSize: moderateScale(9),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
