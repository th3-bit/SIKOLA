import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GraduationCap, ChevronLeft, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { Alert, ActivityIndicator } from 'react-native';

export default function VerifyEmailScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const userEmail = route.params?.email || '';
  const inputs = useRef([]);

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
      Alert.alert('Error', 'Please enter the 8-digit code');
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
        const resetMsg = 'Code verified successfully! You can now set a new password.';
        if (Platform.OS === 'web') {
          alert(resetMsg);
          navigation.navigate('ResetPassword');
        } else {
          Alert.alert('Email Verified', resetMsg, [{ text: 'Set New Password', onPress: () => navigation.navigate('ResetPassword') }]);
        }
      } else {
        const verifyMsg = 'Your account has been successfully verified! You can now log in.';
        if (Platform.OS === 'web') {
          alert(verifyMsg);
          navigation.navigate('Login');
        } else {
          Alert.alert('Email Verified', verifyMsg, [{ text: 'Login', onPress: () => navigation.navigate('Login') }]);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Verification Failed', error.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackspace = (key, index) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
          inputs.current[index - 1].focus();
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
                <Text style={[styles.backText, { color: theme.colors.textPrimary }]}>Back</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.brandContainer}>
          <GraduationCap size={60} color={theme.colors.secondary} style={styles.logo} />
        </View>
        <Text style={[styles.sloganText, { color: theme.colors.textSecondary }]}>Verify your email</Text> 
      </SafeAreaView>

      <View style={[styles.bottomSection, { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.borderRadius.l, borderTopRightRadius: theme.borderRadius.l }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
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
                      <ArrowRight color={theme.colors.textContrast} size={24} style={{ marginLeft: 10 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

               <TouchableOpacity style={styles.resendContainer}>
                  <Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>Didn't receive code? </Text>
                  <Text style={[styles.resendLink, { color: theme.colors.secondary }]}>Resend</Text>
               </TouchableOpacity>

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
  otpContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 30,
      paddingHorizontal: 0,
  },
  otpInput: {
      width: 38,
      height: 55,
      borderWidth: 1,
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
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
  resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
  },
  resendText: {
      fontSize: 14,
  },
  resendLink: {
      fontWeight: 'bold',
      fontSize: 14,
  }
});
