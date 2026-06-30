import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, Smartphone, ChevronRight, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

const { width } = Dimensions.get('window');

export default function PaymentValidationModal({ visible, onClose }) {
  const { theme, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={40}
          tint="dark"
          style={styles.blurContainer}
        >
            <View style={[styles.modalContent, { 
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.1)'
            }]}>
                
                {/* Close Button */}
                <TouchableOpacity 
                    onPress={onClose}
                    style={styles.closeButton}
                >
                    <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                {/* Icon Header */}
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.iconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <AlertTriangle size={32} color="#FFF" fill="#FFF" />
                    </LinearGradient>
                    <View style={[styles.badge, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                        <Smartphone size={14} color="#EF4444" />
                    </View>
                </View>

                {/* Text Content */}
                <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    Invalid Phone Number
                </Text>

                <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    Please enter a valid phone number (exactly 9 digits) to proceed with the payment securely.
                </Text>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.8}
                        style={styles.actionButtonWrapper}
                    >
                        <LinearGradient
                            colors={['#EF4444', '#B91C1C']}
                            style={styles.actionButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.actionButtonText}>Okay, I'll fix it</Text>
                            <ChevronRight size={18} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  modalContent: {
    width: '100%',
    maxWidth: scale(320),
    borderRadius: scale(30),
    padding: scale(24),
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: verticalScale(10),
    },
    shadowOpacity: 0.3,
    shadowRadius: scale(20),
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(16),
    right: scale(16),
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  iconContainer: {
    marginBottom: verticalScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(24),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: verticalScale(8) },
    shadowOpacity: 0.4,
    shadowRadius: scale(12),
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    bottom: verticalScale(-6),
    right: scale(-6),
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: verticalScale(10),
  },
  message: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: verticalScale(24),
    lineHeight: moderateScale(20),
  },
  actions: {
    width: '100%',
  },
  actionButtonWrapper: {
    borderRadius: scale(16),
    overflow: 'hidden',
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.3,
    shadowRadius: scale(8),
    elevation: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(20),
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginRight: scale(8),
  },
});
