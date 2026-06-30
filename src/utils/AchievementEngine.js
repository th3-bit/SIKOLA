import { 
  Zap, 
  BookOpen, 
  Star, 
  Flame 
} from 'lucide-react-native';

/**
 * AchievementEngine.js
 * Centralized business logic for tracking user levels, streaks, activities, and achievements.
 */

export const AchievementEngine = {

  /**
   * Calculates current level and XP thresholds based on total XP.
   */
  getLevelInfo(totalXp) {
    // Mimicking the logic from the constants/LevelConfig.js without needing the full import yet
    const currentLevel = Math.floor(Math.sqrt(totalXp / 100)) + 1;
    const currentLevelXpStart = Math.pow(currentLevel - 1, 2) * 100;
    const nextLevelXpStart = Math.pow(currentLevel, 2) * 100;
    
    return {
      current: { level: currentLevel },
      next: { level: currentLevel + 1 },
      xpProgress: totalXp - currentLevelXpStart,
      xpNeeded: nextLevelXpStart - currentLevelXpStart
    };
  },

  /**
   * Generates a 7-day array (Mon-Sun) indicating active days.
   */
  calculateWeeklyActivity(sessions, progress) {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    const diffSinceMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diffSinceMonday));
    startOfWeek.setHours(0, 0, 0, 0);

    const weekData = new Array(7).fill(false);
    
    const sessionsThisWeek = (sessions || []).filter(s => new Date(s.started_at) >= startOfWeek);
    const progressThisWeek = (progress || []).filter(p => new Date(p.completed_at) >= startOfWeek);

    const combinedActivity = [
      ...sessionsThisWeek.map(s => new Date(s.started_at)),
      ...progressThisWeek.map(p => new Date(p.completed_at))
    ];

    combinedActivity.forEach(date => {
      const day = date.getDay(); 
      const index = (day === 0 ? 6 : day - 1); 
      if (index >= 0 && index < 7) {
        weekData[index] = true;
      }
    });

    return weekData;
  },

  /**
   * Evaluates completion rules for weekly achievements.
   */
  calculateWeeklyAchievements(sessions, progress) {
    const now = new Date();
    const currentDay = now.getDay();
    const diffSinceMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diffSinceMonday));
    startOfWeek.setHours(0, 0, 0, 0);

    const sessionsThisWeek = (sessions || []).filter(s => new Date(s.started_at) >= startOfWeek);
    const progressThisWeek = (progress || []).filter(p => new Date(p.completed_at) >= startOfWeek);

    const earlyBirdCount = sessionsThisWeek.filter(s => {
      const h = new Date(s.started_at).getHours();
      return h >= 5 && h < 9;
    }).length;

    const uniqueDaysStudied = new Set(sessionsThisWeek.map(s => new Date(s.started_at).toDateString())).size;
    
    const perfectScores = progressThisWeek.filter(l => l.score === 100).length;
    
    const lessonsCompletedCount = progressThisWeek.length;

    return [
      { 
        id: 1, 
        title: 'Early Bird', 
        icon: Zap, 
        color: '#FACC15', 
        unlocked: earlyBirdCount >= 4, 
        current: earlyBirdCount,
        total: 4,
        desc: 'Complete 4 lessons before 9AM this week' 
      },
      { 
        id: 2, 
        title: 'Weekly Warrior', 
        icon: Flame, 
        color: '#FF453A', 
        unlocked: uniqueDaysStudied >= 7, 
        current: uniqueDaysStudied,
        total: 7,
        desc: 'Study for 7 days this week' 
      },
      { 
        id: 3, 
        title: 'Quiz Master', 
        icon: Star, 
        color: '#8B5CF6', 
        unlocked: perfectScores >= 3, 
        current: perfectScores,
        total: 3,
        desc: 'Score 100% on 3 quizzes this week' 
      },
      { 
        id: 4, 
        title: 'Bookworm', 
        icon: BookOpen, 
        color: '#10B981', 
        unlocked: lessonsCompletedCount >= 5, 
        current: lessonsCompletedCount,
        total: 5,
        desc: 'Complete 5 lessons this week' 
      },
    ];
  }
};
