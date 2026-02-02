import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import LearningContentScreen from './src/screens/LearningContentScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import LearningProgressScreen from './src/screens/LearningProgressScreen';
import CourseCompletionScreen from './src/screens/CourseCompletionScreen';
import SearchScreen from './src/screens/SearchScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
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
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ProgressProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ProgressProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
