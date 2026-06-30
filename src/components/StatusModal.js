import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform, Animated, Easing, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { CheckCircle, AlertCircle, ChevronRight, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

const { width } = Dimensions.get('window');

/**
 * A premium feedback modal for success or error states
 * @param {boolean} visible 
 * @param {function} onClose 
 * @param {string} type - 'success' | 'error'
 * @param {string} title
 * @param {string} message 
 * @param {function} onAction - Navigation or closing action
 * @param {string} actionText - Label for the button
 */
export default function StatusModal({ 
  visible, 
  onClose, 
  type = 'success',
  title,
  message,
  onAction,
  actionText = 'Continue',
  loading = false
}) {
  const { theme, isDark } = useTheme();
  
  // Animations
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const pulseValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (visible) {
      // Icon pop animation
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Button pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const isSuccess = type === 'success';
  const colors = isSuccess ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626'];
  const IconComponent = isSuccess ? CheckCircle : AlertCircle;

  const content = (
    <View style={[styles.modalContent, { 
        backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.1)'
    }]}>
        
        {/* Close Button */}
        <TouchableOpacity 
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
        >
            <X size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Dynamic Glow Background */}
        <View style={[styles.glow, { backgroundColor: colors[0], opacity: isDark ? 0.15 : 0.1 }]} />

        {/* Icon Header */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleValue }] }]}>
            <LinearGradient
                colors={colors}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <IconComponent size={32} color="#FFF" />
            </LinearGradient>
            <View style={[styles.badge, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                <View style={[styles.dot, { backgroundColor: colors[0] }]} />
            </View>
        </Animated.View>

        {/* Text Content */}
        <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
            {title || (isSuccess ? "Success!" : "Something went wrong")}
        </Text>

        <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
            {message}
        </Text>

        {/* Actions */}
        <View style={styles.actions}>
            <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
              <TouchableOpacity
                  onPress={onAction || onClose}
                  activeOpacity={0.8}
                  style={[styles.primaryButtonWrapper, { shadowColor: colors[0] }]}
              >
                  <LinearGradient
                      colors={colors}
                      style={styles.primaryButton}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                  >
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>{actionText}</Text>
                          <ChevronRight size={18} color="#FFF" />
                        </>
                      )}
                  </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
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
            intensity={20}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  webContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width * 0.85,
    maxWidth: scale(340),
    borderRadius: scale(32),
    padding: scale(24),
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 10,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: verticalScale(-60),
    width: scale(220),
    height: scale(220),
    borderRadius: scale(110),
    zIndex: -1,
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(18),
    right: scale(18),
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  iconContainer: {
    marginBottom: verticalScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(28),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  badge: {
    position: 'absolute',
    bottom: -scale(2),
    right: -scale(2),
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: moderateScale(28),
  },
  message: {
    fontSize: moderateScale(15),
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: verticalScale(28),
    paddingHorizontal: scale(10),
    lineHeight: moderateScale(22),
  },
  actions: {
    width: '100%',
  },
  primaryButtonWrapper: {
    borderRadius: scale(18),
    overflow: 'hidden',
    shadowOffset: { width: 0, height: verticalScale(6) },
    shadowOpacity: 0.35,
    shadowRadius: scale(10),
    elevation: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(20),
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: moderateScale(17),
    fontWeight: '700',
    marginRight: scale(8),
  },
});
