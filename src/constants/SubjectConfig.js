import { 
  Calculator, 
  BookOpen, 
  Beaker, 
  Globe, 
  TrendingUp, 
  Briefcase, 
  Code, 
  Scale, 
  Flame,
  Dumbbell,
  Palette,
  Music,
  Zap,
  Cpu
} from 'lucide-react-native';

export const SUBJECT_CONFIG = {
  'Mathematics': { color: '#FACC15', icon: Calculator },
  'English': { color: '#3B82F6', icon: BookOpen },
  'Biology': { color: '#10B981', icon: Beaker },
  'Chemistry': { color: '#EC4899', icon: Beaker },
  'Physics': { color: '#8B5CF6', icon: Beaker },
  'Geography': { color: '#14B8A6', icon: Globe },
  'History': { color: '#F97316', icon: BookOpen },
  'Economics': { color: '#6366F1', icon: TrendingUp },
  'Accounting': { color: '#00D1FF', icon: Scale }, // Vibrant Cyan
  'Entrepreneurship / Business Studies': { color: '#F43F5E', icon: Briefcase }, // Rose
  'Entrepreneurship': { color: '#F43F5E', icon: Briefcase },
  'Business Management': { color: '#EF4444', icon: Briefcase }, // True Red
  'Business Studies': { color: '#EF4444', icon: Briefcase },
  'Commerce': { color: '#A3E635', icon: Briefcase }, // Lime
  'ICT / Computer Studies': { color: '#22C55E', icon: Code },
  'Civic Education': { color: '#A855F7', icon: Scale },
};

const DEFAULT_COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#A3E635', '#34D399', 
  '#2DD4BF', '#38BDF8', '#818CF8', '#A78BFA', '#E879F9'
];

export const getSubjectStyle = (name) => {
  if (!name) return { color: '#8B5CF6', icon: BookOpen };
  
  // 1. Try exact match
  if (SUBJECT_CONFIG[name]) return { ...SUBJECT_CONFIG[name], name };
  
  // 2. Try normalized match (Capitalize first, lower rest) - more robust
  const normalized = name.trim().split(/\s+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  
  if (SUBJECT_CONFIG[normalized]) return { ...SUBJECT_CONFIG[normalized], name: normalized };
  
  // 3. More specific fuzzy matching to avoid overlaps
  const lowerName = name.toLowerCase();
  
  // Business/Fin
  if (lowerName.includes('management')) return { ...SUBJECT_CONFIG['Business Management'], name: 'Business Management' };
  if (lowerName.includes('entrepreneur')) return { ...SUBJECT_CONFIG['Entrepreneurship'], name: 'Entrepreneurship' };
  if (lowerName.includes('account')) return { ...SUBJECT_CONFIG['Accounting'], name: 'Accounting' };
  if (lowerName.includes('business') || lowerName.includes('commerce')) return { ...SUBJECT_CONFIG['Business Studies'], name: 'Business Studies' };
  
  // Core Academic
  if (lowerName.includes('math') || lowerName.includes('calc')) return { ...SUBJECT_CONFIG['Mathematics'], name: 'Mathematics' };
  if (lowerName.includes('english') || lowerName.includes('literature')) return { ...SUBJECT_CONFIG['English'], name: 'English' };
  
  // Science Fuzzy
  if (lowerName.includes('bio')) return { ...SUBJECT_CONFIG['Biology'], name: 'Biology' };
  if (lowerName.includes('chem')) return { ...SUBJECT_CONFIG['Chemistry'], name: 'Chemistry' };
  if (lowerName.includes('physic')) return { ...SUBJECT_CONFIG['Physics'], name: 'Physics' };
  if (lowerName.includes('science')) return { color: '#06B6D4', icon: Beaker, name: normalized };

  // Tech Fuzzy
  if (lowerName.includes('computer') || lowerName.includes('ict') || lowerName.includes('code') || lowerName.includes('tech')) 
    return { ...SUBJECT_CONFIG['ICT / Computer Studies'], name: 'ICT / Computer Studies' };

  // Arts & Misc Fuzzy
  if (lowerName.includes('art') || lowerName.includes('design')) return { color: '#F97316', icon: Palette, name: normalized };
  if (lowerName.includes('music')) return { color: '#EC4899', icon: Music, name: normalized };
  if (lowerName.includes('geography')) return { ...SUBJECT_CONFIG['Geography'], name: 'Geography' };
  if (lowerName.includes('history')) return { ...SUBJECT_CONFIG['History'], name: 'History' };
  if (lowerName.includes('civic') || lowerName.includes('law')) return { ...SUBJECT_CONFIG['Civic Education'], name: 'Civic Education' };
  if (lowerName.includes('bible') || lowerName.includes('religious')) return { color: '#FCD34D', icon: BookOpen, name: 'Religious Education' };
  if (lowerName.includes('physical') || lowerName.includes('sport')) return { color: '#EF4444', icon: Dumbbell, name: normalized };

  // 4. Stable Fallback for completely unique courses
  const icon = lowerName.includes('exam') || lowerName.includes('test') ? Zap : BookOpen;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % DEFAULT_COLORS.length;
  
  return { 
    color: DEFAULT_COLORS[colorIndex], 
    icon: icon,
    name: normalized
  };
};
