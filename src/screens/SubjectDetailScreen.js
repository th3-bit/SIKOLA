import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, BookOpen, Clock, Award, Search, Lock, Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import { getSubjectStyle } from '../constants/SubjectConfig';
import LessonCard from '../components/LessonCard';
import LockStatusModal from '../components/LockStatusModal';
import Skeleton from '../components/Skeleton';

const { width } = Dimensions.get('window');

export default function SubjectDetailScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  // Safe params destructuring
  const params = route.params || {};
  const subject = params.subject || {};
  const subjectIndex = params.subjectIndex;
  
  const { courseProgress, checkAccess, subscriptions, isTrialExpired } = useProgress();
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

  useEffect(() => {
    if (subject.id) {
      fetchSubjectContent();
    }
  }, [subject.id, courseProgress]);

  const fetchSubjectContent = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching detail for subject:', subject);

      const { data: topics, error } = await supabase
        .from('topics')
        .select(`
          *,
          lessons (id, duration)
        `)
        .eq('subject_id', subject.id)
        .order('created_at', { ascending: true });

      if (error) {
          console.error('Supabase Error in SubjectDetail:', error);
          throw error;
      }

      console.log('Fetched topics:', topics);

      if (topics) {
        let totalCompleted = 0;
        let totalDuration = 0;
        let infoList = [];

        topics.forEach(topic => {
           const subLessons = topic.lessons || [];
           const completedSubCount = subLessons.filter(l => courseProgress[l.id]?.completed).length;
           const progress = subLessons.length > 0 ? Math.round((completedSubCount / subLessons.length) * 100) : 0;
           
           if (progress === 100) totalCompleted++;
           
           // Calculate estimated duration from nested lessons or default
           const topicDuration = topic.lessons?.reduce((sum, l) => sum + (l.duration || 15), 0) || 15;
           totalDuration += topicDuration;

           infoList.push({
             id: topic.id,
             title: topic.title,
             category: subject.name,
             progress: progress,
             duration: topicDuration,
             color: subject.color,
             // Pass full object for navigation
             ...topic
           });
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
      console.error('Error fetching subject details:', error);
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
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
        }]}>
          <View style={styles.statsRow}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.statItem}>
                <Skeleton width={44} height={44} borderRadius={14} style={{ marginBottom: 8 }} />
                <Skeleton width={40} height={20} style={{ marginBottom: 4 }} />
                <Skeleton width={60} height={12} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Curriculum List Skeleton */}
      <View style={styles.lessonsContent}>
        <View style={styles.sectionHeaderRow}>
          <Skeleton width={100} height={24} />
          <Skeleton width={80} height={18} />
        </View>

        <View style={styles.curriculumList}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.curriculumItemWrapper}>
              <View style={styles.curriculumItemLeft}>
                <Skeleton width={30} height={30} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
                  <Skeleton width="40%" height={14} />
                </View>
              </View>
              <Skeleton width={28} height={28} borderRadius={14} />
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            >
              <ArrowLeft color={theme.colors.textPrimary} size={24} />
            </TouchableOpacity>
 
             <TouchableOpacity 
               onPress={() => navigation.navigate('Search')}
               style={[styles.iconButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
             >
               <Search color={theme.colors.textPrimary} size={24} />
             </TouchableOpacity>
           </View>
           
           <View style={[styles.headerContent, { 
             backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
             borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
           }]}>
             <View style={[styles.subjectIcon, { backgroundColor: `${subject.color || '#8B5CF6'}15` }]}>
               {(() => {
                 const IconComponent = typeof subject.icon === 'function' 
                   ? subject.icon 
                   : getSubjectStyle(subject.name).icon;
                 return <IconComponent color={subject.color || '#8B5CF6'} size={32} />;
               })()}
             </View>
             <View style={styles.headerText}>
               <Text style={[styles.subjectName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                 {subject.name || 'Topic'}
               </Text>
               <Text style={[styles.lessonCount, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                 {stats.total} courses available
               </Text>
             </View>
           </View>
         </View>
 
         {loading ? (
            <SubjectDetailSkeleton />
         ) : (
          <>
            {/* Stats Card */}
            <View style={[styles.statsCardWrapper, { shadowColor: subject.color || '#8B5CF6' }]}>
              <View style={[
                styles.statsCard, 
                { 
                  backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
                }
              ]}>
                
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${subject.color || '#8B5CF6'}15` }]}>
                      <BookOpen color={subject.color || '#8B5CF6'} size={20} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                      {stats.completed}/{stats.total}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                      Completed
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${subject.color || '#8B5CF6'}15` }]}>
                      <Clock color={subject.color || '#8B5CF6'} size={20} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                      {stats.totalDuration}m
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                      Total Time
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <View style={[styles.statIconContainer, { backgroundColor: `${subject.color || '#8B5CF6'}15` }]}>
                      <Award color={subject.color || '#8B5CF6'} size={20} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                      {stats.avgProgress}%
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                      Progress
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Topics/Lessons List (Curriculum Style) */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.lessonsContent}
              showsVerticalScrollIndicator={false}
            >
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

                   return (
                     <TouchableOpacity
                       key={lesson.id}
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
                          }
                        }}
                       style={styles.curriculumItemWrapper}
                     >
                      <View style={styles.curriculumItemLeft}>
                        <Text style={[styles.indexText, { color: isLocked ? theme.colors.textSecondary : subject.color || theme.colors.secondary, opacity: isLocked ? 0.3 : 0.5, fontFamily: theme.typography.fontFamily }]}>
                          {(index + 1).toString().padStart(2, '0')}
                        </Text>
                        <View style={styles.curriculumTextContent}>
                           <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                             <Text style={[styles.curriculumTitle, { color: isLocked ? (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)') : theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginRight: 8 }]}>
                               {lesson.title}
                             </Text>
                             
                             {/* Access Badges */}
                             {isFree ? (
                               <View style={[styles.badge, styles.freeBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                                 <Text style={styles.freeBadgeText}>FREE</Text>
                               </View>
                             ) : accessType ? (
                               <View style={[styles.badge, styles.subscribedBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' }]}>
                                 <Sparkles size={10} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                                 <Text style={styles.subscribedBadgeText}>{accessType}</Text>
                               </View>
                             ) : isLocked && (
                               <View style={[styles.badge, styles.premiumBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                                 <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                               </View>
                             )}
                           </View>
                           <Text style={[styles.curriculumSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                             {lesson.duration} mins • {lesson.category}
                           </Text>
                           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                              <View style={{ flex: 1, height: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
                                 <View style={{ width: `${lesson.progress}%`, height: '100%', backgroundColor: isLocked ? theme.colors.textSecondary : (subject.color || theme.colors.secondary), borderRadius: 2, opacity: isLocked ? 0.3 : 1 }} />
                              </View>
                              <Text style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: 'bold' }}>{lesson.progress}%</Text>
                           </View>
                        </View>
                      </View>

                      <View style={styles.curriculumItemRight}>
                         {lesson.progress >= 100 ? (
                            <View style={[styles.statusIcon, { backgroundColor: '#10B981' }]}>
                               <Award size={14} color="#FFF" />
                            </View>
                         ) : isLocked ? (
                            <View style={[styles.statusIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                               <Lock size={14} color={theme.colors.textSecondary} /> 
                            </View>
                         ) : (
                            <View style={[styles.statusBorder, { borderColor: subject.color || theme.colors.secondary }]}>
                               <View style={[styles.playTriangle, { borderLeftColor: subject.color || theme.colors.secondary }]} />
                            </View>
                         )}
                      </View>
                    </TouchableOpacity>
                   );
                })}
              </View>

              {/* Learning Tip / Motivation */}
              <View style={[styles.tipCard, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)', borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)' }]}>
                 <Sparkles size={20} color="#8B5CF6" />
                 <View style={styles.tipContent}>
                    <Text style={[styles.tipTitle, { color: theme.colors.textPrimary }]}>Pro Learning Tip</Text>
                    <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                       Did you know? Reviewing a course within 24 hours of first studying it increases memory retention by up to 80%!
                    </Text>
                 </View>
              </View>


              <View style={{ height: 100 }} />
            </ScrollView>
          </>
        )}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
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
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'visible',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  curriculumList: {
    gap: 15,
  },
  curriculumItemWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  curriculumItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 15,
  },
  tipCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 15,
    alignItems: 'flex-start',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  indexText: {
    fontSize: 24,
    fontWeight: '900',
    marginRight: 20,
    width: 40, 
  },
  curriculumTextContent: {
    flex: 1,
  },
  curriculumTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  curriculumSubtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  curriculumItemRight: {
    paddingLeft: 10,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBorder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'black', // overwritten inline
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2, 
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeBadge: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  freeBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subscribedBadge: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  subscribedBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  premiumBadgeText: {
    color: 'rgba(128, 128, 128, 0.8)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
