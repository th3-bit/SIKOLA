import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, X, LogOut, Trash2, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

const { width } = Dimensions.get('window');

export default function ConfirmationModal({ 
    visible, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmLabel = "Confirm", 
    cancelLabel = "Cancel",
    type = "warning" // warning, danger, info
}) {
  const { theme, isDark } = useTheme();
  
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1)),
        })
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      slideAnim.setValue(20);
    }
  }, [visible]);

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          color: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          gradient: ['#EF4444', '#B91C1C']
        };
      case 'info':
        return {
          icon: Info,
          color: '#3B82F6',
          bg: 'rgba(59, 130, 246, 0.1)',
          gradient: ['#3B82F6', '#1D4ED8']
        };
      case 'warning':
      default:
        return {
          icon: AlertTriangle,
          color: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.1)',
          gradient: ['#F59E0B', '#D97706']
        };
    }
  };

  const styleConfig = getTypeStyles();
  const Icon = styleConfig.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.blurWrapper, { opacity: fadeAnim }]}>
            <BlurView
              intensity={isDark ? 40 : 20}
              tint="dark"
              style={StyleSheet.absoluteFill}
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
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)'
            }]}>
                
                {/* Header Icon */}
                <View style={[styles.iconWrapper, { backgroundColor: styleConfig.bg }]}>
                    <Icon size={moderateScale(32)} color={styleConfig.color} />
                </View>

                {/* Text Content */}
                <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {title}
                </Text>

                <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {message}
                </Text>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={onConfirm}
                        activeOpacity={0.8}
                        style={styles.confirmButtonWrapper}
                    >
                        <LinearGradient
                            colors={styleConfig.gradient}
                            style={styles.confirmButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.confirmText}>{confirmLabel}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.cancelButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}
                    >
                        <Text style={[styles.cancelText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                            {cancelLabel}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  contentWrapper: {
    width: '100%',
    padding: scale(30),
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: scale(340),
    borderRadius: scale(28),
    padding: scale(24),
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: verticalScale(12),
  },
  message: {
    fontSize: moderateScale(15),
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: verticalScale(28),
    lineHeight: moderateScale(22),
  },
  actions: {
    width: '100%',
    gap: verticalScale(12),
  },
  confirmButtonWrapper: {
    borderRadius: scale(16),
    overflow: 'hidden',
  },
  confirmButton: {
    paddingVertical: verticalScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: verticalScale(14),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
});
