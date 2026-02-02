import { Platform } from 'react-native';

// Defensive initialization for web compatibility
let Notifications = null;
let Device = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    
    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (err) {
    console.warn('Native notification modules not available:', err);
  }
}

export const NotificationService = {
  /**
   * Request permissions for notifications
   */
  async requestPermissions() {
    if (Platform.OS === 'web' || !Notifications || !Device) return false;
    
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  },

  /**
   * Schedule a daily reminder for a specific time
   */
  async scheduleDailyReminder(hour = 9, minute = 0) {
    if (Platform.OS === 'web' || !Notifications) return;
    
    await this.cancelAllNotifications();

    const trigger = {
      hour,
      minute,
      repeats: true,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📚 Time for Sikola!",
        body: "Your daily lessons are waiting. Let's keep your streak alive!",
        data: { screen: 'Learn' },
        sound: true,
      },
      trigger,
    });

    console.log(`Scheduled daily reminder (ID: ${id}) for ${hour}:${minute}`);
    return id;
  },

  /**
   * Schedule a streak-saving alert
   */
  async scheduleStreakAlert() {
    if (Platform.OS === 'web' || !Notifications) return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 Streak at Risk!",
        body: "Don't lose your progress! Complete just one lesson to save your streak.",
        data: { screen: 'Learn' },
        color: '#FF4785',
      },
      trigger: null,
    });
  },

  /**
   * Schedule an achievement celebration
   */
  async scheduleAchievementUnlocked(achievementName) {
    if (Platform.OS === 'web' || !Notifications) return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🏆 Achievement Unlocked!",
        body: `Congratulations! You've earned the "${achievementName}" badge.`,
        data: { screen: 'Profile' },
      },
      trigger: null,
    });
  },

  async cancelAllNotifications() {
    if (Platform.OS === 'web' || !Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};

export default NotificationService;
