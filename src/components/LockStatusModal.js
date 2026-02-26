import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Lock, Crown, ChevronRight, X, AlertCircle, Clock, GraduationCap, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * A premium unified modal for different lock scenarios
 * @param {boolean} visible 
 * @param {function} onClose 
 * @param {string} type - 'sequential', 'subscription', 'limit'
 * @param {string} title
 * @param {string} message 
 * @param {function} onAction - Action for the primary button
 * @param {string} actionText - Label for the primary button
 */
export default function LockStatusModal({ 
  visible, 
  onClose, 
  type = 'subscription',
  title,
  message,
  onAction,
  actionText
}) {
  const { theme, isDark } = useTheme();

  // Configuration based on lock type
  const getConfig = () => {
    switch (type) {
      case 'sequential':
        return {
          icon: GraduationCap,
          colors: ['#3B82F6', '#2563EB'], // Blue
          defaultTitle: 'Keep the Flow!',
          defaultMessage: 'Please complete the previous topic to unlock this lesson and continue your learning journey.',
          defaultActionText: 'Go to Previous',
          showFeatures: false
        };
      case 'limit':
        return {
          icon: Clock,
          colors: ['#FACC15', '#EAB308'], // Gold/Yellow
          defaultTitle: 'Daily Limit Reached',
          defaultMessage: 'Trial users can take 1 comprehensive test per day. Subscribe for unlimited practice!',
          defaultActionText: 'View Premium Plans',
          showFeatures: true
        };
      case 'motivation':
        return {
          icon: Sparkles,
          colors: ['#10B981', '#34D399'], // Emerald/Green
          defaultTitle: 'You are Unstoppable!',
          defaultMessage: 'Keep up that momentum. You are one step closer to mastering your course.',
          defaultActionText: 'Keep Going',
          showFeatures: false
        };
      case 'subscription':
      default:
        return {
          icon: Crown,
          colors: ['#8B5CF6', '#D946EF'], // Purple/Pink
          defaultTitle: 'Unlock Premium Content',
          defaultMessage: 'Get unlimited access to all topics, tests, and detailed study notes with SIKOLA Premium.',
          defaultActionText: 'Upgrade to Premium',
          showFeatures: true
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  const content = (
    <View style={[styles.modalContent, { 
        backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    }]}>
        
        {/* Close Button */}
        <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
        >
            <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Icon Header */}
        <View style={styles.iconContainer}>
            <LinearGradient
                colors={config.colors}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <IconComponent size={32} color="#FFF" fill={type === 'sequential' ? "none" : "#FFF"} />
            </LinearGradient>
            <View style={[styles.lockBadge, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                <Lock size={12} color={type === 'motivation' ? '#10B981' : (type === 'sequential' ? '#3B82F6' : theme.colors.textSecondary)} />
            </View>
        </View>

        {/* Text Content */}
        <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
            {title || config.defaultTitle}
        </Text>

        <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
            {message || config.defaultMessage}
        </Text>

        {/* Features List (Conditional) */}
        {config.showFeatures && (
            <View style={[styles.featuresList, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                {[
                    "Unlimited Topic Access",
                    "Comprehensive Proficiency Tests",
                    "Detailed Study Notes",
                    "Ad-Free Excellence"
                ].map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                        <AlertCircle size={14} color={config.colors[0]} style={{ marginRight: 8 }} />
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                            {feature}
                        </Text>
                    </View>
                ))}
            </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
            <TouchableOpacity
                onPress={onAction || onClose}
                activeOpacity={0.8}
                style={[styles.primaryButtonWrapper, { shadowColor: config.colors[0] }]}
            >
                <LinearGradient
                    colors={config.colors}
                    style={styles.primaryButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.primaryButtonText}>{actionText || config.defaultActionText}</Text>
                    <ChevronRight size={18} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={onClose}
                style={styles.secondaryButton}
            >
                <Text style={[styles.secondaryText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    Maybe Later
                </Text>
            </TouchableOpacity>
        </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {Platform.OS === 'web' ? (
          <View style={[styles.webContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
             {content}
          </View>
        ) : (
          <BlurView
            intensity={40}
            tint="dark"
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 24,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
