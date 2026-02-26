import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgress } from '../context/ProgressContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function TrialBanner() {
  const { theme, isDark } = useTheme();
  const { trialDaysRemaining, subscriptions, subscriptionInfo } = useProgress();
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const hasActiveSub = subscriptions && subscriptions.length > 0;

  useEffect(() => {
    checkVisibility();
  }, [hasActiveSub, trialDaysRemaining]);

  const checkVisibility = async () => {
    if (hasActiveSub || trialDaysRemaining <= 0) {
      setVisible(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const showData = await AsyncStorage.getItem(`trial_banner_shows_${today}`);
      let shows = showData ? parseInt(showData) : 0;

      if (shows < 2) {
        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
        
        // Count this show
        await AsyncStorage.setItem(`trial_banner_shows_${today}`, (shows + 1).toString());
      } else {
        setVisible(false);
      }
    } catch (e) {
      console.error("Banner storage error", e);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#FACC15', '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Sparkles size={20} color="#000" />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>Free Trial Active</Text>
            <Text style={styles.subtitle}>
              {subscriptionInfo.subLabel.split(' • ')[0]}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.upgradeText}>Upgrade</Text>
            <ArrowRight size={14} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  gradient: {
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.7)',
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  upgradeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
});
