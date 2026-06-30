import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Image,
  Platform,
  useWindowDimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';



const onboardingData = [
  {
    image: require('../../assets/onboarding_1.png'),
    title: 'Learn Anywhere, Anytime',
    description: 'Turn every moment into a chance to grow — even on the move.',
    microText: 'Quick lessons. Smart results.',
  },
  {
    image: require('../../assets/onboarding_2.png'),
    title: 'Make Learning Enjoyable',
    description: 'Study with interactive lessons, quizzes, and challenges that keep you engaged.',
  },
  {
    image: require('../../assets/onboarding_3.png'),
    title: 'Track Your Progress',
    description: 'See your improvement, earn scores, and celebrate every milestone.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { completeOnboarding } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);
  
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;
  const CONTAINER_WIDTH = isDesktop ? 420 : windowWidth;
  const CONTAINER_HEIGHT = isDesktop ? Math.min(850, windowHeight * 0.9) : '100%';

  // Animation values for text fade + slide-up
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Track raw scroll position for the parallax effect
  const scrollX = useRef(new Animated.Value(0)).current;

  // Trigger animation whenever the active slide changes
  useEffect(() => {
    // Reset to starting position (invisible, 30px below)
    fadeAnim.setValue(0);
    slideAnim.setValue(30);

    // Animate to final position (fully visible, 0px offset)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeSlide]);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newActiveSlide = Math.round(contentOffsetX / CONTAINER_WIDTH);
    setActiveSlide(newActiveSlide);
  };

  const nextSlide = () => {
    if (activeSlide < onboardingData.length - 1) {
      scrollViewRef.current?.scrollTo({ 
        x: (activeSlide + 1) * CONTAINER_WIDTH, 
        animated: true 
      });
    } else {
      completeOnboarding();
    }
  };

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainerBackground]}>
      <View style={[isDesktop && styles.desktopWrapper, { width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT }]}>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true, listener: handleScroll }
          )}
          scrollEventThrottle={16}
          style={styles.slidesContainer}
          bounces={false}
        >
          {onboardingData.map((slide, index) => {
            // Compute a parallax translateX for this slide's image
            const inputRange = [(index - 1) * CONTAINER_WIDTH, index * CONTAINER_WIDTH, (index + 1) * CONTAINER_WIDTH];
            const parallaxTranslateX = scrollX.interpolate({
              inputRange,
              outputRange: [-CONTAINER_WIDTH * 0.3, 0, CONTAINER_WIDTH * 0.3],
              extrapolate: 'clamp',
            });

            return (
              <View key={index} style={[styles.slide, { width: CONTAINER_WIDTH }]}>
                <Animated.Image
                  source={slide.image}
                  style={[
                    styles.image,
                    { 
                      width: CONTAINER_WIDTH * 1.6, 
                      left: -CONTAINER_WIDTH * 0.3,
                      transform: [{ translateX: parallaxTranslateX }] 
                    },
                  ]}
                  resizeMode="cover"
                />
              {/* Gradient Overlay for Text Readability */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.gradientOverlay}
              />
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Controls Overlay */}
      <SafeAreaView style={styles.controlsOverlay} pointerEvents="box-none">
        <View style={styles.skipContainer}>
           <TouchableOpacity style={styles.skipButton} onPress={() => completeOnboarding()}>
              <Text style={[styles.skipText, { fontFamily: theme.typography.fontFamily }]}>Skip</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.bottomContent} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.title, { fontFamily: theme.typography.fontFamily }]}>
              {onboardingData[activeSlide].title}
            </Text>
            <Text style={[styles.description, { fontFamily: theme.typography.fontFamily }]}>
              {onboardingData[activeSlide].description}
            </Text>
            {onboardingData[activeSlide].microText && (
              <Text style={[styles.microText, { fontFamily: theme.typography.fontFamily }]}>
                {onboardingData[activeSlide].microText}
              </Text>
            )}
          </Animated.View>

          <View style={styles.footer}>
            <View style={styles.pagination}>
              {onboardingData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: activeSlide === index ? theme.colors.secondary : 'rgba(255,255,255,0.4)' },
                    activeSlide === index && styles.activeDot
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.buttonWrapper, { shadowColor: theme.colors.secondary }]}
              onPress={nextSlide}
            >
              <LinearGradient
                colors={isDark ? [theme.colors.secondary, '#CFCB11'] : [theme.colors.secondary, '#1D4ED8']}
                style={styles.buttonGradient}
              >
                <Text style={[styles.buttonText, { color: theme.colors.textContrast, fontFamily: theme.typography.fontFamily }]}>
                  {activeSlide === onboardingData.length - 1 ? 'Get Started' : 'Next'}
                </Text>
                <ArrowRight color={theme.colors.textContrast} size={scale(20)} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fallback
  },
  desktopContainerBackground: {
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  desktopWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    height: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden', // Clip the wider parallax image within slide bounds
  },
  image: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%', // Cover bottom half for text
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  skipContainer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    alignItems: 'flex-end',
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: scale(1),
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: scale(50),
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(8),
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  skipText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#FFF',
  },
  bottomContent: {
    paddingBottom: verticalScale(40),
    paddingHorizontal: scale(30),
    justifyContent: 'flex-end',
  },
  textContainer: {
    marginBottom: verticalScale(40),
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(30),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(38),
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: verticalScale(2) },
    textShadowRadius: scale(6),
  },
  description: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: verticalScale(10),
  },
  microText: {
    fontSize: moderateScale(13),
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    letterSpacing: 0.5,
    marginTop: verticalScale(4),
  },
  footer: {
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: verticalScale(30),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    marginHorizontal: scale(4),
  },
  activeDot: {
    width: scale(24),
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: scale(20),
    overflow: 'hidden',
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(15),
    elevation: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(18),
    borderRadius: scale(20),
  },
  buttonText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginRight: scale(10),
  },
});
