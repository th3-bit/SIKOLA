import React, { useState } from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ChevronLeft, ArrowRight, KeyRound, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import StatusModal from '../components/StatusModal';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

const { width } = Dimensions.get('window');

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

export default function ForgotPasswordScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  const [activeSlide, setActiveSlide] = useState(0);
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  React.useEffect(() => {
    if (!isDesktop) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % onboardingData.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isDesktop]);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: 'success', title: '', message: '', actionText: 'Continue' });

  const handleResetPassword = async () => {
    if (!email) {
      setModalConfig({
        type: 'error',
        title: 'Missing Email',
        message: 'Please enter your email address to continue.',
        actionText: 'Got It'
      });
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      setOtpSent(true);
      
      const message = `A verification code has been sent to ${email}. Please check your inbox and enter the code to reset your password.`;
      
      setModalConfig({
        type: 'success',
        title: 'OTP Sent Successfully',
        message: message,
        actionText: 'Enter Code'
      });
      setShowModal(true);
    } catch (error) {
      logger.error('Password reset error:', error);
      setModalConfig({
        type: 'error',
        title: 'Failed to Send OTP',
        message: error.message || 'Unable to send verification code. Please try again.',
        actionText: 'Try Again'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => (
    <>
      <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>Forgot Password</Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Enter the email address associated with your account and we'll send you a link to reset your password.
      </Text>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <View
            {...(Platform.OS === 'web' ? { onMouseEnter: () => setIsEmailHovered(true), onMouseLeave: () => setIsEmailHovered(false) } : {})}
            style={[
              styles.inputContainer,
              { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, borderRadius: theme.borderRadius.m },
              (isEmailHovered && !isEmailFocused) && { borderColor: theme.colors.secondary + '60' },
              isEmailFocused && { borderColor: theme.colors.secondary },
            ]}
          >
            <Mail color={isEmailFocused ? theme.colors.secondary : theme.colors.textSecondary} size={20} style={styles.icon} />
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

        <TouchableOpacity
          style={[styles.buttonContainer, loading && { opacity: 0.7 }, { shadowColor: theme.colors.secondary }]}
          activeOpacity={0.8}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <LinearGradient
            colors={isDark ? [theme.colors.secondary, '#CFCB11'] : [theme.colors.secondary, '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButton}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.textContrast} />
            ) : (
              <>
                <Text style={[styles.submitButtonText, { color: theme.colors.textContrast, fontFamily: theme.typography.fontFamily }]}>
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                </Text>
                <ArrowRight color={theme.colors.textContrast} size={24} style={{ marginLeft: 10 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.linkText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Login</Text>
          </TouchableOpacity>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>  |  </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.linkText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderLogoSection = (desktopStyles = false) => (
    <View style={[styles.brandContainer, desktopStyles && { marginBottom: 30 }]}>
      <KeyRound size={60} color={theme.colors.secondary} style={styles.logo} />
      {!desktopStyles && <Text style={[styles.sloganText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Recover your account</Text>}
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
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={[styles.backButton, { marginBottom: 20 }]}>
              <ChevronLeft color={theme.colors.textPrimary} size={28} />
              <Text style={[styles.backText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Back to login</Text>
            </TouchableOpacity>

            {renderLogoSection(true)}
            {renderFormFields()}
          </View>
        </View>

        <StatusModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          onAction={() => {
            setShowModal(false);
            if (modalConfig.type === 'success') {
              navigation.navigate('VerifyEmail', { email: email, type: 'recovery' });
            }
          }}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          actionText={modalConfig.actionText}
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
            <ChevronLeft color={theme.colors.textPrimary} size={28} />
            <Text style={[styles.backText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Back to login</Text>
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

      <View style={[styles.bottomSection, { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.borderRadius.l, borderTopRightRadius: theme.borderRadius.l }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderFormFields()}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <StatusModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAction={() => {
          setShowModal(false);
          if (modalConfig.type === 'success') {
            navigation.navigate('VerifyEmail', { email: email, type: 'recovery' });
          }
        }}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        actionText={modalConfig.actionText}
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
    height: '35%',
  },
  topSection: {
    height: '28%',
    paddingHorizontal: scale(20),
    justifyContent: 'space-between',
    paddingBottom: verticalScale(25),
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
    width: '100%',
    justifyContent: 'space-between',
  },
  themeToggle: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
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
    marginBottom: 0,
  },
  logo: {},
  sloganText: {
    fontSize: moderateScale(16),
    marginBottom: verticalScale(5),
    fontWeight: '500',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: scale(30),
    paddingTop: verticalScale(30),
    marginTop: 0,
  },
  scrollContent: {
    paddingBottom: verticalScale(20),
  },
  formTitle: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    marginBottom: verticalScale(10),
    textAlign: 'left',
  },
  description: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(30),
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: verticalScale(25),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: scale(15),
    height: verticalScale(60),
  },
  icon: {
    marginRight: scale(10),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(16),
    height: '100%',
  },
  buttonContainer: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginTop: verticalScale(10),
    marginBottom: verticalScale(20),
  },
  submitButton: {
    borderRadius: scale(32),
    height: verticalScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  submitButtonText: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(20),
    alignItems: 'center',
  },
  footerText: {
    fontSize: moderateScale(16),
  },
  linkText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
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
  },
});
