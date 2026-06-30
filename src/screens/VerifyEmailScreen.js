import React, { useState, useRef } from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Alert, ActivityIndicator } from 'react-native';
import StatusModal from '../components/StatusModal';
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

export default function VerifyEmailScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  const [activeSlide, setActiveSlide] = useState(0);

  React.useEffect(() => {
    if (!isDesktop) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % onboardingData.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isDesktop]);

  const { refreshStats } = useProgress();
  const { setIsRecovering } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [modalLoading, setModalLoading] = useState(false);
  const userEmail = route.params?.email || '';
  const inputs = useRef([]);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: 'success', title: '', message: '', actionText: 'Continue' });

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 7) {
      inputs.current[index + 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 8) {
      setModalConfig({
        type: 'error',
        title: 'Incomplete Code',
        message: 'Please enter all 8 digits of the verification code.',
        actionText: 'Got It'
      });
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: code,
        type: route.params?.type || 'signup',
      });

      if (error) throw error;

      if (route.params?.type === 'recovery') {
        if (setIsRecovering) setIsRecovering(true);
        setModalConfig({
          type: 'success',
          title: 'Email Verified',
          message: 'Code verified successfully! You can now set a new password.',
          actionText: 'Set New Password'
        });
        setShowModal(true);
      } else {
        setModalConfig({
          type: 'success',
          title: 'Account Verified',
          message: 'Your account has been successfully verified! Welcome to Sikola+.',
          actionText: 'Get Started'
        });
        setShowModal(true);
      }
    } catch (error) {
      logger.error('Verification error:', error);
      setModalConfig({
        type: 'error',
        title: 'Verification Failed',
        message: error.message || 'Invalid or expired code. Please try again.',
        actionText: 'Try Again'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBackspace = (key, index) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
          inputs.current[index - 1].focus();
      }
  };

  // Cooldown timer effect
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setResendLoading(true);
      
      // Resend OTP based on type
      if (route.params?.type === 'recovery') {
        const { error } = await supabase.auth.resetPasswordForEmail(userEmail);
        if (error) throw error;
      } else {
        // For signup, we need to resend the signup confirmation
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: userEmail,
        });
        if (error) throw error;
      }

      setResendCooldown(60); // 60 second cooldown
      setOtp(['', '', '', '', '', '', '', '']); // Clear old code
      setModalConfig({
        type: 'success',
        title: 'Code Resent',
        message: 'A new verification code has been sent to your email.',
        actionText: 'Got It'
      });
      setShowModal(true);
    } catch (error) {
      logger.error('Resend error:', error);
      setModalConfig({
        type: 'error',
        title: 'Resend Failed',
        message: error.message || 'Failed to resend code. Please try again.',
        actionText: 'Try Again'
      });
      setShowModal(true);
    } finally {
      setResendLoading(false);
    }
  };

  const renderFormFields = () => (
    <>
      <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>Enter Code</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                Please enter the 8-digit code sent to your email address.
            </Text>

            <View style={styles.form}>
              
              <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => inputs.current[index] = ref}
                        style={[styles.otpInput, { 
                          backgroundColor: theme.colors.inputBg, 
                          borderColor: theme.colors.inputBorder,
                          color: theme.colors.textPrimary,
                          borderRadius: theme.borderRadius.m
                        }]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={({ nativeEvent }) => handleBackspace(nativeEvent.key, index)}
                        placeholder="-"
                        placeholderTextColor={theme.colors.textSecondary}
                      />
                  ))}
              </View>

              <TouchableOpacity 
                style={[styles.buttonContainer, loading && { opacity: 0.7 }, { shadowColor: theme.colors.secondary }]} 
                activeOpacity={0.8}
                onPress={handleVerify}
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
                      <Text style={[styles.submitButtonText, { color: theme.colors.textContrast }]}>Verify Code</Text>
                      <ArrowRight color={theme.colors.textContrast} size={scale(24)} style={{ marginLeft: scale(10) }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

               <TouchableOpacity 
                 style={styles.resendContainer}
                 onPress={handleResendOtp}
                 disabled={resendLoading || resendCooldown > 0}
               >
                  <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>Didn't receive code? </Text>
                  {resendLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.secondary} />
                  ) : (
                    <Text style={[styles.resendLink, { 
                      color: resendCooldown > 0 ? theme.colors.textSecondary : theme.colors.secondary,
                      opacity: resendCooldown > 0 ? 0.5 : 1
                    }]}>
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
                    </Text>
                  )}
               </TouchableOpacity>

            </View>
    </>
  );

  const renderLogoSection = (desktopStyles = false) => (
    <View style={[styles.brandContainer, desktopStyles && { marginBottom: 30 }]}>
      <GraduationCap size={60} color={theme.colors.secondary} style={styles.logo} />
      {!desktopStyles && <Text style={[styles.sloganText, { color: theme.colors.textSecondary }]}>Verify your email</Text>}
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
          onClose={() => !modalLoading && setShowModal(false)}
          loading={modalLoading}
          onAction={async () => {
            if (modalConfig.type === 'success' && modalConfig.title !== 'Code Resent') {
              if (route.params?.type === 'recovery') {
                setShowModal(false);
                navigation.navigate('ResetPassword');
              } else {
                setModalLoading(true);
                try {
                  if (refreshStats) await refreshStats();
                  setShowModal(false);
                  navigation.replace('MainApp');
                } catch (err) {
                  logger.error("Refresh stats error:", err);
                  setShowModal(false);
                  navigation.replace('MainApp');
                } finally {
                  setModalLoading(false);
                }
              }
            } else {
              setShowModal(false);
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
                <ChevronLeft color={theme.colors.textPrimary} size={scale(28)} />
                <Text style={[styles.backText, { color: theme.colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.brandContainer}>
          <GraduationCap size={scale(60)} color={theme.colors.secondary} style={styles.logo} />
        </View>
        <Text style={[styles.sloganText, { color: theme.colors.textSecondary }]}>Verify your email</Text> 
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

      {/* Status Modal */}
      <StatusModal
        visible={showModal}
        onClose={() => !modalLoading && setShowModal(false)}
        loading={modalLoading}
        onAction={async () => {
          if (modalConfig.type === 'success' && modalConfig.title !== 'Code Resent') {
            if (route.params?.type === 'recovery') {
              setShowModal(false);
              navigation.navigate('ResetPassword');
            } else {
              setModalLoading(true);
              try {
                if (refreshStats) await refreshStats();
                setShowModal(false);
                navigation.replace('MainApp');
              } catch (err) {
                logger.error("Refresh stats error:", err);
                setShowModal(false);
                navigation.replace('MainApp');
              } finally {
                setModalLoading(false);
              }
            }
          } else {
            setShowModal(false);
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
    height: '25%',
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
      justifyContent: 'flex-start',
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
  logo: {
      // styles if needed
  },
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
  otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: verticalScale(30),
      paddingHorizontal: 0,
  },
  otpInput: {
      width: scale(38),
      height: verticalScale(55),
      borderWidth: 1,
      fontSize: moderateScale(20),
      fontWeight: 'bold',
      textAlign: 'center',
  },
   buttonContainer: {
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.5,
    shadowRadius: scale(16),
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
  resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: verticalScale(20),
  },
  resendText: {
      fontSize: moderateScale(14),
  },
  resendLink: {
      fontWeight: 'bold',
      fontSize: moderateScale(14),
  }
,
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
    maxWidth: 580, // slightly wider to accommodate 8 OTP inputs
    padding: 40,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 20,
  }
});
