import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Library, GraduationCap, PenTool, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import SubjectsScreen from '../screens/SubjectsScreen';
import LearnScreen from '../screens/LearnScreen';
import PracticeScreen from '../screens/PracticeScreen';
import AccountScreen from '../screens/AccountScreen';
import GlassHeader from '../components/GlassHeader';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const PlaceholderScreen = ({ name }) => {
  const { theme, isDark } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <GlassHeader showSearch={name === 'Subjects'} />
        
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


const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={styles.container}>
      <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={[styles.tabBarWrapper, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
        <View style={styles.tabBarContent}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const isCenter = index === 2; // "Learn"

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const Icon = options.tabBarIcon;

            return (
              <TouchableOpacity
                key={index}
                onPress={onPress}
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
                    color: isFocused ? (isDark ? '#000' : '#fff') : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'), 
                    size: isCenter ? 28 : 24 
                  })}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Subjects" 
        component={SubjectsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Library color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Learn" 
        component={LearnScreen}
        options={{
          tabBarIcon: ({ color, size }) => <GraduationCap color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Test" 
        component={PracticeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <PenTool color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={AccountScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: '5%',
    right: '5%',
    alignItems: 'center',
  },
  tabBarWrapper: {
    width: '100%',
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tabBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },
  tabItem: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabItem: {
    width: 60,
    height: 60,
  },
  glowIndicator: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  centerGlow: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
