import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Configure notification behavior
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const NotificationService = {
  /**
   * Initialize the notification service
   */
  async initialize() {
    if (Platform.OS === 'web' || !Notifications) return false;
    
    try {
      const hasPermission = await this.requestPermissions();
      console.log('Notification Service Initialized. Permissions:', hasPermission);
      return hasPermission;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  },

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
        lightColor: '#8B5CF6',
      });
    }

    return true;
  },

  /**
   * Get the Expo push token
   */
  async getPushToken() {
    if (Platform.OS === 'web' || !Notifications || !Device) return null;
    
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (e) {
      console.error('Error getting push token:', e);
      return null;
    }
  },

  /**
   * Schedule a daily reminder for a specific time
   */
  async scheduleDailyReminder(hour = 9, minute = 0, userName = "Sikola", lastSubject = null) {
    if (Platform.OS === 'web' || !Notifications) return;
    
    await this.cancelAllNotifications();

    const trigger = {
      hour: hour ?? 9,
      minute: minute ?? 0,
      repeats: true,
    };

    const bodyText = lastSubject 
      ? `Ready to master more of ${lastSubject} today? Your progress is waiting.`
      : "Ready to master a new concept today? Your progress is waiting.";

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Rise and Shine, ${userName}! ☀️`,
        body: bodyText,
        data: { screen: 'Home' },
        sound: true,
        priority: 'high',
      },
      trigger,
    });

    console.log(`[NotificationService] Scheduled Daily Reminder ID: ${id} for ${hour}:${minute}`);
    return id;
  },

  /**
   * Schedule a streak-saving alert
   */
  async scheduleStreakAlert() {
    if (Platform.OS === 'web' || !Notifications) return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Protect Your Streak! 🔥",
        body: "Don't let your hard-earned streak cool down! Study for 5 minutes now.",
        data: { screen: 'Test' },
        color: '#8B5CF6',
        priority: 'high',
        sound: true,
      },
      trigger: {
          hour: 18, // 6 PM
          minute: 0,
          repeats: true
      },
    });
  },

  /**
   * Schedule a smart nudge based on progress
   */
  async scheduleSmartNudge(lessonCount = 0) {
    if (Platform.OS === 'web' || !Notifications) return;
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "You're on a roll! 📈",
        body: `You've already mastered ${lessonCount} lessons. Unlock the full curriculum to become a certified expert! 👑`,
        data: { screen: 'Subscription' },
        color: '#FACC15',
        sound: true,
        priority: 'high',
      },
      trigger: {
          seconds: 60 * 60 * 48, // 48 hours later
          repeats: false
      },
    });
    console.log(`[NotificationService] Scheduled Smart Nudge ID: ${id}`);
  },

  /**
   * Send an instant notification (for testing)
   */
  async sendInstantNotification(title, body, data = {}) {
    if (Platform.OS === 'web' || !Notifications) return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || "Test Notification 🔔",
        body: body || "This is a test notification from Sikola+.",
        data,
        sound: true,
        priority: 'high',
      },
      trigger: null, // null means send immediately
    });
  },

  /**
   * Schedule an inactivity nudge
   */
  async scheduleInactivityNudge(userName = "Sikola") {
    if (Platform.OS === 'web' || !Notifications) return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `We miss you, ${userName}! 👋`,
        body: "Your learning path is waiting. Did you know? Studying just 10 minutes a day increases retention by 60%! 🧠",
        data: { screen: 'Learn' },
        sound: true,
        priority: 'high',
      },
      trigger: {
        seconds: 60 * 60 * 48, // 48 hours later
        repeats: false
      },
    });
  },

  /**
   * Schedule a weekend bonus reminder
   */
  async scheduleWeekendBonus() {
    if (Platform.OS === 'web' || !Notifications) return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weekend Challenge! ⚔️",
        body: "Earn double XP today only! Complete any two lessons to claim your bonus. 💎",
        data: { screen: 'Learn' },
        sound: true,
        priority: 'high',
        color: '#3B82F6',
      },
      trigger: {
        weekday: 7, // Saturday
        hour: 10,
        minute: 0,
        repeats: true
      },
    });
  },

  /**
   * Schedule a trial expiry warning
   */
  async scheduleTrialExpiryWarning(daysLeft = 1) {
    if (Platform.OS === 'web' || !Notifications) return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Don't lose your progress! ⏳",
        body: `Your trial ends in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Subscribe now to keep your streak alive!`,
        data: { screen: 'Subscription' },
        sound: true,
        priority: 'high',
        color: '#EF4444',
      },
      trigger: {
        seconds: 60 * 60 * 24, // 24 hours later
        repeats: false
      },
    });
  },

  async cancelAllNotifications() {
    if (Platform.OS === 'web' || !Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};

export default NotificationService;
