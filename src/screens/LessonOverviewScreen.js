import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Award, Clock, BookOpen, Target, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import LockStatusModal from '../components/LockStatusModal';

const { width } = Dimensions.get('window');
const { scale, verticalScale, moderateScale } = require('../utils/Scaling');

export default function LessonOverviewScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { lesson, subject, topicIndex } = route.params;
  const { checkLessonAccess, subscriptions } = useProgress();

  const [showLockModal, setShowLockModal] = React.useState(false);
  const [lockConfig, setLockConfig] = React.useState({ type: 'subscription', title: '', message: '', onAction: null });

  // Learning objectives
  const objectives = [
    'Understand the fundamental concepts',
    'Apply knowledge to real-world scenarios',
    'Master practical techniques',
    'Complete hands-on exercises',
  ];

  const rewards = {
    xp: 50,
    duration: lesson.duration,
    difficulty: 'Intermediate',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
            >
              <ArrowLeft color={theme.colors.textPrimary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Hero Card */}
          <View style={[styles.heroCardWrapper]}>
            <View style={[styles.heroCard, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)' 
            }]}>
              <LinearGradient
                colors={isDark 
                  ? [`${lesson.color}30`, `${lesson.color}10`, 'transparent'] 
                  : [`${lesson.color}20`, `${lesson.color}10`, `${lesson.color}05`]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              
              <View style={[styles.categoryBadge, { backgroundColor: `${lesson.color}20` }]}>
                <Text style={[styles.categoryText, { color: lesson.color, fontFamily: theme.typography.fontFamily }]}>
                  {lesson.category}
                </Text>
              </View>

              <Text style={[styles.lessonTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {lesson.title}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Clock color={theme.colors.textSecondary} size={16} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {rewards.duration} min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Award color={theme.colors.textSecondary} size={16} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {rewards.xp} XP
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <BookOpen color={theme.colors.textSecondary} size={16} />
                  <Text style={[styles.metaText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {rewards.difficulty}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* What You'll Learn */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              What You'll Learn
            </Text>
            <View style={[styles.objectivesCard, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)', 
              borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)' 
            }]}>
              {objectives.map((objective, index) => (
                <View key={index} style={styles.objectiveItem}>
                  <View style={[styles.objectiveIcon, { backgroundColor: `${lesson.color}20` }]}>
                    <CheckCircle color={lesson.color} size={18} />
                  </View>
                  <Text style={[styles.objectiveText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {objective}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Rewards */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              Rewards
            </Text>
            <View style={[styles.rewardsCard, { backgroundColor: `${lesson.color}15`, borderColor: `${lesson.color}40` }]}>
              <View style={styles.rewardItem}>
                <Award color={lesson.color} size={24} />
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {rewards.xp} XP
                  </Text>
                  <Text style={[styles.rewardLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    Experience Points
                  </Text>
                </View>
              </View>
              <View style={styles.rewardItem}>
                <Target color={lesson.color} size={24} />
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    Certificate
                  </Text>
                  <Text style={[styles.rewardLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    Upon completion
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: lesson.color }]}
            onPress={() => {
              const lessonIndex = lesson.order_index ?? 0;
              const actualTopicIndex = topicIndex ?? 0;
              const hasAccess = checkLessonAccess(lessonIndex, lesson.topic_id, subject?.id, actualTopicIndex);

              if (!hasAccess) {
                const hasAnySub = subscriptions && subscriptions.length > 0;
                if (hasAnySub) {
                  setLockConfig({
                    type: 'subscription',
                    title: 'Content Locked',
                    message: 'This topic is not included in your current plan. Upgrade to unlock all content in this subject.',
                    onAction: () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: lesson.id, title: lesson.title } }); }
                  });
                } else {
                  setLockConfig({
                    type: 'subscription',
                    title: 'Unlock Premium',
                    message: 'This is a premium topic. Get SIKOLA Premium to unlock all detailed notes and quizzes.',
                    onAction: () => { setShowLockModal(false); navigation.navigate('Subscription', { lockedCourse: { id: lesson.id, title: lesson.title } }); }
                  });
                }
                setShowLockModal(true);
              } else {
                navigation.navigate('LearningContent', { lesson, subject, topicIndex: actualTopicIndex });
              }
            }}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[lesson.color, `${lesson.color}CC`]}
              style={styles.buttonGradient}
            >
              <Play color="#FFFFFF" size={24} fill="#FFFFFF" />
              <Text style={[styles.buttonText, { fontFamily: theme.typography.fontFamily }]}>
                Start Topic
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scale(20),
  },
  header: {
    paddingTop: verticalScale(10),
    marginBottom: verticalScale(20),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCardWrapper: {
    marginBottom: verticalScale(24),
    borderRadius: scale(28),
    overflow: 'visible',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 10,
  },
  heroCard: {
    padding: scale(24),
    borderWidth: 1,
    borderRadius: scale(28),
    overflow: 'hidden',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
    marginBottom: verticalScale(16),
  },
  categoryText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lessonTitle: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    marginBottom: verticalScale(16),
  },
  metaRow: {
    flexDirection: 'row',
    gap: scale(20),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  metaText: {
    fontSize: moderateScale(14),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    marginBottom: verticalScale(12),
  },
  objectivesCard: {
    padding: scale(20),
    borderRadius: scale(20),
    borderWidth: 1,
    gap: verticalScale(16),
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  objectiveIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  objectiveText: {
    flex: 1,
    fontSize: moderateScale(15),
    lineHeight: moderateScale(22),
  },
  rewardsCard: {
    padding: scale(20),
    borderRadius: scale(20),
    borderWidth: 1,
    gap: verticalScale(16),
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
  },
  rewardInfo: {
    flex: 1,
  },
  rewardValue: {
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  rewardLabel: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(2),
  },
  startButton: {
    borderRadius: scale(24),
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(18),
    gap: scale(12),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
});
