/**
 * Leveling Configuration for Sikola
 * Defines XP thresholds, titles, and visual themes for ranks
 */

export const LEVELS = [
  {
    level: 1,
    title: "Novice",
    minXP: 0,
    color: "#94A3B8", // Slate
    icon: "🌱",
  },
  {
    level: 2,
    title: "Scholar",
    minXP: 500,
    color: "#60A5FA", // Blue
    icon: "📖",
  },
  {
    level: 3,
    title: "Expert",
    minXP: 1200,
    color: "#818CF8", // Indigo
    icon: "🔍",
  },
  {
    level: 4,
    title: "Master",
    minXP: 2500,
    color: "#A78BFA", // Purple
    icon: "🎓",
  },
  {
    level: 5,
    title: "Legend",
    minXP: 5000,
    color: "#F472B6", // Pink
    icon: "👑",
  },
  {
    level: 6,
    title: "Sage",
    minXP: 10000,
    color: "#FBBF24", // Umber/Yellow
    icon: "✨",
  }
];

/**
 * Calculates level info based on total XP
 * @param {number} totalXP 
 * @returns {object} { current, next, progress }
 */
export const getLevelInfo = (totalXP) => {
  let current = LEVELS[0];
  let next = LEVELS[1];

  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXP >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    } else {
      break;
    }
  }

  const progress = next 
    ? (totalXP - current.minXP) / (next.minXP - current.minXP)
    : 1;

  return {
    current,
    next,
    progress: Math.min(Math.max(progress, 0), 1),
    totalXP
  };
};

export default {
  LEVELS,
  getLevelInfo
};
