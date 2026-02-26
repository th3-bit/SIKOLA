import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions, 
  Platform, 
  Animated, 
  Easing 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  Award, 
  Sparkles, 
  X, 
  ChevronRight, 
  Crown, 
  Zap,
  Lock
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * MasteryModal - A premium UI for Course Proficiency Tests
 * @param {boolean} visible
 * @param {function} onClose
 * @param {string} type - 'trial' | 'premium' | 'limit'
 * @param {string} title
 * @param {string} message
 * @param {function} onAction
 * @param {string} actionText
 */
export default function MasteryModal({ 
  visible, 
  onClose, 
  type = 'premium',
  title,
  message,
  onAction,
  actionText
}) {
  const { theme, isDark } = useTheme();
  
  // Animations
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset and animate in
      scaleValue.setValue(0);
      opacityValue.setValue(0);
      
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Looping pulse for primary button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.03,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const getStyleConfig = () => {
    switch (type) {
      case 'limit':
        return {
          icon: Lock,
          colors: ['#F59E0B', '#D97706'], // Amber
          badgeIcon: Zap,
          badgeColor: '#F59E0B'
        };
      case 'trial':
        return {
          icon: Sparkles,
          colors: ['#3B82F6', '#2563EB'], // Blue
          badgeIcon: Crown,
          badgeColor: '#3B82F6'
        };
      case 'premium':
      default:
        return {
          icon: Award,
          colors: ['#8B5CF6', '#7C3AED'], // Violet
          badgeIcon: Crown,
          badgeColor: '#8B5CF6'
        };
    }
  };

  const config = getStyleConfig();
  const IconComponent = config.icon;
  const BadgeIcon = config.badgeIcon;

  const content = (
    <Animated.View style={[
      styles.modalContent, 
      { 
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.96)' : 'rgba(255, 255, 255, 0.96)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        transform: [{ scale: scaleValue }],
        opacity: opacityValue
      }
    ]}>
      {/* Dynamic Glow */}
      <View style={[styles.glow, { backgroundColor: config.colors[0], opacity: isDark ? 0.12 : 0.08 }]} />

      {/* Close Button */}
      <TouchableOpacity 
        onPress={onClose}
        style={styles.closeButton}
        activeOpacity={0.7}
      >
        <X size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      {/* Hero Icon */}
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={config.colors}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <IconComponent size={36} color="#FFF" />
        </LinearGradient>
        <View style={[styles.badge, { backgroundColor: isDark ? '#2C2C2E' : '#FFF' }]}>
          <BadgeIcon size={12} color={config.badgeColor} />
        </View>
      </View>

      {/* Text Context */}
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>

      {/* Highlight Features (Trial specific) */}
      {type === 'trial' && (
        <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }]}>
          <Text style={[styles.infoText, { color: '#3B82F6' }]}>
            Mastery Tests are a Premium feature. You have 1 free test available today!
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
          <TouchableOpacity
            onPress={onAction}
            activeOpacity={0.9}
            style={[styles.primaryButtonWrapper, { shadowColor: config.colors[0] }]}
          >
            <LinearGradient
              colors={config.colors}
              style={styles.primaryButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>{actionText || 'Start Mastery Test'}</Text>
              <ChevronRight size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity 
          onPress={onClose}
          style={styles.secondaryButton}
          activeOpacity={0.6}
        >
          <Text style={[styles.secondaryText, { color: theme.colors.textSecondary }]}>
            Maybe Later
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {Platform.OS === 'web' ? (
          <View style={[styles.webContainer, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
            {content}
          </View>
        ) : (
          <BlurView
            intensity={30}
            tint={isDark ? "dark" : "light"}
            style={styles.blurContainer}
          >
            {content}
          </BlurView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 32,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  glow: {
    position: 'absolute',
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    zIndex: -1,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 84,
    height: 84,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  badge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 24,
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  infoBox: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButtonWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.7,
  },
});
