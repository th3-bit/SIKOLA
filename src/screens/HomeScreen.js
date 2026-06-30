import React from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, ChevronRight, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCopilot, walkthroughable, CopilotStep } from 'react-native-copilot';

import { useFocusEffect } from '@react-navigation/native';

const WalkthroughableView = walkthroughable(View);
import StatusModal from '../components/StatusModal';

const WalkthroughableScrollView = walkthroughable(ScrollView);

import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { scale, moderateScale, verticalScale } from '../utils/Scaling';

import GlassHeader from '../components/GlassHeader';
import DailyProgressCard from '../components/DailyProgressCard';
import LessonCard from '../components/LessonCard';
import CategoryCard from '../components/CategoryCard';
import TrialBanner from '../components/TrialBanner';
import MarketingCarousel from '../components/MarketingCarousel';
import LockStatusModal from '../components/LockStatusModal';

function HomeScreen({ navigation }) {
  const { theme, isDark, hapticsEnabled } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 1024;
  const { start, copilotEvents, visible } = useCopilot();
  const scrollRef = React.useRef(null);
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);

  React.useEffect(() => {
    const handleStepChange = (step) => {
      if (step?.name === 'exploreSubjects') {
        // Small delay to ensure measurements happen after the scroll layout settles
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: verticalScale(415), animated: true });
        }, 100);
      } else if (step?.name === 'progress' || step?.name === 'search' || step?.name === 'profileHeader') {
        // Ensure we are at the top for header and progress steps
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    };

    const handleStop = () => {
      setShowWelcomeModal(true);
    };

    copilotEvents.on('stepChange', handleStepChange);
    copilotEvents.on('stop', handleStop);

    return () => {
      copilotEvents.off('stepChange', handleStepChange);
      copilotEvents.off('stop', handleStop);
    };
  }, [copilotEvents]);

  useFocusEffect(
    React.useCallback(() => {
      const checkFirstTime = async () => {
        try {
          const hasSeen = await AsyncStorage.getItem('hasSeenHomeCoachmarks');
          if (!hasSeen) {
            start();
            await AsyncStorage.setItem('hasSeenHomeCoachmarks', 'true');
          }
        } catch (e) {
          logger.error('Error with coachmarks', e);
        }
      };
      // Add a slight delay to ensure screen is mounted and animated in
      setTimeout(checkFirstTime, 500);
    }, [start])
  );
  
  // Animation refs
  const progressScale = React.useRef(new Animated.Value(1)).current;
  const subScale = React.useRef(new Animated.Value(1)).current;
  const ctaScale = React.useRef(new Animated.Value(1)).current;
  const [showLockModal, setShowLockModal] = React.useState(false);
  const [lockConfig, setLockConfig] = React.useState({ type: 'subscription', title: '', message: '', onAction: null });

  const animateScale = (ref, toValue) => {
    Animated.spring(ref, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 40
    }).start();
  };

  const handlePressIn = (ref, style = 'light') => {
    animateScale(ref, 0.97);
    if (hapticsEnabled) {
      if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePressOut = (ref) => {
    animateScale(ref, 1);
  };

  const { 
    recentLessons, 
    continueLearning, 
    isLoading, 
    subjectBreakdown,
    checkSubjectAccess,
    checkAccess,
    subscriptions,
    isTrialExpired
  } = useProgress();

  // 1. Categories for the grid (Memoized from breakdown)
  const categories = React.useMemo(() => {
    return subjectBreakdown.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      topicCount: cat.totalTopics,
      lessonCount: cat.totalLessons,
      progress: cat.totalTopics > 0 ? (cat.completedTopics / cat.totalTopics) * 100 : 0
    }));
  }, [subjectBreakdown]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }



  const renderDailyProgress = () => (
    <View style={{ marginBottom: verticalScale(20) }}>
      <CopilotStep text="Track your learning progress and your daily, weekly, and monthly streaks." order={1} name="progress">
        <WalkthroughableView pointerEvents={visible ? 'none' : 'auto'}>
          <Animated.View style={{ transform: [{ scale: progressScale }] }}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPressIn={() => handlePressIn(progressScale)}
              onPressOut={() => handlePressOut(progressScale)}
              onPress={() => navigation.navigate('LearningProgress')}
            >
              <DailyProgressCard />
            </TouchableOpacity>
          </Animated.View>
        </WalkthroughableView>
      </CopilotStep>
    </View>
  );

  const renderSubscriptionBanner = () => (
    <Animated.View style={[styles.subscriptionBannerWrapper, { transform: [{ scale: subScale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => handlePressIn(subScale, 'medium')}
        onPressOut={() => handlePressOut(subScale)}
        onPress={() => navigation.navigate('Subscription')}
      >
        <View style={[styles.subscriptionBanner, { 
          backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.1)',
          borderColor: '#FACC15',
          borderWidth: scale(1.5)
        }]}>
          <View style={styles.subscriptionContent}>
            <View style={styles.subscriptionLeft}>
              <View style={styles.crownContainer}>
                <Crown size={scale(22)} color="#FACC15" fill="#FACC15" />
              </View>
              <View style={styles.subscriptionText}>
                <Text style={[styles.subscriptionTitle, { color: theme.colors.textPrimary }]}>
                  Unlock Premium Access
                </Text>
                <Text style={[styles.subscriptionSubtitle, { color: theme.colors.textSecondary }]}>
                  View all subscription plans
                </Text>
              </View>
            </View>
            <ChevronRight size={scale(24)} color="#FACC15" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderContinueLearning = () => {
    if (continueLearning.length === 0) return null;
    return (
      <View style={[styles.section, isDesktop && styles.desktopSectionCard, isDesktop && isDark && styles.desktopSectionCardDark]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
          Continue Learning
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.horizontalScroll, isDesktop && { paddingHorizontal: scale(24) }]}
          style={[styles.horizontalScrollView, isDesktop && { marginHorizontal: -scale(24) }]}
        >
          {continueLearning.map((topic) => (
            <LessonCard 
              key={topic.id} 
              lesson={topic} 
              shadowColor={topic.color}
              onPress={() => navigation.navigate('LessonDetail', { 
                 lesson: topic,
                 subject: { id: topic.subject_id, name: topic.category, color: topic.color },
                 subjectIndex: topic.subjectIndex,
                 topicIndex: topic.topicIndex,
                 fromContinueLearning: true
              })}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderExploreSubjects = () => (
    <View style={[styles.section, isDesktop && styles.desktopSectionCard, isDesktop && isDark && styles.desktopSectionCardDark]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
        Explore Subjects
      </Text>
      <View style={isDesktop ? styles.desktopCategoriesGrid : styles.categoriesGrid}>
        {categories.map((category, index) => {
          const isUnlocked = checkSubjectAccess(category.id, index);
          return (
            <View key={category.id} style={isDesktop ? styles.desktopCategoryItem : { position: 'relative' }}>
              <CategoryCard 
                category={category}
                onPress={() => {
                  if (isUnlocked) {
                    navigation.navigate('SubjectDetail', { subject: category, subjectIndex: index });
                  } else {
                    navigation.navigate('Subscription', { reason: 'Unlock Subject', subject: category });
                  }
                }}
                style={{ opacity: isUnlocked ? 1 : 0.6 }}
              />
              {!isUnlocked && (
                <View style={[styles.lockOverlay, { backgroundColor: 'rgba(0,0,0,0.3)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', borderRadius: scale(20) }]}>
                   <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: scale(10), borderRadius: scale(20) }}>
                      <Lock size={scale(24)} color="#FFF" />
                   </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderEliteCTA = () => (
    <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => handlePressIn(ctaScale, 'medium')}
        onPressOut={() => handlePressOut(ctaScale)}
        onPress={() => navigation.navigate('Subscription', { defaultPlanType: 'monthly' })}
        style={styles.ctaWrapper}
      >
        <LinearGradient
          colors={['#1FD907', '#1AB206']}
          style={styles.ctaCard}
        >
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Become a Sikola Legend</Text>
            <Text style={styles.ctaDesc}>Get unlimited access to everything and join the elite circle of learners.</Text>
            <View style={[styles.ctaButton, { backgroundColor: '#FFF' }]}>
               <Text style={[styles.ctaButtonText, { color: '#8B5CF6' }]}>Join the Elite Circle</Text>
               <ChevronRight size={scale(16)} color="#8B5CF6" />
            </View>
          </View>
          <View style={styles.ctaIconContainer}>
             <Crown size={scale(80)} color="rgba(255,255,255,0.15)" strokeWidth={1.5} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <GlassHeader 
          showSearch={true} 
          onSearchPress={() => navigation.navigate('Search')}
        />
        
        {/* Responsive Ghost Target for Step 5 */}
        <View style={{ position: 'absolute', top: verticalScale(140), left: 0, right: 0, height: 1, zIndex: -1 }}>
          <CopilotStep text="Browse our extensive library of subjects and discover new courses tailored to your goals." order={5} name="exploreSubjects">
            <WalkthroughableView pointerEvents={visible ? 'none' : 'auto'} style={{ flex: 1 }} />
          </CopilotStep>
        </View>
        
        <WalkthroughableScrollView 
          ref={scrollRef}
          style={[styles.scrollView, isDesktop && { paddingRight: 100 }]}
          contentContainerStyle={[styles.content, isDesktop && styles.desktopContent]}
          showsVerticalScrollIndicator={false}
        >
          {isDesktop ? (
            <View>
              {/* Top Full-Width Banners */}
              <MarketingCarousel navigation={navigation} />
              <TrialBanner />
              
              <View style={styles.desktopRow}>
                {/* Left Column (Side) */}
                <View style={styles.desktopSideColumn}>
                  {renderDailyProgress()}
                  {renderSubscriptionBanner()}
                  {renderEliteCTA()}
                </View>

                {/* Right Column (Main) */}
                <View style={styles.desktopMainColumn}>
                  {renderContinueLearning()}
                  {renderExploreSubjects()}
                </View>
              </View>
            </View>
          ) : (
            <>
              <MarketingCarousel navigation={navigation} />
              <TrialBanner />
              {renderDailyProgress()}
              {renderSubscriptionBanner()}
              {renderContinueLearning()}
              {renderExploreSubjects()}
              {renderEliteCTA()}
            </>
          )}

          {/* Bottom padding for tab bar */}
          <View style={{ height: verticalScale(140) }} />
        </WalkthroughableScrollView>
      </SafeAreaView>


      <LockStatusModal 
        visible={showLockModal}
        onClose={() => setShowLockModal(false)}
        type={lockConfig.type}
        title={lockConfig.title}
        message={lockConfig.message}
        onAction={lockConfig.onAction}
      />

      <StatusModal 
        visible={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        type="success"
        title="Welcome to Sikola! ✨"
        message="You're all set! Explore your subjects, track your progress, and start your journey to academic excellence."
        actionText="Let's Start Learning"
        onAction={() => setShowWelcomeModal(false)}
      />
    </View>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
  },
  section: {
    marginBottom: verticalScale(30),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    marginBottom: verticalScale(16),
  },
  horizontalScrollView: {
    // Negative margin to break out of parent paddingHorizontal and reach screen edges
    marginHorizontal: -scale(20),
  },
  horizontalScroll: {
    paddingLeft: scale(20),  // First card aligned with rest of content
    paddingRight: scale(20), // Trailing space after last card
  },
  categoriesGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  recentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recentItem: {
    width: '48%',
    marginBottom: 16,
  },
  subscriptionBannerWrapper: {
    marginBottom: verticalScale(16),
    borderRadius: moderateScale(28),
    overflow: 'visible',
  },
  subscriptionBanner: {
    borderRadius: scale(20),
    borderWidth: 2,
    padding: scale(16),
    overflow: 'hidden',
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    flex: 1,
  },
  crownContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionText: {
    flex: 1,
  },
  subscriptionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    marginBottom: verticalScale(0),
  },
  subscriptionSubtitle: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  ctaWrapper: {
    marginTop: verticalScale(10),
    borderRadius: scale(24),
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(15),
    elevation: 10,
  },
  ctaCard: {
    padding: scale(24),
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ctaContent: {
    flex: 1,
    zIndex: 1,
  },
  ctaTitle: {
    color: '#FFF',
    fontSize: moderateScale(22),
    fontWeight: '900',
    marginBottom: verticalScale(8),
  },
  ctaDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginBottom: verticalScale(20),
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(10),
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  ctaButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginRight: scale(4),
  },
  ctaIconContainer: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  lockOverlay: {
    position: 'absolute',
    borderRadius: scale(20),
  },

  // Desktop Styles
  desktopContent: {
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  desktopRow: {
    flexDirection: 'row',
    gap: 30,
  },
  desktopMainColumn: {
    flex: 2.2,
  },
  desktopSideColumn: {
    flex: 1,
  },
  desktopCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  desktopCategoryItem: {
    width: '48%',
    position: 'relative'
  },
  desktopSectionCard: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    padding: scale(24),
    borderRadius: scale(28),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    marginBottom: verticalScale(30),
  },
  desktopSectionCardDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255,255,255,0.15)',
  }
});
