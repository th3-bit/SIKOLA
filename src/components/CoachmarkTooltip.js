import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, moderateScale, verticalScale } from '../utils/Scaling';
import { useTheme } from '../context/ThemeContext';
import { ChevronRight, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useCopilot } from 'react-native-copilot';

export default function CoachmarkTooltip() {
  const { theme, hapticsEnabled } = useTheme();
  const {
    isFirstStep,
    isLastStep,
    goToNext,
    goToPrev,
    stop,
    currentStep,
  } = useCopilot();

  const onNext = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLastStep) {
      stop();
    } else {
      goToNext();
    }
  };

  const onSkip = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step {currentStep?.order}</Text>
        </View>
        <TouchableOpacity onPress={onSkip} style={styles.skipButton} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip Tutorial</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.descriptionText}>
        {currentStep?.text || 'Here is some information to help you get started.'}
      </Text>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {/* We can add dots here if we know the total steps, but keeping it clean for now */}
        </View>

        <TouchableOpacity 
          style={styles.nextButtonWrapper} 
          activeOpacity={0.8}
          onPress={onNext}
        >
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            style={styles.nextButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Finish' : 'Next'}
            </Text>
            {isLastStep ? (
              <Check size={scale(16)} color="#FFF" />
            ) : (
              <ChevronRight size={scale(16)} color="#FFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A3E', // Deep premium dark background
    borderRadius: scale(24),
    padding: scale(16), // Reduced padding
    width: scale(320), // Constrain width instead of 100%
    alignSelf: 'center', // Keep it centered
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.2)', // Subtle indigo border
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  stepBadge: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  stepText: {
    color: '#818CF8',
    fontSize: moderateScale(11),
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  skipText: {
    color: '#94A3B8',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  descriptionText: {
    color: '#F1F5F9',
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    fontWeight: '500',
    marginBottom: verticalScale(16),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pagination: {
    flex: 1,
  },
  nextButtonWrapper: {
    borderRadius: scale(16),
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(12),
    gap: scale(6),
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
});
