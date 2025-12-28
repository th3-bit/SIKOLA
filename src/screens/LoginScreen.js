import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraduationCap, Facebook, Apple, Chrome, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Focus States
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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
        <View style={styles.brandContainer}>
          <GraduationCap size={60} color={theme.colors.secondary} style={styles.logo} />
          <Text style={[styles.welcomeText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Sikola+</Text>
          <Text style={[styles.subWelcomeText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Welcome Student</Text>
          <Text style={[styles.sloganText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Unlock your potential today</Text>
        </View>
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
          <ScrollView 
             contentContainerStyle={styles.scrollContent} 
             showsVerticalScrollIndicator={false}
             keyboardShouldPersistTaps="handled"
          >
            
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Login</Text>

            <View style={styles.form}>
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
                <View style={[
                     styles.inputContainer,
                     { 
                       backgroundColor: theme.colors.inputBg, 
                       borderColor: theme.colors.inputBorder,
                       borderRadius: theme.borderRadius.m,
                     },
                     isPasswordFocused && { borderColor: theme.colors.secondary, backgroundColor: isDark ? 'rgba(240, 236, 29, 0.03)' : 'rgba(37, 99, 235, 0.03)' }
                ]}>
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.forgotPassword} onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={[styles.forgotPasswordText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.buttonContainer, { shadowColor: theme.colors.secondary }]} 
                activeOpacity={0.8}
                onPress={() => navigation.replace('MainApp')}
              >
                <LinearGradient
                  colors={isDark ? [theme.colors.secondary, '#CFCB11'] : [theme.colors.secondary, '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginButton}
                >
                  <Text style={[styles.loginButtonText, { color: theme.colors.textContrast, fontFamily: theme.typography.fontFamily }]}>Log In</Text>
                  <ArrowRight color={theme.colors.textContrast} size={24} style={{ marginLeft: 10 }} />
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
                <Text style={[styles.dividerText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Or login with</Text>
                <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                  <Facebook color={theme.colors.textPrimary} size={20} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                  <Chrome color={theme.colors.textPrimary} size={20} /> 
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
                   <Apple color={theme.colors.textPrimary} size={20} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.footer}>
                 <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Don't have an account? </Text>
                 <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                    <Text style={[styles.linkText, { color: theme.colors.secondary, fontFamily: theme.typography.fontFamily }]}>Sign Up</Text>
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
    height: '40%', 
  },
  topSection: {
    height: '35%', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  logo: {
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 36, 
    fontWeight: 'bold',
  },
  subWelcomeText: {
    fontSize: 16,
    marginTop: 2,
  },
  sloganText: {
    fontSize: 14,
    marginTop: 5,
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
  input: {
    flex: 1,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20, 
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 20, 
  },
  loginButton: {
    borderRadius: 32,
    height: 56, 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15, 
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20, 
  },
  socialButton: {
    width: 45, 
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
  },
  linkText: {
      fontWeight: 'bold',
  }
});
