import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowLeft, CheckCircle, X, Award, TrendingUp } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';

const { width } = Dimensions.get('window');

export default function QuizScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { completeTopic } = useProgress();
  // Safe params destructuring
  const { 
    lesson: initialLesson, 
    subject, 
    questions: passedQuestions, 
    topic, 
    isComprehensive 
  } = route.params || {};

  // Comprehensive test might not have a single 'lesson', so we use topic/subject
  const lesson = initialLesson || topic || { name: 'Test', color: subject?.color || theme.colors.secondary };
  const primaryColor = lesson.color || subject?.color || theme.colors.secondary;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  // Use passed questions or empty array
  const questions = passedQuestions || [];

  if (questions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.colors.textPrimary }}>No questions found for this test.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.colors.secondary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalQuestions = questions.length;
  const currentQuestionData = questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];
  const isAnswered = selectedAnswer !== undefined;

  const handleAnswerSelect = (optionIndex) => {
    if (!isAnswered) {
      setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: optionIndex });
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: totalQuestions,
      percentage: Math.round((correct / totalQuestions) * 100)
    };
  };

  const handleContinue = async () => {
    const score = calculateScore();
    if (isComprehensive) {
      // Save the score for the topic
      if (topic) {
        await completeTopic(subject?.id, topic.id, score.percentage);
      }
      // Go back to the test/practice list
      navigation.navigate('MainApp', { screen: 'Test' });
    } else if (score.percentage >= 60) {
      // Pass - go to learning content (normal lesson quiz)
      navigation.navigate('LearningContent', { lesson, subject });
    } else {
      // Fail - go back to lesson detail
      navigation.goBack();
    }
  };

  if (showResults) {
    const score = calculateScore();
    const passed = score.percentage >= 60;

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
            {/* Results Card */}
            <View style={[styles.resultsCardWrapper, { shadowColor: passed ? '#10B981' : '#EF4444' }]}>
              <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[styles.resultsCard, { borderColor: theme.colors.glassBorder }]}>
                <LinearGradient
                  colors={passed 
                    ? ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)', 'transparent']
                    : ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)', 'transparent']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />

                <View style={[styles.resultIcon, { backgroundColor: passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                  {passed ? (
                    <CheckCircle color="#10B981" size={64} />
                  ) : (
                    <X color="#EF4444" size={64} />
                  )}
                </View>

                <Text style={[styles.resultTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {passed ? 'Great Job!' : 'Keep Practicing'}
                </Text>

                <Text style={[styles.resultSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                  {passed 
                    ? 'You passed the quiz! Ready to continue learning.'
                    : 'Review the lesson and try again to continue.'}
                </Text>

                <View style={styles.scoreContainer}>
                  <Text style={[styles.scoreValue, { color: passed ? '#10B981' : '#EF4444', fontFamily: theme.typography.fontFamily }]}>
                    {score.percentage}%
                  </Text>
                  <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {score.correct} out of {score.total} correct
                  </Text>
                </View>

                {passed && (
                  <View style={[styles.xpBadge, { backgroundColor: `${primaryColor}20` }]}>
                    <Award color={primaryColor} size={20} />
                    <Text style={[styles.xpText, { color: primaryColor, fontFamily: theme.typography.fontFamily }]}>
                      +{isComprehensive ? '50' : '25'} XP Earned
                    </Text>
                  </View>
                )}
              </BlurView>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: passed ? primaryColor : theme.colors.textSecondary }]}
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <Text style={[styles.actionButtonText, { fontFamily: theme.typography.fontFamily }]}>
                {isComprehensive ? 'Close Test' : (passed ? 'Continue Learning' : 'Review Lesson')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                Retake Lesson
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  const isCorrect = isAnswered && selectedAnswer === currentQuestionData.correctAnswer;

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
              {isComprehensive ? 'Comprehensive Test' : 'Quick Quiz'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
              Question {currentQuestion + 1} of {totalQuestions}
            </Text>
          </View>

          <View style={[styles.progressCircle, { borderColor: primaryColor }]}>
            <Text style={[styles.progressText, { color: primaryColor, fontFamily: theme.typography.fontFamily }]}>
              {currentQuestion + 1}/{totalQuestions}
            </Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Card */}
          <View style={[styles.questionCardWrapper, { shadowColor: primaryColor }]}>
            <BlurView intensity={isDark ? 20 : 30} tint={isDark ? "dark" : "light"} style={[styles.questionCard, { borderColor: theme.colors.glassBorder }]}>
              <LinearGradient
                colors={isDark 
                  ? [`${primaryColor}30`, `${primaryColor}10`, 'transparent'] 
                  : [`${primaryColor}20`, `${primaryColor}10`, `${primaryColor}05`]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <Text style={[styles.question, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {currentQuestionData.question}
              </Text>

              <View style={styles.optionsContainer}>
                {currentQuestionData.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const showCorrect = isAnswered && index === currentQuestionData.correctAnswer;
                  const showWrong = isAnswered && isSelected && !isCorrect;
                  const label = String.fromCharCode(65 + index);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                          borderColor: showCorrect ? '#10B981' : showWrong ? '#EF4444' : theme.colors.glassBorder,
                          borderWidth: showCorrect || showWrong ? 2 : 1,
                        }
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={isAnswered}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.optionLabel, 
                          { 
                            backgroundColor: showCorrect ? '#10B981' : showWrong ? '#EF4444' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                            borderColor: showCorrect ? '#10B981' : showWrong ? '#EF4444' : theme.colors.glassBorder
                          }
                        ]}>
                          <Text style={[styles.optionLabelText, { color: (showCorrect || showWrong) ? '#FFF' : theme.colors.textPrimary }]}>
                            {label}
                          </Text>
                        </View>
                        <Text style={[styles.optionText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                          {option}
                        </Text>
                      </View>
                      {showCorrect && <CheckCircle color="#10B981" size={24} />}
                      {showWrong && <X color="#EF4444" size={24} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {isAnswered && (
                <View style={[styles.feedbackCard, { backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                  <Text style={[styles.feedbackText, { color: isCorrect ? '#10B981' : '#EF4444', fontFamily: theme.typography.fontFamily }]}>
                    {isCorrect ? '✓ Correct! Well done.' : '✗ Not quite. The correct answer is highlighted.'}
                  </Text>
                </View>
              )}
            </BlurView>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Navigation Buttons */}
        {isAnswered && (
          <View style={styles.navigationContainer}>
            {currentQuestion > 0 && (
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
              style={[styles.navButton, styles.nextButton, { backgroundColor: primaryColor, marginLeft: currentQuestion > 0 ? 12 : 0 }]}
              onPress={handleNext}
            >
              <Text style={[styles.navButtonText, { color: '#FFFFFF', fontFamily: theme.typography.fontFamily }]}>
                {currentQuestion === totalQuestions - 1 ? 'See Results' : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  progressCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  questionCardWrapper: {
    borderRadius: 28,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  questionCard: {
    padding: 24,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  question: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 12,
    flexDirection: 'column',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    width: '100%',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionLabel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: '900',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  feedbackCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  feedbackText: {
    fontSize: 15,
    fontWeight: '600',
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
  resultsCardWrapper: {
    borderRadius: 28,
    overflow: 'visible',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  resultsCard: {
    padding: 32,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
  },
  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '800',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    marginTop: 8,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButton: {
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
