
import { WebView } from 'react-native-webview';
import logger from '../utils/logger';

import React, { useState, useEffect, useRef, createElement } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, Animated, Easing, ActivityIndicator, Alert, Platform, BackHandler, useWindowDimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronRight, CheckCircle, X, Trophy, Star, Zap, FileText, Calculator, Lightbulb } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import CalculatorModal from '../components/CalculatorModal';
import NotesModal from '../components/NotesModal';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

const { width, height } = Dimensions.get('window');

const parseExampleContent = (content) => {
  let cleanContent = content.replace(/💡\s*Access more examples via the bulb icon\.?/gi, '').trim();

  let problem = cleanContent;
  let solution = null;
  let takeaway = null;
  let why = null;

  const lowerContent = cleanContent.toLowerCase();
  const hasSolutionMarker = lowerContent.includes('solution:');
  const hasTakeawayMarker = lowerContent.includes('takeaway:');

  if (hasTakeawayMarker) {
    const parts = cleanContent.split(/takeaway:/i);
    const beforeTakeaway = parts[0];
    const afterTakeaway = parts[1];
    
    if (beforeTakeaway.toLowerCase().includes('solution:')) {
      const subParts = beforeTakeaway.split(/solution:/i);
      problem = subParts[0].trim();
      solution = subParts[1].trim();
    } else {
      problem = beforeTakeaway.trim();
    }

    if (afterTakeaway.toLowerCase().includes('why:')) {
      const subParts = afterTakeaway.split(/why:/i);
      takeaway = subParts[0].trim();
      why = subParts[1].trim();
    } else {
      takeaway = afterTakeaway.trim();
    }
  } else if (hasSolutionMarker) {
    const parts = cleanContent.split(/solution:/i);
    problem = parts[0].trim();
    solution = parts[1].trim();
  } else {
    // Fallback heuristic: split by double newlines
    const blocks = cleanContent.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    if (blocks.length >= 3) {
       problem = blocks[0];
       takeaway = blocks[blocks.length - 1];
       solution = blocks.slice(1, blocks.length - 1).join('\n\n');
    } else if (blocks.length === 2) {
       problem = blocks[0];
       solution = blocks[1];
    } else {
       // Fallback to single newlines
       const lines = cleanContent.split('\n').map(s => s.trim()).filter(Boolean);
       if (lines.length >= 3) {
         problem = lines[0];
         takeaway = lines[lines.length - 1];
         solution = lines.slice(1, lines.length - 1).join('\n');
       } else if (lines.length === 2) {
         problem = lines[0];
         solution = lines[1];
       } else {
         problem = cleanContent;
       }
    }
  }

  // Clean up common prefixes
  problem = problem.replace(/^problem:\s*/i, '').trim();
  if (solution) solution = solution.replace(/^solution:\s*/i, '').trim();
  if (takeaway) takeaway = takeaway.replace(/^what:\s*/i, '').trim();
  
  return { problem, solution, takeaway, why };
};
export default function LearningContentScreen({ route, navigation }) {
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth >= 768;
  const { lesson, topic, subject, isExam = false, isFree = false, subjectIndex, topicIndex } = route.params;
  const { theme, isDark } = useTheme();
  const { completeTopic, subscriptions, checkLessonAccess, markTopicAsAccessed } = useProgress();
  const primaryColor = subject?.color || theme.colors.secondary;

  React.useEffect(() => {
    if (topic?.id) {
       markTopicAsAccessed(topic.id);
    }
  }, [topic?.id]);

  const renderBoldText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|\$.*?\$|Step \d+:?)/gi);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <Text key={index} style={{ fontWeight: '900', color: theme.colors.textPrimary }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        return (
          <Text key={index} style={{ fontWeight: '900', color: theme.colors.textPrimary }}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      if (/^Step \d+:?$/i.test(part)) {
        return (
          <Text key={index} style={{ fontWeight: '900', color: theme.colors.textPrimary }}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  // content parsing with safety check
  let slides = [];
  try {
    slides = typeof lesson.content === 'string' ? JSON.parse(lesson.content) : lesson.content;
  } catch (e) {
    logger.error("LearningContentScreen: Failed to parse lesson content", e);
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
         logger.log("LearningContentScreen: Access DENIED for Premium Exam (No targeted subscription)");
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
        logger.log("LearningContentScreen: Access GRANTED for Exam");
      }
    } else {
      // Standard Lesson Access Check
      const lessonIndex = lesson.order_index ?? 0;
      const topicId = topic?.id || lesson.topic_id;
      const subjectId = subject?.id || topic?.subject_id;
      const actualTopicIndex = topicIndex ?? 0;
      
      const hasAccess = checkLessonAccess(lessonIndex, topicId, subjectId, actualTopicIndex);
      
      if (!hasAccess) {
         logger.log("LearningContentScreen: Access DENIED for Standard Lesson (Internal Check)");
         const timer = setTimeout(() => {
            Alert.alert(
              "Unlock Premium",
              "This content is part of SIKOLA Premium. Upgrade now to get full access to all lessons and quizzes.",
              [
                { text: "View Plans", onPress: () => navigation.replace('Subscription') },
                { text: "Go Back", onPress: () => navigation.goBack() }
              ]
            );
         }, 100);
         return () => clearTimeout(timer);
      }
    }
  }, [isExam, subscriptions, topic?.id, subject?.id, lesson, topicIndex, checkLessonAccess]);

  // Safety check for empty slides
  if (!slides || !Array.isArray(slides) || slides.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', padding: scale(20) }]}>
         <Text style={{ color: theme.colors.textPrimary, fontSize: moderateScale(18), textAlign: 'center' }}>
            No content available for this lesson.
         </Text>
         <TouchableOpacity 
           onPress={() => navigation.goBack()}
           style={{ marginTop: verticalScale(20), padding: scale(12), backgroundColor: primaryColor, borderRadius: scale(12) }}
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

  // Sync hardware back button with app back button
  useFocusEffect(
    React.useCallback(() => {
      const onHardwareBack = () => {
        navigation.goBack();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [navigation])
  );

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
        logger.error('Error logging lesson start:', err);
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
        const { problem, solution, takeaway, why } = parseExampleContent(s.content);

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

    // Safely get IDs — topic may be undefined if coming from LessonOverviewScreen
    const courseId = subject?.id || null;
    const topicId = lesson?.id || topic?.id || null;
    const durationNum = Math.max(1, Math.round((Date.now() - startTime) / 60000));

    logger.log('[finishLesson] percentage:', percentage, 'topicId:', topicId, 'courseId:', courseId);

    if (percentage >= 70) {
      completeTopic(courseId, topicId, percentage, durationNum, 'lesson', () => {
        // goBack() reliably returns to the previous screen regardless of stack depth
        navigation.goBack();
      });
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

    const youtubeVideoId = getYoutubeId(currentSlideData.videoUrl);
    const youtubeWatchUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

    const renderWebYoutube = () => {
      // Use a wrapper div + iframe approach with nocookie domain to avoid embed restrictions
      // and show a fallback overlay if the video can't be embedded (error 152-18)
      const iframeHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body, html { width: 100%; height: 100%; background: #000; overflow: hidden; font-family: sans-serif; }
              .wrapper { position: relative; width: 100%; height: 100%; }
              iframe { width: 100%; height: 100%; border: 0; }
              #fallback {
                display: none;
                position: absolute; inset: 0;
                background: #111;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #fff;
                text-align: center;
                padding: 20px;
              }
              #fallback.visible { display: flex; }
              #fallback p { margin-bottom: 16px; font-size: 15px; opacity: 0.8; }
              #fallback a {
                display: inline-block;
                background: #FF0000;
                color: #fff;
                padding: 12px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <iframe
                id="yt"
                src="https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0&autoplay=0&controls=1&playsinline=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <div id="fallback">
                <p>This video cannot be played here because the owner has restricted embedding.</p>
                <a href="${youtubeWatchUrl}" target="_blank" rel="noopener">▶ Watch on YouTube</a>
              </div>
            </div>
            <script>
              // YouTube sends an error event via the iframe's contentWindow
              // We detect embed-blocked errors (code 101 / 150 / 152) and show the fallback
              window.addEventListener('message', function(e) {
                try {
                  var data = JSON.parse(e.data);
                  if (data && data.event === 'onError' && (data.info === 101 || data.info === 150 || data.info === 152)) {
                    document.getElementById('fallback').classList.add('visible');
                  }
                } catch(_) {}
              });

              // Additional fallback: if the iframe fails to load at all
              document.getElementById('yt').addEventListener('error', function() {
                document.getElementById('fallback').classList.add('visible');
              });
            </script>
          </body>
        </html>
      `;

      return createElement('iframe', {
        width: "100%",
        height: "100%",
        srcDoc: iframeHtml,
        frameBorder: "0",
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
            borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)',
            height: isLargeScreen ? verticalScale(460) : verticalScale(220),
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
        
        <Text style={[styles.slideContent, { color: theme.colors.textSecondary, marginTop: verticalScale(20) }]}>
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
        <View style={[styles.contentSlide, { justifyContent: 'center', alignItems: 'center', minHeight: verticalScale(450), paddingHorizontal: scale(10) }]}>
          {/* TOPIC Badge - Centered */}
          <View style={{ 
            backgroundColor: `${primaryColor}10`, 
            paddingHorizontal: scale(20), 
            paddingVertical: verticalScale(10), 
            borderRadius: scale(14), 
            marginBottom: verticalScale(30),
            borderWidth: 1,
            borderColor: `${primaryColor}20`
          }}>
            <Text style={{ 
              color: primaryColor, 
              fontSize: moderateScale(14), 
              fontWeight: '900', 
              letterSpacing: 2,
              fontFamily: theme.typography.fontFamily 
            }}>
              TOPIC
            </Text>
          </View>

          {/* Topic Name Row */}
          <View style={{ width: '100%', alignItems: 'center', marginBottom: verticalScale(10) }}>
            <Text 
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{ 
                color: primaryColor, 
                fontSize: moderateScale(24), 
                fontWeight: '900', 
                textAlign: 'center',
                lineHeight: moderateScale(32),
                fontFamily: theme.typography.fontFamily 
              }}
            >
              {currentSlideData.title}
            </Text>
          </View>

          <View style={{ width: scale(80), height: 2, backgroundColor: primaryColor, opacity: 0.3, marginBottom: verticalScale(40), alignSelf: 'center' }} />

          {/* Section Header */}
          <View style={{ width: '100%', marginBottom: verticalScale(20) }}>
            <Text style={{ 
              color: theme.colors.textSecondary, 
              fontSize: moderateScale(14), 
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
              fontSize: moderateScale(14), 
              opacity: 0.8,
              lineHeight: moderateScale(28),
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
        <View style={[styles.contentSlide, { paddingHorizontal: scale(10) }]}>
           {/* TOPIC Badge - Centered for Goals too as per design */}
           <View style={{ alignItems: 'center', marginBottom: verticalScale(30) }}>
            <View style={{ 
              backgroundColor: `${primaryColor}10`, 
              paddingHorizontal: scale(20), 
              paddingVertical: verticalScale(10), 
              borderRadius: scale(14), 
              borderWidth: 1,
              borderColor: `${primaryColor}20`
            }}>
              <Text style={{ 
                color: primaryColor, 
                fontSize: moderateScale(14), 
                fontWeight: '900', 
                letterSpacing: 2,
                fontFamily: theme.typography.fontFamily 
              }}>
                TOPIC
              </Text>
            </View>
          </View>

          <View style={{ width: '100%', alignItems: 'center', marginBottom: verticalScale(10) }}>
            <Text 
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{ 
                color: primaryColor, 
                fontSize: moderateScale(24), 
                fontWeight: '900', 
                textAlign: 'center',
                lineHeight: moderateScale(32),
                fontFamily: theme.typography.fontFamily 
              }}
            >
              {currentSlideData.title}
            </Text>
          </View>

          <View style={{ width: scale(80), height: 2, backgroundColor: primaryColor, opacity: 0.3, marginBottom: verticalScale(40), alignSelf: 'center' }} />

          <View style={{ width: '100%', marginBottom: verticalScale(24) }}>
             <Text style={{ color: theme.colors.textSecondary, fontSize: moderateScale(13), fontWeight: '700', opacity: 0.6, letterSpacing: 0.5, marginBottom: verticalScale(8), fontFamily: theme.typography.fontFamily }}>
               WHAT YOU WILL LEARN (GOAL/INTRO)
             </Text>
          </View>

          <View style={{ width: '100%' }}>
             {goalLines.map((goal, idx) => (
               <View key={idx} style={{ flexDirection: 'row', marginBottom: verticalScale(16), alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: moderateScale(18), color: theme.colors.textSecondary, marginRight: scale(12), opacity: 0.8 }}>•</Text>
                  <Text style={{ 
                    flex: 1, 
                    fontSize: moderateScale(14), 
                    color: theme.colors.textSecondary, 
                    fontWeight: '500', 
                    lineHeight: moderateScale(24),
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
      const { problem, solution, takeaway, why } = parseExampleContent(currentSlideData.content);

      return (
        <View style={styles.contentSlide}>
          {/* Title: Selective Underline */}
          {/* Title: inline label + name, auto-fit scaling */}
          <View style={{ marginBottom: verticalScale(20) }}>
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              style={{ fontSize: moderateScale(22), color: isDark ? '#FFFFFF' : '#000000', fontFamily: theme.typography.fontFamily, lineHeight: moderateScale(30) }}
            >
              Example Title:{' '}
              <Text style={{ fontWeight: '800', textDecorationLine: 'underline', color: primaryColor }}>
                {currentSlideData.title.replace(/example/i, '').replace(/^[:\s-]+/, '').trim() || currentSlideData.title}
              </Text>
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Problem: Red */}
            <Text style={{ fontSize: moderateScale(18), fontWeight: '800', color: '#EF4444', marginBottom: verticalScale(8), fontFamily: theme.typography.fontFamily }}>
              Problem: <Text style={{ color: theme.colors.textPrimary, fontWeight: '400' }}>{renderBoldText(problem)}</Text>
            </Text>

            {/* Solution: Green */}
            {solution && (
              <View style={{ marginTop: verticalScale(15), marginBottom: takeaway ? verticalScale(25) : verticalScale(10) }}>
                <Text style={{ fontSize: moderateScale(18), fontWeight: '800', color: '#10B981', marginBottom: verticalScale(10), fontFamily: theme.typography.fontFamily }}>
                  Solution:
                </Text>
                              <View style={{ padding: scale(18), backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', borderRadius: scale(16), borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)' }}>
                  <Text style={{ fontSize: moderateScale(16), color: theme.colors.textPrimary, lineHeight: moderateScale(26), fontFamily: theme.typography.fontFamily }}>
                    {renderBoldText(solution)}
                  </Text>
                </View>
              </View>
            )}

            {/* Key Takeaway Card */}
            {takeaway && (
              <View style={{ marginTop: verticalScale(10), borderRadius: scale(24), overflow: 'hidden' }}>
                <View style={{ padding: scale(20), borderRadius: scale(24), backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }}>
                  <View style={{ position: 'absolute', left: 0, top: verticalScale(20), bottom: verticalScale(20), width: scale(6), backgroundColor: '#EF4444', borderTopRightRadius: scale(4), borderBottomRightRadius: scale(4) }} />
                  <View style={{ marginLeft: scale(16) }}>
                    <Text style={{ color: '#EF4444', fontSize: moderateScale(12), fontWeight: '900', letterSpacing: 1, marginBottom: verticalScale(4), fontFamily: theme.typography.fontFamily }}>KEY TAKEAWAY</Text>
                    <Text style={{ fontSize: moderateScale(16), fontWeight: '600', lineHeight: moderateScale(24), color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }}>
                      WHAT: {renderBoldText(takeaway)}
                    </Text>
                    {why && (
                      <Text style={{ fontSize: moderateScale(16), fontWeight: '600', lineHeight: moderateScale(24), color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginTop: verticalScale(10) }}>
                        WHY: {renderBoldText(why)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Bulb Tip — separate from the takeaway card */}
            {takeaway && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10), paddingHorizontal: scale(4) }}>
                <Text style={{ fontSize: moderateScale(14), color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, opacity: 0.75 }}>
                  💡 Access more examples via the bulb icon.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={[styles.contentSlide, isIntro && { justifyContent: 'center', alignItems: 'center', minHeight: verticalScale(400) }]}>
        <Text style={[
          styles.slideTitle, 
          { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }
        ]}>
          {currentSlideData.title}
        </Text>
        <Text style={[
          styles.slideContent, 
          { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }
        ]}>
          {renderBoldText(currentSlideData.content)}
        </Text>
        
        {currentSlideData.content.includes('💡') && (
          <View style={{ marginTop: verticalScale(30), padding: scale(15), backgroundColor: `${primaryColor}10`, borderRadius: scale(15), borderWidth: 1, borderColor: `${primaryColor}30`, borderStyle: 'dashed' }}>
            <Text style={{ color: primaryColor, fontSize: moderateScale(14), fontWeight: '700', textAlign: 'center' }}>
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
          {renderBoldText(currentSlideData.question)}
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
                    backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.7)',
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
                       backgroundColor: showCorrect ? '#10B981' : showWrong ? '#EF4444' : (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'),
                       borderColor: showCorrect ? '#10B981' : showWrong ? '#EF4444' : theme.colors.glassBorder
                     }
                   ]}>
                      <Text style={[styles.optionLabelText, { color: (showCorrect || showWrong) ? '#FFF' : theme.colors.textPrimary }]}>
                        {label}
                      </Text>
                   </View>
                   <Text style={[styles.optionText, { color: theme.colors.textPrimary }]}>{renderBoldText(option)}</Text>
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
        pointerEvents="none"
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={[styles.header, isLargeScreen && styles.largeScreenContainer]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.1)' }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: primaryColor }]} />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {currentSlide + 1} / {slides.length}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.toolItem}>
              <TouchableOpacity 
                style={[styles.toolButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', borderColor: theme.colors.glassBorder }]}
                onPress={() => setShowNotes(true)}
              >
                <FileText color={theme.colors.secondary} size={18} />
              </TouchableOpacity>
              <Text style={[styles.toolLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Notes</Text>
            </View>

            <View style={styles.toolItem}>
              <TouchableOpacity 
                style={[styles.toolButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', borderColor: theme.colors.glassBorder }]}
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
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentCardWrapper, { shadowColor: primaryColor }, isLargeScreen && styles.largeScreenContainer]}>
            <View style={[styles.contentCard, { 
              backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
              borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)' 
            }, isLargeScreen && styles.largeScreenPadding]}>
              {renderSlideContent()}
            </View>
          </View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={[styles.navigationContainer, isLargeScreen && styles.largeScreenContainer]}>
          {currentSlide > 0 && (
            <TouchableOpacity 
              style={[styles.navButton, styles.prevButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
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
              <View style={{ padding: scale(40), alignItems: 'center' }}>
                 <View style={{ marginBottom: verticalScale(20), width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
                    <X size={40} color="#FFF" />
                 </View>
                 <Text style={[styles.xpTitle, { color: theme.colors.textPrimary }]}>Keep Trying!</Text>
                 <Text style={[styles.xpSubtitle, { color: theme.colors.textSecondary }]}>
                   You scored {testScore} marks.
                 </Text>
                 <Text style={{ textAlign: 'center', color: '#EF4444', fontSize: moderateScale(16), fontWeight: 'bold', marginBottom: verticalScale(30) }}>
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
              <View style={{ padding: scale(40), alignItems: 'center' }}>
                 <View style={{ marginBottom: verticalScale(20), width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: '#FACC15', justifyContent: 'center', alignItems: 'center' }}>
                    <Lightbulb size={scale(40)} color="#FFF" />
                 </View>
                 <Text style={[styles.xpTitle, { color: theme.colors.textPrimary, fontSize: moderateScale(24) }]}>Selection Required</Text>
                  <Text style={[styles.xpSubtitle, { color: theme.colors.textSecondary, marginBottom: verticalScale(30) }]}>
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
      <Modal visible={showExamples} animationType={isLargeScreen ? "fade" : "slide"} transparent>
        <View style={[
          styles.container, 
          { backgroundColor: 'rgba(0,0,0,0.5)' },
          isLargeScreen && { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 40 }
        ]}>
          <BlurView 
            intensity={100} 
            tint={isDark ? "dark" : "light"} 
            style={[
              isLargeScreen ? {} : StyleSheet.absoluteFill, 
              { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.75)' },
              isLargeScreen ? {
                width: '100%',
                maxWidth: 900,
                flex: 1,
                borderRadius: 32,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
                overflow: 'hidden'
              } : { flex: 1 }
            ]} 
          >
            <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
               <View style={[styles.toolButton, { backgroundColor: `${primaryColor}20`, borderColor: primaryColor }]}>
                  <Lightbulb color={primaryColor} size={20} />
               </View>
              <Text style={[styles.headerTitle, { flex: 1, color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginLeft: scale(10) }]}>Examples & Tips</Text>
              <TouchableOpacity 
                onPress={() => setShowExamples(false)}
                style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
              >
                <X color={theme.colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={true} indicatorStyle={isDark ? 'white' : 'black'}>
                {slides.filter(s => s.isExample === true || s.isExample === 'true' || (s.title && s.title.toLowerCase().includes('example'))).length > 0 ? (
                 slides.filter(s => s.isExample === true || s.isExample === 'true' || (s.title && s.title.toLowerCase().includes('example'))).map((ex, idx) => {
                   const { problem, solution, takeaway, why } = parseExampleContent(ex.content);

                   return (
                     <View key={idx} style={[styles.contentCardWrapper, { marginBottom: verticalScale(20), shadowColor: primaryColor }]}>
                       <View style={[styles.contentCard, { 
                        minHeight: 0, 
                        padding: scale(24), 
                        backgroundColor: isDark ? 'rgba(25, 25, 25, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                        borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.1)' 
                      }]}>
                          {/* Title: Bold with Underlined Contents */}
                          {/* Title: inline label + name, auto-fit scaling */}
                          <View style={{ marginBottom: verticalScale(20) }}>
                            <Text
                              numberOfLines={2}
                              adjustsFontSizeToFit
                              minimumFontScale={0.75}
                              style={{ fontSize: moderateScale(20), color: isDark ? '#FFFFFF' : '#000000', fontFamily: theme.typography.fontFamily, lineHeight: moderateScale(28) }}
                            >
                              Example Title:{' '}
                              <Text style={{ fontWeight: '800', textDecorationLine: 'underline', color: primaryColor }}>
                                {ex.title}
                              </Text>
                            </Text>
                          </View>
                          
                          {/* Problem: Red */}
                          <Text style={{ fontSize: moderateScale(18), fontWeight: '800', color: '#EF4444', marginBottom: verticalScale(8), fontFamily: theme.typography.fontFamily }}>
                            Problem: <Text style={{ color: theme.colors.textPrimary, fontWeight: '400' }}>{renderBoldText(problem)}</Text>
                          </Text>

                          {/* Solution: Green */}
                          {solution && (
                            <View style={{ marginTop: verticalScale(12), marginBottom: takeaway ? verticalScale(20) : 0 }}>
                              <Text style={{ fontSize: moderateScale(18), fontWeight: '800', color: '#10B981', marginBottom: verticalScale(8), fontFamily: theme.typography.fontFamily }}>
                                Solution:
                              </Text>
                              <View style={{ padding: scale(16), backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', borderRadius: scale(16), borderWidth: 1, borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)' }}>
                                <Text style={{ fontSize: moderateScale(15), color: theme.colors.textPrimary, lineHeight: moderateScale(24), fontFamily: theme.typography.fontFamily }}>
                                  {renderBoldText(solution)}
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Key Takeaway: No icon, space-maximized */}
                          {takeaway && (
                            <View style={{ marginTop: verticalScale(10), borderRadius: scale(24), overflow: 'hidden' }}>
                              <View style={{ padding: scale(20), borderRadius: scale(24), backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2' }}>
                                <View style={{ position: 'absolute', left: 0, top: verticalScale(20), bottom: verticalScale(20), width: scale(6), backgroundColor: '#EF4444', borderTopRightRadius: scale(4), borderBottomRightRadius: scale(4) }} />
                                <View style={{ marginLeft: scale(16) }}>
                                  <Text style={{ color: '#EF4444', fontSize: moderateScale(12), fontWeight: '900', letterSpacing: 1, marginBottom: verticalScale(4), fontFamily: theme.typography.fontFamily }}>KEY TAKEAWAY</Text>
                                  <Text style={{ fontSize: moderateScale(15), fontWeight: '600', lineHeight: moderateScale(24), color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }}>
                                    WHAT: {renderBoldText(takeaway)}
                                  </Text>
                                  {why && (
                                    <Text style={{ fontSize: moderateScale(15), fontWeight: '600', lineHeight: moderateScale(24), color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, marginTop: verticalScale(10) }}>
                                      WHY: {renderBoldText(why)}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            </View>
                          )}

                          {/* Bulb Tip — separate from the takeaway card */}
                          {takeaway && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10), paddingHorizontal: scale(4) }}>
                              <Text style={{ fontSize: moderateScale(13), color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, opacity: 0.75 }}>
                                💡 Access more examples via the bulb icon.
                              </Text>
                            </View>
                          )}
                       </View>
                     </View>
                   );
                 })
               ) : (
                 <View style={{ alignItems: 'center', marginTop: verticalScale(100) }}>
                    <Lightbulb size={scale(60)} color={theme.colors.textSecondary} style={{ opacity: 0.3, marginBottom: verticalScale(20) }} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: moderateScale(16), textAlign: 'center', opacity: 0.7 }}>
                       No specific examples added for this lesson.
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: moderateScale(14), textAlign: 'center', marginTop: verticalScale(10), paddingHorizontal: scale(40) }}>
                       Check the core concept slides for general theory and explanations!
                    </Text>
                 </View>
               )}
               <View style={{ height: verticalScale(40) }} />
            </ScrollView>
          </SafeAreaView>
          </BlurView>
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
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(10),
    gap: scale(12),
  },
  backButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: { flex: 1 },
  progressBar: {
    height: verticalScale(6),
    borderRadius: scale(3),
    overflow: 'hidden',
    marginBottom: verticalScale(8),
  },
  progressFill: { height: '100%', borderRadius: scale(3) },
  progressText: { fontSize: moderateScale(13), fontWeight: '700' },
  headerRight: {
    flexDirection: 'row',
    gap: scale(10),
  },
  toolButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolItem: {
    alignItems: 'center',
    gap: scale(4),
  },
  toolLabel: {
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: scale(20) },
  contentCardWrapper: {
    borderRadius: scale(32),
    overflow: 'visible',
  },
  contentCard: {
    padding: scale(20),
    borderWidth: 1,
    borderRadius: scale(32),
    overflow: 'hidden',
    minHeight: verticalScale(450),
  },
  largeScreenContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  largeScreenPadding: {
    padding: scale(40),
  },
  contentSlide: { flex: 1 },
  videoSlide: { flex: 1 },
  videoWrapper: {
    borderRadius: scale(24),
    overflow: 'visible',
    marginTop: verticalScale(10),
  },
  videoContainer: {
    borderRadius: scale(24),
    borderWidth: 1,
    overflow: 'hidden',
    height: verticalScale(220),
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
    fontSize: moderateScale(24),
    fontWeight: '900',
    marginBottom: verticalScale(20),
    lineHeight: moderateScale(34),
  },
  slideContent: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(30),
    opacity: 0.9,
  },
  quizSlide: { flex: 1 },
  quizQuestion: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    marginBottom: verticalScale(24),
  },
  optionsContainer: { 
    gap: verticalScale(12),
    flexDirection: 'column'
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(16),
    borderRadius: scale(20),
    width: '100%'
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
  optionText: { fontSize: moderateScale(16), fontWeight: '600', flex: 1 },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    borderRadius: scale(20),
    gap: scale(8),
  },
  prevButton: { flex: 1 },
  nextButton: { flex: 2 },
  navButtonText: { fontSize: moderateScale(16), fontWeight: '900', letterSpacing: 0.5 },
  
  // XP Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpCard: {
    width: width * 0.85,
    maxWidth: 500,
    borderRadius: scale(40),
    overflow: 'hidden',
    elevation: 20,
  },
  xpGradient: {
    padding: scale(40),
    alignItems: 'center',
  },
  trophyIcon: { marginBottom: verticalScale(20) },
  xpTitle: {
    color: '#FFF',
    fontSize: moderateScale(32),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  xpSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: verticalScale(30),
  },
  xpBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    borderRadius: scale(20),
    gap: scale(10),
    marginBottom: verticalScale(25),
  },
  xpAmount: {
    color: '#FFF',
    fontSize: moderateScale(24),
    fontWeight: '900',
  },
  starsRow: {
    flexDirection: 'row',
    gap: scale(15),
    marginBottom: verticalScale(40),
  },
  collectButton: {
    backgroundColor: '#FFF',
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(40),
    borderRadius: scale(20),
    width: '100%',
  },
  collectText: {
    color: '#8B5CF6',
    fontWeight: '900',
    fontSize: moderateScale(16),
    textAlign: 'center',
  }
});
