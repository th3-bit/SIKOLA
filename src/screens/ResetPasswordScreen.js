import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, ChevronLeft, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { Alert, ActivityIndicator } from 'react-native';
import StatusModal from '../components/StatusModal';

export default function ResetPasswordScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ type: 'success', title: '', message: '', actionText: 'Continue' });

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

    if (password.length < 6) {
      setModalConfig({
        type: 'error',
        title: 'Weak Password',
        message: 'Your password must be at least 6 characters long for security.',
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

      setModalConfig({
        type: 'success',
        title: 'Success!',
        message: 'Your password has been reset successfully. You can now log in with your new credentials.',
        actionText: 'Back to Login'
      });
      setShowModal(true);
    } catch (error) {
      console.error('Password reset error:', error);
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
          <CheckCircle size={60} color={theme.colors.secondary} style={styles.logo} />
        </View>
        <Text style={[styles.sloganText, { color: theme.colors.textSecondary }]}>Secure your account</Text> 
      </SafeAreaView>

      <View style={[styles.bottomSection, { backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.borderRadius.l, borderTopRightRadius: theme.borderRadius.l }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <Text style={[styles.formTitle, { color: theme.colors.textPrimary }]}>New Password</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                Create a new strong password for your account.
            </Text>

            <View style={styles.form}>
              
               {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder, borderRadius: theme.borderRadius.m }]}>
                  <Lock color={theme.colors.textSecondary} size={20} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textPrimary }]}
                    placeholder="New Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
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
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Status Modal */}
      <StatusModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAction={() => {
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
});
