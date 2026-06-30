import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Easing, Alert, BackHandler, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ArrowLeft, CheckCircle, X, Award, TrendingUp, Calculator } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import CalculatorModal from '../components/CalculatorModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { scale, verticalScale, moderateScale, width } from '../utils/Scaling';
import ConfirmationModal from '../components/ConfirmationModal';

export default function QuizScreen({ route, navigation }) {
  const { theme, isDark, hapticsEnabled } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  // const { completeTopic } = useProgress(); // Removed duplicate
  // Safe params destructuring
  const { 
    lesson: initialLesson, 
    subject, 
    questions: passedQuestions, 
    topic, 
    isComprehensive,
    isFree,
    subjectIndex,
    topicIndex
  } = route.params || {};

  const { completeTopic, subscriptions } = useProgress();

  // BLOCK TEST ACCESS FOR FREE USERS
  React.useEffect(() => {
    const hasActiveSub = subscriptions && subscriptions.length > 0;
    
    // Allow if Subscribed OR if it's a Free Topic
    if (!hasActiveSub && !isFree) {
       // Alert and Redirect
       // Using distinct Alert to avoid render loop issues
       const timer = setTimeout(() => {
         Alert.alert(
           "Premium Feature", 
           "Tests and Quizzes are exclusive to Premium members. Please subscribe to unlock.",
           [
             { text: "View Plans", onPress: () => navigation.replace('Subscription') },
             { text: "Cancel", onPress: () => navigation.goBack() }
           ]
         );
       }, 100);
       return () => clearTimeout(timer);
    }
  }, [subscriptions, isFree]);

  // Comprehensive test might not have a single 'lesson', so we use topic/subject
  const lesson = initialLesson || topic || { name: 'Test', color: subject?.color || theme.colors.secondary };
  const primaryColor = lesson.color || subject?.color || theme.colors.secondary;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  // Sync hardware back button with app back button
  // During active quiz: show exit confirmation. On results page: go back normally.
  useFocusEffect(
    React.useCallback(() => {
      const onHardwareBack = () => {
        if (showResults) {
          navigation.goBack();
          return true;
        }
        setShowExitModal(true);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [navigation, showResults])
  );

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
      const correct = optionIndex === currentQuestionData.correctAnswer;
      setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: optionIndex });
      
      if (hapticsEnabled) {
        if (correct) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    }
  };

  const handleNext = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    const navigationAction = () => {
      // Redirect to the Test (Practice) tab in the main tab navigator
      navigation.navigate('MainApp', { screen: 'Test' });
    };

    if (isComprehensive) {
      // Reward modal handles the success feedback and navigation
      await completeTopic(subject?.id, topic?.id, score.percentage, 30, 'test', navigationAction);
    } else if (score.percentage >= 60) {
      // Pass - go to the Test tab as requested by the user
      if (topic) {
        await completeTopic(subject?.id, topic.id, score.percentage, 15, 'lesson', navigationAction);
      } else {
        navigationAction();
      }
    } else {
      // Fail - go back to previous screen (usually lesson detail) to retry learning
      navigation.goBack();
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setDisplayPercentage(0);
    resultScale.setValue(0.9);
    resultOpacity.setValue(0);
  };

  // Renders text with content between $...$ as bold
  const renderWithBold = (text, baseStyle) => {
    if (!text || typeof text !== 'string' || !text.includes('$')) {
      return <Text style={baseStyle}>{text}</Text>;
    }
    const parts = text.split('$');
    return (
      <Text style={baseStyle}>
        {parts.map((part, i) =>
          i % 2 === 1 ? (
            <Text key={i} style={{ fontWeight: '900' }}>{part}</Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  // Results State Animations
  const resultScale = React.useRef(new Animated.Value(0.9)).current;
  const resultOpacity = React.useRef(new Animated.Value(0)).current;
  const [displayPercentage, setDisplayPercentage] = useState(0);

  React.useEffect(() => {
    if (showResults) {
      const score = calculateScore();
      
      Animated.parallel([
        Animated.spring(resultScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]).start();

      // Percentage Count Animation
      let start = 0;
      const duration = 1000;
      const stepTime = 30;
      const totalSteps = Math.floor(duration / stepTime);
      const increment = score.percentage / totalSteps;
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= score.percentage) {
          setDisplayPercentage(score.percentage);
          clearInterval(timer);
        } else {
          setDisplayPercentage(Math.floor(start));
        }
      }, stepTime);
      
      return () => clearInterval(timer);
    }
  }, [showResults]);

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
            contentContainerStyle={[styles.resultsContent, { flexGrow: 1, justifyContent: 'center' }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <Animated.View style={[styles.resultsHeader, { opacity: resultOpacity }, isLargeScreen && styles.largeScreenResultsContainer]}>
              <Text style={[styles.subjectTag, { backgroundColor: `${primaryColor}20`, color: primaryColor }]}>
                {subject?.name || 'Quiz'}
              </Text>
              <Text style={[styles.resultTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {passed ? 'Outstanding!' : 'Keep Pushing!'}
              </Text>
            </Animated.View>

            {/* Results Card */}
            <Animated.View style={[
              styles.resultsCardWrapper, 
              { 
                opacity: resultOpacity,
                transform: [{ scale: resultScale }],
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              },
              isLargeScreen && styles.largeScreenResultsContainer
            ]}>
              <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.premiumResultsCard}>
                <View style={[styles.resultIconWrapper, { backgroundColor: passed ? '#10B98120' : '#EF444420' }]}>
                  {passed ? (
                    <CheckCircle color="#10B981" size={48} />
                  ) : (
                    <X color="#EF4444" size={48} />
                  )}
                </View>

                <View style={styles.percentageContainer}>
                  <Svg width={scale(180)} height={scale(180)} style={styles.percentageSvg}>
                    <Circle
                      cx={scale(90)}
                      cy={scale(90)}
                      r={scale(75)}
                      stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                      strokeWidth={scale(10)}
                      fill="none"
                    />
                    <Circle
                      cx={scale(90)}
                      cy={scale(90)}
                      r={scale(75)}
                      stroke={passed ? '#10B981' : '#EF4444'}
                      strokeWidth={scale(12)}
                      fill="none"
                      strokeDasharray={`${(displayPercentage / 100) * (2 * Math.PI * scale(75))} ${2 * Math.PI * scale(75)}`}
                      strokeLinecap="round"
                    />
                  </Svg>
                  <Text style={[styles.bigPercentage, { color: passed ? '#10B981' : '#EF4444', fontFamily: theme.typography.fontFamily }]}>
                    {displayPercentage}%
                  </Text>
                </View>

                <Text style={[styles.scoreDetail, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                   You answered <Text style={{ color: theme.colors.textPrimary, fontWeight: '800' }}>{score.correct}</Text> correctly out of {score.total} questions
                </Text>

                <View style={styles.statsGrid}>
                  <View style={[styles.miniStat, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]}>
                    <TrendingUp size={16} color={theme.colors.secondary} />
                    <Text style={[styles.miniStatText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Improvement</Text>
                  </View>
                  {passed && (
                    <View style={[styles.miniStat, { backgroundColor: `${primaryColor}15` }]}>
                      <Award size={16} color={primaryColor} />
                      <Text style={[styles.miniStatText, { color: primaryColor, fontFamily: theme.typography.fontFamily }]}>+{isComprehensive ? '50' : '25'} XP</Text>
                    </View>
                  )}
                </View>
              </BlurView>
            </Animated.View>

            {/* Motivation Text */}
            <Animated.Text style={[styles.motivationText, { opacity: resultOpacity, color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }, isLargeScreen && styles.largeScreenResultsContainer]}>
              {passed 
                ? "You've proven your expertise! Let's build on this success and keep the momentum."
                : "Every mistake is a learning opportunity. Review the parts you missed and you'll crush it next time!"}
            </Animated.Text>

            {/* Action Buttons */}
            <Animated.View style={[styles.resultsActions, { opacity: resultOpacity, transform: [{ translateY: Animated.multiply(resultOpacity, -20) }] }, isLargeScreen && styles.largeScreenResultsContainer]}>
              <TouchableOpacity 
                style={styles.primaryActionBtn}
                onPress={handleContinue}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[passed ? primaryColor : '#64748B', passed ? `${primaryColor}CC` : '#475569']}
                  style={styles.btnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.btnText, { fontFamily: theme.typography.fontFamily }]}>
                    {isComprehensive ? 'Finish & Collect' : (passed ? 'Continue Learning' : 'Review Lesson')}
                  </Text>
                  <Award size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.secondaryActionBtn, { 
                  borderColor: '#EF4444',
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)'
                }]}
                onPress={handleRetake}
              >
                <Text style={[styles.secondaryBtnText, { color: '#EF4444', fontFamily: theme.typography.fontFamily }]}>
                  Retake Test
                </Text>
              </TouchableOpacity>
            </Animated.View>
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
        <View style={[styles.header, isLargeScreen && styles.largeScreenContainer]}>
          <TouchableOpacity 
            onPress={() => setShowExitModal(true)}
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
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

          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.toolButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', borderColor: theme.colors.glassBorder }]}
              onPress={() => setShowCalculator(true)}
            >
              <Calculator color={theme.colors.secondary} size={20} />
            </TouchableOpacity>

            <View style={[styles.progressCircle, { borderColor: primaryColor }]}>
              <Text style={[styles.progressText, { color: primaryColor, fontFamily: theme.typography.fontFamily }]}>
                {currentQuestion + 1}/{totalQuestions}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Question Card */}
          <View style={[styles.questionCardWrapper, { shadowColor: primaryColor }, isLargeScreen && styles.largeScreenContainer]}>
            <View style={[styles.questionCard, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)' 
            }, isLargeScreen && styles.largeScreenPadding]}>
              
              {renderWithBold(currentQuestionData.question, [styles.question, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }])}

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
                          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
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
                            backgroundColor: showCorrect ? '#10B981' : showWrong ? '#EF4444' : (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'),
                            borderColor: showCorrect ? '#10B981' : showWrong ? '#EF4444' : theme.colors.glassBorder
                          }
                        ]}>
                          <Text style={[styles.optionLabelText, { color: (showCorrect || showWrong) ? '#FFF' : theme.colors.textPrimary }]}>
                            {label}
                          </Text>
                        </View>
                        {renderWithBold(option, [styles.optionText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }])}
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
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Navigation Buttons */}
        {isAnswered && (
          <View style={[styles.navigationContainer, isLargeScreen && styles.largeScreenContainer]}>
            {currentQuestion > 0 && (
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

      <CalculatorModal 
        visible={showCalculator} 
        onClose={() => setShowCalculator(false)} 
      />

      <ConfirmationModal
        visible={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={() => {
            setShowExitModal(false);
            navigation.goBack();
        }}
        title="Exit Quiz?"
        message="Your progress will be lost. Are you sure you want to quit this test?"
        confirmLabel="Exit Now"
        cancelLabel="Keep Going"
        type="warning"
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(16),
    gap: scale(12),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    marginTop: verticalScale(2),
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  toolButton: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scale(20),
  },
  questionCardWrapper: {
    borderRadius: scale(32),
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  questionCard: {
    padding: scale(30),
    borderWidth: 1,
    borderRadius: scale(32),
    overflow: 'hidden',
    minHeight: verticalScale(450),
  },
  question: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(32),

  },
  optionsContainer: {
    gap: scale(12),
    flexDirection: 'column',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(16),
    borderRadius: scale(20),
    width: '100%',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  optionLabel: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  optionLabelText: {
    fontSize: moderateScale(14),
    fontWeight: '900',
  },
  optionText: {
    fontSize: moderateScale(16),
    flex: 1,
  },
  feedbackCard: {
    marginTop: verticalScale(20),
    padding: scale(16),
    borderRadius: scale(12),
  },
  feedbackText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
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
  resultsCardWrapper: {
    width: width - scale(48),
    borderRadius: scale(40),
    overflow: 'hidden',
    marginBottom: verticalScale(24),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  resultsCard: {
    padding: scale(32),
    borderWidth: 1,
    borderRadius: scale(28),
    overflow: 'hidden',
    alignItems: 'center',
  },
  resultIcon: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  resultTitle: {
    fontSize: moderateScale(32),
    fontWeight: '800',
    marginBottom: verticalScale(8),
  },
  resultSubtitle: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: verticalScale(24),
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  scoreValue: {
    fontSize: moderateScale(64),
    fontWeight: '800',
    marginBottom: verticalScale(8),
  },
  scoreLabel: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(8),
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderRadius: scale(20),
    gap: scale(8),
  },
  xpText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  actionButton: {
    paddingVertical: verticalScale(18),
    borderRadius: scale(24),
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  secondaryButton: {
    paddingVertical: verticalScale(16),
    borderRadius: scale(20),
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  // New Result Styles
  resultsContent: {
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
    alignItems: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  subjectTag: {
    fontSize: moderateScale(11),
    fontWeight: '900',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(5),
    borderRadius: scale(10),
    letterSpacing: scale(1),
    textTransform: 'uppercase',
    marginBottom: verticalScale(10),
    overflow: 'hidden',
  },
  premiumResultsCard: {
    width: '100%',
    padding: scale(24),
    alignItems: 'center',
  },
  resultIconWrapper: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  percentageRow: {
    marginBottom: verticalScale(4),
  },
  percentageContainer: {
    width: scale(200),
    height: scale(200),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  percentageSvg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }]
  },
  bigPercentage: {
    fontSize: moderateScale(56),
    fontWeight: '900',
    letterSpacing: -1,
  },
  scoreDetail: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: verticalScale(16),
    width: '85%',
    lineHeight: moderateScale(20),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: scale(12),
    width: '100%',
    justifyContent: 'center',
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderRadius: scale(16),
  },
  miniStatText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  motivationText: {
    marginTop: verticalScale(20),
    fontSize: moderateScale(15),
    textAlign: 'center',
    lineHeight: moderateScale(22),
    paddingHorizontal: scale(20),
    opacity: 0.8,
  },
  resultsActions: {
    marginTop: verticalScale(24),
    width: '100%',
    gap: verticalScale(12),
  },
  primaryActionBtn: {
    width: '100%',
    borderRadius: scale(24),
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(8) },
    shadowOpacity: 0.2,
    shadowRadius: scale(12),
    elevation: 8,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
    gap: scale(12),
  },
  btnText: {
    color: '#FFF',
    fontSize: moderateScale(18),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  secondaryActionBtn: {
    width: '100%',
    paddingVertical: verticalScale(18),
    borderRadius: scale(22),
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: moderateScale(17),
    fontWeight: '700',
  },
  largeScreenContainer: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  largeScreenResultsContainer: {
    width: '100%',
    maxWidth: 550,
    alignSelf: 'center',
  },
  largeScreenPadding: {
    padding: scale(40),
  }
});
