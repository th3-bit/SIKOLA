import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Mail, CheckCircle, ChevronRight, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AuthStatusModal({ visible, onClose, onAction, type = 'success', title, message, actionText = 'Continue' }) {
  const { theme, isDark } = useTheme();

  // Determine colors based on type
  const isSuccess = type === 'success';
  const gradientColors = isSuccess ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626'];
  const iconColor = isSuccess ? '#10B981' : '#EF4444';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {Platform.OS === 'web' ? (
          <View style={styles.blurContainer}>
            <View style={[styles.modalContent, { 
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
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
                        colors={gradientColors}
                        style={styles.iconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {isSuccess ? (
                            <Mail size={32} color="#FFF" />
                        ) : (
                            <X size={32} color="#FFF" />
                        )}
                    </LinearGradient>
                    <View style={[styles.badge, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                        {isSuccess ? (
                            <CheckCircle size={14} color="#10B981" />
                        ) : (
                            <X size={14} color="#EF4444" />
                        )}
                    </View>
                </View>

                {/* Text Content */}
                <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {title || (isSuccess ? "Email Sent" : "Error")}
                </Text>

                <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {message || "Please check your email for further instructions."}
                </Text>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={onAction || onClose}
                        activeOpacity={0.8}
                        style={styles.actionButtonWrapper}
                    >
                        <LinearGradient
                            colors={gradientColors}
                            style={styles.actionButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.actionButtonText}>{actionText}</Text>
                            <ChevronRight size={18} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
          </View>
        ) : (
          <BlurView
            intensity={40}
            tint="dark"
            style={styles.blurContainer}
          >
            <View style={[styles.modalContent, { 
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
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
                        colors={gradientColors}
                        style={styles.iconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {isSuccess ? (
                            <Mail size={32} color="#FFF" />
                        ) : (
                            <X size={32} color="#FFF" />
                        )}
                    </LinearGradient>
                    <View style={[styles.badge, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                        {isSuccess ? (
                            <CheckCircle size={14} color="#10B981" />
                        ) : (
                            <X size={14} color="#EF4444" />
                        )}
                    </View>
                </View>

                {/* Text Content */}
                <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    {title || (isSuccess ? "Email Sent" : "Error")}
                </Text>

                <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {message || "Please check your email for further instructions."}
                </Text>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={onAction || onClose}
                        activeOpacity={0.8}
                        style={styles.actionButtonWrapper}
                    >
                        <LinearGradient
                            colors={gradientColors}
                            style={styles.actionButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.actionButtonText}>{actionText}</Text>
                            <ChevronRight size={18} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
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
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  badge: {
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    opacity: 0.8,
    marginBottom: 24,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
  },
  actionButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});
