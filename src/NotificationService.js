import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import logger from './utils/logger';

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
    
    // Safety check for Expo Go (SDK 51+)
    if (Constants?.appOwnership === 'expo' && Platform.OS === 'android') {
      logger.warn('Push notifications are not supported in Expo Go on Android. Use a Development Build.');
      return false;
    }
    
    try {
      const hasPermission = await this.requestPermissions();
      return hasPermission;
    } catch (error) {
      logger.error('Error initializing notifications:', error);
      return false;
    }
  },

  /**
   * Automatically schedule all relevant notifications based on user data
   */
  async autoScheduleAll(userData = {}, userStats = {}, recentLessons = []) {
    if (Platform.OS === 'web' || !Notifications) return;

    try {
      const firstName = (userData?.name || 'Sikola').split(' ')[0];
      const lastSubject = recentLessons?.length > 0 ? recentLessons[0].category : null;
      const lessonCount = userStats?.total_lessons_completed || 0;

      logger.log('🔔 Automating notifications for:', firstName);

      // 1. Morning Reminder (4 AM)
      await this.scheduleDailyReminder(4, 0, firstName, lastSubject);

      // 2. Streak Protection (6 PM)
      await this.scheduleStreakAlert();

      // 3. Weekend Bonuses
      await this.scheduleWeekendBonus();

      // 4. Inactivity Nudge (35h)
      await this.scheduleInactivityNudge(firstName);

      // 5. Smart Nudge if they've completed some lessons
      if (lessonCount > 0) {
        await this.scheduleSmartNudge(lessonCount);
      }

      logger.log('✅ All automated notifications scheduled!');
    } catch (error) {
      logger.error('Error auto-scheduling notifications:', error);
    }
  },

  /**
   * Request permissions for notifications
   */
  async requestPermissions() {
    if (Platform.OS === 'web' || !Notifications || !Device) return false;
    
    if (!Device.isDevice) {
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
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
      logger.error('Error getting push token:', e);
      return null;
    }
  },

  /**
   * Schedule a daily reminder for a specific time
   */
  async scheduleDailyReminder(hour = 4, minute = 0, userName = "Sikola", lastSubject = null) {
    if (Platform.OS === 'web' || !Notifications) return;
    
    // We don't cancel all here anymore to allow multiple types of schedules to coexist
    // Instead, we should use a consistent identifier if we wanted to replace specific ones

    const trigger = {
      hour: hour ?? 4,
      minute: minute ?? 0,
      repeats: true,
    };

    const messages = [
      `Rise and Shine, ${userName}! ☀️ Ready to hit your Early Bird target in ${lastSubject || 'subjects'}?`,
      `Good morning, ${userName}! ☕ Your 5-9 AM study session is the best way to start your day.`,
      `Early bird gets the XP! 🦅 Your learning path is waiting for you at the top of the morning.`,
      `Morning, ${userName}! 👋 Don't let your streak cool down. Let's finish an early lesson!`,
      `Ready for your morning boost? 👑 Your next ${lastSubject || 'Sikola+'} lesson is just a tap away.`,
      `The world is quiet, but your brain is awake! 🧠 Early study sessions are 2x more effective. Let's go!`
    ];

    const bodyText = messages[Math.floor(Math.random() * messages.length)];

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Morning Learning Reminder 📚",
        body: bodyText,
        data: { screen: 'Learn' },
        sound: true,
        priority: 'high',
        color: '#8B5CF6',
        android: {
          channelId: 'default',
          smallIcon: 'notification_icon', // Ensure this exists in your assets or use default
        }
      },
      trigger,
    });

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
        body: "Don't let your hard-earned streak cool down! Study for 5 minutes now to keep it alive.",
        data: { screen: 'Test' },
        color: '#EF4444',
        priority: 'high',
        sound: true,
        android: {
          channelId: 'default',
        }
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
        android: {
          channelId: 'default',
        }
      },
      trigger: {
          seconds: 60 * 60 * 38, // 38 hours later
          repeats: false
      },
    });
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
        android: {
          channelId: 'default',
        }
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
        android: {
          channelId: 'default',
        }
      },
      trigger: {
        seconds: 60 * 60 * 35, // 35 hours later
        repeats: false
      },
    });
  },

  /**
   * Schedule a weekend bonus reminder
   */
  async scheduleWeekendBonus() {
    if (Platform.OS === 'web' || !Notifications) return;
    
    // Saturday at 10 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weekend Challenge! ⚔️",
        body: "Earn double XP today only! Complete any two lessons to claim your bonus. 💎",
        data: { screen: 'Learn' },
        sound: true,
        priority: 'high',
        color: '#3B82F6',
        android: {
          channelId: 'default',
        }
      },
      trigger: {
        weekday: 7, 
        hour: 10,
        minute: 0,
        repeats: true
      },
    });

    // Sunday at 10 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Weekend Challenge! ⚔️",
        body: "Your weekend XP bonus is active! Finish a lesson now to boost your rank. 💎",
        data: { screen: 'Learn' },
        sound: true,
        priority: 'high',
        color: '#3B82F6',
        android: {
          channelId: 'default',
        }
      },
      trigger: {
        weekday: 1, 
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
        android: {
          channelId: 'default',
        }
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
