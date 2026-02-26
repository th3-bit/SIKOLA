import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform, Animated, Easing, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { CheckCircle, AlertCircle, ChevronRight, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

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
    maxWidth: 320,
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    zIndex: -1,
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
  badge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
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
});
