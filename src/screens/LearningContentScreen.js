
import { WebView } from 'react-native-webview';

import React, { useState, useEffect, useRef, createElement } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Animated, Easing, ActivityIndicator, Alert, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronRight, CheckCircle, X, Trophy, Star, Zap, FileText, Calculator, Lightbulb } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import CalculatorModal from '../components/CalculatorModal';
import NotesModal from '../components/NotesModal';

const { width } = Dimensions.get('window');

export default function LearningContentScreen({ route, navigation }) {
  const { lesson, topic, subject, isExam = false, isFree = false } = route.params;
  const { theme, isDark } = useTheme();
  const { completeTopic, subscriptions } = useProgress();
  const primaryColor = subject?.color || theme.colors.primary;

  // content parsing with safety check
  let slides = [];
  try {
    slides = typeof lesson.content === 'string' ? JSON.parse(lesson.content) : lesson.content;
  } catch (e) {
    console.error("LearningContentScreen: Failed to parse lesson content", e);
    // slides remains empty, which triggers the fallback UI below
  }

  React.useEffect(() => {
    if (isExam) {
      // FIX: Strictly verify targeted access for Exams
      // Even if checkAccess was called previously, we double check here with specific IDs
      const hasTargetedAccess = subscriptions && subscriptions.length > 0 && subscriptions.some(s => {
        // 1a. All Access
        if (!s.topic_id && !s.subject_id) return true;
        // 1b. Targeted Access (Course/Topic or Subject)
        if (s.topic_id && s.topic_id === topic?.id) return true;
        if (s.subject_id && s.subject_id === subject?.id) return true;
        return false;
      });

      if (!hasTargetedAccess) {
         console.log("LearningContentScreen: Access DENIED for Premium Exam (No targeted subscription)");
         // Using timeout to ensure navigation mount
         const timer = setTimeout(() => {
            Alert.alert(
              "Premium Feature", 
              "Final Exams are exclusive to Premium members. Please subscribe to unlock and earn your certificate.",
              [
                { text: "View Plans", onPress: () => navigation.replace('Subscription') },
                { text: "Cancel", onPress: () => navigation.goBack() }
              ]
            );
         }, 100);
         return () => clearTimeout(timer);
      } else {
        console.log("LearningContentScreen: Access GRANTED for Exam");
      }
    }
  }, [isExam, subscriptions, topic?.id, subject?.id]);

  // Safety check for empty slides
  if (!slides || !Array.isArray(slides) || slides.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
         <Text style={{ color: theme.colors.textPrimary, fontSize: 18, textAlign: 'center' }}>
            No content available for this lesson.
         </Text>
         <TouchableOpacity 
           onPress={() => navigation.goBack()}
           style={{ marginTop: 20, padding: 12, backgroundColor: primaryColor, borderRadius: 12 }}
         >
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Go Back</Text>
         </TouchableOpacity>
      </View>
    );
  }

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [retryModalVisible, setRetryModalVisible] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [testPercentage, setTestPercentage] = useState(0);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  
  // Tools state
  const [showCalculator, setShowCalculator] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Video state
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const videoRef = useRef(null);

  const slideAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Log start of session for "Recent Activity"
    const logStart = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        await supabase.from('learning_sessions').insert([{
          user_id: user.id,
          subject_id: subject?.id,
          duration_minutes: 0,
          started_at: new Date().toISOString()
        }]);
      } catch (err) {
        console.error('Error logging lesson start:', err);
      }
    };
    logStart();
  }, []);

  // Aggregated Study Notes for the Modal
  const aggregatedNotes = React.useMemo(() => {
    // 1. Explanation Section (includes all core content)
    const explanationContent = (slides || [])
      .filter(s => (s.type === 'content' || s.type === 'text') && 
                   !s.isExample && 
                   s.title !== 'Lesson Goal' && 
                   !(s.title && s.title.toLowerCase().includes('example')))
      .map(s => (s.title === 'Explanation' || s.title === topic?.title) ? s.content : `## ${s.title}\n${s.content}`)
      .join('\n\n');
      
    // 2. Examples & Takeaways Section
    const exampleSlides = (slides || [])
      .filter(s => s.isExample || (s.title && s.title.toLowerCase().includes('example')));
    
    const examplesText = exampleSlides
      .map((s, index) => {
        const hasSolutionMarker = s.content.toLowerCase().includes('solution:');
        const hasTakeawayMarker = s.content.toLowerCase().includes('takeaway:');
        
        let problem = s.content;
        let solution = null;
        let takeaway = null;
        let why = null;

        if (hasTakeawayMarker) {
          const parts = s.content.split(/takeaway:/i);
          const beforeTakeaway = parts[0];
          const afterTakeaway = parts[1];
          
          if (beforeTakeaway.toLowerCase().includes('solution:')) {
            const subParts = beforeTakeaway.split(/solution:/i);
            problem = subParts[0].replace(/problem:/i, '').trim();
            solution = subParts[1].trim();
          } else {
            problem = beforeTakeaway.replace(/problem:/i, '').trim();
          }

          if (afterTakeaway.toLowerCase().includes('why:')) {
            const subParts = afterTakeaway.split(/why:/i);
            takeaway = subParts[0].replace(/what:/i, '').trim();
            why = subParts[1].trim();
          } else {
            takeaway = afterTakeaway.replace(/what:/i, '').trim();
          }
        } else if (hasSolutionMarker) {
          const parts = s.content.split(/solution:/i);
          problem = parts[0].replace(/problem:/i, '').trim();
          solution = parts[1].trim();
        }

        let block = `## Example ${index + 1}: ${s.title}\n\nPROBLEM: ${problem}`;
        if (solution) {
          block += `\n\nSOLUTION: ${solution}`;
        }
        if (takeaway) {
          // Format for NotesModal (use single \n to stay in same card)
          const takeawayContent = why ? `WHAT: ${takeaway}\nWHY: ${why}` : takeaway;
          block += `\n\n[||TAKEAWAY||]${takeawayContent}`;
        }
        return block;
      })
      .filter(Boolean)
      .join('\n\n');
      
    let total = '';
    if (explanationContent) {
      total += `EXPLANATION\n\n${explanationContent}\n\n`;
    }
    
    if (examplesText) {
      if (total) total += `───────────────────\n\n`;
      total += `EXAMPLES\n\n${examplesText}\n\n`;
    }
    
    return total || "No detailed notes provided for this lesson yet.";
  }, [slides]);

  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;
  const progress = ((currentSlide + 1) / slides.length) * 100;

  useEffect(() => {
    // Reset video loading state when slide changes
    if (currentSlideData && currentSlideData.type === 'video') {
      setIsVideoLoading(true);
    }
    
    // Animate slide transition
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5))
    }).start();
  }, [currentSlide]);

  const handleAnswerSelect = (index) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentSlide]: index
    });
  };

  const handleNext = () => {
    if (currentSlideData.type === 'quiz' && selectedAnswers[currentSlide] === undefined) {
      setValidationModalVisible(true);
      return;
    }

    if (isLastSlide) {
      finishLesson();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const finishLesson = () => {
    // Calculate score
    let correct = 0;
    const quizSlides = slides.filter(s => s.type === 'quiz');
    const totalQuiz = quizSlides.length;
    
    slides.forEach((slide, index) => {
      if (slide.type === 'quiz') {
        if (selectedAnswers[index] === slide.correctAnswer) {
          correct++;
        }
      }
    });

    const percentage = totalQuiz > 0 ? Math.round((correct / totalQuiz) * 100) : 100;
    setTestScore(correct);
    setTestPercentage(percentage);

    if (percentage >= 70) {
      // Calculate actual duration
      const durationNum = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      
      // completeTopic now handles session logging and reward feedback internally
      // Pass goBack as onAction to trigger when the reward modal is collected
      completeTopic(subject.id, lesson.id, percentage, durationNum, 'lesson', () => navigation.goBack());
    } else {
      setRetryModalVisible(true);
    }
  };



  const handleRetry = () => {
    setRetryModalVisible(false);
    setCurrentSlide(0);
    setSelectedAnswers({});
  };

  const renderVideo = () => {
    const isYouTube = currentSlideData.videoUrl?.includes('youtube.com') || currentSlideData.videoUrl?.includes('youtu.be');
    
    // Helper to extract YouTube ID
    const getYoutubeId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url?.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoSource = isYouTube 
      ? { 
          uri: `https://www.youtube.com/embed/${getYoutubeId(currentSlideData.videoUrl)}?rel=0&autoplay=0&showinfo=0&controls=1&playsinline=1`,
          headers: { 'Referer': 'https://www.youtube.com' }
        }
      : { uri: currentSlideData.videoUrl };

    const renderWebYoutube = () => {
        return createElement('iframe', {
          width: "100%",
          height: "100%",
          src: `https://www.youtube.com/embed/${getYoutubeId(currentSlideData.videoUrl)}`,
          frameBorder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowFullScreen: "true",
          style: { border: 0, height: '100%', width: '100%' }
        });
    };

    return (
      <View style={styles.videoSlide}>
        <Text style={[styles.slideTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
          {currentSlideData.title}
        </Text>
        
        <View style={[styles.videoWrapper, { shadowColor: primaryColor }]}>
          <View style={[styles.videoContainer, { 
            backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
          }]}>
            {isYouTube ? (
                Platform.OS === 'web' ? renderWebYoutube() : (() => {
                  const youtubeId = getYoutubeId(currentSlideData.videoUrl);
                  const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                        <style>
                          body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
                          .video-container { position: relative; width: 100%; height: 100%; background: #000; }
                          iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
                        </style>
                      </head>
                      <body>
                        <div class="video-container">
                          <iframe 
                            src="https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&autoplay=0&showinfo=0&controls=1&playsinline=1&enablejsapi=1&origin=https://sikola.org"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen>
                          </iframe>
                        </div>
                      </body>
                    </html>
                  `;

                  return (
                    <WebView
                      style={styles.video}
                      source={{ html: htmlContent, baseUrl: 'https://sikola.org' }}
                      allowsFullscreenVideo
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      allowsInlineMediaPlayback={true}
                      mediaPlaybackRequiresUserAction={false}
                      originWhitelist={['*']}
                      userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
                      startInLoadingState={true}
                      renderLoading={() => (
                        <View style={styles.videoLoading}>
                          <ActivityIndicator size="large" color={primaryColor} />
                        </View>
                      )}
                    />
                  );
                })()
            ) : (
              <>
                {isVideoLoading && (
                  <View style={styles.videoLoading}>
                    <ActivityIndicator size="large" color={primaryColor} />
                  </View>
                )}
                <Video
                  ref={videoRef}
                  style={styles.video}
                  source={videoSource}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping={false}
                  onLoadStart={() => setIsVideoLoading(true)}
                  onLoad={() => setIsVideoLoading(false)}
                />
              </>
            )}
          </View>
        </View>
        
        <Text style={[styles.slideContent, { color: theme.colors.textSecondary, marginTop: 20 }]}>
          {currentSlideData.content}
        </Text>
      </View>
    );
  };

  const renderTextContent = () => {
    const isIntro = currentSlideData.type === 'intro';
    const isGoals = currentSlideData.title?.toLowerCase().includes('what you will learn') || 
                   currentSlideData.title?.toLowerCase().includes('learning objectives');
    const isExample = currentSlideData.isExample === true || 
                     currentSlideData.isExample === 'true' || 
                     (currentSlideData.title && currentSlideData.title.toLowerCase().includes('example'));
    
    // 1. Premium Intro Slide Redesign
    if (isIntro) {
      return (
        <View style={[styles.contentSlide, { justifyContent: 'center', alignItems: 'center', minHeight: 450, paddingHorizontal: 10 }]}>
          {/* TOPIC Badge - Centered */}
          <View style={{ 
            backgroundColor: `${primaryColor}10`, 
            paddingHorizontal: 20, 
            paddingVertical: 10, 
            borderRadius: 14, 
            marginBottom: 30,
            borderWidth: 1,
            borderColor: `${primaryColor}20`
          }}>
            <Text style={{ 
              color: primaryColor, 
              fontSize: 14, 
              fontWeight: '900', 
              letterSpacing: 2,
              fontFamily: theme.typography.fontFamily 
            }}>
              TOPIC
            </Text>
          </View>

          {/* Topic Name Row */}
          <View style={{ width: '100%', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ 
              color: primaryColor, 
              fontSize: 32, 
              fontWeight: '900', 
              textAlign: 'center',
              lineHeight: 40,
              fontFamily: theme.typography.fontFamily 
            }}>
              {currentSlideData.title}
            </Text>
          </View>

          <View style={{ width: 80, height: 2, backgroundColor: primaryColor, opacity: 0.3, marginBottom: 40, alignSelf: 'center' }} />

          {/* Section Header */}
          <View style={{ width: '100%', marginBottom: 20 }}>
            <Text style={{ 
              color: theme.colors.textSecondary, 
              fontSize: 14, 
              fontWeight: '700', 
              opacity: 0.6,
              letterSpacing: 0.5,
              fontFamily: theme.typography.fontFamily 
            }}>
              SECTION HIGHLIGHTS
            </Text>
          </View>

          {/* Intro Content with Left Alignment */}
          <Text style={[
            styles.slideContent, 
            { 
              color: theme.colors.textSecondary, 
              fontFamily: theme.typography.fontFamily,
              textAlign: 'left', 
              fontSize: 17, 
              opacity: 0.8,
              lineHeight: 28,
              width: '100%'
            }
          ]}>
            {currentSlideData.content || 'Welcome to this lesson! Tap next to begin.'}
          </Text>
        </View>
      );
    }

    // 2. "What you will learn" Goals Redesign
    if (isGoals) {
      // Split content into clean list items
      const goalLines = currentSlideData.content
        .split(/[•\n]/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      return (
        <View style={[styles.contentSlide, { paddingHorizontal: 10 }]}>
           {/* TOPIC Badge - Centered for Goals too as per design */}
           <View style={{ alignItems: 'center', marginBottom: 30 }}>
            <View style={{ 
              backgroundColor: `${primaryColor}10`, 
              paddingHorizontal: 20, 
              paddingVertical: 10, 
              borderRadius: 14, 
              borderWidth: 1,
              borderColor: `${primaryColor}20`
            }}>
              <Text style={{ 
                color: primaryColor, 
                fontSize: 14, 
                fontWeight: '900', 
                letterSpacing: 2,
                fontFamily: theme.typography.fontFamily 
              }}>
                TOPIC
              </Text>
            </View>
          </View>

          <View style={{ width: '100%', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ 
              color: primaryColor, 
              fontSize: 32, 
              fontWeight: '900', 
              textAlign: 'center',
              lineHeight: 40,
              fontFamily: theme.typography.fontFamily 
            }}>
              {currentSlideData.title}
            </Text>
          </View>

          <View style={{ width: 80, height: 2, backgroundColor: primaryColor, opacity: 0.3, marginBottom: 40, alignSelf: 'center' }} />

          <View style={{ width: '100%', marginBottom: 24 }}>
             <Text style={{ color: theme.colors.textSecondary, fontSize: 13, fontWeight: '700', opacity: 0.6, letterSpacing: 0.5, marginBottom: 8, fontFamily: theme.typography.fontFamily }}>
               WHAT YOU WILL LEARN (GOAL/INTRO)
             </Text>
          </View>

          <View style={{ width: '100%' }}>
             {goalLines.map((goal, idx) => (
               <View key={idx} style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 18, color: theme.colors.textSecondary, marginRight: 12, opacity: 0.8 }}>•</Text>
                  <Text style={{ 
                    flex: 1, 
                    fontSize: 16, 
                    color: theme.colors.textSecondary, 
                    fontWeight: '500', 
                    lineHeight: 24,
                    opacity: 0.8,
                    fontFamily: theme.typography.fontFamily 
                  }}>
                    {goal}
                  </Text>
               </View>
             ))}
          </View>
        </View>
      );
    }

    // 3. Example Slide Redesign (Already Implemented, preserved here)
    if (isExample) {
      // Parsing logic for Problem, Solution, Takeaway
      const hasSolutionMarker = currentSlideData.content.toLowerCase().includes('solution:');
      const hasTakeawayMarker = currentSlideData.content.toLowerCase().includes('takeaway:');
      const hasWhyMarker = currentSlideData.content.toLowerCase().includes('why:');

      let problem = currentSlideData.content;
      let solution = null;
      let takeaway = null;
      let why = null;

      if (hasTakeawayMarker) {
        const parts = currentSlideData.content.split(/takeaway:/i);
        const beforeTakeaway = parts[0];
        const afterTakeaway = parts[1];
        
        if (beforeTakeaway.toLowerCase().includes('solution:')) {
          const subParts = beforeTakeaway.split(/solution:/i);
          problem = subParts[0].replace(/problem:/i, '').trim();
          solution = subParts[1].trim();
        } else {
          problem = beforeTakeaway.replace(/problem:/i, '').trim();
        }

        if (afterTakeaway.toLowerCase().includes('why:')) {
          const subParts = afterTakeaway.split(/why:/i);
          takeaway = subParts[0].replace(/what:/i, '').trim();
          why = subParts[1].trim();
        } else {
          takeaway = afterTakeaway.replace(/what:/i, '').trim();
        }
      } else if (hasSolutionMarker) {
        const parts = currentSlideData.content.split(/solution:/i);
        problem = parts[0].replace(/problem:/i, '').trim();
        solution = parts[1].trim();
      }

      return (
        <View style={styles.contentSlide}>
          {/* Title: Selective Underline */}
          <View style={{ alignSelf: 'flex-start', marginBottom: 20 }}>
            <Text style={[styles.slideTitle, { fontSize: 22, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              Example Title: <Text style={{ fontWeight: '800', textDecorationLine: 'underline' }}>{currentSlideData.title.replace(/example/i, '').replace(/^[:\s-]+/, '').trim() || currentSlideData.title}</Text>
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Problem: Red */}
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#EF4444', marginBottom: 8, fontFamily: theme.typography.fontFamily }}>
              Problem: <Text style={{ color: theme.colors.textPrimary, fontWeight: '400' }}>{problem}</Text>
            </Text>

            {/* Solution: Green */}
            {solution && (
              <View style={{ marginTop: 15, marginBottom: takeaway ? 25 : 10 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981', marginBottom: 10, fontFamily: theme.typography.fontFamily }}>
                  Solution:
                </Text>
                <View style={{ padding: 18, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16, borderWidth: 1, borderColor: theme.colors.glassBorder }}>
                  <Text style={{ fontSize: 16, color: theme.colors.textPrimary, lineHeight: 26, fontFamily: theme.typography.fontFamily }}>
                    {solution}
                  </Text>
                </View>
              </View>
            )}

            {/* Key Takeaway Card */}
            {takeaway && (
              <View style={{ marginTop: 10, borderRadius: 24, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', padding: 20, borderRadius: 24, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', alignItems: 'center' }}>
                  <View style={{ position: 'absolute', left: 0, top: 20, bottom: 20, width: 6, backgroundColor: '#EF4444', borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
                  <View style={{ marginRight: 16, marginLeft: 8 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FFF', justifyContent: 'center', alignItems: 'center' }}>
                      <Zap color="#EF4444" size={18} fill="#EF4444" />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 4, fontFamily: theme.typography.fontFamily }}>KEY TAKEAWAY</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', lineHeight: 24, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }}>
                      WHAT: {takeaway}
                    </Text>
                    {why && (
                      <Text style={{ fontSize: 16, fontWeight: '600', lineHeight: 24, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginTop: 10 }}>
                        WHY: {why}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={[styles.contentSlide, isIntro && { justifyContent: 'center', alignItems: 'center', minHeight: 400 }]}>
        <Text style={[
          styles.slideTitle, 
          { color: isIntro ? primaryColor : theme.colors.textPrimary, fontFamily: theme.typography.fontFamily },
          isIntro && { textAlign: 'center', fontSize: 32, marginBottom: 30 }
        ]}>
          {currentSlideData.title}
        </Text>
        <Text style={[
          styles.slideContent, 
          { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily },
          isIntro && { textAlign: 'center', fontSize: 20, opacity: 0.8 }
        ]}>
          {currentSlideData.content}
        </Text>
        
        {currentSlideData.content.includes('💡') && (
          <View style={{ marginTop: 30, padding: 15, backgroundColor: `${primaryColor}10`, borderRadius: 15, borderWidth: 1, borderColor: `${primaryColor}30`, borderStyle: 'dashed' }}>
            <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
              PRO TIP: Tap the bulb icon (top right) anytime for more examples!
            </Text>
          </View>
        )}
      </View>
    );
  };

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
                onPress={() => !isAnswered && handleAnswerSelect(index)}
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
                   <Text style={[styles.optionText, { color: theme.colors.textPrimary }]}>{option}</Text>
                </View>
                {showCorrect && <CheckCircle color="#10B981" size={22} />}
                {showWrong && <X color="#EF4444" size={22} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
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
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: primaryColor }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {currentSlide + 1} / {slides.length}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.toolItem}>
              <TouchableOpacity 
                style={[styles.toolButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.colors.glassBorder }]}
                onPress={() => setShowNotes(true)}
              >
                <FileText color={theme.colors.secondary} size={18} />
              </TouchableOpacity>
              <Text style={[styles.toolLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Notes</Text>
            </View>

            <View style={styles.toolItem}>
              <TouchableOpacity 
                style={[styles.toolButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: theme.colors.glassBorder }]}
                onPress={() => setShowCalculator(true)}
              >
                <Calculator color={theme.colors.secondary} size={18} />
              </TouchableOpacity>
              <Text style={[styles.toolLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Calc</Text>
            </View>

            <View style={styles.toolItem}>
              <TouchableOpacity 
                style={[styles.toolButton, { backgroundColor: `${primaryColor}20`, borderColor: primaryColor }]}
                onPress={() => setShowExamples(true)}
              >
                <Lightbulb color={primaryColor} size={18} />
              </TouchableOpacity>
              <Text style={[styles.toolLabel, { color: primaryColor, fontFamily: theme.typography.fontFamily }]}>Examples</Text>
            </View>
          </View>
        </View>

        {/* Content Card */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentCardWrapper, { shadowColor: primaryColor }]}>
            <View style={[styles.contentCard, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
            }]}>
              {renderSlideContent()}
            </View>
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
            style={[styles.navButton, styles.nextButton, { backgroundColor: primaryColor, marginLeft: currentSlide > 0 ? 12 : 0 }]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>
              {isLastSlide ? 'FINISH' : (currentSlideData.type === 'quiz' ? 'NEXT QUESTION' : 'NEXT SLIDE')}
            </Text>
            <ChevronRight color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Completion feedback is now handled globally via ProgressContext's RewardModal */}

      {/* Retry Modal */}
      <Modal visible={retryModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.7)' }]} />
           <View style={[styles.xpCard, { backgroundColor: theme.colors.primary }]}>
              <View style={{ padding: 40, alignItems: 'center' }}>
                 <View style={{ marginBottom: 20, width: 80, height: 80, borderRadius: 40, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
                    <X size={40} color="#FFF" />
                 </View>
                 <Text style={[styles.xpTitle, { color: theme.colors.textPrimary }]}>Keep Trying!</Text>
                 <Text style={[styles.xpSubtitle, { color: theme.colors.textSecondary }]}>
                   You scored {testScore} marks.
                 </Text>
                 <Text style={{ textAlign: 'center', color: '#EF4444', fontSize: 16, fontWeight: 'bold', marginBottom: 30 }}>
                   Notification: You haven't met the passing score. Please retake this {topic?.isExam ? 'Final Exam' : 'lesson'} to improve your understanding.
                 </Text>
                 
                 <TouchableOpacity 
                   style={[styles.collectButton, { backgroundColor: '#EF4444' }]}
                   onPress={handleRetry}
                 >
                    <Text style={[styles.collectText, { color: '#FFF' }]}>RETRY {topic?.isExam ? 'EXAM' : 'LESSON'}</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      {/* Validation Modal */}
      <Modal visible={validationModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.7)' }]} />
           <View style={[styles.xpCard, { backgroundColor: theme.colors.primary, transform: [{scale: 0.9}] }]}>
              <View style={{ padding: 40, alignItems: 'center' }}>
                 <View style={{ marginBottom: 20, width: 80, height: 80, borderRadius: 40, backgroundColor: '#FACC15', justifyContent: 'center', alignItems: 'center' }}>
                    <Lightbulb size={40} color="#FFF" />
                 </View>
                 <Text style={[styles.xpTitle, { color: theme.colors.textPrimary, fontSize: 24 }]}>Selection Required</Text>
                  <Text style={[styles.xpSubtitle, { color: theme.colors.textSecondary, marginBottom: 30 }]}>
                    Please select an answer that you think is true to move to the next question .
                  </Text>
                 
                 <TouchableOpacity 
                   style={[styles.collectButton, { backgroundColor: '#FACC15' }]}
                   onPress={() => setValidationModalVisible(false)}
                 >
                    <Text style={[styles.collectText, { color: '#FFF' }]}>OKAY, GOT IT</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>

      {/* Examples Modal */}
      <Modal visible={showExamples} animationType="slide" transparent>
        <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <BlurView 
            intensity={100} 
            tint={isDark ? "dark" : "light"} 
            style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.45)' }]} 
          />
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
               <View style={[styles.toolButton, { backgroundColor: `${primaryColor}20`, borderColor: primaryColor }]}>
                  <Lightbulb color={primaryColor} size={20} />
               </View>
              <Text style={[styles.headerTitle, { flex: 1, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginLeft: 10 }]}>Examples & Tips</Text>
              <TouchableOpacity 
                onPress={() => setShowExamples(false)}
                style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              >
                <X color={theme.colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {slides.filter(s => s.isExample === true || s.isExample === 'true' || (s.title && s.title.toLowerCase().includes('example'))).length > 0 ? (
                 slides.filter(s => s.isExample === true || s.isExample === 'true' || (s.title && s.title.toLowerCase().includes('example'))).map((ex, idx) => {
                   // Split content into problem, solution, and takeaway components
                   const hasSolutionMarker = ex.content.toLowerCase().includes('solution:');
                   const hasTakeawayMarker = ex.content.toLowerCase().includes('takeaway:');
                   const hasWhyMarker = ex.content.toLowerCase().includes('why:');

                   let problem = ex.content;
                   let solution = null;
                   let takeaway = null;
                   let why = null;

                   if (hasTakeawayMarker) {
                     const parts = ex.content.split(/takeaway:/i);
                     const beforeTakeaway = parts[0];
                     const afterTakeaway = parts[1];
                     
                     // Parse problem and solution from before takeaway
                     if (beforeTakeaway.toLowerCase().includes('solution:')) {
                       const subParts = beforeTakeaway.split(/solution:/i);
                       problem = subParts[0].replace(/problem:/i, '').trim();
                       solution = subParts[1].trim();
                     } else {
                       problem = beforeTakeaway.replace(/problem:/i, '').trim();
                     }

                     // Parse WHAT/WHY from after takeaway
                     if (afterTakeaway.toLowerCase().includes('why:')) {
                       const subParts = afterTakeaway.split(/why:/i);
                       takeaway = subParts[0].replace(/what:/i, '').trim();
                       why = subParts[1].trim();
                     } else {
                       takeaway = afterTakeaway.replace(/what:/i, '').trim();
                     }
                   } else if (hasSolutionMarker) {
                     const parts = ex.content.split(/solution:/i);
                     problem = parts[0].replace(/problem:/i, '').trim();
                     solution = parts[1].trim();
                   }

                   return (
                     <View key={idx} style={[styles.contentCardWrapper, { marginBottom: 20, shadowColor: primaryColor }]}>
                       <View style={[styles.contentCard, { 
                        minHeight: 0, 
                        padding: 24, 
                        backgroundColor: isDark ? 'rgba(25, 25, 25, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                      }]}>
                          {/* Title: Bold with Underlined Contents */}
                          <View style={{ alignSelf: 'flex-start', marginBottom: 20 }}>
                            <Text style={[styles.slideTitle, { fontSize: 20, color: isDark ? '#FFF' : '#000', marginBottom: 4, fontFamily: theme.typography.fontFamily }]}>
                              Example Title: <Text style={{ fontWeight: '800', textDecorationLine: 'underline' }}>{ex.title}</Text>
                            </Text>
                          </View>
                          
                          {/* Problem: Red */}
                          <Text style={{ fontSize: 18, fontWeight: '800', color: '#EF4444', marginBottom: 8, fontFamily: theme.typography.fontFamily }}>
                            Problem: <Text style={{ color: theme.colors.textPrimary, fontWeight: '400' }}>{problem}</Text>
                          </Text>

                          {/* Solution: Green */}
                          {solution && (
                            <View style={{ marginTop: 12, marginBottom: takeaway ? 20 : 0 }}>
                              <Text style={{ fontSize: 18, fontWeight: '800', color: '#10B981', marginBottom: 8, fontFamily: theme.typography.fontFamily }}>
                                Solution:
                              </Text>
                              <View style={{ padding: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 16, borderWidth: 1, borderColor: theme.colors.glassBorder }}>
                                <Text style={{ fontSize: 15, color: theme.colors.textPrimary, lineHeight: 24, fontFamily: theme.typography.fontFamily }}>
                                  {solution}
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Key Takeaway: Pixel-Perfect Mirror */}
                          {takeaway && (
                            <View style={{ marginTop: 10, borderRadius: 24, overflow: 'hidden' }}>
                              <View style={{ flexDirection: 'row', padding: 20, borderRadius: 24, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2', alignItems: 'center' }}>
                                <View style={{ position: 'absolute', left: 0, top: 20, bottom: 20, width: 6, backgroundColor: '#EF4444', borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
                                <View style={{ marginRight: 16, marginLeft: 8 }}>
                                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FFF', justifyContent: 'center', alignItems: 'center' }}>
                                    <Zap color="#EF4444" size={18} fill="#EF4444" />
                                  </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 4, fontFamily: theme.typography.fontFamily }}>KEY TAKEAWAY</Text>
                                  <Text style={{ fontSize: 16, fontWeight: '600', lineHeight: 24, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }}>
                                    WHAT: {takeaway}
                                  </Text>
                                  {why && (
                                    <Text style={{ fontSize: 16, fontWeight: '600', lineHeight: 24, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginTop: 10 }}>
                                      WHY: {why}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            </View>
                          )}
                       </View>
                     </View>
                   );
                 })
               ) : (
                 <View style={{ alignItems: 'center', marginTop: 100 }}>
                    <Lightbulb size={60} color={theme.colors.textSecondary} style={{ opacity: 0.3, marginBottom: 20 }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 16, textAlign: 'center', opacity: 0.7 }}>
                       No specific examples added for this lesson.
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 10, paddingHorizontal: 40 }}>
                       Check the core concept slides for general theory and explanations!
                    </Text>
                 </View>
               )}
               <View style={{ height: 40 }} />
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
        notes={aggregatedNotes}
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
  toolItem: {
    alignItems: 'center',
    gap: 4,
  },
  toolLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },
  contentCardWrapper: {
    borderRadius: 32,
    overflow: 'visible',
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
  optionsContainer: { 
    gap: 12,
    flexDirection: 'column'
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    width: '100%'
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
