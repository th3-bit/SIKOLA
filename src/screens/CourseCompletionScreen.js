import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { CheckCircle, Award, Share2, Home, ArrowRight, Star } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const { scale, verticalScale, moderateScale } = require('../utils/Scaling');

// Simple particle system for confetti effect
const ConfettiParticle = ({ index }) => {
  const positionY = useRef(new Animated.Value(-50)).current;
  const positionX = useRef(new Animated.Value(Math.random() * width)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = Math.random() * 1000;
    const duration = 2500 + Math.random() * 2000;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(positionY, {
          toValue: height + 50,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.7),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          })
        ])
      ])
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${360 + Math.random() * 360}deg`]
  });

  const colors = ['#FACC15', '#EC4899', '#8B5CF6', '#3B82F6', '#10B981'];
  const color = colors[index % colors.length];
  const size = scale(10) + Math.random() * scale(10);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 2, 
        transform: [
          { translateX: positionX },
          { translateY: positionY },
          { rotate: spin },
          { scale: opacity } 
        ],
        opacity: opacity,
        zIndex: 100,
      }}
    />
  );
};

export default function CourseCompletionScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const params = route.params || {};
  const course = params.course || params.lesson || { title: 'Unknown Course', subject: 'General' };
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />

      {/* Confetti */}
      {[...Array(30)].map((_, i) => <ConfettiParticle key={i} index={i} />)}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.safeArea}>
            
          <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.glowRing, { backgroundColor: `${theme.colors.secondary}40` }]} />
              <View style={[styles.glowRingInner, { backgroundColor: `${theme.colors.secondary}60` }]} />
              <LinearGradient
                colors={[theme.colors.secondary, '#8B5CF6']}
                style={styles.iconCircle}
              >
                <Award size={scale(64)} color="#FFF" fill="#FFF" />
              </LinearGradient>
            </View>

            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Course Completed!</Text>
            <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
              You've successfully mastered
            </Text>
            <Text style={[styles.courseName, { color: theme.colors.secondary }]}>
              {course.title}
            </Text>

            {/* Certificate Card */}
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.certificateCard, { borderColor: theme.colors.glassBorder }]}>
              <View style={styles.certificateHeader}>
                <View style={styles.certLogo}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: theme.colors.textPrimary }}>S+</Text>
                </View>
                <Text style={[styles.certLabel, { color: theme.colors.textSecondary }]}>CERTIFICATE OF COMPLETION</Text>
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                   <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>12</Text>
                   <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Lessons</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.glassBorder }]} />
                <View style={styles.statItem}>
                   <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>4.5h</Text>
                   <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Hours</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.colors.glassBorder }]} />
                <View style={styles.statItem}>
                   <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>98%</Text>
                   <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Score</Text>
                </View>
              </View>

              <View style={[styles.xpRow, { backgroundColor: `${theme.colors.secondary}20` }]}>
                 <Star size={16} color={theme.colors.secondary} fill={theme.colors.secondary} />
                 <Text style={[styles.xpText, { color: theme.colors.secondary }]}>+500 XP Earned</Text>
              </View>
            </BlurView>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                activeOpacity={0.8}
                style={[styles.primaryButton, { shadowColor: theme.colors.secondary }]}
                onPress={() => navigation.navigate('MainApp')}
              >
                <LinearGradient
                  colors={[theme.colors.secondary, '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonText}>Continue Journey</Text>
                  <ArrowRight size={20} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.secondaryButtons}>
                 <TouchableOpacity 
                   style={[styles.outlineButton, { borderColor: theme.colors.glassBorder }]}
                   onPress={() => {}}
                 >
                    <Share2 size={20} color={theme.colors.textPrimary} />
                    <Text style={[styles.outlineButtonText, { color: theme.colors.textPrimary }]}>Share</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   style={[styles.outlineButton, { borderColor: theme.colors.glassBorder }]}
                   onPress={() => navigation.navigate('MainApp', { screen: 'Home' })}
                 >
                    <Home size={20} color={theme.colors.textPrimary} />
                    <Text style={[styles.outlineButtonText, { color: theme.colors.textPrimary }]}>Home</Text>
                 </TouchableOpacity>
              </View>
            </View>

          </Animated.View>
        </SafeAreaView>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    padding: scale(24),
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    position: 'relative',
    width: scale(120),
    height: scale(120),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(30),
  },
  glowRing: {
    position: 'absolute',
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    opacity: 0.5,
  },
  glowRingInner: {
    position: 'absolute',
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    opacity: 0.8,
  },
  iconCircle: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  message: {
    fontSize: moderateScale(16),
    marginBottom: verticalScale(8),
    textAlign: 'center',
  },
  courseName: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    marginBottom: verticalScale(40),
    textAlign: 'center',
  },
  certificateCard: {
    width: '100%',
    padding: scale(24),
    borderRadius: scale(24),
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: verticalScale(40),
  },
  certificateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(20),
    gap: scale(12),
  },
  certLogo: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  certLabel: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    letterSpacing: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: verticalScale(20),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: verticalScale(30),
  },
  statValue: {
    fontSize: moderateScale(20),
    fontWeight: '900',
    marginBottom: verticalScale(4),
  },
  statLabel: {
    fontSize: moderateScale(12),
    opacity: 0.7,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(12),
    borderRadius: scale(16),
    gap: scale(8),
  },
  xpText: {
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
  buttonContainer: {
    width: '100%',
    gap: verticalScale(16),
  },
  primaryButton: {
    width: '100%',
    borderRadius: scale(20),
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(18),
    borderRadius: scale(20),
    gap: scale(8),
  },
  buttonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: scale(16),
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    borderRadius: scale(20),
    borderWidth: 1,
    gap: scale(8),
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  outlineButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  }
});
