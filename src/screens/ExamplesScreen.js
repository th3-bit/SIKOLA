import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowLeft, ChevronRight, Lightbulb, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ExamplesScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { lesson, subject } = route.params;
  const [currentExample, setCurrentExample] = useState(0);

  // Mock examples data
  const examples = [
    {
      title: 'Example 1: Basic Application',
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
    },
    {
      title: 'Example 2: Real-World Scenario',
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
    },
    {
      title: 'Example 3: Advanced Technique',
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
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
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
            <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
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

              {/* Example Badge */}
              <View style={[styles.exampleBadge, { backgroundColor: `${lesson.color}20` }]}>
                <Lightbulb color={lesson.color} size={20} />
                <Text style={[styles.exampleBadgeText, { color: lesson.color, fontFamily: theme.typography.fontFamily }]}>
                  {currentExampleData.title}
                </Text>
              </View>

              {/* Problem Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  Problem
                </Text>
                <Text style={[styles.sectionContent, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                  {currentExampleData.problem}
                </Text>
              </View>

              {/* Solution Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  Solution
                </Text>
                <View style={[styles.solutionBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.colors.glassBorder }]}>
                  <Text style={[styles.sectionContent, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {currentExampleData.solution}
                  </Text>
                </View>
              </View>

              {/* Key Takeaway */}
              <View style={[styles.takeawayCard, { backgroundColor: `${lesson.color}15`, borderColor: `${lesson.color}40` }]}>
                <View style={styles.takeawayHeader}>
                  <CheckCircle color={lesson.color} size={20} />
                  <Text style={[styles.takeawayTitle, { color: lesson.color, fontFamily: theme.typography.fontFamily }]}>
                    Key Takeaway
                  </Text>
                </View>
                <Text style={[styles.takeawayText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {currentExampleData.keyTakeaway}
                </Text>
              </View>
            </BlurView>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentExample > 0 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.prevButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  exampleCardWrapper: {
    borderRadius: 28,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  exampleCard: {
    padding: 24,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  exampleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  exampleBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 26,
  },
  solutionBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  takeawayCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  takeawayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  takeawayTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  takeawayText: {
    fontSize: 15,
    lineHeight: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 8,
  },
  prevButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
