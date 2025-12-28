import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Modal,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  ChevronRight, 
  CheckCircle, 
  X, 
  Lightbulb,
  Zap,
  Trophy,
  Star,
  Calculator,
  FileText
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import CalculatorModal from '../components/CalculatorModal';
import NotesModal from '../components/NotesModal';

const { width } = Dimensions.get('window');

export default function LearningContentScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { lesson, subject } = route.params;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExamples, setShowExamples] = useState(false);
  const [showXPModal, setShowXPModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Animation Refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const xpScale = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);

  useEffect(() => {
    animateSlide();
  }, [currentSlide]);

  const animateSlide = () => {
    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7
    }).start();
  };

  const triggerXPModal = () => {
    setShowXPModal(true);
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(xpScale, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true
      })
    ]).start();
  };

  // Mock learning content
  const slides = [
    {
      type: 'intro',
      title: 'Welcome to ' + lesson.title,
      content: `Let's begin your journey into ${lesson.category || 'this subject'}. This lesson will cover the fundamental concepts you need to master.`,
    },
    {
      type: 'video',
      title: 'Visual Overview',
      videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
      content: 'Watch this short video to understand the real-world application of this concept.',
    },
    {
      type: 'content',
      title: 'Core Concept #1',
      content: `Understanding the basics is crucial. Here we'll explore the foundational principles that everything else builds upon.\n\nKey Points:\n• First fundamental principle\n• How it applies in practice\n• Common misconceptions to avoid`,
    },
    {
      type: 'quiz',
      question: 'What is the main principle we just learned?',
      options: [
        'The foundational concept',
        'An advanced technique',
        'A common mistake',
        'A practice exercise'
      ],
      correctAnswer: 0,
    },
    {
      type: 'summary',
      title: 'Lesson Complete!',
      content: `Great work! You've completed this lesson. Keep up the excellent progress!`,
      notes: "This lesson covered the foundational elements of " + (lesson.title || "the subject") + ". To reinforce your learning, remember to review the equations weekly.",
      pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
  ];

  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;
  const progress = ((currentSlide + 1) / slides.length) * 100;

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      triggerXPModal();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleAnswerSelect = (optionIndex) => {
    setSelectedAnswers({ ...selectedAnswers, [currentSlide]: optionIndex });
  };

  const renderSlideContent = () => {
    return (
      <Animated.View style={{ 
        opacity: slideAnim,
        transform: [
          { translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
          { scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }
        ]
      }}>
        {currentSlideData.type === 'video' ? renderVideo() : 
         currentSlideData.type === 'quiz' ? renderQuiz() : renderTextContent()}
      </Animated.View>
    );
  };

  const renderVideo = () => (
    <View style={styles.videoSlide}>
      <Text style={[styles.slideTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
        {currentSlideData.title}
      </Text>
      
      <View style={[styles.videoWrapper, { shadowColor: lesson.color }]}>
        <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.videoContainer, { borderColor: theme.colors.glassBorder }]}>
          {isVideoLoading && (
            <View style={styles.videoLoading}>
              <ActivityIndicator size="large" color={lesson.color} />
            </View>
          )}
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: currentSlideData.videoUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            onLoadStart={() => setIsVideoLoading(true)}
            onLoad={() => setIsVideoLoading(false)}
          />
        </BlurView>
      </View>
      
      <Text style={[styles.slideContent, { color: theme.colors.textSecondary, marginTop: 20 }]}>
        {currentSlideData.content}
      </Text>
    </View>
  );

  const renderTextContent = () => (
    <View style={styles.contentSlide}>
      <Text style={[styles.slideTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
        {currentSlideData.title}
      </Text>
      <Text style={[styles.slideContent, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
        {currentSlideData.content}
      </Text>
    </View>
  );

  const renderQuiz = () => {
    const selectedAnswer = selectedAnswers[currentSlide];
    const isAnswered = selectedAnswer !== undefined;
    const isCorrect = selectedAnswer === currentSlideData.correctAnswer;

    return (
      <View style={styles.quizSlide}>
        <Text style={[styles.quizQuestion, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
          {currentSlideData.question}
        </Text>
        <View style={styles.optionsContainer}>
          {currentSlideData.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const showCorrect = isAnswered && index === currentSlideData.correctAnswer;
            const showWrong = isAnswered && isSelected && !isCorrect;

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
                onPress={() => !isAnswered && handleAnswerSelect(index)}
                disabled={isAnswered}
              >
                <Text style={[styles.optionText, { color: theme.colors.textPrimary }]}>{option}</Text>
                {showCorrect && <CheckCircle color="#10B981" size={24} />}
                {showWrong && <X color="#EF4444" size={24} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
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

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: lesson.color }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {currentSlide + 1} / {slides.length}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.toolButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.colors.glassBorder }]}
              onPress={() => setShowNotes(true)}
            >
              <FileText color={theme.colors.secondary} size={18} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.colors.glassBorder }]}
              onPress={() => setShowCalculator(true)}
            >
              <Calculator color={theme.colors.secondary} size={18} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolButton, { backgroundColor: `${lesson.color}20`, borderColor: lesson.color }]}
              onPress={() => setShowExamples(true)}
            >
              <Lightbulb color={lesson.color} size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Card */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentCardWrapper, { shadowColor: lesson.color }]}>
            <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[styles.contentCard, { borderColor: theme.colors.glassBorder }]}>
              {renderSlideContent()}
            </BlurView>
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentSlide > 0 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.prevButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              onPress={handlePrevious}
            >
              <Text style={[styles.navButtonText, { color: theme.colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.navButton, styles.nextButton, { backgroundColor: lesson.color, marginLeft: currentSlide > 0 ? 12 : 0 }]}
            onPress={handleNext}
            disabled={currentSlideData.type === 'quiz' && selectedAnswers[currentSlide] === undefined}
            activeOpacity={0.8}
          >
            <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>
              {isLastSlide ? 'FINISH' : 'NEXT STEP'}
            </Text>
            <ChevronRight color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Completion/XP Modal */}
      <Modal visible={showXPModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
           <Animated.View style={[styles.xpCard, { transform: [{ scale: xpScale }] }]}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                style={styles.xpGradient}
              >
                 <Trophy size={60} color="#FFF" style={styles.trophyIcon} />
                 <Text style={styles.xpTitle}>Mastery Achieved!</Text>
                 <Text style={styles.xpSubtitle}>You've completed {lesson.title}</Text>
                 
                 <View style={styles.xpBonus}>
                    <Zap size={24} color="#FACC15" fill="#FACC15" />
                    <Text style={styles.xpAmount}>+150 XP</Text>
                 </View>

                 <View style={styles.starsRow}>
                    {[1, 2, 3].map(i => <Star key={i} size={30} color="#FACC15" fill="#FACC15" />)}
                 </View>

                 <TouchableOpacity 
                   style={styles.collectButton}
                   onPress={() => {
                     setShowXPModal(false);
                     navigation.goBack();
                   }}
                 >
                    <Text style={styles.collectText}>COLLECT REWARDS</Text>
                 </TouchableOpacity>
              </LinearGradient>
           </Animated.View>
        </View>
      </Modal>

      {/* Examples Modal (Simple Version for now) */}
      <Modal visible={showExamples} animationType="slide">
        <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <Text style={[styles.slideTitle, { flex: 1, marginBottom: 0 }]}>Quick Tips</Text>
              <TouchableOpacity onPress={() => setShowExamples(false)}>
                <X color={theme.colors.textPrimary} size={30} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
               <BlurView intensity={20} style={styles.contentCard}>
                  <Text style={[styles.slideContent, { color: theme.colors.textSecondary }]}>
                    Stay focused and take your time with each concept. Mastery comes with practice!
                  </Text>
               </BlurView>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <CalculatorModal 
        visible={showCalculator} 
        onClose={() => setShowCalculator(false)} 
      />

      <NotesModal 
        visible={showNotes} 
        onClose={() => setShowNotes(false)}
        notes={currentSlideData.notes}
        pdfUrl={currentSlideData.pdfUrl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject },
  safeArea: { flex: 1 },
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
  progressContainer: { flex: 1 },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 13, fontWeight: '700' },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  toolButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },
  contentCardWrapper: {
    borderRadius: 32,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  contentCard: {
    padding: 30,
    borderWidth: 1,
    borderRadius: 32,
    overflow: 'hidden',
    minHeight: 450,
  },
  contentSlide: { flex: 1 },
  videoSlide: { flex: 1 },
  videoWrapper: {
    borderRadius: 24,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
  },
  videoContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  video: {
    flex: 1,
  },
  videoLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
    lineHeight: 34,
  },
  slideContent: {
    fontSize: 17,
    lineHeight: 30,
    opacity: 0.9,
  },
  quizSlide: { flex: 1 },
  quizQuestion: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
  },
  optionsContainer: { gap: 12 },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 18,
  },
  optionText: { fontSize: 16, fontWeight: '600', flex: 1 },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    gap: 8,
  },
  prevButton: { flex: 1 },
  nextButton: { flex: 2 },
  navButtonText: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  
  // XP Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpCard: {
    width: width * 0.85,
    borderRadius: 40,
    overflow: 'hidden',
    elevation: 20,
  },
  xpGradient: {
    padding: 40,
    alignItems: 'center',
  },
  trophyIcon: { marginBottom: 20 },
  xpTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  xpSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  xpBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 10,
    marginBottom: 25,
  },
  xpAmount: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 40,
  },
  collectButton: {
    backgroundColor: '#FFF',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 20,
    width: '100%',
  },
  collectText: {
    color: '#8B5CF6',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
  }
});
