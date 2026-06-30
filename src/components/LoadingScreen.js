import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withDelay, 
  withSequence,
  Easing,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { scale, moderateScale, verticalScale } from '../utils/Scaling';

const { width, height } = Dimensions.get('window');

const getCoordinates = () => [
  { x: -scale(42), y: -scale(42) }, // box0
  { x: scale(42),  y: -scale(42) }, // box1
  { x: scale(42),  y: scale(42)  }, // box2
  { x: -scale(42), y: scale(42)  }, // box3
  { x: 0,          y: -scale(60) }, // box4
  { x: scale(60),  y: 0          }, // box5
  { x: 0,          y: scale(60)  }, // box6
  { x: -scale(60), y: 0          }, // box7
];

const ACCENT_COLOR = '#2765F5';
const BOX_COUNT = 8;
const DURATION = 3000;
const BOX_SIZE = scale(32);

const JumpingBox = ({ index, isDark = false }) => {
  const COORDINATES = getCoordinates();
  
  // Defensive check for coordinates to prevent IndexOutOfBounds or TypeErrors
  const coords = COORDINATES[index] || { x: 0, y: 0 };
  const initialX = Number(coords.x) || 0;
  const initialY = Number(coords.y) || 0;

  const x = useSharedValue(initialX);
  const y = useSharedValue(initialY);
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    const delay = index * 80;

    x.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(initialX, { duration: DURATION * 0.12 }),
          withTiming(0, { duration: DURATION * 0.13, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withDelay(DURATION * 0.27, withTiming(0, { duration: 0 })),
          withDelay(DURATION * 0.28, withTiming(initialX, { duration: DURATION * 0.2, easing: Easing.out(Easing.quad) }))
        ),
        -1
      )
    );

    const jumpHeight = -scale(40);
    const fallDistance = verticalScale(300);

    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(initialY, { duration: DURATION * 0.12 }),
          withTiming(0, { duration: DURATION * 0.13, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withDelay(DURATION * 0.27, withSequence(
            withTiming(jumpHeight, { duration: DURATION * 0.28, easing: Easing.out(Easing.quad) }),
            withTiming(fallDistance, { duration: DURATION * 0.2, easing: Easing.in(Easing.quad) })
          )),
          withTiming(initialY, { duration: 0 })
        ),
        -1
      )
    );
  }, [index, initialX, initialY]);

  const jumpUpThreshold = -scale(40);
  const fallDownThreshold = verticalScale(300);
  const fadeStartThreshold = verticalScale(200);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scaleValue.value }
    ],
    opacity: interpolate(
        y.value,
        [jumpUpThreshold, 0, fadeStartThreshold, fallDownThreshold],
        [1, 1, 0.8, 0],
        Extrapolate.CLAMP
    )
  }));

  return (
    <Animated.View 
      style={[
        styles.box, 
        { 
          width: BOX_SIZE,
          height: BOX_SIZE,
          backgroundColor: index % 2 === 0 ? ACCENT_COLOR : (isDark ? '#FFF' : '#333'),
          shadowColor: ACCENT_COLOR,
        },
        animatedStyle
      ]} 
    />
  );
};

export default function LoadingScreen() {
  const { theme, isDark } = useTheme();

  const groundScale = useSharedValue(0);
  const groundOpacity = useSharedValue(0);

  useEffect(() => {
    // Synchronized ground animation
    groundScale.value = withRepeat(
      withSequence(
        withTiming(0, { duration: DURATION * 0.65 }), // Wait
        withTiming(1, { duration: DURATION * 0.1, easing: Easing.out(Easing.quad) }), // Appear
        withTiming(1, { duration: DURATION * 0.15 }), // Stay
        withTiming(0, { duration: DURATION * 0.1, easing: Easing.in(Easing.quad) }) // Disappear
      ),
      -1
    );

    groundOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: DURATION * 0.65 }),
        withTiming(1, { duration: DURATION * 0.1 }),
        withTiming(1, { duration: DURATION * 0.15 }),
        withTiming(0, { duration: DURATION * 0.1 })
      ),
      -1
    );
  }, []);

  const groundStyle = useAnimatedStyle(() => ({
    transform: [
        { rotateX: '90deg' },
        { scale: groundScale.value }
    ],
    opacity: groundOpacity.value
  }));
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      {/* Brand logo at the top center of the screen */}
      <View style={styles.brandContainer}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
            SIKOLA <Text style={{ color: ACCENT_COLOR }}>PLUS</Text>
          </Text>
        </View>
        <View style={[styles.brandUnderline, { backgroundColor: ACCENT_COLOR }]} />
      </View>

      <View style={styles.content}>
        {/* The 8 Jumping Boxes */}
        <View style={styles.loaderContainer}>
          {[...Array(BOX_COUNT)].map((_, i) => (
            <JumpingBox 
              key={i} 
              index={i} 
              isDark={isDark}
            />
          ))}
          
          {/* Ground / Shadow Effect */}
          <Animated.View style={[
            styles.ground, 
            { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.1)' },
            groundStyle
          ]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(40), // Spacing between logo and loader
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: moderateScale(36),
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  brandUnderline: {
    height: 3,
    width: scale(100),
    borderRadius: 2,
    opacity: 0.8,
  },
  loaderContainer: {
    width: scale(200),
    height: scale(200),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  box: {
    position: 'absolute',
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: moderateScale(8),
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  ground: {
    position: 'absolute',
    bottom: -scale(30),
    width: scale(140),
    height: scale(140),
    borderRadius: scale(70),
    zIndex: -1,
  },
});
