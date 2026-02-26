import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ticket, Sparkles, ChevronRight, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function FreePassModal({ visible, onClose, onStart }) {
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
                        colors={['#F59E0B', '#FCD34D']}
                        style={styles.iconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ticket size={32} color="#FFF" fill="#FFF" />
                    </LinearGradient>
                    <View style={[styles.badge, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                        <Sparkles size={14} color="#F59E0B" />
                    </View>
                </View>

                {/* Text Content */}
                <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    Free Test Pass Available!
                </Text>

                <Text style={[styles.message, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    You are about to use your <Text style={{fontWeight: 'bold', color: '#F59E0B'}}>1 Free Test Pass</Text>. This comprehensive test includes questions from ALL lessons in this topic.
                </Text>

                {/* Info Box */}
                <View style={styles.infoBox}>
                     <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                        Good luck! Taking this test will use up your free pass. Upgrade to Premium for unlimited tests.
                     </Text>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={onStart}
                        activeOpacity={0.8}
                        style={styles.startButtonWrapper}
                    >
                        <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            style={styles.startButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.startButtonText}>Start Test Now</Text>
                            <ChevronRight size={18} color="#FFF" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.cancelButton}
                    >
                        <Text style={[styles.cancelText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                            Cancel
                        </Text>
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
    shadowColor: "#F59E0B",
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
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
    lineHeight: 20,
  },
  infoBox: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.9,
    fontStyle: 'italic',
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  startButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
