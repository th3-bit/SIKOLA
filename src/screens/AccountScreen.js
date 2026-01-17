import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  Image 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  User, 
  Settings, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  ChevronRight, 
  Award, 
  BookOpen, 
  Clock,
  PenTool,
  Flame,
  Zap,
  Layout,
  Star,
  Target,
  Activity,
  Calendar,
  CheckCircle2
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import ThemeSwitch from '../components/ThemeSwitch';

const { width } = Dimensions.get('window');

export default function AccountScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { userStats, weeklyActivity, sessions, isLoading } = useProgress();
  
  const StatCard = ({ icon: Icon, label, value, color = theme.colors.secondary, shadowColor = color }) => (
    <View style={[styles.statCardWrapper, { shadowColor: shadowColor }]}>
      <BlurView intensity={isDark ? 20 : 30} tint={isDark ? "dark" : "light"} style={[styles.statCard, { borderColor: theme.colors.glassBorder }]}>
        <LinearGradient
          colors={isDark 
            ? [`${color}30`, `${color}10`, 'transparent'] 
            : [`${color}20`, `${color}10`, `${color}05`]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.statIconContainer, { backgroundColor: `${color}${isDark ? '20' : '30'}` }]}>
          <Icon color={color} size={18} />
        </View>
        <Text style={[styles.statValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{label}</Text>
        <View style={[styles.liquidGlow, { backgroundColor: color, opacity: isDark ? 0.15 : 0.2 }]} />
      </BlurView>
    </View>
  );

  const StreakCard = () => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const days = dayLabels.map((label, index) => ({
      label,
      active: weeklyActivity[index] || false
    }));
    
    const streak = userStats?.current_streak || 0;

    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.streakCardWrapper}>
        <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[styles.streakCard, { borderColor: theme.colors.glassBorder }]}>
          <LinearGradient
            colors={isDark ? ['rgba(255, 69, 58, 0.15)', 'transparent'] : ['rgba(255, 69, 58, 0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.streakContent}>
            <View style={styles.streakInfo}>
              <View style={styles.streakIconCircle}>
                <Flame color="#FF453A" size={32} fill="#FF453A" />
              </View>
              <View style={styles.streakTextContainer}>
                <Text style={[styles.streakTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{streak} Day Streak!</Text>
                <Text style={[styles.streakSub, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{streak < 7 ? `Keep studying to reach 7 days!` : 'You are on fire! Keep it up!'}</Text>
              </View>
            </View>
            <View style={styles.streakBadge}>
              <Zap color="#FF453A" size={16} fill="#FF453A" />
              <Text style={[styles.streakValue, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>+50 XP</Text>
            </View>
          </View>
          
          {/* Progress Days Chips */}
          <View style={styles.streakDaysContainer}>
            {days.map((day, index) => (
              <View 
                key={index} 
                style={[
                  styles.dayChip,
                  { 
                    backgroundColor: day.active ? "#FF453A" : (isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                    borderColor: day.active ? "#FF453A" : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                  }
                ]}
              >
                <Zap 
                  size={14} 
                  color={day.active ? "#FFFFFF" : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')} 
                  fill={day.active ? "#FFFFFF" : (isDark ? 'rgba(255,255,255,0.1)' : 'transparent')} 
                />
                <Text style={[
                  styles.dayChipText, 
                  { 
                    color: day.active ? "#FFFFFF" : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)'),
                    fontFamily: theme.typography.fontFamily 
                  }
                ]}>
                  {day.label}
                </Text>
              </View>
            ))}
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  const MenuOption = ({ icon: Icon, label, onPress, isLast = false, color = theme.colors.textPrimary }) => (
    <TouchableOpacity 
      style={[styles.menuItem, isLast && styles.noBorder, { borderBottomColor: theme.colors.glassBorder }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconWrapper}>
            <Icon color={color === theme.colors.textPrimary ? theme.colors.textSecondary : color} size={20} />
        </View>
        <Text style={[styles.menuLabel, { color, fontFamily: theme.typography.fontFamily }]}>{label}</Text>
      </View>
      <ChevronRight color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} size={20} />
    </TouchableOpacity>
  );

  // Mock Data for Achievements and Activity
  const achievements = [
    { id: 1, title: 'Early Bird', icon: Zap, color: '#FACC15', unlocked: true, desc: 'Completed 5 lessons before 9AM' },
    { id: 2, title: 'Quiz Master', icon: Star, color: '#FF453A', unlocked: true, desc: 'Scored 100% on 3 quizzes' },
    { id: 3, title: 'Scholar', icon: BookOpen, color: '#3B82F6', unlocked: false, desc: 'Study for 10 hours total' },
    { id: 4, title: 'Sharpshooter', icon: Target, color: '#10B981', unlocked: false, desc: 'Maintain 7 day streak' },
  ];

  const activities = [
    { id: 1, title: 'Completed "Accounting Basics"', time: '2 hours ago', icon: CheckCircle2, color: '#10B981' },
    { id: 2, title: 'Scored 85% in Biology Quiz', time: 'Yesterday', icon: Award, color: '#FACC15' },
    { id: 3, title: 'Started "Business Management"', time: '2 days ago', icon: BookOpen, color: '#3B82F6' },
  ];

  const AchievementsSection = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Achievements</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsScroll}>
        {achievements.map((item) => (
          <View key={item.id} style={[styles.achievementCard, { opacity: item.unlocked ? 1 : 0.6 }]}>
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.achievementContent, { borderColor: theme.colors.glassBorder, backgroundColor: item.unlocked ? theme.colors.glass : 'rgba(0,0,0,0.02)' }]}>
              <View style={[styles.achievementIcon, { backgroundColor: item.unlocked ? item.color + '20' : '#88888820' }]}>
                <item.icon size={24} color={item.unlocked ? item.color : '#888'} />
              </View>
              <Text style={[styles.achievementTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.achievementDesc, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]} numberOfLines={2}>{item.desc}</Text>
            </BlurView>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const RecentActivitySection = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Recent Activity</Text>
      <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.activityList, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
        {activities.map((item, index) => (
          <View key={item.id} style={[styles.activityItem, index === activities.length - 1 && styles.noBorder, { borderBottomColor: theme.colors.glassBorder }]}>
            <View style={[styles.activityIconBox, { backgroundColor: item.color + '15' }]}>
              <item.icon size={16} color={item.color} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={[styles.activityTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{item.title}</Text>
              <Text style={[styles.activityTime, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{item.time}</Text>
            </View>
          </View>
        ))}
      </BlurView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Header Branding & Theme Switch */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Sikola+</Text>
            <ThemeSwitch />
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarGlow, { backgroundColor: theme.colors.secondary }]} />
              <View style={[styles.avatarFrame, { backgroundColor: theme.colors.glass, borderColor: theme.colors.secondary }]}>
                <User color={theme.colors.secondary} size={40} />
              </View>
              <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary }]}>
                 <PenTool color={theme.colors.textContrast} size={12} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.userName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Sikola Student</Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>student@sikolaplus.com</Text>
            
            <TouchableOpacity style={[styles.editProfileBtn, { backgroundColor: isDark ? 'rgba(240, 236, 29, 0.1)' : 'rgba(37, 99, 235, 0.1)', borderColor: isDark ? 'rgba(240, 236, 29, 0.2)' : 'rgba(37, 99, 235, 0.2)' }]}>
               <Text style={[styles.editProfileText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Edit Profile</Text>
            </TouchableOpacity>
            
            {/* Subscription Status */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Subscription')}
              style={[styles.subscriptionCard, { backgroundColor: isDark ? 'rgba(250, 204, 21, 0.15)' : 'rgba(250, 204, 21, 0.2)', borderColor: '#FACC15' }]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(250, 204, 21, 0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.subscriptionContent}>
                <View style={styles.subscriptionLeft}>
                  <View style={[styles.crownIcon, { backgroundColor: 'rgba(250, 204, 21, 0.3)' }]}>
                    <Award color="#FACC15" size={22} />
                  </View>
                  <View>
                    <Text style={[styles.subscriptionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                      Free Trial Active
                    </Text>
                    <Text style={[styles.subscriptionSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                      2 days remaining • Tap to upgrade
                    </Text>
                  </View>
                </View>
                <ChevronRight color="#FACC15" size={22} />
              </View>
            </TouchableOpacity>
          </View>

           {/* Stats Row */}
           <View style={styles.statsRow}>
             <StatCard icon={BookOpen} label="Lessons" value={userStats?.total_lessons_completed?.toString() || "0"} color="#22C55E" />
             <StatCard icon={Award} label="Points" value={userStats?.total_xp?.toString() || "0"} color="#FACC15" />
             <StatCard icon={Clock} label="Hours" value={Math.floor((sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0) / 60).toString()} color="#3B82F6" />
           </View>

           {/* Streak Section */}
           <View style={styles.menuSection}>
             <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Current Progress</Text>
             <StreakCard />
           </View>

           {/* Achievements Section */}
           <AchievementsSection />

           {/* Recent Activity Section */}
           <RecentActivitySection />

          {/* Menu Sections */}
          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Account Settings</Text>
            <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.menuContainer, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
              <MenuOption icon={User} label="Personal Information" onPress={() => navigation.navigate('PersonalInfo')} />
              <MenuOption icon={Bell} label="Notifications" onPress={() => {}} />
              <MenuOption icon={ShieldCheck} label="Security & Privacy" onPress={() => {}} isLast={true} />
            </BlurView>
          </View>

          <View style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>More</Text>
            <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.menuContainer, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
              <MenuOption icon={Settings} label="Preferences" onPress={() => {}} />
              <MenuOption 
                icon={LogOut} 
                label="Logout" 
                onPress={() => navigation.replace('Login')} 
                color="#EF4444" 
                isLast={true} 
              />
            </BlurView>
          </View>


          <Text style={[styles.versionText, { color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', fontFamily: theme.typography.fontFamily }]}>Version 1.0.0 (Sikola+)</Text>
          
          {/* Extra padding for bottom tab bar */}
          <View style={{ height: 100 }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 35,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.1,
  },
  avatarFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 15,
  },
  editProfileBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
  },
   statCardWrapper: {
    width: (width - 60) / 3,
    height: 110,
    borderRadius: 24,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  statCard: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  liquidGlow: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    opacity: 0.8,
  },
  streakCardWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#FF453A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  streakCard: {
    flex: 1,
    padding: 20,
    borderWidth: 1,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  streakTextContainer: {
    justifyContent: 'center',
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  streakSub: {
    fontSize: 12,
    marginTop: 2,
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  streakValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  streakDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    alignItems: 'center',
    marginTop: 5,
  },
  dayChip: {
    width: (width - 100) / 7,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '800',
  },
  menuSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginLeft: 5,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconWrapper: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  subscriptionCard: {
    width: '100%',
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  subscriptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subscriptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crownIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  subscriptionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 10,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  achievementsScroll: {
    paddingRight: 20,
    gap: 12,
  },
  achievementCard: {
    width: 140,
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
  },
  achievementContent: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.7,
  },
  activityList: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  activityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    opacity: 0.6,
  },
});
