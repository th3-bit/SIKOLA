import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  ScrollView,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, GraduationCap, BookOpen, PenTool, Award } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    icon: GraduationCap,
    title: 'Learn New Skills',
    description: 'Explore a vast library of courses and master new skills at your own pace.',
  },
  {
    icon: BookOpen,
    title: 'Interactive Lessons',
    description: 'Engage with interactive content, quizzes, and practical exercises.',
  },
  {
    icon: Award,
    title: 'Achieve Your Goals',
    description: 'Track your progress, earn certificates, and unlock your full potential.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { theme, isDark } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.content}>
        <View style={styles.skipContainer}>
           <TouchableOpacity onPress={() => navigation.replace('Login')}>
              <Text style={[styles.skipText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Skip</Text>
           </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.slidesContainer}
        >
          {onboardingData.map((slide, index) => (
            <View key={index} style={styles.slide}>
              <View style={[
                styles.iconContainer, 
                { 
                  backgroundColor: isDark ? 'rgba(240, 236, 29, 0.1)' : 'rgba(37, 99, 235, 0.1)', 
                  borderColor: isDark ? 'rgba(240, 236, 29, 0.2)' : 'rgba(37, 99, 235, 0.2)' 
                }
              ]}>
                <slide.icon size={60} color={theme.colors.secondary} />
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{slide.title}</Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{slide.description}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: activeSlide === index ? theme.colors.secondary : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') },
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
      </SafeAreaView>
    </View>
  );
}

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
  content: {
    flex: 1,
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
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
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
