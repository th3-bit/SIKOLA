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
  Play, 
  BookOpen, 
  Award, 
  Clock, 
  Star, 
  ChevronRight,
  Zap
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import GlassHeader from '../components/GlassHeader';

const { width } = Dimensions.get('window');

const continueLearning = {
  id: 1,
  title: 'Quantum Physics Basics',
  subject: 'Science',
  progress: 65,
  color: '#EC4899',
  timeLeft: '12 min left',
};

const learningPath = [
  { id: 1, title: 'Introduction to Logic', status: 'completed', duration: '15m' },
  { id: 2, title: 'Elementary Algebra', status: 'in-progress', duration: '25m' },
  { id: 3, title: 'Quadratic Equations', status: 'locked', duration: '30m' },
  { id: 4, title: 'Complex Numbers', status: 'locked', duration: '45m' },
];

export default function LearnScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  const PathStep = ({ step, index, isLast }) => {
    const isCompleted = step.status === 'completed';
    const isInProgress = step.status === 'in-progress';
    const isLocked = step.status === 'locked';

    return (
      <View style={styles.pathItemContainer}>
        {/* Connection Line */}
        {!isLast && (
          <View style={[
            styles.connectionLine, 
            { backgroundColor: isCompleted ? theme.colors.secondary : 'rgba(255,255,255,0.1)' }
          ]} />
        )}
        
        <View style={styles.pathContentRow}>
          <View style={[
            styles.stepIconContainer, 
            { 
              backgroundColor: isCompleted ? theme.colors.secondary : (isInProgress ? 'transparent' : 'rgba(255,255,255,0.05)'),
              borderColor: isInProgress ? theme.colors.secondary : 'transparent',
              borderWidth: isInProgress ? 2 : 0
            }
          ]}>
            {isCompleted ? (
              <Star size={16} color="#FFF" fill="#FFF" />
            ) : (
              <Text style={[styles.stepNumber, { color: isInProgress ? theme.colors.secondary : theme.colors.textSecondary }]}>
                {index + 1}
              </Text>
            )}
          </View>

          <TouchableOpacity 
            activeOpacity={0.8}
            disabled={isLocked}
            style={[
              styles.stepCardWrapper, 
              { opacity: isLocked ? 0.5 : 1 }
            ]}
          >
            <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.stepCard, { borderColor: theme.colors.glassBorder }]}>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {step.title}
                </Text>
                <View style={styles.stepMeta}>
                  <Clock size={12} color={theme.colors.textSecondary} />
                  <Text style={[styles.stepMetaText, { color: theme.colors.textSecondary }]}>{step.duration}</Text>
                </View>
              </View>
              {!isLocked && <ChevronRight size={20} color={theme.colors.textSecondary} />}
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          {/* Hero Overall Stats */}
          <View style={styles.statsOverview}>
             <BlurView intensity={25} tint={isDark ? "dark" : "light"} style={[styles.statsBlur, { borderColor: theme.colors.glassBorder }]}>
                <View style={styles.statsHeader}>
                   <View>
                      <Text style={[styles.statsWelcome, { color: theme.colors.textSecondary }]}>Overall Mastery</Text>
                      <Text style={[styles.statsLevel, { color: theme.colors.textPrimary }]}>Level 12 Learner</Text>
                   </View>
                   <View style={[styles.xpBadge, { backgroundColor: theme.colors.secondary }]}>
                      <Zap size={14} color="#FFF" fill="#FFF" />
                      <Text style={styles.xpText}>2,450 XP</Text>
                   </View>
                </View>
                
                <View style={styles.progressSection}>
                   <View style={styles.progressBarBg}>
                      <LinearGradient
                        colors={['#8B5CF6', '#EC4899']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: '75%' }]}
                      />
                   </View>
                   <Text style={[styles.progressRatio, { color: theme.colors.textSecondary }]}>750/1000 to next level</Text>
                </View>
             </BlurView>
          </View>

          {/* Continue Learning Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Keep Going</Text>
            <TouchableOpacity><Text style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>See Favorites</Text></TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.9} style={[styles.continueCardWrapper, { shadowColor: continueLearning.color }]}>
            <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.continueCard, { borderColor: theme.colors.glassBorder }]}>
              <LinearGradient
                colors={[`${continueLearning.color}40`, 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.continueCardLeft}>
                <View style={[styles.subBadge, { backgroundColor: `${continueLearning.color}20` }]}>
                  <Text style={[styles.subBadgeText, { color: continueLearning.color }]}>{continueLearning.subject}</Text>
                </View>
                <Text style={[styles.continueTitle, { color: theme.colors.textPrimary }]}>{continueLearning.title}</Text>
                <View style={styles.timeLeftRow}>
                   <Clock size={14} color={theme.colors.textSecondary} />
                   <Text style={[styles.timeLeftText, { color: theme.colors.textSecondary }]}>{continueLearning.timeLeft}</Text>
                </View>
              </View>
              
              <View style={styles.continueCardRight}>
                <View style={styles.playIconContainer}>
                  <Play size={24} color="#FFF" fill="#FFF" />
                </View>
              </View>

              <View style={styles.cardProgressLine}>
                <View style={[styles.cardProgressFill, { width: `${continueLearning.progress}%`, backgroundColor: continueLearning.color }]} />
              </View>
            </BlurView>
          </TouchableOpacity>

          {/* Learning Path */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Mathematics Path</Text>
            <View style={[styles.smallBadge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>4 Lessons</Text>
            </View>
          </View>

          <View style={styles.pathGrid}>
            {learningPath.map((step, index) => (
              <PathStep 
                key={step.id} 
                step={step} 
                index={index} 
                isLast={index === learningPath.length - 1} 
              />
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
  statsOverview: {
    marginBottom: 25,
  },
  statsBlur: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statsWelcome: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsLevel: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  xpText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },
  progressSection: {
    marginTop: 5,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressRatio: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
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
  continueCardWrapper: {
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  continueCard: {
    flexDirection: 'row',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    height: 140,
  },
  continueCardLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  subBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  subBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  continueTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  timeLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeLeftText: {
    fontSize: 13,
    fontWeight: '600',
  },
  continueCardRight: {
     justifyContent: 'center',
     alignItems: 'center',
  },
  playIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardProgressLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardProgressFill: {
    height: '100%',
  },
  pathGrid: {
    paddingLeft: 10,
  },
  pathItemContainer: {
    position: 'relative',
    paddingBottom: 25,
  },
  connectionLine: {
    position: 'absolute',
    left: 17,
    top: 34,
    width: 2,
    height: '100%',
    opacity: 0.3,
  },
  pathContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepCardWrapper: {
    flex: 1,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  smallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  }
});
