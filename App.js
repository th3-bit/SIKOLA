import React, { useEffect, useCallback, useRef, useState } from 'react';
import logger from './src/utils/logger';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import ErrorBoundary from './src/components/ErrorBoundary';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import SubjectDetailScreen from './src/screens/SubjectDetailScreen';
import LessonDetailScreen from './src/screens/LessonDetailScreen';
import LessonOverviewScreen from './src/screens/LessonOverviewScreen';
import ExamplesScreen from './src/screens/ExamplesScreen';
import QuizScreen from './src/screens/QuizScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ProgressProvider } from './src/context/ProgressContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LearningContentScreen from './src/screens/LearningContentScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import LearningProgressScreen from './src/screens/LearningProgressScreen';
import CourseCompletionScreen from './src/screens/CourseCompletionScreen';
import SearchScreen from './src/screens/SearchScreen';
import NotificationTestScreen from './src/screens/NotificationTestScreen';
import PreferencesScreen from './src/screens/PreferencesScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import NotificationService from './src/NotificationService';
import * as Notifications from 'expo-notifications';
import LoadingScreen from './src/components/LoadingScreen';
import { useProgress } from './src/context/ProgressContext';
import GlobalModals from './src/components/GlobalModals';
import { NetworkProvider } from './src/context/NetworkContext';
import OfflineBanner from './src/components/OfflineBanner';
import { CopilotProvider } from 'react-native-copilot';
import CoachmarkTooltip from './src/components/CoachmarkTooltip';
import { verticalScale } from './src/utils/Scaling';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause this to error in dev */
});

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

function AppNavigator() {
  const { isDark } = useTheme();
  const { session, loading: authLoading, isRecovering, showOnboarding, postOnboardingDestination } = useAuth();
  const { isLoading: dataLoading } = useProgress();

  const isActuallyLoading = authLoading || (session && dataLoading) || showOnboarding === null;

  // After onboarding completes for a new user, route them to SignUp (not Login)
  useEffect(() => {
    if (!showOnboarding && !session && postOnboardingDestination === 'SignUp') {
      const t = setTimeout(() => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('SignUp');
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [showOnboarding, session, postOnboardingDestination]);

  useEffect(() => {

    // Hide native splash screen immediately to let our branded LoadingScreen take over
    // while we determine auth state and fetch user data.
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (isActuallyLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : isRecovering ? (
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        ) : !session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainApp" component={MainTabNavigator} />
            <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
            <Stack.Screen name="LessonDetail" component={LessonDetailScreen} />
            <Stack.Screen name="LessonOverview" component={LessonOverviewScreen} />
            <Stack.Screen name="Examples" component={ExamplesScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="LearningContent" component={LearningContentScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
            <Stack.Screen name="LearningProgress" component={LearningProgressScreen} />
            <Stack.Screen name="CourseCompletion" component={CourseCompletionScreen} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="NotificationTest" component={NotificationTestScreen} />
            <Stack.Screen name="Preferences" component={PreferencesScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

const NAV_STATE_KEY = '@sikola_nav_state';

// Screens that must never be persisted (unauthenticated routes)
const AUTH_SCREENS = new Set(['Login', 'SignUp', 'ForgotPassword', 'VerifyEmail', 'ResetPassword', 'Onboarding']);

function getActiveRouteName(state) {
  if (!state) return null;
  const route = state.routes[state.index];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
}

const linking = {
  prefixes: ['sikola://', 'https://sikola.com'],
  config: {
    screens: {
      Onboarding: 'onboarding',
      Login: 'login',
      SignUp: 'signup',
      ForgotPassword: 'forgot-password',
      VerifyEmail: 'verify-email',
      ResetPassword: 'reset-password',
      MainApp: {
        screens: {
          Home: 'home',
          Course: 'courses',
          Learn: 'learn',
          Test: 'test',
          Profile: 'profile',
        },
      },
      SubjectDetail: 'subject/:id',
      LessonDetail: 'lesson/:id',
      LessonOverview: 'lesson-overview/:id',
      Examples: 'examples/:id',
      Quiz: 'quiz/:id',
      LearningContent: 'content/:id',
      Subscription: 'settings/subscription',
      Payment: 'settings/payment',
      PersonalInfo: 'settings/personal-info',
      LearningProgress: 'progress',
      CourseCompletion: 'completion/:id',
      Search: 'search',
      NotificationTest: 'notification-test',
      Preferences: 'settings/preferences',
      PrivacyPolicy: 'privacy',
      HelpSupport: 'help',
    },
  },
};


export default function App() {
  const [initialNavState, setInitialNavState] = useState(undefined);
  const navStateReady = useRef(false);

  // Load persisted nav state on mount
  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedStateStr = await AsyncStorage.getItem(NAV_STATE_KEY);
        if (savedStateStr) {
          const savedState = JSON.parse(savedStateStr);
          // Only restore if the last active screen was a content screen (not auth)
          const lastScreen = getActiveRouteName(savedState);
          if (lastScreen && !AUTH_SCREENS.has(lastScreen)) {
            setInitialNavState(savedState);
          } else {
            setInitialNavState(null);
          }
        } else {
          setInitialNavState(null);
        }
      } catch (e) {
        // If state can't be parsed, start fresh
        setInitialNavState(null);
      }
    };
    restoreState();
  }, []);

  const onNavStateChange = useCallback(async (state) => {
    if (!state) return;
    const activeScreen = getActiveRouteName(state);
    // Never persist auth screens — always start fresh from login
    if (activeScreen && AUTH_SCREENS.has(activeScreen)) {
      await AsyncStorage.removeItem(NAV_STATE_KEY);
      return;
    }
    try {
      await AsyncStorage.setItem(NAV_STATE_KEY, JSON.stringify(state));
    } catch (e) {
      logger.warn('Failed to persist nav state', e);
    }
  }, []);

  React.useEffect(() => {
    // 1. Initialize Notification Service
    NotificationService.initialize();

    // 4. Setup Response Listener (Handles clicks on notifications)
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      logger.log('Notification clicked:', JSON.stringify(response, null, 2));
      
      const { data } = response.notification.request.content;
      if (data?.screen) {
        logger.log(`Deep linking to screen: ${data.screen}`, data.params || '');
        
        // Wait for navigation container to be ready
        if (navigationRef.isReady()) {
          // Check if the destination is one of our main tabs
          const tabScreens = ['Home', 'Topics', 'Learn', 'Test', 'Profile'];
          
          if (tabScreens.includes(data.screen)) {
            // Nested navigation for tab screens
            navigationRef.navigate('MainApp', {
              screen: data.screen,
              params: data.params
            });
          } else {
            // Direct navigation for root-level screens
            navigationRef.navigate(data.screen, data.params);
          }
        } else {
          logger.warn('Navigation not ready, deep link delayed');
        }
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Wait until we've attempted to load persisted state before rendering
  if (initialNavState === undefined) return null;

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <NetworkProvider>
        <AuthProvider>
          <ThemeProvider>
            <ProgressProvider>
              <NavigationContainer
                ref={navigationRef}
                initialState={initialNavState}
                onStateChange={onNavStateChange}
                linking={linking}
              >
                <CopilotProvider 
                  overlay="svg" 
                  tooltipComponent={CoachmarkTooltip}
                  stepNumberComponent={() => null}
                  tooltipStyle={{ backgroundColor: 'transparent', paddingTop: 0, paddingHorizontal: 0, borderRadius: 28 }}
                  svgMaskPath={({ size, position, canvasSize, step }) => {
                    const sizeX = size.x._value;
                    const sizeY = size.y._value;
                    const positionX = position.x._value;
                    const positionY = position.y._value;
                    
                    // Special case for Explore Subjects: Bleed the highlight to the bottom
                    if (step?.name === 'exploreSubjects') {
                      const r = 28;
                      // We use the measured coordinates but force the width to be full-screen 
                      // and the height to bleed to the bottom.
                      const customPosX = 0;
                      const customSizeX = canvasSize.x;
                      
                      return `M0,0H${canvasSize.x}V${canvasSize.y}H0V0ZM${
                        customPosX + r
                      },${positionY}h${customSizeX - 2 * r}a${r},${r} 0 0 1 ${r},${r}V${
                        canvasSize.y
                      }H${customPosX}V${positionY + r}a${r},${r} 0 0 1 ${r},-${r}Z`;
                    }
                    
                    // Standard dynamic radius for other steps
                    const isCircle = Math.abs(sizeX - sizeY) < 5;
                    const r = isCircle ? Math.min(sizeX / 2, sizeY / 2) : Math.min(28, sizeX / 2, sizeY / 2); 
                    
                    return `M0,0H${canvasSize.x}V${canvasSize.y}H0V0ZM${
                      positionX + r
                    },${positionY}h${sizeX - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${
                      sizeY - 2 * r
                    }a${r},${r} 0 0 1 -${r},${r}h-${sizeX - 2 * r}a${r},${r} 0 0 1 -${r},-${r}v-${
                      sizeY - 2 * r
                    }a${r},${r} 0 0 1 ${r},-${r}Z`;
                  }}
                >
                  <ErrorBoundary>
                    <AppNavigator />
                    <GlobalModals />
                    <OfflineBanner />
                  </ErrorBoundary>
                </CopilotProvider>
              </NavigationContainer>
            </ProgressProvider>
          </ThemeProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
