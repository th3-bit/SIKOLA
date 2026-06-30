import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  Image,
  Alert,
  Linking,
  Clipboard,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { formatRelativeTime } from '../utils/DateTimeUtils';
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
  CheckCircle2,
  MessageCircle,
  Shield,
  FileText
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import ThemeSwitch from '../components/ThemeSwitch';
import AchievementDetailModal from '../components/AchievementDetailModal';
import TermsModal from '../components/TermsModal';
import WhatsAppIcon from '../components/WhatsAppIcon';
import StatusModal from '../components/StatusModal';
import Constants from 'expo-constants';
import { version as packageVersion } from '../../package.json';

const { width } = Dimensions.get('window');

// Resolve version info once at module level
const APP_VERSION   = Constants.expoConfig?.version || packageVersion || '1.0.0';
const BUILD_NUMBER  = Platform.OS === 'android'
  ? (Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.extra?.buildNumber ?? '')
  : (Constants.expoConfig?.ios?.buildNumber ?? '');
const VERSION_STRING = BUILD_NUMBER
  ? `v${APP_VERSION} (build ${BUILD_NUMBER})`
  : `v${APP_VERSION}`;

export default function AccountScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { theme, isDark } = useTheme();
  const { userStats, levelInfo, weeklyActivity, sessions, userActivities, isLoading, userProfile, subscriptionInfo, achievements } = useProgress();
  const { signOut } = useAuth();
  const [selectedAchievement, setSelectedAchievement] = React.useState(null);
  const [achievementModalVisible, setAchievementModalVisible] = React.useState(false);
  const [termsModalVisible, setTermsModalVisible] = React.useState(false);
  const [termsModalType, setTermsModalType] = React.useState('terms');
  const [showCopyModal, setShowCopyModal] = React.useState(false);
  const currentRank = levelInfo?.current;
  
  const handleWhatsAppPress = () => {
    const phoneNumber = '250728439394'; // Support number from your contact info
    const message = 'Hello Sikola+ Support, I need help with...';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to web link if WhatsApp app is not installed
        Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
      }
    });
  };

  const scaleValue = useSharedValue(1);

  React.useEffect(() => {
    scaleValue.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(1, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    shadowOpacity: withTiming(scaleValue.value === 1.1 ? 0.4 : 0.2),
  }));
  

  const MenuOption = ({ icon: Icon, label, onPress, isLast = false, color = theme.colors.textPrimary }) => (
    <TouchableOpacity 
      style={[styles.menuItem, isLast && styles.noBorder, { borderBottomColor: theme.colors.glassBorder }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconWrapper}>
            <Icon color={color === theme.colors.textPrimary ? theme.colors.textSecondary : color} size={scale(20)} />
        </View>
        <Text style={[styles.menuLabel, { color, fontFamily: theme.typography.fontFamily }]}>{label}</Text>
      </View>
      <ChevronRight color={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} size={scale(20)} />
    </TouchableOpacity>
  );

  const AchievementsSection = () => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Achievements</Text>
        <TouchableOpacity><Text style={{ color: theme.colors.secondary, fontWeight: 'bold', fontFamily: theme.typography.fontFamily }}>View All</Text></TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.achievementsScroll}
        style={styles.achievementsScrollView}
      >
        {achievements.map((badge) => {
          const progress = Math.min((badge.current || 0) / (badge.total || 1), 1);
          return (
            <TouchableOpacity 
              key={badge.id} 
              activeOpacity={0.7}
              onPress={() => {
                setSelectedAchievement(badge);
                setAchievementModalVisible(true);
              }}
              style={[styles.badgeCard, { opacity: badge.unlocked ? 1 : 0.8 }]}
            >
              <View style={[styles.badgeInner, { 
                  borderColor: `${badge.color}50`, 
                  backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)' 
              }]}>
                  <LinearGradient
                    colors={[`${badge.color}15`, 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={[styles.liquidGlow, { backgroundColor: badge.color, opacity: isDark ? 0.15 : 0.08 }]} />
                  
                  <View style={[styles.badgeIconBg, { 
                    backgroundColor: badge.unlocked ? `${badge.color}20` : 'rgba(255,255,255,0.15)',
                    borderColor: badge.unlocked ? badge.color : `${badge.color}30`,
                    borderWidth: 1
                  }]}>
                    {React.createElement(badge.icon, { 
                      size: moderateScale(20), 
                      color: badge.unlocked ? badge.color : theme.colors.textSecondary,
                      strokeWidth: 2.5
                    })}
                  </View>
                  
                  <Text style={[styles.badgeTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]} numberOfLines={1}>
                    {badge.title}
                  </Text>
  
                  {!badge.unlocked ? (
                    <View style={styles.badgeProgressContainer}>
                        <View style={[styles.badgeProgressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
                          <View style={[styles.badgeProgressBarFill, { width: `${progress * 100}%`, backgroundColor: badge.color }]} />
                        </View>
                        <Text style={[styles.badgeProgressText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, fontSize: moderateScale(10), marginTop: verticalScale(4) }]}>
                          {badge.current}/{badge.total}
                        </Text>
                    </View>
                  ) : (
                    <View style={[styles.unlockedTag, { backgroundColor: `${badge.color}20`, paddingHorizontal: scale(8), paddingVertical: verticalScale(2), borderRadius: scale(6) }]}>
                        <Text style={[styles.unlockedTagText, { color: badge.color, fontFamily: theme.typography.fontFamily, fontSize: moderateScale(9), fontWeight: '800' }]}>UNLOCKED</Text>
                    </View>
                  )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const RecentActivitySection = () => (
    <View style={styles.sectionContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Recent Activity</Text>
      <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.activityList, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
        {userActivities && userActivities.length > 0 ? (
          userActivities.slice(0, 5).map((item, index) => {
            // Map types to icons
            let ActivityIcon = CheckCircle2;
            let iconColor = '#10B981'; // Green from screenshot
            if (item.type === 'start') {
              ActivityIcon = BookOpen;
              iconColor = '#3B82F6';
            }

            return (
              <View key={item.id} style={[styles.activityItem, (index === userActivities.slice(0, 5).length - 1) && styles.noBorder, { borderBottomColor: theme.colors.glassBorder }]}>
                <View style={[styles.activityIconBox, { backgroundColor: iconColor + '15' }]}>
                  <ActivityIcon size={scale(18)} color={iconColor} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={[styles.activityTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    {formatRelativeTime(item.time)}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyActivity}>
            <Activity color={theme.colors.textSecondary} size={moderateScale(24)} style={{ opacity: 0.3, marginBottom: verticalScale(8) }} />
            <Text style={[styles.emptyActivityText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
              No recent activity yet. Start a lesson to see it here!
            </Text>
          </View>
        )}
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
            <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
              <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Sikola+</Text>
            </TouchableOpacity>
            <ThemeSwitch />
          </View>

          {isLargeScreen ? (
            <View style={styles.largeScreenContainer}>
              <BlurView 
                intensity={25} 
                tint={isDark ? "dark" : "light"} 
                style={[styles.leftColumn, styles.glassPanel, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
              >
                {/* Profile Section */}
                <View style={[styles.profileSection, { marginBottom: verticalScale(15) }]}>
                  <View style={styles.avatarContainer}>
                    <View style={[styles.avatarGlow, { backgroundColor: theme.colors.secondary }]} />
                    <View style={[styles.avatarFrame, { backgroundColor: theme.colors.glass, borderColor: theme.colors.secondary }]}>
                      <User color={theme.colors.secondary} size={scale(40)} />
                    </View>
                    <TouchableOpacity 
                      style={[styles.editAvatarBtn, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary }]}
                      onPress={() => navigation.navigate('PersonalInfo')}
                    >
                       <PenTool color={theme.colors.textContrast} size={scale(12)} />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={[styles.userName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{userProfile.name}</Text>
                  
                  <Text style={[styles.userEmail, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, marginTop: verticalScale(4) }]}>{userProfile.email || 'Loading email...'}</Text>
                  
                  <TouchableOpacity 
                    style={[styles.editProfileBtn, { backgroundColor: isDark ? 'rgba(240, 236, 29, 0.1)' : 'rgba(37, 99, 235, 0.1)', borderColor: isDark ? 'rgba(240, 236, 29, 0.2)' : 'rgba(37, 99, 235, 0.2)' }]}
                    onPress={() => navigation.navigate('PersonalInfo')}
                  >
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
                          <Award color="#FACC15" size={scale(22)} />
                        </View>
                        <View>
                          <Text style={[styles.subscriptionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                            {subscriptionInfo.label}
                          </Text>
                          <Text style={[styles.subscriptionSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                            {subscriptionInfo.subLabel}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight color="#FACC15" size={scale(22)} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Menu Sections */}
                <View style={styles.menuSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Account Settings</Text>
                  <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.menuContainer, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
                    <MenuOption icon={User} label="Personal Information" onPress={() => navigation.navigate('PersonalInfo')} />
                    <MenuOption icon={Bell} label="Notifications" onPress={() => navigation.navigate('NotificationTest')} />
                    <MenuOption 
                      icon={WhatsAppIcon} 
                      label="Help & Support" 
                      color="#25D366"
                      onPress={() => navigation.navigate('HelpSupport')} 
                      isLast={true} 
                    />
                  </BlurView>
                </View>

                <View style={styles.menuSection}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>More</Text>
                  <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.menuContainer, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
                    <MenuOption icon={Settings} label="Preferences" onPress={() => navigation.navigate('Preferences')} />
                    <MenuOption 
                      icon={Shield} 
                      label="Privacy Policy" 
                      onPress={() => {
                        setTermsModalType('privacy');
                        setTermsModalVisible(true);
                      }} 
                    />
                    <MenuOption 
                      icon={FileText} 
                      label="Terms of Service" 
                      onPress={() => {
                        setTermsModalType('terms');
                        setTermsModalVisible(true);
                      }} 
                    />
                    <MenuOption 
                      icon={LogOut} 
                      label="Logout" 
                      onPress={signOut} 
                      color="#EF4444" 
                      isLast={true} 
                    />
                  </BlurView>
                </View>

                {/* App Version — long press to copy for bug reports */}
                <TouchableOpacity
                  activeOpacity={0.6}
                  onLongPress={() => {
                    Clipboard.setString(VERSION_STRING);
                    setShowCopyModal(true);
                  }}
                  style={[styles.versionBlock, { marginTop: 0 }]}
                >
                  <Text style={[styles.versionLabel, { color: theme.colors.textSecondary }]}>
                    Sikola+
                  </Text>
                  <Text style={[styles.versionValue, { color: theme.colors.textSecondary }]}>
                    {VERSION_STRING}
                  </Text>
                  <Text style={[styles.versionHint, { color: theme.colors.textSecondary }]}>
                    Hold to copy for bug reports
                  </Text>
                </TouchableOpacity>
              </BlurView>

              <BlurView 
                intensity={25} 
                tint={isDark ? "dark" : "light"} 
                style={[styles.rightColumn, styles.glassPanel, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
              >
                {/* Achievements Section */}
                <AchievementsSection />

                {/* Recent Activity Section */}
                <RecentActivitySection />
              </BlurView>
            </View>
          ) : (
            <View>
              {/* Profile Section */}
              <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                  <View style={[styles.avatarGlow, { backgroundColor: theme.colors.secondary }]} />
                  <View style={[styles.avatarFrame, { backgroundColor: theme.colors.glass, borderColor: theme.colors.secondary }]}>
                    <User color={theme.colors.secondary} size={scale(40)} />
                  </View>
                  <TouchableOpacity 
                    style={[styles.editAvatarBtn, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.primary }]}
                    onPress={() => navigation.navigate('PersonalInfo')}
                  >
                     <PenTool color={theme.colors.textContrast} size={scale(12)} />
                  </TouchableOpacity>
                </View>
                
                <Text style={[styles.userName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{userProfile.name}</Text>
                
                <Text style={[styles.userEmail, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, marginTop: verticalScale(4) }]}>{userProfile.email || 'Loading email...'}</Text>
                
                <TouchableOpacity 
                  style={[styles.editProfileBtn, { backgroundColor: isDark ? 'rgba(240, 236, 29, 0.1)' : 'rgba(37, 99, 235, 0.1)', borderColor: isDark ? 'rgba(240, 236, 29, 0.2)' : 'rgba(37, 99, 235, 0.2)' }]}
                  onPress={() => navigation.navigate('PersonalInfo')}
                >
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
                        <Award color="#FACC15" size={scale(22)} />
                      </View>
                      <View>
                        <Text style={[styles.subscriptionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                          {subscriptionInfo.label}
                        </Text>
                        <Text style={[styles.subscriptionSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                          {subscriptionInfo.subLabel}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight color="#FACC15" size={scale(22)} />
                  </View>
                </TouchableOpacity>
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
                  <MenuOption icon={Bell} label="Notifications" onPress={() => navigation.navigate('NotificationTest')} />
                  <MenuOption 
                    icon={WhatsAppIcon} 
                    label="Help & Support" 
                    color="#25D366"
                    onPress={() => navigation.navigate('HelpSupport')} 
                    isLast={true} 
                  />
                </BlurView>
              </View>

              <View style={styles.menuSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>More</Text>
                <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.menuContainer, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
                  <MenuOption icon={Settings} label="Preferences" onPress={() => navigation.navigate('Preferences')} />
                  <MenuOption 
                    icon={Shield} 
                    label="Privacy Policy" 
                    onPress={() => {
                      setTermsModalType('privacy');
                      setTermsModalVisible(true);
                    }} 
                  />
                  <MenuOption 
                    icon={FileText} 
                    label="Terms of Service" 
                    onPress={() => {
                      setTermsModalType('terms');
                      setTermsModalVisible(true);
                    }} 
                  />
                  <MenuOption 
                    icon={LogOut} 
                    label="Logout" 
                    onPress={signOut} 
                    color="#EF4444" 
                    isLast={true} 
                  />
                </BlurView>
              </View>


              {/* App Version — long press to copy for bug reports */}
              <TouchableOpacity
                activeOpacity={0.6}
                onLongPress={() => {
                  Clipboard.setString(VERSION_STRING);
                  setShowCopyModal(true);
                }}
                style={styles.versionBlock}
              >
                <Text style={[styles.versionLabel, { color: theme.colors.textSecondary }]}>
                  Sikola+
                </Text>
                <Text style={[styles.versionValue, { color: theme.colors.textSecondary }]}>
                  {VERSION_STRING}
                </Text>
                <Text style={[styles.versionHint, { color: theme.colors.textSecondary }]}>
                  Hold to copy for bug reports
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Extra padding for bottom tab bar */}
          <View style={{ height: verticalScale(140) }} />
          
            <AchievementDetailModal
              visible={achievementModalVisible}
              onClose={() => setAchievementModalVisible(false)}
              achievement={selectedAchievement}
            />
            <TermsModal 
              visible={termsModalVisible}
              onClose={() => setTermsModalVisible(false)}
              type={termsModalType}
            />

            <StatusModal
              visible={showCopyModal}
              onClose={() => setShowCopyModal(false)}
              type="success"
              title="Version Copied"
              message={`"${VERSION_STRING}" has been copied to your clipboard. Paste it when reporting a bug or contacting support.`}
              actionText="Got it"
            />
        </ScrollView>
      </SafeAreaView>

      {/* Floating WhatsApp Button with Pulse Animation */}
      <Animated.View style={[styles.floatingWhatsAppContainer, animatedStyle]}>
        <TouchableOpacity 
          style={[styles.floatingWhatsApp, { backgroundColor: '#25D366' }]}
          onPress={handleWhatsAppPress}
          activeOpacity={0.8}
        >
          <WhatsAppIcon size={scale(30)} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>
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
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: '900',
    letterSpacing: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: verticalScale(25),
  },
  avatarContainer: {
    width: scale(100),
    height: scale(100),
    marginBottom: verticalScale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGlow: {
    position: 'absolute',
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    opacity: 0.1,
  },
  avatarFrame: {
    width: scale(90),
    height: scale(90),
    borderRadius: scale(45),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: verticalScale(5),
    right: scale(5),
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(3),
  },
  userName: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  userEmail: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(15),
  },
  editProfileBtn: {
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(8),
    borderRadius: scale(20),
    borderWidth: scale(1),
  },
  editProfileText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(20),
  },
   statCardWrapper: {
    width: (width - scale(60)) / 3,
    height: verticalScale(110),
    borderRadius: scale(24),
    overflow: 'visible',
  },
  statCard: {
    flex: 1,
    paddingVertical: verticalScale(15),
    alignItems: 'center',
    borderWidth: scale(1),
    paddingHorizontal: scale(10),
    borderRadius: scale(24),
    overflow: 'hidden',
  },
  liquidGlow: {
    position: 'absolute',
    bottom: verticalScale(-15),
    right: scale(-15),
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
  },
  statIconContainer: {
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  statValue: {
    fontSize: moderateScale(20),
    fontWeight: '800',
  },
  statLabel: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
    fontWeight: '600',
    opacity: 0.8,
  },
  streakCardWrapper: {
    width: '100%',
    height: verticalScale(160),
    borderRadius: scale(28),
    overflow: 'hidden',
    marginTop: verticalScale(10),
  },
  streakCard: {
    flex: 1,
    padding: scale(20),
    borderWidth: scale(1),
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIconCircle: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  streakTextContainer: {
    justifyContent: 'center',
  },
  streakTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  streakSub: {
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  streakBadge: {
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
  },
  streakValue: {
    fontSize: moderateScale(12),
    fontWeight: '700',
  },
  streakDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    alignItems: 'center',
    marginTop: verticalScale(5),
  },
  dayChip: {
    width: (width - scale(100)) / 7,
    height: verticalScale(55),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(1),
    gap: verticalScale(4),
  },
  dayChipText: {
    fontSize: moderateScale(14),
    fontWeight: '800',
  },
  menuSection: {
    marginBottom: verticalScale(25),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginBottom: verticalScale(10),
    marginLeft: scale(5),
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuContainer: {
    borderRadius: scale(24),
    overflow: 'hidden',
    borderWidth: scale(1),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(20),
    borderBottomWidth: scale(1),
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconWrapper: {
    width: scale(32),
    alignItems: 'center',
    marginRight: scale(12),
  },
  menuLabel: {
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  subscriptionCard: {
    width: '100%',
    marginTop: verticalScale(16),
    padding: scale(16),
    borderRadius: scale(20),
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
    gap: scale(12),
  },
  crownIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  subscriptionSubtitle: {
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  versionBlock: {
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    marginTop: verticalScale(8),
    gap: verticalScale(3),
  },
  versionLabel: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    letterSpacing: 0.5,
    opacity: 0.5,
  },
  versionValue: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    opacity: 0.5,
  },
  versionHint: {
    fontSize: moderateScale(10),
    opacity: 0.3,
    marginTop: verticalScale(2),
  },
  sectionContainer: {
    marginBottom: verticalScale(25),
  },
  achievementsScrollView: {
    marginHorizontal: -scale(20),
  },
  achievementsScroll: {
    paddingLeft: scale(20),
    paddingRight: scale(20),
    gap: scale(15),
  },
  badgeCard: {
    width: scale(105),
    marginBottom: verticalScale(6),
  },
  badgeInner: {
    alignItems: 'center',
    padding: scale(10),
    borderRadius: moderateScale(16),
    borderWidth: scale(2),
    overflow: 'hidden',
    height: verticalScale(125),
    justifyContent: 'center',
  },
  badgeIconBg: {
    width: scale(38),
    height: scale(38),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(8),
  },
  badgeTitle: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  badgeProgressBarBg: {
    width: '100%',
    height: verticalScale(6),
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: scale(3),
    overflow: 'hidden',
  },
  badgeProgressBarFill: {
    height: '100%',
    borderRadius: scale(3),
  },
  badgeProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(15),
  },
  activityList: {
    borderRadius: scale(24),
    borderWidth: scale(1),
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
    borderBottomWidth: scale(1),
  },
  activityIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    marginBottom: verticalScale(2),
  },
  activityTime: {
    fontSize: moderateScale(13),
    opacity: 0.5,
  },
  emptyActivity: {
    padding: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivityText: {
    fontSize: moderateScale(14),
    opacity: 0.6,
    textAlign: 'center',
  },
  floatingWhatsAppContainer: {
    position: 'absolute',
    bottom: verticalScale(95),
    right: '4.5%',
    zIndex: 999,
  },
  floatingWhatsApp: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(6) },
    shadowOpacity: 0.3,
    shadowRadius: scale(10),
    elevation: 10,
  },
  largeScreenContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(30),
    marginTop: verticalScale(10),
    width: '100%',
  },
  leftColumn: {
    width: scale(300),
    maxWidth: '40%',
  },
  rightColumn: {
    flex: 1,
    maxWidth: scale(600),
  },
  glassPanel: {
    borderRadius: scale(30),
    borderWidth: scale(1),
    paddingVertical: verticalScale(25),
    paddingHorizontal: scale(20),
    overflow: 'hidden',
  },
});
