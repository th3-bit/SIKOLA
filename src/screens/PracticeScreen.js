import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  Zap, 
  Brain, 
  Trophy, 
  Timer, 
  RotateCcw, 
  ChevronRight,
  Flame,
  Dumbbell
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import GlassHeader from '../components/GlassHeader';

const { width } = Dimensions.get('window');

const practiceModes = [
  { 
    id: 1, 
    title: 'Daily Sprint', 
    desc: '10 quick questions to keep you sharp', 
    icon: Timer, 
    color: '#FACC15',
    xp: '+20 XP'
  },
  { 
    id: 2, 
    title: 'Deep Dive', 
    desc: 'Master a specific topic with focusing', 
    icon: Brain, 
    color: '#8B5CF6',
    xp: '+50 XP'
  },
  { 
    id: 3, 
    title: 'Flashcards', 
    desc: 'Quick recall and memorization', 
    icon: RotateCcw, 
    color: '#EC4899',
    xp: '+15 XP'
  },
  { 
    id: 4, 
    title: 'Challenge Mode', 
    desc: 'Beat your high score and earn rewards', 
    icon: Trophy, 
    color: '#10B981',
    xp: '+100 XP'
  },
];

const revisionTopics = [
  { id: 1, name: 'Algebra Fundamentals', subject: 'Mathematics', strength: 85, color: '#FACC15' },
  { id: 2, name: 'Chemical Bonds', subject: 'Science', strength: 40, color: '#EC4899' },
  { id: 3, name: 'Macro Trends', subject: 'Economics', strength: 15, color: '#8B5CF6' },
];

export default function PracticeScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  const ModeCard = ({ mode }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      style={[styles.modeCardWrapper, { shadowColor: mode.color }]}
    >
      <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.modeCard, { borderColor: theme.colors.glassBorder }]}>
        <LinearGradient
          colors={[`${mode.color}20`, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.modeIconContainer, { backgroundColor: `${mode.color}20` }]}>
          <mode.icon color={mode.color} size={24} />
        </View>
        <View style={styles.modeInfo}>
          <Text style={[styles.modeTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
            {mode.title}
          </Text>
          <Text style={[styles.modeDesc, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
            {mode.desc}
          </Text>
        </View>
        <View style={styles.modeXp}>
          <Text style={[styles.modeXpText, { color: mode.color }]}>{mode.xp}</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <GlassHeader />
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Daily Streak Header */}
          <View style={styles.streakSection}>
            <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.streakBlur, { borderColor: theme.colors.glassBorder }]}>
               <View style={styles.streakHeader}>
                  <View style={styles.streakInfo}>
                     <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>Current Streak</Text>
                     <Text style={[styles.streakValue, { color: theme.colors.textPrimary }]}>7 Days</Text>
                  </View>
                  <View style={[styles.flameCircle, { backgroundColor: `${theme.colors.secondary}20` }]}>
                     <Flame size={32} color={theme.colors.secondary} fill={theme.colors.secondary} />
                  </View>
               </View>
               
               <View style={styles.weekContainer}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <View key={i} style={styles.dayItem}>
                       <View style={[
                         styles.dayCircle, 
                         i < 6 ? { backgroundColor: theme.colors.secondary } : { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: theme.colors.glassBorder }
                       ]}>
                          {i < 6 && <Zap size={10} color="#FFF" fill="#FFF" />}
                       </View>
                       <Text style={[styles.dayText, { color: theme.colors.textSecondary }]}>{day}</Text>
                    </View>
                  ))}
               </View>
            </BlurView>
          </View>

          {/* Practice Modes */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Choose Mode</Text>
          </View>

          <View style={styles.modeGrid}>
            {practiceModes.map((mode) => (
              <ModeCard key={mode.id} mode={mode} />
            ))}
          </View>

          {/* Revision Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recommended Revise</Text>
            <TouchableOpacity><Text style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>All Topics</Text></TouchableOpacity>
          </View>

          <View style={styles.revisionList}>
            {revisionTopics.map((topic) => (
              <TouchableOpacity key={topic.id} style={[styles.topicRowWrapper, { shadowColor: topic.color }]}>
                <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.topicRow, { borderColor: theme.colors.glassBorder }]}>
                  <View style={styles.topicMain}>
                    <Text style={[styles.topicName, { color: theme.colors.textPrimary }]}>{topic.name}</Text>
                    <Text style={[styles.topicSub, { color: theme.colors.textSecondary }]}>{topic.subject}</Text>
                  </View>
                  <View style={styles.topicStat}>
                    <Text style={[styles.strengthLabel, { color: theme.colors.textSecondary }]}>Mastery</Text>
                    <View style={styles.strengthBarBg}>
                       <View style={[styles.strengthBarFill, { width: `${topic.strength}%`, backgroundColor: topic.color }]} />
                    </View>
                  </View>
                  <ChevronRight size={18} color={theme.colors.textSecondary} />
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  streakSection: {
    marginBottom: 25,
  },
  streakBlur: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  flameCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  dayItem: {
    alignItems: 'center',
    gap: 8,
  },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modeGrid: {
    gap: 15,
    marginBottom: 30,
  },
  modeCardWrapper: {
    borderRadius: 20,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  modeTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  modeDesc: {
    fontSize: 13,
    opacity: 0.7,
  },
  modeXp: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  modeXpText: {
    fontSize: 12,
    fontWeight: '900',
  },
  revisionList: {
    gap: 12,
  },
  topicRowWrapper: {
    borderRadius: 18,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 15,
  },
  topicMain: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  topicSub: {
    fontSize: 12,
    opacity: 0.6,
  },
  topicStat: {
    width: 80,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  }
});
