import React, { useState, useEffect, useRef } from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Animated, Easing, Image, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraduationCap, Facebook, Apple, Chrome, ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';

import { supabase } from '../lib/supabase';
import LoginValidationModal from '../components/LoginValidationModal';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

const onboardingData = [
  {
    image: require('../../assets/onboarding_1.png'),
    title: 'Learn Anywhere, Anytime',
    description: 'Turn every moment into a chance to grow — even on the move.',
  },
  {
    image: require('../../assets/onboarding_2.png'),
    title: 'Make Learning Enjoyable',
    description: 'Study with interactive lessons, quizzes, and challenges that keep you engaged.',
  },
  {
    image: require('../../assets/onboarding_3.png'),
    title: 'Track Your Progress',
    description: 'See your improvement, earn scores, and celebrate every milestone.',
  },
];

export default function LoginScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { refreshStats } = useProgress();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState({ title: '', message: '' });
  const [showValidationModal, setShowValidationModal] = useState(false);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!isDesktop) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % onboardingData.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isDesktop]);

  // Focus States
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Hover States
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isPasswordHovered, setIsPasswordHovered] = useState(false);

  // Animation Values
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setValidationError({ title: 'Missing Info', message: 'Please fill in all fields' });
      setShowValidationModal(true);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Data loading is handled automatically by ProgressContext
      // via the SIGNED_IN auth event — no manual refresh needed here.
    } catch (error) {
      logger.error('Login error:', error);
      setValidationError({ title: 'Login Failed', message: error.message || 'Please check your credentials' });
      setShowValidationModal(true);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => (
    <View style={styles.form}>
      <View style={styles.inputWrapper}>
        <View 
          {...(Platform.OS === 'web' ? { onMouseEnter: () => setIsEmailHovered(true), onMouseLeave: () => setIsEmailHovered(false) } : {})}
          style={[
            styles.inputContainer, 
            { 
              backgroundColor: theme.colors.inputBg, 
              borderColor: theme.colors.inputBorder,
              borderRadius: theme.borderRadius.m,
            },
            (isEmailHovered && !isEmailFocused) && { borderColor: theme.colors.secondary + '60', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
            isEmailFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
        ]}>
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
            placeholder="Email Address"
            placeholderTextColor={theme.colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setIsEmailFocused(true)}
            onBlur={() => setIsEmailFocused(false)}
          />
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <View 
             {...(Platform.OS === 'web' ? { onMouseEnter: () => setIsPasswordHovered(true), onMouseLeave: () => setIsPasswordHovered(false) } : {})}
             style={[
             styles.inputContainer,
             { 
               backgroundColor: theme.colors.inputBg, 
               borderColor: theme.colors.inputBorder,
               borderRadius: theme.borderRadius.m,
             },
             (isPasswordHovered && !isPasswordFocused) && { borderColor: theme.colors.secondary + '60', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
             isPasswordFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
        ]}>
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
            placeholder="Password"
            placeholderTextColor={theme.colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}>
            {showPassword ? (
              <EyeOff color={theme.colors.textSecondary} size={scale(20)} />
            ) : (
              <Eye color={theme.colors.textSecondary} size={scale(20)} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={[styles.forgotPassword, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]} onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={[styles.forgotPasswordText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.buttonContainer, loading && { opacity: 0.6 }, { shadowColor: theme.colors.secondary }, Platform.OS === 'web' ? { cursor: 'pointer' } : {}]} 
        activeOpacity={loading ? 1 : 0.8}
        onPress={handleLogin}
        disabled={loading}
      >
        <LinearGradient
          colors={isDark ? [theme.colors.secondary, '#CFCB11'] : [theme.colors.secondary, '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loginButton}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.textContrast} />
          ) : (
            <>
              <Text style={[styles.loginButtonText, { color: theme.colors.textContrast, fontFamily: theme.typography.fontFamily }]}>Log In</Text>
              <ArrowRight color={theme.colors.textContrast} size={scale(24)} style={{ marginLeft: scale(10) }} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      
      <View style={styles.footer}>
         <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Don't have an account? </Text>
         <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={Platform.OS === 'web' ? { cursor: 'pointer' } : {}}>
            <Text style={[styles.linkText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Sign Up</Text>
         </TouchableOpacity>
      </View>
    </View>
  );

  const renderLogoSection = (desktopStyles = false) => (
    <View style={[styles.brandContainer, desktopStyles && { marginBottom: 30 }]}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={[styles.welcomeText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Sikola+</Text>
      <Text style={[styles.subWelcomeText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Welcome Student</Text>
      {!desktopStyles && <Text style={[styles.sloganText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Unlock your potential today</Text>}
    </View>
  );

  if (isDesktop) {
    return (
      <View style={[styles.container, styles.desktopContainer, { backgroundColor: theme.colors.primary }]}>
        
        {/* Left Side: Cycling Images */}
        <View style={styles.desktopLeftPane}>
          <Image 
            key={activeSlide} 
            source={onboardingData[activeSlide].image} 
            style={styles.desktopHeroImage} 
            resizeMode="cover" 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.desktopGradientOverlay}
          />
          <View style={styles.desktopHeroTextContainer}>
             <Text style={[styles.desktopHeroTitle, { fontFamily: theme.typography.fontFamily }]}>{onboardingData[activeSlide].title}</Text>
             <Text style={[styles.desktopHeroDesc, { fontFamily: theme.typography.fontFamily }]}>{onboardingData[activeSlide].description}</Text>
             <View style={styles.pagination}>
              {onboardingData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: activeSlide === index ? theme.colors.secondary : 'rgba(255,255,255,0.4)' },
                    activeSlide === index && styles.activeDot
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Right Side: Form Card */}
        <View style={styles.desktopRightPane}>
          <TouchableOpacity 
            style={[
              styles.themeToggleDesktop,
              !isDark && { borderColor: 'rgba(0,0,0,0.5)', backgroundColor: 'rgba(0,0,0,0.15)' }
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            {isDark ? <Sun size={20} color="#FCE72D" /> : <Moon size={20} color="#000" />}
          </TouchableOpacity>

          <View style={[styles.desktopFormCard, { backgroundColor: theme.colors.surface, shadowColor: isDark ? '#000' : 'rgba(0,0,0,0.1)' }]}>
            {renderLogoSection(true)}
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, textAlign: 'center', marginBottom: 20 }]}>Log In</Text>
            {renderFormFields()}
          </View>
        </View>

        <LoginValidationModal 
          visible={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          title={validationError.title}
          message={validationError.message}
        />
      </View>
    );
  }

  // Mobile Layout
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />
      
      <SafeAreaView style={styles.topSection}>
        <View style={styles.header}>
          <View style={{ width: scale(44) }} /> 
          <TouchableOpacity 
            style={[
              styles.themeToggle,
              !isDark && { borderColor: 'rgba(0,0,0,0.5)', backgroundColor: 'rgba(0,0,0,0.15)' }
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            {isDark ? <Sun size={scale(20)} color="#FCE72D" /> : <Moon size={scale(20)} color="#000" />}
          </TouchableOpacity>
        </View>
        {renderLogoSection()}
      </SafeAreaView>

      <Animated.View style={[
          styles.bottomSection, 
          { 
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.borderRadius.l,
            borderTopRightRadius: theme.borderRadius.l,
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim
          }
      ]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Login</Text>
            {renderFormFields()}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      <LoginValidationModal 
        visible={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title={validationError.title}
        message={validationError.message}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Mobile styles
  background: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    height: verticalScale(Dimensions.get('window').height * 0.35), 
  },
  topSection: {
    height: verticalScale(Dimensions.get('window').height * 0.28),
    paddingHorizontal: scale(20), justifyContent: 'space-between',
    paddingBottom: verticalScale(15), alignItems: 'center', position: 'relative',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', marginTop: verticalScale(10),
    width: '100%', justifyContent: 'space-between',
  },
  themeToggle: {
    width: scale(44), height: scale(44), borderRadius: scale(22),
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)', borderWidth: scale(1), borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  brandContainer: { alignItems: 'center' },
  logo: {
    width: scale(65), height: scale(65), marginBottom: verticalScale(4),
    backgroundColor: '#FFF', borderRadius: scale(32.5),
    shadowColor: "#000", shadowOffset: { width: 0, height: verticalScale(10) },
    shadowOpacity: 0.2, shadowRadius: scale(15), elevation: 10,
  },
  welcomeText: { fontSize: moderateScale(26), fontWeight: 'bold', marginBottom: verticalScale(4) },
  subWelcomeText: { fontSize: moderateScale(14), marginTop: verticalScale(1) },
  sloganText: { fontSize: moderateScale(12), fontStyle: 'italic', fontWeight: '600', marginTop: verticalScale(2) },
  bottomSection: {
    flex: 1, paddingHorizontal: scale(30), paddingTop: verticalScale(15), 
  },
  scrollContent: { paddingBottom: verticalScale(20) },
  formTitle: { fontSize: moderateScale(22), fontWeight: 'bold', marginBottom: verticalScale(12) },
  form: { width: '100%' },
  inputWrapper: { marginBottom: verticalScale(12) },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: scale(1),
    paddingHorizontal: scale(15), height: verticalScale(50), 
  },
  input: { flex: 1, fontSize: moderateScale(16) },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: verticalScale(15) },
  forgotPasswordText: { fontSize: moderateScale(14), fontWeight: '600' },
  buttonContainer: {
    shadowOffset: { width: 0, height: verticalScale(6) }, shadowOpacity: 0.3,
    shadowRadius: scale(10), elevation: 8, marginBottom: verticalScale(15), 
  },
  loginButton: {
    borderRadius: scale(32), height: verticalScale(50), 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  loginButtonText: { fontSize: moderateScale(18), fontWeight: 'bold', letterSpacing: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginBottom: verticalScale(15) },
  linkText: { fontWeight: 'bold' },

  // Desktop Split Screen Styles
  desktopContainer: {
    flexDirection: 'row',
  },
  desktopLeftPane: {
    flex: 1.2,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 30,
    margin: 20,
    marginRight: 0, // Keep it closer to the form
  },
  desktopRightPane: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    position: 'relative',
  },
  desktopHeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  desktopGradientOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
  },
  desktopHeroTextContainer: {
    position: 'absolute', bottom: 60, left: 40, right: 40,
  },
  desktopHeroTitle: {
    fontSize: 48, fontWeight: '900', color: '#FFF', marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  desktopHeroDesc: {
    fontSize: 20, color: 'rgba(255,255,255,0.9)', lineHeight: 30, marginBottom: 24,
  },
  pagination: { flexDirection: 'row' },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  activeDot: { width: 24 },
  desktopFormCard: {
    width: '100%',
    maxWidth: 480,
    padding: 40,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 20,
  },
  themeToggleDesktop: {
    position: 'absolute', top: 40, right: 40,
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.18)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.35)',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  }
});
