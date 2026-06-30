import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ticket, Sparkles, ChevronRight, X, Trophy, Zap, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

const { width, height } = Dimensions.get('window');

export default function FreePassModal({ visible, onClose, onStart, isPremium = false }) {
  const { theme, isDark } = useTheme();
  
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Entrance Animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        })
      ]).start();

      // Floating Animation for Icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -10,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.quad),
          })
        ])
      ).start();

      // Pulse Animation for Button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      floatAnim.setValue(0);
      slideAnim.setValue(20);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View 
            style={[
                styles.blurWrapper,
                { opacity: fadeAnim }
            ]}
        >
            <BlurView
              intensity={isDark ? 50 : 30}
              tint={isDark ? "dark" : "light"}
              style={styles.blurContainer}
            />
        </Animated.View>

        <Animated.View 
            style={[
                styles.contentWrapper,
                {
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateY: slideAnim }
                    ]
                }
            ]}
        >
            <View style={[styles.modalContent, { 
                backgroundColor: isDark ? 'rgba(20, 20, 20, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'
            }]}>
                
                {/* Close Button */}
                <TouchableOpacity 
                    onPress={onClose}
                    style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}
                    activeOpacity={0.7}
                >
                    <X size={moderateScale(20)} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                {/* Animated Background Shapes */}
                <View style={styles.bgShapes}>
                    <View style={[styles.shape, styles.shape1, { backgroundColor: theme.colors.secondary, opacity: 0.05 }]} />
                    <View style={[styles.shape, styles.shape2, { backgroundColor: '#F59E0B', opacity: 0.05 }]} />
                </View>

                {/* Icon Header with Float Animation */}
                <Animated.View style={[styles.iconContainer, { transform: [{ translateY: floatAnim }] }]}>
                    <LinearGradient
                        colors={isPremium ? ['#3B82F6', '#60A5FA'] : ['#F59E0B', '#FCD34D']}
                        style={[styles.iconGradient, isPremium && { shadowColor: '#3B82F6' }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {isPremium ? (
                            <Trophy size={moderateScale(36)} color="#FFF" fill="#FFF" />
                        ) : (
                            <Ticket size={moderateScale(36)} color="#FFF" fill="#FFF" />
                        )}
                    </LinearGradient>
                    <Animated.View style={[styles.badge, { backgroundColor: isDark ? '#1F2937' : '#FFF', transform: [{ scale: pulseAnim }] }]}>
                        <Sparkles size={moderateScale(14)} color={isPremium ? '#3B82F6' : '#F59E0B'} />
                    </Animated.View>
                </Animated.View>

                {/* Text Content */}
                <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {isPremium ? "Ready to Ace\n" : "Ready for your\n"}
                    <Text style={{ color: isPremium ? '#3B82F6' : '#F59E0B' }}>
                        {isPremium ? "This Test?" : "Daily Pass Test?"}
                    </Text>
                </Text>

                <View style={[styles.divider, { backgroundColor: isPremium ? '#3B82F6' : '#F59E0B' }]} />

                <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {isPremium 
                        ? "You have unlimited attempts with SIKOLA Premium. Take this test to evaluate your progress!"
                        : "You're using your 1 Free Test Pass for today. This test covers all lessons in this course."
                    }
                </Text>

                {/* Features Row */}
                <View style={styles.featuresRow}>
                    <View style={styles.featureItem}>
                        <Zap size={moderateScale(16)} color={isPremium ? '#3B82F6' : '#F59E0B'} style={{marginBottom: verticalScale(4)}} />
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Timed</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Trophy size={moderateScale(16)} color={isPremium ? '#3B82F6' : '#F59E0B'} style={{marginBottom: verticalScale(4)}} />
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Full Score</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Star size={moderateScale(16)} color={isPremium ? '#3B82F6' : '#F59E0B'} style={{marginBottom: verticalScale(4)}} />
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>Certify</Text>
                    </View>
                </View>

                {/* Info Box */}
                <View style={[styles.infoBox, { backgroundColor: isPremium ? 'rgba(59, 130, 246, 0.05)' : 'rgba(245, 158, 11, 0.05)' }]}>
                     <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                        {isPremium 
                            ? "Your scores are tracked in your profile. Aim for 100% to earn your trophy!"
                            : "Good luck! Once you start, you'll need to finish to earn your badge."
                        }
                     </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <TouchableOpacity
                            onPress={onStart}
                            activeOpacity={0.9}
                            style={[styles.startButtonWrapper, isPremium && { shadowColor: '#3B82F6' }]}
                        >
                            <LinearGradient
                                colors={isPremium ? ['#3B82F6', '#2563EB'] : ['#F59E0B', '#D97706']}
                                style={styles.startButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.startButtonText}>
                                    {isPremium ? "Start Test" : "Begin Proficiency Test"}
                                </Text>
                                <ChevronRight size={moderateScale(20)} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.cancelButton}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.cancelText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                            Wait, not now
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  contentWrapper: {
    width: '100%',
    padding: scale(20),
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: scale(360),
    borderRadius: scale(32),
    padding: scale(24),
    alignItems: 'center',
    borderWidth: scale(1),
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  bgShapes: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  shape: {
    position: 'absolute',
    borderRadius: scale(100),
  },
  shape1: {
    width: scale(200),
    height: scale(200),
    top: -scale(100),
    right: -scale(50),
  },
  shape2: {
    width: scale(150),
    height: scale(150),
    bottom: -scale(50),
    left: -scale(30),
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(16),
    right: scale(16),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  iconContainer: {
    marginBottom: verticalScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(10),
  },
  iconGradient: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  badge: {
    position: 'absolute',
    bottom: -scale(4),
    right: -scale(4),
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(3),
    borderColor: 'transparent', 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: moderateScale(26),
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(32),
  },
  divider: {
    width: scale(40),
    height: verticalScale(4),
    borderRadius: scale(2),
    backgroundColor: '#F59E0B',
    marginBottom: verticalScale(15),
    opacity: 0.8,
  },
  message: {
    fontSize: moderateScale(15),
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(22),
    paddingHorizontal: scale(10),
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: scale(20),
    marginBottom: verticalScale(24),
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    opacity: 0.6,
  },
  infoBox: {
    width: '100%',
    marginBottom: verticalScale(28),
    borderRadius: scale(20),
    padding: scale(16),
    borderWidth: scale(1),
    borderColor: 'rgba(245, 158, 11, 0.1)',
  },
  infoText: {
    fontSize: moderateScale(13),
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
    lineHeight: moderateScale(18),
  },
  actions: {
    width: '100%',
    gap: verticalScale(12),
  },
  startButtonWrapper: {
    borderRadius: scale(20),
    overflow: 'hidden',
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(24),
  },
  startButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '900',
    marginRight: scale(8),
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: verticalScale(14),
    alignItems: 'center',
  },
  cancelText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    opacity: 0.6,
  },
});
