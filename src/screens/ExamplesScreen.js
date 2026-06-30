import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowLeft, ChevronRight, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const { scale, verticalScale, moderateScale } = require('../utils/Scaling');

export default function ExamplesScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { lesson, subject } = route.params;
  const [currentExample, setCurrentExample] = useState(0);

  // Mock examples data
  const examples = [
    {
      title: 'Basic Application',
      problem: `Let's apply the fundamental concept of ${lesson.category} to a simple scenario.`,
      solution: `Step 1: Identify the key elements
• First, we recognize the main components
• Then, we understand their relationships

Step 2: Apply the principle
• Use the core concept we learned
• Follow the systematic approach

Step 3: Verify the result
• Check if our solution makes sense
• Ensure all requirements are met`,
      keyTakeaway: 'Always break down complex problems into smaller, manageable steps.',
      why: 'This systematic approach reduces cognitive load and prevents common errors in logic.',
    },
    {
      title: 'Real-World Scenario',
      problem: `How would professionals use ${lesson.category} in their daily work?`,
      solution: `Practical Application:
• Industry experts use this concept regularly
• It helps solve common challenges efficiently
• The same principles apply across different contexts

Implementation Steps:
1. Analyze the situation
2. Choose the appropriate method
3. Execute with precision
4. Review and optimize`,
      keyTakeaway: 'Understanding theory enables practical problem-solving in real situations.',
      why: 'Bridging the gap between abstract concepts and concrete needs is how value is created in industry.',
    },
    {
      title: 'Advanced Technique',
      problem: `Let's explore a more complex application of what we've learned.`,
      solution: `Advanced Strategy:
• Build upon the basics we covered
• Combine multiple concepts together
• Apply critical thinking skills

Process:
→ Start with the foundation
→ Layer additional techniques
→ Integrate everything smoothly
→ Achieve optimal results`,
      keyTakeaway: 'Mastery comes from combining basic principles in creative ways.',
      why: 'Complex problems rarely have a single-concept solution; integration is the key to advanced mastery.',
    },
  ];

  const totalExamples = examples.length;
  const currentExampleData = examples[currentExample];
  const progress = ((currentExample + 1) / totalExamples) * 100;

  const handleNext = () => {
    if (currentExample < totalExamples - 1) {
      setCurrentExample(currentExample + 1);
    } else {
      // After all examples, go to quiz
      navigation.navigate('Quiz', { lesson, subject });
    }
  };

  const handlePrevious = () => {
    if (currentExample > 0) {
      setCurrentExample(currentExample - 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              Examples
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
              {currentExample + 1} of {totalExamples}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.1)' }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: lesson.color }]} />
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Example Card */}
          <View style={[styles.exampleCardWrapper, { shadowColor: lesson.color }]}>
            <BlurView intensity={isDark ? 20 : 30} tint={isDark ? "dark" : "light"} style={[styles.exampleCard, { borderColor: theme.colors.glassBorder }]}>
              <LinearGradient
                colors={isDark 
                  ? [`${lesson.color}30`, `${lesson.color}10`, 'transparent'] 
                  : [`${lesson.color}20`, `${lesson.color}10`, `${lesson.color}05`]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Example Title */}
              <View style={[styles.titleContainer, { marginBottom: verticalScale(20) }]}>
                <Text
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={{ fontSize: moderateScale(22), color: isDark ? '#FFFFFF' : '#000000', fontFamily: theme.typography.fontFamily, lineHeight: moderateScale(30) }}
                >
                  Example Title:{' '}
                  <Text style={{ fontWeight: '800', textDecorationLine: 'underline', color: lesson.color }}>
                    {currentExampleData.title}
                  </Text>
                </Text>
              </View>

              {/* Problem Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: '#EF4444', fontFamily: theme.typography.fontFamily }]}>
                  Problem: <Text style={{ color: theme.colors.textSecondary, fontWeight: '400' }}>{currentExampleData.problem}</Text>
                </Text>
              </View>

              {/* Solution Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: '#10B981', fontFamily: theme.typography.fontFamily }]}>
                  Solution:
                </Text>
                <View style={[styles.solutionBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.glassBorder }]}>
                  <Text style={[styles.sectionContent, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {currentExampleData.solution}
                  </Text>
                </View>
              </View>

              {/* Custom Key Takeaway */}
              <View style={styles.takeawayWrapper}>
                <View style={[styles.takeawayCard, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }]}>
                  <View style={styles.takeawayAccent} />
                  <View style={[styles.takeawayContent, { marginLeft: scale(16) }]}>
                    <Text style={[styles.takeawayHeader, { fontFamily: theme.typography.fontFamily }]}>KEY TAKEAWAY</Text>
                    <Text style={[styles.takeawayText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                      WHAT: {currentExampleData.keyTakeaway}
                    </Text>
                    {currentExampleData.why && (
                      <Text style={[styles.takeawayText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginTop: 10 }]}>
                        WHY: {currentExampleData.why}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </BlurView>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentExample > 0 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.prevButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
              onPress={handlePrevious}
            >
              <Text style={[styles.navButtonText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                Previous
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton, { backgroundColor: lesson.color, marginLeft: currentExample > 0 ? 12 : 0 }]}
            onPress={handleNext}
          >
            <Text style={[styles.navButtonText, { color: '#FFFFFF', fontFamily: theme.typography.fontFamily }]}>
              {currentExample === totalExamples - 1 ? 'Take Quiz' : 'Next Example'}
            </Text>
            <ChevronRight color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>
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
  header: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(16),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  headerInfo: {
    marginBottom: verticalScale(12),
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    marginTop: verticalScale(4),
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: verticalScale(6),
    borderRadius: scale(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(3)
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scale(20),
  },
  exampleCardWrapper: {
    borderRadius: scale(28),
    overflow: 'visible',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 10,
  },
  exampleCard: {
    padding: scale(24),
    borderWidth: 1,
    borderRadius: scale(28),
    overflow: 'hidden',
  },
  titleContainer: {
    marginBottom: verticalScale(24),
    alignSelf: 'flex-start',
  },
  exampleTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    paddingBottom: verticalScale(4),
  },
  section: {
    marginBottom: verticalScale(24),
  },
  sectionLabel: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    marginBottom: verticalScale(8),
  },
  sectionContent: {
    fontSize: moderateScale(15),
    lineHeight: moderateScale(26),
  },
  solutionBox: {
    padding: scale(16),
    borderRadius: scale(16),
    borderWidth: 1,
  },
  takeawayWrapper: {
    marginTop: verticalScale(10),
    borderRadius: scale(24),
    overflow: 'hidden',
  },
  takeawayCard: {
    flexDirection: 'row',
    padding: scale(20),
    borderRadius: scale(24),
    alignItems: 'center',
  },
  takeawayAccent: {
    position: 'absolute',
    left: 0,
    top: verticalScale(20),
    bottom: verticalScale(20),
    width: scale(6),
    backgroundColor: '#EF4444',
    borderTopRightRadius: scale(4),
    borderBottomRightRadius: scale(4),
  },
  takeawayIconContainer: {
    marginRight: scale(16),
    marginLeft: scale(8),
  },
  takeawayIconCircle: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  takeawayContent: {
    flex: 1,
  },
  takeawayHeader: {
    color: '#EF4444',
    fontSize: moderateScale(12),
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: verticalScale(4),
  },
  takeawayText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    lineHeight: moderateScale(24),
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(16),
    paddingBottom: verticalScale(24),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(24),
    borderRadius: scale(20),
    gap: scale(8),
  },
  prevButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  navButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
});
