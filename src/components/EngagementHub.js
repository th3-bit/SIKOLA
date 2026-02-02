import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Flame, Target, Trophy, ChevronRight, Clock } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';

// Only import SVG on native platforms
let Svg, Circle;
if (Platform.OS !== 'web') {
  const RNSvg = require('react-native-svg');
  Svg = RNSvg.default;
  Circle = RNSvg.Circle;
}

const { width } = Dimensions.get('window');

export default function EngagementHub({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userStats, levelInfo, dailyXP = 450, dailyTarget = 1000 } = useProgress();
  
  const streak = userStats?.current_streak || 0;
  const progress = Math.min(dailyXP / dailyTarget, 1);
  const currentLevel = levelInfo?.current;
  const nextLevel = levelInfo?.next;
  const levelProgress = levelInfo?.progress || 0;
  
  // SVG Constants for Goal Ring (only used on native)
  const size = 80; 
  const strokeWidth = 10;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  // Web-friendly progress bar component
  const WebProgressBar = () => (
    <View style={styles.webProgressContainer}>
      <View style={styles.webProgressBar}>
        <View style={[styles.webProgressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.webProgressText}>
        <Target size={18} color="#10B981" />
        <Text style={[styles.goalPercent, { color: theme.colors.textPrimary }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );

  // Native SVG circular progress component
  const NativeCircularProgress = () => (
    <View style={styles.goalContainer}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#10B981"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.goalTextCenter}>
         <Target size={18} color="#10B981" />
         <Text style={[styles.goalPercent, { color: theme.colors.textPrimary }]}>{Math.round(progress * 100)}%</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 🚀 Widget Grid */}
      <View style={styles.widgetGrid}>
        
        {/* 🔥 Streak Hub Widget (Large) */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={[styles.mainWidget, { shadowColor: '#FF4D4D' }]}
        >
          <View style={[styles.glassCard, { 
            backgroundColor: isDark ? 'rgba(255, 77, 77, 0.1)' : 'rgba(255, 77, 77, 0.05)',
            borderColor: 'rgba(255, 77, 77, 0.25)'
          }]}>
            <View style={styles.widgetHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF4D4D' }]}>
                <Flame size={20} color="#FFF" fill="#FFF" />
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusText}>ACTIVE</Text>
              </View>
            </View>
            
            <View style={styles.widgetBody}>
              <Text style={[styles.widgetValue, { color: theme.colors.textPrimary }]}>{streak}</Text>
              <Text style={[styles.widgetLabel, { color: theme.colors.textSecondary }]}>Day Streak</Text>
            </View>
            
            <View style={styles.widgetFooter}>
              <Text style={[styles.footerText, { color: '#FF4D4D' }]}>Study today to keep it!</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.sideColumn}>
          {/* 🎯 Daily Goal Widget */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={[styles.smallWidget, { shadowColor: '#10B981' }]}
          >
            <View style={[styles.glassCard, { 
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
            borderColor: 'rgba(16, 185, 129, 0.25)'
          }]}>
              {/* Platform-specific progress display */}
              {Platform.OS === 'web' ? <WebProgressBar /> : <NativeCircularProgress />}
              <Text style={[styles.smallWidgetLabel, { color: theme.colors.textSecondary }]}>Daily Goal</Text>
            </View>
          </TouchableOpacity>

          {/* 🏅 Mastery Rank Widget */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={[styles.smallWidget, { shadowColor: currentLevel?.color || '#8B5CF6' }]}
          >
            <View style={[styles.glassCard, { 
              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)',
              borderColor: 'rgba(139, 92, 246, 0.25)'
            }]}>
              <View style={styles.rankHeader}>
                <Text style={{ fontSize: 24 }}>{currentLevel?.icon}</Text>
                <View style={[styles.levelBadge, { 
                  backgroundColor: `${currentLevel?.color || '#8B5CF6'}25`, 
                  borderColor: `${currentLevel?.color || '#8B5CF6'}50` 
                }]}>
                  <Text style={[styles.levelBadgeText, { color: currentLevel?.color || '#8B5CF6' }]}>LVL {currentLevel?.level || '-'}</Text>
                </View>
              </View>
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.smallWidgetValue, { color: theme.colors.textPrimary, textTransform: 'uppercase' }]}>
                  {currentLevel?.title}
                </Text>
                
                {/* Level Progress Bar */}
                <View style={styles.levelProgressContainer}>
                  <View style={[styles.levelProgressBar, { width: `${levelProgress * 100}%`, backgroundColor: currentLevel?.color }]} />
                </View>
                <Text style={[styles.smallWidgetLabel, { color: theme.colors.textSecondary, fontSize: 9 }]}>
                  {nextLevel ? `${Math.round(levelProgress * 100)}% to ${nextLevel.title}` : 'MAX LEVEL'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

      </View>

      {/* 💡 Feature Widget: Lesson of the Day */}
      <TouchableOpacity 
        activeOpacity={0.9}
        style={styles.featuredWidget}
      >
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(99, 102, 241, 0.1)']}
          style={[styles.featuredCard, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
        >
          <View style={styles.featuredIconBg}>
            <Zap size={24} color="#8B5CF6" fill="#8B5CF6" />
          </View>
          <View style={styles.featuredContent}>
            <Text style={[styles.featuredTag, { color: '#8B5CF6' }]}>FEATURED LESSON</Text>
            <Text style={[styles.featuredTitle, { color: theme.colors.textPrimary }]}>Quantum Physics Basics</Text>
            <View style={styles.featuredMeta}>
               <Clock size={12} color={theme.colors.textSecondary} />
               <Text style={[styles.featuredMetaText, { color: theme.colors.textSecondary }]}>15 mins • 200 XP</Text>
            </View>
          </View>
          <ChevronRight size={20} color={theme.colors.textSecondary} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  widgetGrid: {
    flexDirection: 'row',
    gap: 16,
    height: 220,
  },
  mainWidget: {
    flex: 1.2,
    borderRadius: 24,
    overflow: 'hidden',
  },
  sideColumn: {
    flex: 1,
    gap: 16,
  },
  smallWidget: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassCard: {
    flex: 1,
    padding: 20,
    borderWidth: 1,
    borderRadius: 24,
    justifyContent: 'space-between',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  widgetBody: {
    marginTop: 10,
  },
  widgetValue: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 56,
  },
  widgetLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  widgetFooter: {
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalContainer: {
    width: '100%',
    height: size,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  svg: {
    position: 'absolute',
  },
  goalTextCenter: {
    alignItems: 'center',
  },
  goalPercent: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  smallWidgetLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smallWidgetValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  featuredWidget: {
    width: '100%',
  },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  featuredIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContent: {
    flex: 1,
  },
  featuredTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredMetaText: {
    fontSize: 12,
    opacity: 0.6,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  levelProgressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  levelProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  // Web-specific progress bar styles
  webProgressContainer: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webProgressBar: {
    width: '80%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  webProgressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  webProgressText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
