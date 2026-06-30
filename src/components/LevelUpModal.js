import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  Easing,
  Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  Award,
  Trophy
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width, height: screenHeight } = Dimensions.get('window');

/**
 * LevelUpModal - A high-impact celebration modal when a user reaches a new rank
 * @param {boolean} visible
 * @param {function} onClose
 * @param {object} levelData - { current: { level, title, color, icon }, next, progress }
 */
export default function LevelUpModal({ 
  visible, 
  onClose, 
  levelData
}) {
  const { theme, isDark } = useTheme();
  
  // Animations
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const slideUpValue = useRef(new Animated.Value(100)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset
      scaleValue.setValue(0);
      opacityValue.setValue(0);
      slideUpValue.setValue(100);
      rotateValue.setValue(0);

      // Entrance Sequence
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpValue, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(rotateValue, {
            toValue: 1,
            duration: 10000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseValue, {
              toValue: 1.1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseValue, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            })
          ])
        )
      ]).start();
    }
  }, [visible]);

  if (!levelData) return null;

  const { current } = levelData;
  const rankColor = current.color || theme.colors.secondary;

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const modalBody = (
    <Animated.View style={[
      styles.modalContent,
      {
        backgroundColor: isDark ? 'rgba(20, 20, 22, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderColor: `${rankColor}40`,
        transform: [
          { scale: scaleValue },
          { translateY: slideUpValue }
        ],
        opacity: opacityValue
      }
    ]}>
      {/* Background Celebration Ray */}
      <Animated.View style={[styles.rayContainer, { transform: [{ rotate: spin }] }]}>
        <Sparkles size={300} color={rankColor} opacity={0.15} />
      </Animated.View>

      {/* Level Badge Section */}
      <View style={styles.badgeSection}>
        <Animated.View style={{ transform: [{ scale: pulseValue }] }}>
          <LinearGradient
            colors={[rankColor, `${rankColor}CC`]}
            style={styles.mainBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.levelEmoji}>{current.icon || '🚀'}</Text>
          </LinearGradient>
        </Animated.View>
        <View style={[styles.levelCircle, { backgroundColor: isDark ? '#FFF' : '#000' }]}>
            <Text style={[styles.levelNumber, { color: isDark ? '#000' : '#FFF' }]}>{current.level}</Text>
        </View>
      </View>

      {/* Achievement Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.congratsText, { color: rankColor }]}>NEW RANK REACHED!</Text>
        <Text style={[styles.rankTitle, { color: theme.colors.textPrimary }]}>{current.title}</Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          Phenomenal work! Your dedication to learning has pushed you to new heights. Keep this momentum going!
        </Text>
      </View>

      {/* Stats Preview */}
      <View style={[styles.statsRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]}>
        <View style={styles.statItem}>
            <TrendingUp size={20} color={rankColor} />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Rank Up</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
            <Award size={20} color="#FACC15" />
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Legendary</Text>
        </View>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={0.9}
        style={styles.buttonWrapper}
      >
        <LinearGradient
          colors={[rankColor, `${rankColor}DD`]}
          style={styles.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.buttonText}>Continue Journey</Text>
          <ChevronRight size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
      
      <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
        Tap to continue your adventure
      </Text>
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
          <View style={styles.blurFallback}>
            {modalBody}
          </View>
        ) : (
          <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
             {modalBody}
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
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  blurFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 40,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 25,
  },
  rayContainer: {
    position: 'absolute',
    top: -50,
    zIndex: -1,
  },
  badgeSection: {
    marginBottom: 30,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBadge: {
    width: 120,
    height: 120,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  levelEmoji: {
    fontSize: 56,
  },
  levelCircle: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  congratsText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  rankTitle: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
    paddingHorizontal: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 15,
    borderRadius: 20,
    marginBottom: 30,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
  }
});
