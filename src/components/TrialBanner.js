import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, AlertTriangle, ShieldX, ArrowRight, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgress } from '../context/ProgressContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

/**
 * TrialBanner — Shows contextual warnings based on trial status.
 *
 * States (in order of urgency):
 *  1. active     (>1 day)   — yellow  — "Free Trial Active · X days left"  — dismissible, max 2x/day
 *  2. warning    (1 day)    — orange  — "Trial expires tomorrow!"           — dismissible once per day
 *  3. urgent     (0 days)   — red     — "Trial expires today!"              — NOT dismissible
 *  4. expired               — dark red — "Trial has ended"                  — NOT dismissible
 *
 * Hidden entirely when user has an active subscription.
 */

const CONFIGS = {
  active: {
    colors:     ['#FACC15', '#F59E0B'],
    Icon:       Sparkles,
    iconBg:     'rgba(255,255,255,0.3)',
    iconColor:  '#000',
    textColor:  '#000',
    subColor:   'rgba(0,0,0,0.7)',
    btnBg:      '#FFF',
    btnText:    '#000',
    btnLabel:   'Upgrade',
    dismissible: true,
  },
  warning: {
    colors:     ['#F97316', '#EA580C'],
    Icon:       AlertTriangle,
    iconBg:     'rgba(255,255,255,0.25)',
    iconColor:  '#FFF',
    textColor:  '#FFF',
    subColor:   'rgba(255,255,255,0.85)',
    btnBg:      '#FFF',
    btnText:    '#EA580C',
    btnLabel:   'Subscribe',
    dismissible: true,
  },
  urgent: {
    colors:     ['#EF4444', '#DC2626'],
    Icon:       AlertTriangle,
    iconBg:     'rgba(255,255,255,0.2)',
    iconColor:  '#FFF',
    textColor:  '#FFF',
    subColor:   'rgba(255,255,255,0.85)',
    btnBg:      '#FFF',
    btnText:    '#DC2626',
    btnLabel:   'Subscribe Now',
    dismissible: false,  // too critical to hide
  },
  expired: {
    colors:     ['#7F1D1D', '#991B1B'],
    Icon:       ShieldX,
    iconBg:     'rgba(255,255,255,0.15)',
    iconColor:  '#FFA0A0',
    textColor:  '#FFF',
    subColor:   'rgba(255,255,255,0.75)',
    btnBg:      '#EF4444',
    btnText:    '#FFF',
    btnLabel:   'Choose a Plan',
    dismissible: false,  // critical — always visible
  },
};

export default function TrialBanner() {
  const { theme } = useTheme();
  const { trialDaysRemaining, subscriptions, isTrialExpired } = useProgress();
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const hasActiveSub = subscriptions && subscriptions.length > 0;

  // Determine which state we are in
  const getState = () => {
    if (hasActiveSub)        return null;        // Subscribed — hide entirely
    if (isTrialExpired)      return 'expired';
    if (trialDaysRemaining === 0) return 'urgent';
    if (trialDaysRemaining === 1) return 'warning';
    if (trialDaysRemaining > 1)  return 'active';
    return null;
  };

  const state = getState();
  const config = state ? CONFIGS[state] : null;

  useEffect(() => {
    if (!state || !config) {
      setVisible(false);
      return;
    }

    // Non-dismissible states always show immediately
    if (!config.dismissible) {
      setVisible(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      return;
    }

    // Dismissible states: limit to once per day per state
    checkVisibility();
  }, [state, hasActiveSub]);

  const checkVisibility = async () => {
    try {
      const today  = new Date().toISOString().split('T')[0];
      const key    = `trial_banner_dismissed_${state}_${today}`;
      const hidden = await AsyncStorage.getItem(key);

      if (!hidden) {
        setVisible(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
      } else {
        setVisible(false);
      }
    } catch (e) {
      // If storage fails, show the banner (safe default)
      setVisible(true);
    }
  };

  const handleClose = async () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true })
      .start(() => setVisible(false));

    // Mark as dismissed for today
    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(`trial_banner_dismissed_${state}_${today}`, '1');
    } catch (_) {}
  };

  if (!visible || !config) return null;

  const { Icon, iconBg, iconColor, textColor, subColor, btnBg, btnText, btnLabel, dismissible } = config;

  const title = {
    active:  'Free Trial Active',
    warning: 'Trial Expires Tomorrow!',
    urgent:  'Trial Expires Today!',
    expired: 'Your Free Trial Has Ended',
  }[state];

  const subtitle = {
    active:  `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining — upgrade to keep learning`,
    warning: 'Subscribe now to avoid losing access to your progress',
    urgent:  'Access will be locked at midnight — subscribe to continue',
    expired: 'Subscribe to unlock all subjects and continue your learning',
  }[state];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <Icon size={18} color={iconColor} />
          </View>

          {/* Text */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: subColor }]} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>

          {/* CTA button */}
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: btnBg }]}
            onPress={() => navigation.navigate('Subscription')}
            activeOpacity={0.85}
          >
            <Text style={[styles.upgradeText, { color: btnText }]}>{btnLabel}</Text>
            <ArrowRight size={12} color={btnText} />
          </TouchableOpacity>

          {/* Dismiss — only on dismissible states */}
          {dismissible && (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <X size={16} color={textColor} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -10,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  gradient: {
    padding: 12,
    paddingHorizontal: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  upgradeButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  upgradeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
    flexShrink: 0,
  },
});
