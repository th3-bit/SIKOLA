import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    image: require('../../assets/onboarding_1.jpg'),
    title: 'Learn New Skills',
    description: 'Explore a vast library of courses and master new skills at your own pace.',
  },
  {
    image: require('../../assets/onboarding_2.jpg'),
    title: 'Interactive Lessons',
    description: 'Engage with interactive content, quizzes, and practical exercises.',
  },
  {
    image: require('../../assets/onboarding_3.jpg'),
    title: 'Achieve Your Goals',
    description: 'Track your progress, earn certificates, and unlock your full potential.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  // ... existing state ...
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newActiveSlide = Math.round(contentOffsetX / width);
    setActiveSlide(newActiveSlide);
  };

  const nextSlide = () => {
    if (activeSlide < onboardingData.length - 1) {
      scrollViewRef.current?.scrollTo({ 
        x: (activeSlide + 1) * width, 
        animated: true 
      });
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.slidesContainer}
        bounces={false}
      >
        {onboardingData.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Image 
              source={slide.image} 
              style={styles.image} 
              resizeMode="cover" 
            />
            {/* Gradient Overlay for Text Readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradientOverlay}
            />
          </View>
        ))}
      </ScrollView>

      {/* Controls Overlay */}
      <SafeAreaView style={styles.controlsOverlay} pointerEvents="box-none">
        <View style={styles.skipContainer}>
           <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={[styles.skipText, { color: '#FFF', fontFamily: theme.typography.fontFamily }]}>Skip</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.bottomContent} pointerEvents="box-none">
          {/* Text Content - Animated per slide? For now just static per slide from state */}
          <View style={styles.textContainer}>
             <Text style={[styles.title, { fontFamily: theme.typography.fontFamily }]}>
               {onboardingData[activeSlide].title}
             </Text>
             <Text style={[styles.description, { fontFamily: theme.typography.fontFamily }]}>
               {onboardingData[activeSlide].description}
             </Text>
          </View>

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
                <ArrowRight color={theme.colors.textContrast} size={20} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fallback
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width: width,
    height: '100%',
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: width,
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
    paddingHorizontal: 25,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomContent: {
    paddingBottom: 40,
    paddingHorizontal: 30,
    justifyContent: 'flex-end',
  },
  textContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
    color: '#FFF',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: 'rgba(255,255,255,0.9)',
  },
  footer: {
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});
