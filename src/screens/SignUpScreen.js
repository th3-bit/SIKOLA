import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, CheckCircle, GraduationCap, ChevronLeft, ArrowRight, Eye, EyeOff, CheckSquare, Square } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

export default function SignUpScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus States
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />

      <SafeAreaView style={styles.topSection}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <ChevronLeft color={theme.colors.textPrimary} size={28} />
                <Text style={[styles.backText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Back</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.brandContainer}>
          <GraduationCap size={60} color={theme.colors.secondary} style={styles.logo} />
          <Text style={[styles.welcomeText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Sikola+</Text>
        </View>
        <Text style={[styles.sloganText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Join the future of learning</Text> 
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
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Sign Up</Text>

            <View style={styles.form}>
              
              <View style={styles.inputWrapper}>
                <View style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.colors.inputBg, 
                      borderColor: theme.colors.inputBorder,
                      borderRadius: theme.borderRadius.m,
                    },
                    isNameFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
                ]}>
                  <User 
                    color={isNameFocused ? theme.colors.secondary : theme.colors.textSecondary} 
                    size={20} 
                    style={styles.icon} 
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Full Name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <View style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.colors.inputBg, 
                      borderColor: theme.colors.inputBorder,
                      borderRadius: theme.borderRadius.m,
                    },
                    isEmailFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
                ]}>
                  <Mail 
                    color={isEmailFocused ? theme.colors.secondary : theme.colors.textSecondary} 
                    size={20} 
                    style={styles.icon} 
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Email"
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
                <View style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.colors.inputBg, 
                      borderColor: theme.colors.inputBorder,
                      borderRadius: theme.borderRadius.m,
                    },
                    isPasswordFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
                ]}>
                  <Lock 
                    color={isPasswordFocused ? theme.colors.secondary : theme.colors.textSecondary} 
                    size={20} 
                    style={styles.icon} 
                  />
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
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff color={theme.colors.textSecondary} size={20} />
                    ) : (
                      <Eye color={theme.colors.textSecondary} size={20} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

               <View style={styles.inputWrapper}>
                <View style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: theme.colors.inputBg, 
                      borderColor: theme.colors.inputBorder,
                      borderRadius: theme.borderRadius.m,
                    },
                    isConfirmFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
                ]}>
                  <CheckCircle 
                    color={isConfirmFocused ? theme.colors.secondary : theme.colors.textSecondary} 
                    size={20} 
                    style={styles.icon} 
                  />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Confirm Password"
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
                style={styles.termsContainer} 
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.8}
              >
                  {agreeTerms ? (
                      <CheckSquare color={theme.colors.secondary} size={24} />
                  ) : (
                      <Square color={theme.colors.textSecondary} size={24} />
                  )}
                  <Text style={[styles.termsText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                      I agree to the <Text style={{ color: theme.colors.secondary, fontWeight: 'bold', fontFamily: theme.typography.fontFamily }}>Terms</Text>
                  </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.buttonContainer, !agreeTerms && { opacity: 0.6 }, { shadowColor: theme.colors.secondary }]} 
                activeOpacity={agreeTerms ? 0.8 : 1}
                onPress={() => {
                    if(agreeTerms) navigation.navigate('MainApp');
                }}
              >
                 <LinearGradient
                  colors={isDark ? [theme.colors.secondary, '#CFCB11'] : [theme.colors.secondary, '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.signUpButton}
                >
                  <Text style={[styles.signUpButtonText, { color: theme.colors.textContrast, fontFamily: theme.typography.fontFamily }]}>Sign Up</Text>
                  <ArrowRight color={theme.colors.textContrast} size={24} style={{ marginLeft: 10 }} />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                 <Text style={[styles.loginText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Already have an account? </Text>
                 <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={[styles.loginLink, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Login</Text>
                 </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
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
  },
  logo: {
      marginBottom: 5,
  },
  welcomeText: {
    fontSize: 28, 
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sloganText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 15,
    height: 55,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  termsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 5,
  },
  termsText: {
      marginLeft: 10,
      fontSize: 14,
  },
   buttonContainer: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 5,
    marginBottom: 20,
  },
  signUpButton: {
    borderRadius: 32,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
