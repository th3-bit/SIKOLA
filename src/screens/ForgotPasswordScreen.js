import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ChevronLeft, ArrowRight, KeyRound } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      setOtpSent(true);
      
      const message = 'A 6-digit verification code has been sent to your email (' + email + ').';
      
      if (Platform.OS === 'web') {
        alert(message);
        navigation.navigate('VerifyEmail', { email: email, type: 'recovery' });
      } else {
        Alert.alert(
          'OTP Sent',
          message,
          [{ text: 'Enter Code', onPress: () => navigation.navigate('VerifyEmail', { email: email, type: 'recovery' }) }]
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

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
                <Text style={[styles.backText, { color: theme.colors.textPrimary }]}>Back to login</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.brandContainer}>
          <KeyRound size={60} color={theme.colors.secondary} style={styles.logo} />
        </View>
        <Text style={[styles.sloganText, { color: theme.colors.textSecondary }]}>Recover your account</Text> 
      </SafeAreaView>

      <View style={[styles.bottomSection, { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.borderRadius.l, borderTopRightRadius: theme.borderRadius.l }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>Forgot Password</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                Enter the email address associated with your account and we'll send you a link to reset your password.
            </Text>

            <View style={styles.form}>
              
              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, borderRadius: theme.borderRadius.m }]}>
                  <Mail color={theme.colors.textSecondary} size={20} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="Email Address"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
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
                      <Text style={[styles.submitButtonText, { color: theme.colors.textContrast }]}>
                        {otpSent ? 'Resend OTP' : 'Send OTP'}
                      </Text>
                      <ArrowRight color={theme.colors.textContrast} size={24} style={{ marginLeft: 10 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.footer}>
                 <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={[styles.linkText, { color: theme.colors.secondary }]}>Login</Text>
                 </TouchableOpacity>
                 <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>  |  </Text>
                 <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                    <Text style={[styles.linkText, { color: theme.colors.secondary }]}>Sign Up</Text>
                 </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
    marginBottom: 25,
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
  footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
      marginBottom: 20,
      alignItems: 'center',
  },
  footerText: {
      fontSize: 16,
  },
  linkText: {
      fontSize: 16,
      fontWeight: 'bold',
  }
});
