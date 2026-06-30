import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Standard mobile screen sizes as base for design (e.g., iPhone 11/13/14)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Clamp the width/height on web so desktop screens don't get massive scaling
const effectiveWidth = Platform.OS === 'web' ? Math.min(width, 420) : width;
const effectiveHeight = Platform.OS === 'web' ? Math.min(height, 900) : height;

/**
 * Scales a value based on the screen width.
 * Best for: Widths, margins, horizontal padding.
 */
const scale = (size) => (effectiveWidth / guidelineBaseWidth) * size;

/**
 * Scales a value based on the screen height.
 * Best for: Heights, vertical padding.
 */
const verticalScale = (size) => (effectiveHeight / guidelineBaseHeight) * size;

/**
 * Scales a value moderately based on the screen width. 
 * Allows for a factor (default 0.5) to keep scaling from becoming too aggressive on large screens.
 * Best for: Font sizes, icons, small gaps.
 */
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export { scale, verticalScale, moderateScale, width, height };
