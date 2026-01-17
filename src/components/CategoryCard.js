import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

export default function CategoryCard({ category, onPress }) {
  const { theme, isDark } = useTheme();
  const Icon = category.icon;

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={[styles.cardWrapper, { shadowColor: category.color }]}
    >
      <BlurView intensity={isDark ? 20 : 30} tint={isDark ? "dark" : "light"} style={[styles.card, { borderColor: theme.colors.glassBorder }]}>
        <LinearGradient
          colors={isDark 
            ? [`${category.color}30`, `${category.color}10`, 'transparent'] 
            : [`${category.color}20`, `${category.color}10`, `${category.color}05`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={[styles.iconContainer, { backgroundColor: `${category.color}${isDark ? '20' : '30'}` }]}>
          <Icon color={category.color} size={32} />
        </View>

        <Text style={[styles.title, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
          {category.name}
        </Text>
        <Text style={[styles.count, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
          {category.topicCount} topics
        </Text>

        <View style={[styles.glow, { backgroundColor: category.color, opacity: isDark ? 0.15 : 0.2 }]} />
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  count: {
    fontSize: 12,
    textAlign: 'center',
  },
  glow: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});
