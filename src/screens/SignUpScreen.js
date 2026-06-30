import React, { useState, useEffect, useRef } from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Easing, Image, Alert, ActivityIndicator, Modal, Dimensions, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, CheckCircle, GraduationCap, ChevronLeft, ArrowRight, Eye, EyeOff, CheckSquare, Square, Phone, ChevronDown, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

import { supabase } from '../lib/supabase';
import CountrySelectorModal from '../components/CountrySelectorModal';
import StatusModal from '../components/StatusModal';
import TermsModal from '../components/TermsModal';
import { COUNTRIES } from '../constants/CountryList';
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

export default function SignUpScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!isDesktop) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % onboardingData.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isDesktop]);


  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalType, setTermsModalType] = useState('terms');
  const [modalConfig, setModalConfig] = useState({ type: 'success', title: '', message: '', actionText: 'Continue' });

  // Hover States
  const [isNameHovered, setIsNameHovered] = useState(false);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isPhoneHovered, setIsPhoneHovered] = useState(false);
  const [isPasswordHovered, setIsPasswordHovered] = useState(false);
  const [isConfirmHovered, setIsConfirmHovered] = useState(false);


  // Focus States
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to first (Rwanda)

  // Animation Values
  const slideAnim = useRef(new Animated.Value(50)).current; 
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Keyboard scroll refs
  const scrollViewRef = useRef(null);
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  // Scroll the active input above the keyboard
  const scrollToInput = (ref) => {
    if (!ref?.current || !scrollViewRef?.current) return;
    ref.current.measureLayout(
      scrollViewRef.current,
      (x, y) => {
        scrollViewRef.current.scrollTo({ y: y - verticalScale(20), animated: true });
      },
      () => {}
    );
  };

  useEffect(() => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasLength = password.length >= 8;

    setPasswordStrength({
      length: hasLength,
      uppercase: hasUpperCase,
      number: hasNumber,
      special: hasSpecial
    });
  }, [password]);

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

  const handleSignUp = async () => {
    logger.log('handleSignUp called', { name, email, phone: phone?.length, agreeTerms });
    if (!name || !email || !phone || !password || !confirmPassword) {
      setModalConfig({
        type: 'error',
        title: 'Missing Info',
        message: 'Please fill in all fields to create your account.',
        actionText: 'Got It'
      });
      setShowModal(true);
      return;
    }

    if (password !== confirmPassword) {
      setModalConfig({
        type: 'error',
        title: 'Password Mismatch',
        message: 'The passwords you entered do not match. Please try again.',
        actionText: 'Got It'
      });
      setShowModal(true);
      return;
    }

    if (!agreeTerms) {
      setModalConfig({
        type: 'error',
        title: 'Terms Required',
        message: 'Please agree to the terms and conditions to continue.',
        actionText: 'Got It'
      });
      setShowModal(true);
      return;
    }

    // Password strength check
    if (!passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.number || !passwordStrength.special) {
      setModalConfig({
        type: 'error',
        title: 'Weak Password',
        message: 'Your password does not meet the security requirements. Please check the requirements below the password field.',
        actionText: 'I Understood'
      });
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);

      // 0. Proactively check if email already exists (since Supabase hides this during signUp)
      logger.log('Checking if email exists:', email);
      const { data: userExists, error: checkError } = await supabase.rpc('check_if_user_exists', { 
        email_to_check: email 
      });

      if (checkError) {
        logger.error('Error checking user existence:', checkError);
        // We don't throw here, we continue with signUp as usual if the check fails
      } else if (userExists) {
        logger.log('User already exists, showing "Account Exists" modal');
        setModalConfig({
          type: 'error',
          title: 'Account Exists',
          message: 'This email is already registered. Please try logging in or use a different email address.',
          actionText: 'Login Instead'
        });
        setShowModal(true);
        setLoading(false);
        return;
      }

      // 1. Create the user in Supabase Auth
      // We pass metadata (name, phone) which the server-side trigger will use 
      // to automatically create the profile and stats records.
      const combinedPhone = `${selectedCountry.code}${phone.replace(/^0+/, '')}`;
      logger.log('Attempting auth.signUp with:', { email, combinedPhone });
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: combinedPhone,
          }
        }
      });

      if (authError) {
        logger.error('Auth signUp error details:', authError);
        throw authError;
      }

      logger.log('Auth signUp success:', { userId: authData?.user?.id, hasSession: !!authData?.session });

      if (authData.user) {
        // NOTE: Profile and stats creation is now handled by a PostgreSQL trigger 
        // in the database (handle_new_user). This ensures data integrity.

        if (authData.session) {
          logger.log('Session exists, showing welcome modal');
          setModalConfig({
            type: 'success',
            title: 'Welcome!',
            message: 'Your account has been created successfully. Welcome to Sikola+!',
            actionText: 'Get Started'
          });
          setShowModal(true);
        } else {
          setModalConfig({
            type: 'success',
            title: 'OTP Sent',
            message: `We've sent a verification code to ${email}. Please enter it to activate your account.`,
            actionText: 'Enter Code'
          });
          setShowModal(true);
        }
      }
    } catch (error) {
      logger.error('Sign up error:', error);
      
      let errorTitle = 'Registration Failed';
      let errorMessage = error.message || 'An error occurred during sign up. Please try again.';

      // Specific handling for existing user
      if (error.message?.toLowerCase().includes('already registered') || error.status === 400 && error.message?.toLowerCase().includes('already registered')) {
        errorTitle = 'Account Exists';
        errorMessage = 'This email is already registered. Please try logging in or use a different email address.';
      }

      setModalConfig({
        type: 'error',
        title: errorTitle,
        message: errorMessage,
        actionText: errorTitle === 'Account Exists' ? 'Login Instead' : 'Try Again'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => (
    <View style={styles.form}>
              
              <View style={styles.inputWrapper}>
                <View
                  {...(Platform.OS === 'web' ? { onMouseEnter: () => setIsNameHovered(true), onMouseLeave: () => setIsNameHovered(false) } : {})}
                  style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.colors.inputBg, 
                      borderColor: theme.colors.inputBorder,
                      borderRadius: theme.borderRadius.m,
                    },
                    (isNameHovered && !isNameFocused) && { borderColor: theme.colors.secondary + '60', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                    isNameFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
                ]}>
                  <User 
                    color={isNameFocused ? theme.colors.secondary : theme.colors.textSecondary} 
                    size={scale(20)} 
                    style={styles.icon} 
                  />
                  <TextInput
                    ref={nameRef}
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Full Name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => { setIsNameFocused(true); scrollToInput(nameRef); }}
                    onBlur={() => setIsNameFocused(false)}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
              </View>

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
                  <Mail 
                    color={isEmailFocused ? theme.colors.secondary : theme.colors.textSecondary} 
                    size={scale(20)} 
                    style={styles.icon} 
                  />
                  <TextInput
                    ref={emailRef}
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Email Address"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onFocus={() => { setIsEmailFocused(true); scrollToInput(emailRef); }}
                    onBlur={() => setIsEmailFocused(false)}
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <View
                  {...(Platform.OS === 'web' ? { onMouseEnter: () => setIsPhoneHovered(true), onMouseLeave: () => setIsPhoneHovered(false) } : {})}
                  style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.colors.inputBg, 
                      borderColor: theme.colors.inputBorder,
                      borderRadius: theme.borderRadius.m,
                    },
                    (isPhoneHovered && !isPhoneFocused) && { borderColor: theme.colors.secondary + '60', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                    isPhoneFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
                ]}>
                  <Phone 
                    color={isPhoneFocused ? theme.colors.secondary : theme.colors.textSecondary} 
                    size={scale(20)} 
                    style={styles.icon} 
                  />
                  
                  {/* Country Selector Trigger */}
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', marginRight: scale(10), borderRightWidth: scale(1), borderRightColor: theme.colors.inputBorder, paddingRight: scale(10), height: '60%' }}
                    onPress={() => setShowCountryPicker(true)}
                  >
                    <Image 
                      source={{ uri: `https://flagcdn.com/w40/${selectedCountry.iso}.png` }}
                      style={{ width: scale(24), height: scale(16), borderRadius: scale(2), marginRight: scale(8) }} 
                    />
                    <Text style={{ fontSize: moderateScale(14), fontWeight: '600', color: theme.colors.textPrimary, marginRight: scale(4) }}>{selectedCountry.code}</Text>
                    <ChevronDown size={scale(14)} color={theme.colors.textSecondary} />
                  </TouchableOpacity>

                  <TextInput
                    ref={phoneRef}
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Phone Number"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={phone}
                    onChangeText={(text) => {
                      const numericText = text.replace(/[^0-9]/g, '');
                      if (numericText.length <= 9) setPhone(numericText);
                    }}
                    maxLength={9}
                    keyboardType="phone-pad"
                    onFocus={() => { setIsPhoneFocused(true); scrollToInput(phoneRef); }}
                    onBlur={() => setIsPhoneFocused(false)}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
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
                  <Lock 
                    color={isPasswordFocused ? theme.colors.secondary : theme.colors.textSecondary} 
                    size={scale(20)} 
                    style={styles.icon} 
                  />
                  <TextInput
                    ref={passwordRef}
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => { setIsPasswordFocused(true); scrollToInput(passwordRef); }}
                    onBlur={() => setIsPasswordFocused(false)}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff color={theme.colors.textSecondary} size={scale(20)} />
                    ) : (
                      <Eye color={theme.colors.textSecondary} size={scale(20)} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Password Strength Checklist */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <Text style={[styles.strengthTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Password Requirements:</Text>
                    <View style={styles.requirementRow}>
                      <CheckCircle size={scale(14)} color={passwordStrength.length ? '#10B981' : theme.colors.textSecondary} />
                      <Text style={[styles.requirementText, { color: passwordStrength.length ? '#10B981' : theme.colors.textSecondary }]}>At least 8 characters</Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <CheckCircle size={scale(14)} color={passwordStrength.uppercase ? '#10B981' : theme.colors.textSecondary} />
                      <Text style={[styles.requirementText, { color: passwordStrength.uppercase ? '#10B981' : theme.colors.textSecondary }]}>At least one uppercase letter (A-Z)</Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <CheckCircle size={scale(14)} color={passwordStrength.number ? '#10B981' : theme.colors.textSecondary} />
                      <Text style={[styles.requirementText, { color: passwordStrength.number ? '#10B981' : theme.colors.textSecondary }]}>At least one number (0-9)</Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <CheckCircle size={scale(14)} color={passwordStrength.special ? '#10B981' : theme.colors.textSecondary} />
                      <Text style={[styles.requirementText, { color: passwordStrength.special ? '#10B981' : theme.colors.textSecondary }]}>At least one special character (@, #, $, etc.)</Text>
                    </View>
                  </View>
                )}
              </View>

               <View style={styles.inputWrapper}>
                <View
                  {...(Platform.OS === 'web' ? { onMouseEnter: () => setIsConfirmHovered(true), onMouseLeave: () => setIsConfirmHovered(false) } : {})}
                  style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.colors.inputBg, 
                      borderColor: theme.colors.inputBorder,
                      borderRadius: theme.borderRadius.m,
                    },
                    (isConfirmHovered && !isConfirmFocused) && { borderColor: theme.colors.secondary + '60', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                    isConfirmFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
                ]}>
                  <CheckCircle 
                    color={confirmPassword.length > 0 ? (password === confirmPassword ? '#10B981' : '#EF4444') : (isConfirmFocused ? theme.colors.secondary : theme.colors.textSecondary)} 
                    size={scale(20)} 
                    style={styles.icon} 
                  />
                  <TextInput
                    ref={confirmRef}
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Confirm Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => { 
                      setIsConfirmFocused(true); 
                      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                    }}
                    onBlur={() => setIsConfirmFocused(false)}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff color={theme.colors.textSecondary} size={scale(20)} />
                    ) : (
                      <Eye color={theme.colors.textSecondary} size={scale(20)} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.termsContainer} 
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.8}
              >
                  {agreeTerms ? (
                      <CheckSquare color={theme.colors.secondary} size={scale(24)} />
                  ) : (
                      <Square color={theme.colors.textSecondary} size={scale(24)} />
                  )}
                  <Text style={[styles.termsText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                      I agree to the <Text 
                        onPress={() => {
                          setTermsModalType('terms');
                          setShowTermsModal(true);
                        }}
                        style={{ color: theme.colors.secondary, fontWeight: 'bold', fontFamily: theme.typography.fontFamily }}
                      >Terms</Text> & <Text 
                        onPress={() => {
                          setTermsModalType('privacy');
                          setShowTermsModal(true);
                        }}
                        style={{ color: theme.colors.secondary, fontWeight: 'bold', fontFamily: theme.typography.fontFamily }}
                      >Privacy Policy</Text>
                  </Text>
              </TouchableOpacity>

              <View style={styles.verificationNotice}>
                <Mail color={theme.colors.secondary} size={scale(14)} />
                <Text style={[styles.verificationNoticeText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                  Verification email will be sent after registration
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.buttonContainer, (!agreeTerms || loading) && { opacity: 0.6 }, { shadowColor: theme.colors.secondary }]} 
                activeOpacity={agreeTerms && !loading ? 0.8 : 1}
                onPress={handleSignUp}
                disabled={loading}
              >
                 <LinearGradient
                  colors={isDark ? [theme.colors.secondary, '#CFCB11'] : [theme.colors.secondary, '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.signUpButton}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.textContrast} />
                  ) : (
                    <>
                      <Text style={[styles.signUpButtonText, { color: theme.colors.textContrast, fontFamily: theme.typography.fontFamily }]}>Create Account</Text>
                      <ArrowRight color={theme.colors.textContrast} size={scale(24)} style={{ marginLeft: scale(10) }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                 <Text style={[styles.loginText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Already have an account? </Text>
                 <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={[styles.loginLink, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Login</Text>
                 </TouchableOpacity>
              </View>

              {/* Country Picker Modal */}
              <CountrySelectorModal 
                visible={showCountryPicker}
                onClose={() => setShowCountryPicker(false)}
                onSelect={setSelectedCountry}
                selectedCountry={selectedCountry}
              />

            </View>
  );

  const renderLogoSection = (desktopStyles = false) => (
    <View style={[styles.brandContainer, desktopStyles && { marginBottom: 30 }]}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.welcomeText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Sikola+</Text>
          {!desktopStyles && <Text style={[styles.sloganText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Join the future of learning</Text>}
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
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, textAlign: 'center', marginBottom: 20 }]}>Create Account</Text>
            {renderFormFields()}
          </View>
        </View>

        <StatusModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onAction={() => {
            setShowModal(false);
            if (modalConfig.type === 'success') {
              if (modalConfig.title === 'OTP Sent') {
                navigation.navigate('VerifyEmail', { email: email });
              } else if (modalConfig.title === 'Welcome!') {
                navigation.navigate('Subscription', { firstTime: true });
              }
            } else if (modalConfig.title === 'Account Exists') {
              navigation.navigate('Login');
            }
          }}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          actionText={modalConfig.actionText}
        />

        <TermsModal 
          visible={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onAccept={() => {
            setAgreeTerms(true);
            setShowTermsModal(false);
          }}
          type={termsModalType}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />

      <SafeAreaView style={styles.topSection}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
                <ChevronLeft color={theme.colors.textPrimary} size={scale(28)} />
                <Text style={[styles.backText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Back</Text>
            </TouchableOpacity>

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
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false} 
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Create Account</Text>

            {renderFormFields()}</ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Status Modal */}
      <StatusModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAction={() => {
          setShowModal(false);
          if (modalConfig.type === 'success') {
            if (modalConfig.title === 'OTP Sent') {
              // Email verification required — go to verify screen
              navigation.navigate('VerifyEmail', { email: email });
            } else if (modalConfig.title === 'Welcome!') {
              // Auto-logged in — show plan selection as part of first-time onboarding
              navigation.navigate('Subscription', { firstTime: true });
            }
          } else if (modalConfig.title === 'Account Exists') {
            navigation.navigate('Login');
          }
        }}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        actionText={modalConfig.actionText}
      />

      <TermsModal 
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAgreeTerms(true);
          setShowTermsModal(false);
        }}
        type={termsModalType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    height: verticalScale(280),
  },
  topSection: {
    paddingHorizontal: scale(20),
    justifyContent: 'flex-start',
    paddingBottom: verticalScale(6), 
    alignItems: 'center', 
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: verticalScale(10),
      width: '100%', 
  },
  themeToggle: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: scale(1),
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  backButton: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  backText: {
      fontSize: moderateScale(16),
      fontWeight: '600',
      marginLeft: scale(5),
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  logo: {
      width: scale(65),
      height: scale(65),
      marginBottom: verticalScale(4),
      backgroundColor: '#FFF',
      borderRadius: scale(32.5),
      shadowColor: "#000",
      shadowOffset: { width: 0, height: verticalScale(10) },
      shadowOpacity: 0.2,
      shadowRadius: scale(15),
      elevation: 10,
  },
  welcomeText: {
    fontSize: moderateScale(26), 
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  sloganText: {
    fontSize: moderateScale(12),
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: verticalScale(2),
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(20),
  },
  scrollContent: {
    paddingBottom: verticalScale(150),
  },
  formTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    marginBottom: verticalScale(20),
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: verticalScale(15),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: scale(1),
    paddingHorizontal: scale(15),
    height: verticalScale(50),
  },
  icon: {
    marginRight: scale(10),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(16),
  },
  termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: verticalScale(20),
      marginTop: verticalScale(5),
  },
  termsText: {
      marginLeft: scale(10),
      fontSize: moderateScale(14),
  },
   buttonContainer: {
    shadowOffset: { width: 0, height: verticalScale(6) },
    shadowOpacity: 0.3,
    shadowRadius: scale(10),
    elevation: 8,
    marginTop: verticalScale(5),
    marginBottom: verticalScale(20),
  },
  signUpButton: {
    borderRadius: scale(32),
    height: verticalScale(55),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  signUpButtonText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(10),
  },
  loginText: {
    fontSize: moderateScale(16),
  },
  loginLink: {
    fontWeight: 'bold',
    fontSize: moderateScale(16),
  },
  verificationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: verticalScale(10),
    gap: scale(6),
  },
  verificationNoticeText: {
    fontSize: moderateScale(12),
    opacity: 0.8,
  },
  strengthContainer: {
    marginTop: verticalScale(10),
    paddingHorizontal: scale(5),
  },
  strengthTitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: verticalScale(6),
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
    gap: scale(8),
  },
  requirementText: {
    fontSize: moderateScale(12),
  },

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
    marginRight: 0,
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
