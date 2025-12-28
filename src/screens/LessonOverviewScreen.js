import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Play, Award, Clock, BookOpen, Target, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function LessonOverviewScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { lesson, subject } = route.params;

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
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            >
              <ArrowLeft color={theme.colors.textPrimary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Hero Card */}
          <View style={[styles.heroCardWrapper, { shadowColor: lesson.color }]}>
            <BlurView intensity={isDark ? 20 : 30} tint={isDark ? "dark" : "light"} style={[styles.heroCard, { borderColor: theme.colors.glassBorder }]}>
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
            </BlurView>
          </View>

          {/* What You'll Learn */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              What You'll Learn
            </Text>
            <View style={[styles.objectivesCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.7)', borderColor: theme.colors.glassBorder }]}>
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
            onPress={() => navigation.navigate('LearningContent', { lesson, subject })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[lesson.color, `${lesson.color}CC`]}
              style={styles.buttonGradient}
            >
              <Play color="#FFFFFF" size={24} fill="#FFFFFF" />
              <Text style={[styles.buttonText, { fontFamily: theme.typography.fontFamily }]}>
                Start Learning
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 10,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCardWrapper: {
    marginBottom: 24,
    borderRadius: 28,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroCard: {
    padding: 24,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lessonTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  objectivesCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  objectiveIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  objectiveText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  rewardsCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  rewardLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  startButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
