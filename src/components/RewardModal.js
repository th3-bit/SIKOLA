import React, { useEffect, useRef, useState } from 'react';
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
  Trophy, 
  Star, 
  Zap, 
  Sparkles, 
  Award,
  ChevronRight,
  Target
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

/**
 * RewardModal - A premium global modal for highlighting achievements (XP, Streaks, Marks)
 * @param {boolean} visible
 * @param {function} onClose
 * @param {number} xp - Amount of XP earned
 * @param {string} title - Custom congratulatory title
 * @param {string} subTitle - Supporting message
 * @param {string} type - 'lesson' | 'test' | 'exam'
 */
export default function RewardModal({ 
  visible, 
  onClose, 
  xp = 0, 
  title, 
  subTitle,
  type = 'lesson',
  onAction
}) {
  const { theme, isDark } = useTheme();
  const [displayXP, setDisplayXP] = useState(0);
  
  // Animations
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;
  const slideUpValue = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Reset
      scaleValue.setValue(0);
      opacityValue.setValue(0);
      rotateValue.setValue(0);
      slideUpValue.setValue(50);
      setDisplayXP(0);

      // Entrance Sequence
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 7,
          tension: 60, // Snappier spring
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300, // Faster fade
          useNativeDriver: true,
        }),
        Animated.timing(slideUpValue, {
          toValue: 0,
          duration: 450, // Faster slide
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 800, // Faster rotate
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        })
      ]).start();

      // XP Counter Animation
      let start = 0;
      const duration = 800; // Snappier XP counter (from 2000ms)
      const stepTime = 50;
      const steps = Math.floor(duration / stepTime);
      const increment = xp / steps;
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= xp) {
          setDisplayXP(xp);
          clearInterval(timer);
        } else {
          setDisplayXP(Math.floor(start));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [visible, xp]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const getThemeConfig = () => {
    switch (type) {
      case 'test':
        return {
          colors: ['#3B82F6', '#2563EB'], // Blue
          icon: Target,
          bgGlow: 'rgba(59, 130, 246, 0.15)',
          defaultTitle: 'Test Mastered!'
        };
      case 'exam':
        return {
          colors: ['#F59E0B', '#D97706'], // Gold
          icon: Trophy,
          bgGlow: 'rgba(245, 158, 11, 0.15)',
          defaultTitle: 'Legendary Performance!'
        };
      default:
        return {
          colors: ['#8B5CF6', '#7C3AED'], // Violet
          icon: Zap,
          bgGlow: 'rgba(139, 92, 246, 0.15)',
          defaultTitle: 'Lesson Complete!'
        };
    }
  };

  const config = getThemeConfig();
  const IconComponent = config.icon;

  const content = (
    <Animated.View style={[
      styles.modalContent,
      {
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        transform: [
          { scale: scaleValue },
          { translateY: slideUpValue }
        ],
        opacity: opacityValue
      }
    ]}>
      {/* Background Ambience */}
      <View style={[styles.glow, { backgroundColor: config.colors[0], opacity: isDark ? 0.15 : 0.1 }]} />
      
      {/* Moving Sparkles in Background */}
      <Animated.View style={[styles.sparkleContainer, { transform: [{ rotate: spin }] }]}>
        <Sparkles size={200} color={config.colors[0]} opacity={0.15} />
      </Animated.View>

      {/* Achievement Icon */}
      <View style={styles.iconWrapper}>
        <LinearGradient
          colors={config.colors}
          style={styles.iconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <IconComponent size={42} color="#FFF" />
        </LinearGradient>
        
        {/* Orbiting Stars */}
        <Animated.View style={[styles.orbitingStar, { top: -10, left: -10, transform: [{ rotate: spin }] }]}>
          <Star size={20} color="#FACC15" fill="#FACC15" />
        </Animated.View>
      </View>

      {/* Titles */}
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
        {title || config.defaultTitle}
      </Text>
      <Text style={[styles.subTitle, { color: theme.colors.textSecondary }]}>
        {subTitle || "Your dedication to learning is paying off!"}
      </Text>

      {/* Rewards Row */}
      <View style={styles.rewardRow}>
        <View style={[styles.rewardItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
          <View style={[styles.rewardIconCircle, { backgroundColor: `${config.colors[0]}20` }]}>
            <Award size={20} color={config.colors[0]} />
          </View>
          <View>
            <Text style={[styles.rewardValue, { color: config.colors[0] }]}>+{displayXP}</Text>
            <Text style={[styles.rewardLabel, { color: theme.colors.textSecondary }]}>XP Points</Text>
          </View>
        </View>
      </View>

      {/* Primary Action */}
      <TouchableOpacity
        onPress={() => {
          if (onAction) onAction();
          onClose();
        }}
        activeOpacity={0.9}
        style={styles.primaryButtonWrapper}
      >
        <LinearGradient
          colors={config.colors}
          style={styles.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.primaryButtonText}>Collect Rewards</Text>
          <ChevronRight size={20} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
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
          <View style={[styles.webContainer, { backgroundColor: 'rgba(0,0,0,0.85)' }]}>
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
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    maxWidth: 360,
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  glow: {
    position: 'absolute',
    top: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: -1,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -20,
    zIndex: -1,
  },
  iconWrapper: {
    marginBottom: 28,
    position: 'relative',
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  orbitingStar: {
    position: 'absolute',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  rewardRow: {
    width: '100%',
    marginBottom: 40,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  rewardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  rewardLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: -2,
  },
  primaryButtonWrapper: {
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 8,
    letterSpacing: 0.5,
  },
});
