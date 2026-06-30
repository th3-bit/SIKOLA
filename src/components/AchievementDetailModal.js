import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Trophy, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AchievementDetailModal({ visible, onClose, achievement }) {
  const { theme, isDark } = useTheme();

  if (!achievement) return null;

  const progress = Math.min((achievement.current || 0) / (achievement.total || 1), 1);
  const Icon = achievement.icon || Trophy;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        </BlurView>

        <View style={styles.modalWrapper}>
          <LinearGradient
            colors={[
              isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              isDark ? 'rgba(20, 20, 20, 0.98)' : 'rgba(248, 250, 252, 0.98)'
            ]}
            style={[styles.modalContent, { borderColor: theme.colors.glassBorder }]}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <View style={[styles.closeIconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
                <X size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: `${achievement.color}20` }]}>
                <Icon size={48} color={achievement.color} />
                {achievement.unlocked && (
                  <View style={styles.checkBadge}>
                    <CheckCircle2 size={16} color="#FFF" fill={achievement.color} />
                  </View>
                )}
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {achievement.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: achievement.unlocked ? `${achievement.color}15` : 'rgba(128,128,128,0.1)' }]}>
                <Text style={[styles.statusText, { color: achievement.unlocked ? achievement.color : theme.colors.textSecondary }]}>
                  {achievement.unlocked ? 'Achievement Unlocked' : 'In Progress'}
                </Text>
              </View>
            </View>

            <View style={styles.body}>
              <Text style={[styles.description, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                {achievement.desc}
              </Text>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressLabel, { color: theme.colors.textPrimary }]}>Progress</Text>
                  <Text style={[styles.progressValue, { color: achievement.color }]}>
                    {achievement.current} / {achievement.total}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)' }]}>
                  <LinearGradient
                    colors={[achievement.color, achievement.color + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: achievement.unlocked ? achievement.color : theme.colors.textPrimary }]} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.actionButtonText, { color: achievement.unlocked ? '#FFF' : (isDark ? '#000' : '#FFF') }]}>
                {achievement.unlocked ? 'Awesome!' : 'Keep Going'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  closeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  actionButton: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
