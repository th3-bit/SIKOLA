import React, { useState } from 'react';
import logger from '../utils/logger';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, ChevronLeft, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Alert, ActivityIndicator } from 'react-native';
import StatusModal from '../components/StatusModal';


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

export default function ResetPasswordScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { setIsRecovering, signOut } = useAuth();
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

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [modalConfig, setModalConfig] = useState({ type: 'success', title: '', message: '', actionText: 'Continue' });

  React.useEffect(() => {
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

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setModalConfig({
        type: 'error',
        title: 'Missing Info',
        message: 'Please fill in both password fields to continue.',
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

    if (!passwordStrength.length || !passwordStrength.uppercase || !passwordStrength.number || !passwordStrength.special) {
      setModalConfig({
        type: 'error',
        title: 'Weak Password',
        message: 'Your password does not meet the security requirements. Please check the requirements below.',
        actionText: 'Got It'
      });
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      if (signOut) await signOut();
      if (setIsRecovering) setIsRecovering(false);

      setModalConfig({
        type: 'success',
        title: 'Congratulations!',
        message: 'Your password has been changed successfully. You can now use your new credentials to access your account.',
        actionText: 'Login'
      });
      setShowModal(true);
    } catch (error) {
      logger.error('Password reset error:', error);
      setModalConfig({
        type: 'error',
        title: 'Reset Failed',
        message: error.message || 'We could not reset your password. Please try again.',
        actionText: 'Try Again'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => (
    <>
      <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>New Password</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                Create a new strong password for your account.
            </Text>

            <View style={styles.form}>
              
               {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer, 
                  { 
                    backgroundColor: theme.colors.inputBg, 
                    borderColor: theme.colors.inputBorder, 
                    borderRadius: theme.borderRadius.m 
                  },
                  isPasswordFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
                ]}>
                  <Lock color={isPasswordFocused ? theme.colors.secondary : theme.colors.textSecondary} size={20} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="New Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff color={theme.colors.textSecondary} size={20} />
                    ) : (
                      <Eye color={theme.colors.textSecondary} size={20} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Password Strength Checklist */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <Text style={[styles.strengthTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Password Requirements:</Text>
                    <View style={styles.requirementRow}>
                      <CheckCircle size={14} color={passwordStrength.length ? '#10B981' : theme.colors.textSecondary} />
                      <Text style={[styles.requirementText, { color: passwordStrength.length ? '#10B981' : theme.colors.textSecondary }]}>At least 8 characters</Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <CheckCircle size={14} color={passwordStrength.uppercase ? '#10B981' : theme.colors.textSecondary} />
                      <Text style={[styles.requirementText, { color: passwordStrength.uppercase ? '#10B981' : theme.colors.textSecondary }]}>At least one uppercase letter (A-Z)</Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <CheckCircle size={14} color={passwordStrength.number ? '#10B981' : theme.colors.textSecondary} />
                      <Text style={[styles.requirementText, { color: passwordStrength.number ? '#10B981' : theme.colors.textSecondary }]}>At least one number (0-9)</Text>
                    </View>
                    <View style={styles.requirementRow}>
                      <CheckCircle size={14} color={passwordStrength.special ? '#10B981' : theme.colors.textSecondary} />
                      <Text style={[styles.requirementText, { color: passwordStrength.special ? '#10B981' : theme.colors.textSecondary }]}>At least one special character (@, #, $, etc.)</Text>
                    </View>
                  </View>
                )}
              </View>

               {/* Confirm Password Input */}
               <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, borderRadius: theme.borderRadius.m }, isConfirmFocused && { borderColor: theme.colors.secondary }]}>
                  <CheckCircle 
                    color={confirmPassword.length > 0 ? (password === confirmPassword ? '#10B981' : '#EF4444') : (isConfirmFocused ? theme.colors.secondary : theme.colors.textSecondary)} 
                    size={20} 
                    style={styles.icon} 
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="Confirm New Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    onFocus={() => setIsConfirmFocused(true)}
                    onBlur={() => setIsConfirmFocused(false)}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff color={theme.colors.textSecondary} size={20} />
                    ) : (
                      <Eye color={theme.colors.textSecondary} size={20} />
                    )}
                  </TouchableOpacity>
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
                      <Text style={[styles.submitButtonText, { color: theme.colors.textContrast }]}>Reset Password</Text>
                      <ArrowRight color={theme.colors.textContrast} size={24} style={{ marginLeft: 10 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </View>
    </>
  );

  const renderLogoSection = (desktopStyles = false) => (
    <View style={[styles.brandContainer, desktopStyles && { marginBottom: 30 }]}>
      <CheckCircle size={60} color={theme.colors.secondary} style={styles.logo} />
      {!desktopStyles && <Text style={[styles.sloganText, { color: theme.colors.textSecondary }]}>Secure your account</Text>}
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
          onClose={() => setShowModal(false)}
          onAction={async () => {
            setShowModal(false);
            if (modalConfig.type === 'success') {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
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
                <Text style={[styles.backText, { color: theme.colors.textPrimary }]}>Back</Text>
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

      {/* Status Modal */}
      <StatusModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAction={async () => {
          setShowModal(false);
          if (modalConfig.type === 'success') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
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
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 25,
    alignItems: 'center',
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
      width: '100%',
      justifyContent: 'flex-start',
  },
  backButton: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  backText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 5,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  logo: {
      // styles if needed
  },
  sloganText: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
    marginTop: 0,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
  },
  description: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 15,
    height: 60,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
   buttonContainer: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  submitButton: {
    borderRadius: 32,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  strengthContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  strengthTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  requirementText: {
    fontSize: 12,
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
  }
});
