import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  Bell, 
  ChevronLeft, 
  Zap, 
  Star, 
  Flame, 
  Send,
  ShieldCheck,
  Smartphone
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import NotificationService from '../services/NotificationService';
import * as Notifications from 'expo-notifications';

const TestButton = ({ icon: Icon, title, description, time, onPress, color }) => {
  const { theme, isDark } = useTheme();
  return (
    <TouchableOpacity 
      style={[styles.testButton, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Icon color={color} size={24} />
      </View>
      <View style={styles.buttonText}>
        <View style={styles.titleRow}>
          <Text style={[styles.buttonTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
          {time && (
            <View style={[styles.timeBadge, { backgroundColor: color + '30' }]}>
              <Text style={[styles.timeText, { color: color }]}>{time}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.buttonDesc, { color: theme.colors.textSecondary }]}>{description}</Text>
      </View>
      <Send size={16} color={theme.colors.textSecondary} style={{ marginLeft: 8, opacity: 0.5 }} />
    </TouchableOpacity>
  );
};

export default function NotificationTestScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userProfile, recentLessons, userStats } = useProgress();
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [pushToken, setPushToken] = useState('Fetching...');

  // Get first name for personalized tests
  const firstName = (userProfile?.name || 'Sikola').split(' ')[0];
  const lastSubject = recentLessons?.length > 0 ? recentLessons[0].category : 'Economics';
  const lessonCount = userStats?.total_lessons_completed || 48;

  useEffect(() => {
    checkPermissions();
    fetchToken();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const fetchToken = async () => {
    if (Platform.OS === 'web') {
      setPushToken('Not supported on web');
      return;
    }
    const token = await NotificationService.getPushToken();
    setPushToken(token || 'Failed to get token');
  };

  const handleTestDaily = async () => {
    // Standardizing to the working 'Streak' pattern for visual verification
    await NotificationService.sendInstantNotification(
      `Rise and Shine, ${firstName}! ☀️`,
      `Ready to master more of ${lastSubject} today? Your progress is waiting.`,
      { screen: 'Home' }
    );
  };

  const handleSmartNudgeTest = async () => {
    // Standardizing to the working 'Streak' pattern for visual verification
    await NotificationService.sendInstantNotification(
      "You're on a roll! 📈",
      `You've already mastered ${lessonCount} lessons. Unlock the full curriculum to become a certified expert! 👑`,
      { screen: 'Subscription' }
    );
  };

  const handleBackgroundTest = async () => {
    Alert.alert(
      "Background Test Ready",
      "Click OK, then IMMEDIATELY minimize the app or lock your screen. The notification will arrive in 10 seconds.",
      [
        {
          text: "OK",
          onPress: async () => {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Background Test Success! 🚀",
                body: "This notification arrived while the app was inactive.",
                data: { screen: 'Home' },
                sound: true,
                priority: 'high',
              },
              trigger: { seconds: 10 },
            });
          }
        }
      ]
    );
  };

  const handleInactivityTest = async () => {
    await NotificationService.sendInstantNotification(
      `We miss you, ${firstName}! 👋`,
      "Your learning path is waiting. Did you know? Studying just 10 minutes a day increases retention by 60%! 🧠",
      { screen: 'Learn' }
    );
  };

  const handleWeekendTest = async () => {
    await NotificationService.sendInstantNotification(
      "Weekend Challenge! ⚔️",
      "Earn double XP today only! Complete any two lessons to claim your bonus. 💎",
      { screen: 'Learn' }
    );
  };

  const handleTrialExpiryTest = async () => {
    await NotificationService.sendInstantNotification(
      "Don't lose your progress! ⏳",
      "Your trial ends in 1 day. Subscribe now to keep your streak alive!",
      { screen: 'Subscription' }
    );
  };

  const handleTestStreak = async () => {
    await NotificationService.sendInstantNotification(
      "Protect Your Streak! 🔥",
      "Don't let your hard-earned streak cool down. Study now!",
      { screen: 'Test' }
    );
  };

  const handleTestAchievement = async () => {
    await NotificationService.sendInstantNotification(
      "🏆 Achievement Unlocked!",
      "Congratulations! You've earned the 'Alpha Learner' badge.",
      { screen: 'Profile' }
    );
  };

  const handleInstantTest = async () => {
    await NotificationService.sendInstantNotification(
      "Test Notification 🔔",
      "This is an instant test notification from the debug menu."
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={theme.colors.textPrimary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Notification Test</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Status Section */}
          <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.statusCard, { borderColor: theme.colors.glassBorder }]}>
            <View style={styles.statusRow}>
              <ShieldCheck color={permissionStatus === 'granted' ? '#10B981' : '#EF4444'} size={20} />
              <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>
                Permissions: <Text style={{ fontWeight: 'bold' }}>{permissionStatus.toUpperCase()}</Text>
              </Text>
            </View>
            <View style={[styles.statusRow, { marginTop: 10 }]}>
              <Smartphone color={theme.colors.secondary} size={20} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>Device Token:</Text>
                <Text style={[styles.tokenValue, { color: theme.colors.textSecondary }]} numberOfLines={1} ellipsizeMode="middle">
                  {pushToken}
                </Text>
              </View>
            </View>
          </BlurView>

          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Available Tests</Text>
          
          <TestButton 
            icon={Bell}
            title="Instant Test"
            description="Trigger a generic notification immediately"
            onPress={handleInstantTest}
            color="#8B5CF6"
          />

          <TestButton 
            icon={Zap}
            title="Personalized Daily"
            description={`Test with ${firstName}/${lastSubject}`}
            time="Daily 9:00 AM"
            onPress={handleTestDaily}
            color="#FACC15"
          />

          <TestButton 
            icon={Star}
            title="Smart Nudge"
            description={`Test with ${lessonCount} lessons`}
            time="48h After Activity"
            onPress={handleSmartNudgeTest}
            color="#3B82F6"
          />

          <TestButton 
            icon={Flame}
            title="Streak Alert"
            description="Test streak protection"
            time="Daily 6:00 PM"
            onPress={handleTestStreak}
            color="#EF4444"
          />

          <TestButton 
            icon={Star}
            title="Achievement Unlocked"
            description="Test celebration message"
            time="Instant Event"
            onPress={handleTestAchievement}
            color="#3B82F6"
          />

          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginTop: 20 }]}>Phase 2 Integration</Text>

          <TestButton 
            icon={Flame}
            title="Inactivity Nudge"
            description={`Test missing ${firstName}`}
            time="48h Inactivity"
            onPress={handleInactivityTest}
            color="#F59E0B"
          />

          <TestButton 
            icon={Zap}
            title="Weekend Warrior"
            description="Test Saturday XP bonus"
            time="Sat 10:00 AM"
            onPress={handleWeekendTest}
            color="#8B5CF6"
          />

          <TestButton 
            icon={Bell}
            title="Trial Countdown"
            description="Test expiry warning"
            time="24h Before End"
            onPress={handleTrialExpiryTest}
            color="#EF4444"
          />

          <View style={styles.noteBox}>
            <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
              Note: If you don't see notifications, ensure you are using a physical device or a simulator with Play Services. Verify your app's notification settings in system preferences.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  statusCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 30,
    overflow: 'hidden',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    marginLeft: 10,
  },
  tokenValue: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
    marginLeft: 5,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  timeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  buttonDesc: {
    fontSize: 13,
    opacity: 0.7,
  },
  noteBox: {
    marginTop: 20,
    padding: 15,
    opacity: 0.8,
  },
  noteText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
