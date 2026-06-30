import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity, Text, Platform, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Library, GraduationCap, PenTool, User, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import SubjectsScreen from '../screens/SubjectsScreen';
import LearnScreen from '../screens/LearnScreen';
import PracticeScreen from '../screens/PracticeScreen';
import AccountScreen from '../screens/AccountScreen';
import GlassHeader from '../components/GlassHeader';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';
import { CopilotStep, walkthroughable, useCopilot } from 'react-native-copilot';

const WalkthroughableTouchableOpacity = walkthroughable(TouchableOpacity);
const WalkthroughableView = walkthroughable(View);
const Tab = createBottomTabNavigator();

const PlaceholderScreen = ({ name }) => {
  const { theme, isDark } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <GlassHeader showSearch={name === 'Course'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ opacity: 0.15 }}>
            {name === 'Profile' && <User color={theme.colors.secondary} size={80} />}
          </View>
          <Text style={{ color: theme.colors.textSecondary, marginTop: 20, fontSize: 18, fontWeight: '600' }}>
            {name} Section
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ─── TAB ICON MAP ─────────────────────────────────────────────────────────────
const TAB_ICONS = {
  Home:    (color, size) => <Home color={color} size={size} />,
  Course:  (color, size) => <Library color={color} size={size} />,
  Learn:   (color, size) => <GraduationCap color={color} size={size} />,
  Test:    (color, size) => <PenTool color={color} size={size} />,
  Profile: (color, size) => <User color={color} size={size} />,
};

// ─── VERTICAL DESKTOP PILL ────────────────────────────────────────────────────
const VerticalTabBar = ({ state, descriptors, navigation, theme, isDark }) => {
  const handlePress = (route, isFocused) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <View
      style={styles.verticalContainer}
      // Allow touch events to pass through the container but catch them on the pill
      {...(Platform.OS === 'web' ? { pointerEvents: 'box-none' } : {})}
    >
      <BlurView
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.verticalPill,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.85)',
            backgroundColor: isDark ? 'rgba(15,15,30,0.6)' : 'rgba(255,255,255,0.35)',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const IconFn = TAB_ICONS[route.name];

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handlePress(route, isFocused)}
              style={styles.verticalTabItem}
              activeOpacity={0.75}
            >
              {isFocused ? (
                /* Active: bright white filled circle */
                <View
                  style={[
                    styles.verticalActiveCircle,
                    {
                      backgroundColor: isDark ? '#ffffff' : '#1a1a2e',
                      shadowColor: isDark ? '#fff' : '#000',
                    },
                  ]}
                >
                  {IconFn && IconFn(isDark ? '#0f0f1e' : '#ffffff', 20)}
                </View>
              ) : (
                /* Inactive: subtle dimmed icon, no background */
                <View style={styles.verticalInactiveCircle}>
                  {IconFn && IconFn(
                    isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                    20
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

// ─── HORIZONTAL MOBILE PILL ───────────────────────────────────────────────────
const HorizontalTabBar = ({ state, descriptors, navigation, theme, isDark }) => {
  const { visible } = useCopilot();

  const mainRoutes   = state.routes.slice(0, 4);
  const profileRoute = state.routes[4];
  const profileFocused = state.index === 4;

  const handlePress = (route, isFocused) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <View style={styles.outerRow}>
      {/* ── Main pill: Home · Course · Learn · Test ── */}
      <CopilotStep text="Use the navigation bar to switch between reading materials, interactive learning, and practice tests." order={6} name="mainTabs">
        <WalkthroughableView pointerEvents={visible ? 'none' : 'auto'} style={{ flex: 1, borderRadius: scale(34) }}>
          <BlurView
            intensity={30}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.mainPill, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
          >
            <View style={styles.pillContent}>
              {mainRoutes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;
                const isCenter  = index === 2;
                const Icon      = options.tabBarIcon;

                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={() => handlePress(route, isFocused)}
                    style={[styles.tabItem, isCenter && styles.centerTabItem]}
                    activeOpacity={0.7}
                  >
                    {isFocused && (
                      <LinearGradient
                        colors={isDark ? [theme.colors.secondary, '#CFCB11'] : [theme.colors.secondary, '#1D4ED8']}
                        style={[styles.glowIndicator, isCenter && styles.centerGlow, { shadowColor: theme.colors.secondary }]}
                      />
                    )}
                    <View style={styles.iconContainer}>
                      {Icon && Icon({
                        color: isFocused
                          ? (isDark ? '#000' : '#fff')
                          : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'),
                        size: isCenter ? 26 : 22,
                      })}
                      <Text style={[styles.tabLabel, {
                        color: isFocused
                          ? (isDark ? '#000' : '#fff')
                          : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'),
                      }]}>
                        {route.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlurView>
        </WalkthroughableView>
      </CopilotStep>

      {/* ── Separated Profile circle ── */}
      <CopilotStep text="Access your account settings, subscription plans, and learning analytics." order={4} name="profileTab">
        <WalkthroughableTouchableOpacity
          pointerEvents={visible ? 'none' : 'auto'}
          onPress={() => handlePress(profileRoute, profileFocused)}
          activeOpacity={0.85}
          style={styles.profileWrapper}
        >
          {profileFocused ? (
            <LinearGradient
              colors={isDark ? [theme.colors.secondary, '#CFCB11'] : [theme.colors.secondary, '#1D4ED8']}
              style={[styles.profileCircle, { shadowColor: theme.colors.secondary }]}
            >
              <User color={isDark ? '#000' : '#fff'} size={24} />
              <Text style={[styles.profileLabel, { color: isDark ? '#000' : '#fff' }]}>Profile</Text>
            </LinearGradient>
          ) : (
            <BlurView
              intensity={30}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.profileCircle, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder, borderWidth: 1 }]}
            >
              <User color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'} size={24} />
              <Text style={[styles.profileLabel, { color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }]}>Profile</Text>
            </BlurView>
          )}
        </WalkthroughableTouchableOpacity>
      </CopilotStep>
    </View>
  );
};

// ─── SMART ROUTER: picks layout based on screen width ─────────────────────────
const CustomTabBar = (props) => {
  const { theme, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  if (isDesktop) {
    return <VerticalTabBar {...props} theme={theme} isDark={isDark} />;
  }
  return <HorizontalTabBar {...props} theme={theme} isDark={isDark} />;
};

// ─── NAVIGATOR ────────────────────────────────────────────────────────────────
export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Course"
        component={SubjectsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Library color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{ tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Test"
        component={PracticeScreen}
        options={{ tabBarIcon: ({ color, size }) => <PenTool color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // ── DESKTOP: Vertical pill on right side ────────────────────────────────────
  verticalContainer: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    ...(Platform.OS === 'web' ? { pointerEvents: 'box-none' } : {}),
  },
  verticalPill: {
    width: 68,
    borderRadius: 34,
    borderWidth: 1,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingHorizontal: 9,
    alignItems: 'center',
    gap: 6,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  verticalTabItem: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalActiveCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  verticalInactiveCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── MOBILE: Horizontal bottom pill ──────────────────────────────────────────
  outerRow: {
    position: 'absolute',
    bottom: verticalScale(20),
    left: '4%',
    right: '4%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  mainPill: {
    flex: 1,
    height: verticalScale(68),
    borderRadius: scale(34),
    overflow: 'hidden',
    borderWidth: 1,
  },
  pillContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  profileWrapper: {},
  profileCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: verticalScale(2),
    shadowOffset: { width: 0, height: verticalScale(6) },
    shadowOpacity: 0.3,
    shadowRadius: scale(12),
    elevation: 10,
  },
  profileLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tabItem: {
    width: scale(48),
    height: scale(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabItem: {
    width: scale(56),
    height: scale(56),
  },
  glowIndicator: {
    position: 'absolute',
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  centerGlow: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
