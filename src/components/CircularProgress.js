import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CircularProgress({ 
  size = 80, 
  progress = 0, 
  strokeWidth = 10, 
  color = '#10B981',
  backgroundColor = 'rgba(255,255,255,0.1)',
  children 
}) {
  // Ensure progress is between 0 and 1
  const normalizedProgress = Math.max(0, Math.min(1, progress));
  
  // Calculate the rotation angle (0-360 degrees)
  const rotation = normalizedProgress * 360;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View 
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]} 
      />
      
      {/* Progress circle using conic gradient simulation */}
      <View 
        style={[
          styles.progressContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          }
        ]}
      >
        {/* Left half */}
        <View 
          style={[
            styles.halfCircle,
            styles.leftHalf,
            {
              width: size / 2,
              height: size,
              borderTopLeftRadius: size / 2,
              borderBottomLeftRadius: size / 2,
            }
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: size / 2,
                height: size,
                borderTopLeftRadius: size / 2,
                borderBottomLeftRadius: size / 2,
                backgroundColor: normalizedProgress > 0.5 ? color : 'transparent',
              }
            ]}
          />
        </View>
        
        {/* Right half */}
        <View 
          style={[
            styles.halfCircle,
            styles.rightHalf,
            {
              width: size / 2,
              height: size,
              borderTopRightRadius: size / 2,
              borderBottomRightRadius: size / 2,
            }
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: size / 2,
                height: size,
                borderTopRightRadius: size / 2,
                borderBottomRightRadius: size / 2,
                backgroundColor: color,
                transform: [
                  { 
                    rotate: normalizedProgress <= 0.5 
                      ? `${rotation}deg` 
                      : '180deg' 
                  }
                ],
              }
            ]}
          />
        </View>
      </View>
      
      {/* Inner circle to create ring effect */}
      <View 
        style={[
          styles.innerCircle,
          {
            width: size - strokeWidth * 2,
            height: size - strokeWidth * 2,
            borderRadius: (size - strokeWidth * 2) / 2,
          }
        ]} 
      />
      
      {/* Center content */}
      <View style={styles.centerContent}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
  },
  progressContainer: {
    position: 'absolute',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  halfCircle: {
    overflow: 'hidden',
  },
  leftHalf: {
    position: 'absolute',
    left: 0,
  },
  rightHalf: {
    position: 'absolute',
    right: 0,
  },
  progressFill: {
    position: 'absolute',
  },
  innerCircle: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
