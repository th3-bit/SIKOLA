import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  CheckCircle,
  Clock,
  Shield,
  ChevronDown,
  Globe,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';

import CountrySelectorModal from '../components/CountrySelectorModal';
import PaymentValidationModal from '../components/PaymentValidationModal';
import StatusModal from '../components/StatusModal';
import { COUNTRIES } from '../constants/CountryList';
import { useFocusEffect } from '@react-navigation/native';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

export default function PaymentScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { refreshData } = useProgress();
  const { plan, topic, subject, course } = route.params || {};
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('momo'); // 'momo' or 'airtel'

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [depositId, setDepositId] = useState(null);
  
  // Pending Modal Timer State
  const [pendingTimer, setPendingTimer] = useState(60);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Status Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'success',
    title: '',
    message: '',
    actionText: 'Continue',
    onAction: null
  });

  // Tracks the last failure so the recovery card can show contextual help
  // Types: null | 'telco' | 'insufficient' | 'timeout' | 'cancelled' | 'generic'
  const [lastError, setLastError] = useState(null);

  // Block hardware back button while payment is pending to prevent accidental exits
  useFocusEffect(
    React.useCallback(() => {
      const onHardwareBack = () => {
        if (showPending) {
          // Don't allow back during an active payment — user must wait or cancel
          return true;
        }
        navigation.goBack();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      return () => sub.remove();
    }, [navigation, showPending])
  );

  // Classify a raw error string into one of our recovery-card categories
  const classifyError = (msg = '') => {
    const m = msg.toLowerCase();
    if (m.includes('telco') || m.includes('wallet') || m.includes('belong') || m.includes('rejection reason unknown') || m.includes('rejected')) return 'telco';
    if (m.includes('insufficient') || m.includes('balance'))                  return 'insufficient';
    if (m.includes('timeout') || m.includes('expired') || m.includes('timed')) return 'timeout';
    if (m.includes('cancel'))                                                  return 'cancelled';
    return 'generic';
  };

  // Check if the phone number prefix matches the selected payment provider (Rwanda-specific)
  // Returns null if valid, or an error message string if there's a mismatch.
  const validatePhoneProvider = (number, method) => {
    if (!number || number.length < 2) return null; // Not enough digits to check
    const prefix = number.replace(/^0+/, '').substring(0, 2); // e.g. '78', '73'
    const MTN_PREFIXES    = ['78', '79'];
    const AIRTEL_PREFIXES = ['72', '73', '75'];

    if (method === 'momo' && AIRTEL_PREFIXES.includes(prefix) && !MTN_PREFIXES.includes(prefix)) {
      return `This looks like an Airtel number (07${prefix}x). Please switch to Airtel Money or enter your MTN number (078xx / 079xx).`;
    }
    if (method === 'airtel' && MTN_PREFIXES.includes(prefix) && !AIRTEL_PREFIXES.includes(prefix)) {
      return `This looks like an MTN number (07${prefix}x). Please switch to MTN MoMo or enter your Airtel number (072xx / 073xx / 075xx).`;
    }
    return null; // OK
  };

  // Helper to parse complex PawaPay/Edge Function errors into human-readable strings
  const parsePaymentError = (error, currentMethod = paymentMethod, num = phoneNumber) => {
    if (!error) return 'An unexpected error occurred. Please try again.';
    
    // 1. Handle string errors (some might be JSON strings)
    let errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));

    // Handle "Wrong Telco" or "Missing Wallet" errors with specific suggestions as requested by user
    const isTelcoError = 
      errorMessage.includes('does not have a mobile money wallet') || 
      errorMessage.includes('does not belong to the telco') ||
      errorMessage.includes('OTHER_ERROR');

    // PawaPay "Rejection reason unknown" almost always means wrong provider or sandbox mode
    const isRejectionUnknown =
      errorMessage.toLowerCase().includes('rejection reason unknown') ||
      errorMessage.toLowerCase().includes('rejected: rejection');

    if (isRejectionUnknown) {
      const selectedTelco   = currentMethod === 'momo' ? 'MTN MoMo' : 'Airtel Money';
      const alternativeTelco = currentMethod === 'momo' ? 'Airtel Money' : 'MTN MoMo';
      return `Your ${selectedTelco} payment was rejected by the network. This usually means the phone number doesn't belong to ${selectedTelco}. Try switching to ${alternativeTelco} or enter a different number.`;
    }

    if (isTelcoError) {
      const selectedTelco = currentMethod === 'momo' ? 'MTN' : 'Airtel';
      const alternativeTelco = currentMethod === 'momo' ? 'Airtel' : 'MTN';
      return `This phone number ${num} does not belong to ${selectedTelco} Money or does not have ${selectedTelco} Money wallet. Change from ${selectedTelco} to ${alternativeTelco} and try again to see if it can work.`;
    }

    try {
      // 2. Attempt to parse as JSON if it looks like a PawaPay response
      if (errorMessage.includes('{') && errorMessage.includes('}')) {
        const parsed = JSON.parse(errorMessage);
        
        // PawaPay standard failure object
        if (parsed.failureReason) {
          const msg = parsed.failureReason.failureMessage || '';
          if (msg.includes('does not have a mobile money wallet') || msg.includes('does not belong to the telco')) {
             const selectedTelco = currentMethod === 'momo' ? 'MTN' : 'Airtel';
             const alternativeTelco = currentMethod === 'momo' ? 'Airtel' : 'MTN';
             return `This phone number ${num} does not belong to ${selectedTelco} Money or does not have ${selectedTelco} Money wallet. Change from ${selectedTelco} to ${alternativeTelco} and try again to see if it can work.`;
          }
          return msg || 'The transaction was declined by the provider.';
        }
        
        // Custom error object from Edge Function
        if (parsed.error) return parsed.error;
      }
    } catch (e) {
      // Not JSON, continue with string processing
      logger.log('Error parsing JSON error message:', e);
    }

    // 3. Map common technical keywords to friendly language
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('insufficient')) return 'Your mobile wallet has insufficient funds for this transaction.';
    if (lowerError.includes('timeout') || lowerError.includes('expired')) return 'The payment request timed out. Please try again.';
    if (lowerError.includes('cancelled') || lowerError.includes('canceled')) return 'You have cancelled the transaction on your phone.';
    if (lowerError.includes('duplicate')) return 'A similar transaction is already in progress. Please wait a moment.';
    if (lowerError.includes('network') || lowerError.includes('connectivity')) return 'Network error. Please ensure your phone has a stable signal and try again.';
    if (lowerError.includes('blocked') || lowerError.includes('restricted')) return 'This transaction was blocked by the mobile provider.';

    // Fallback to original if relatively short, otherwise a generic message
    return errorMessage.length < 100 ? errorMessage : 'The payment failed due to a technical issue. Please try again or use a different number.';
  };

  // Listen for Payment Status Updates via Realtime
  useEffect(() => {
    if (!showPending || !depositId) return;

    const channel = supabase
      .channel('pawapay-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pawapay_transactions',
          filter: `external_id=eq.${depositId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          logger.log('Payment Status Update:', newStatus);

          if (newStatus === 'COMPLETED') {
            logger.log('PaymentScreen: Payment COMPLETED, triggering refresh...');
            // FIX 2: Explicitly call refreshData (now properly exported from ProgressContext).
            // The Realtime listener in ProgressContext will also auto-trigger, but this
            // ensures a refresh even if the channel hasn't connected yet.
            if (typeof refreshData === 'function') refreshData(true);
            setShowPending(false);
            setModalConfig({
              type: 'success',
              title: 'Payment Successful',
              message: `Your "${plan?.name}" plan is now active! Enjoy your learning journey with Sikola+.`,
              actionText: 'Start Learning',
              onAction: () => setTimeout(() => {
                // Per course only: navigate directly to the course the user just unlocked.
                // Two flows reach PaymentScreen for per_course:
                //   1. SubjectsScreen → Payment: params include `topic` (full object) + `subject`
                //   2. Search → Lock modal → Subscription → Payment: params include `course` (id + title only)
                // We use topic || course so both flows land on LessonDetail.
                if (plan?.plan_type === 'per_course') {
                  const lessonTarget = topic || course;
                  if (lessonTarget) {
                    navigation.replace('LessonDetail', {
                      lesson: lessonTarget,
                      subject: subject || null,
                    });
                    return;
                  }
                }
                // All other plan types (daily / weekly / monthly) → Home tab
                navigation.replace('MainApp');
              }, 300)
            });
            setShowStatusModal(true);
          } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
            setShowPending(false);
            const rawMsg = payload.new.error_message || '';
            const userFriendlyError = parsePaymentError(rawMsg);
            const errorType = classifyError(rawMsg);
            setModalConfig({
              type: 'error',
              title: 'Payment Failed',
              message: userFriendlyError,
              actionText: 'Try Again',
              onAction: () => {
                setShowStatusModal(false);
                setLastError(errorType); // ← show recovery card
              }
            });
            setShowStatusModal(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showPending, depositId, plan, navigation]);

  // Pending Timer Logic
  useEffect(() => {
    let interval;
    if (showPending && pendingTimer > 0) {
      interval = setInterval(() => {
        setPendingTimer((prev) => prev - 1);
      }, 1000);
    } else if (pendingTimer === 0) {
      setShowTroubleshoot(true);
    }

    if (!showPending) {
      setPendingTimer(60);
      setShowTroubleshoot(false);
    }

    return () => clearInterval(interval);
  }, [showPending, pendingTimer]);

  const handlePayment = async () => {
    // Basic validation: enforce exactly 9 digits
    if (!phoneNumber || phoneNumber.length !== 9) {
      setShowValidationModal(true);
      return;
    }

    // Provider prefix validation — catch wrong-network numbers before hitting PawaPay
    const providerError = validatePhoneProvider(phoneNumber, paymentMethod);
    if (providerError) {
      setModalConfig({
        type: 'error',
        title: 'Wrong Payment Provider',
        message: providerError,
        actionText: 'Got it',
        onAction: () => {
          setShowStatusModal(false);
          setLastError('telco');
        }
      });
      setShowStatusModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        navigation.navigate('Login');
        return;
      }

      // Clean phone number (remove leading zeros)
      const cleanPhone = phoneNumber.replace(/^0+/, '');
      const fullPhoneNumber = `${selectedCountry.code}${cleanPhone}`.replace('+', ''); // PawaPay often prefers digits only

      // Update user profile with latest phone number
      await supabase
        .from('profiles')
        .update({ phone: `+${fullPhoneNumber}` })
        .eq('id', user.id);

      // Call Edge Function to initiate PawaPay deposit
      logger.log('Initiating PawaPay deposit for:', fullPhoneNumber);
      
      const { data, error } = await supabase.functions.invoke('pawapay-deposit', {
        body: {
          planId: plan.id,
          phoneNumber: fullPhoneNumber,
          countryIso: selectedCountry.iso,
          paymentMethod: paymentMethod,
          topicId: topic?.id || course?.id || null,
          subjectId: subject?.id || topic?.subject_id || null,
          amount: Math.ceil(plan.price * selectedCountry.rate),
          currency: selectedCountry.currency,
        }
      });
      if (error) {
        // If Supabase returns an error physically (non-200), parse it
        const errorDetail = error.context?.json?.error || error.message;
        throw new Error(errorDetail);
      }

      if (data?.success === false || data?.error) {
        // If our function caught an error and returned it as 200 OK
        throw new Error(data.error || 'The payment server returned an unspecified error.');
      }

      if (data?.depositId) {
        setDepositId(data.depositId);
        setLoading(false);
        setShowPending(true);
      } else {
        throw new Error('No transaction ID received from server. Please try again.');
      }

    } catch (error) {
      logger.error('---- PAYMENT INVOCATION ERROR ----');
      logger.error('Message:', error.message);
      if (error.context) logger.error('Context:', JSON.stringify(error.context));
      logger.error('-----------------------------------');
      
      
      // Use StatusModal for a better error experience
      const userFriendlyError = parsePaymentError(error);
      const errorType = classifyError(error.message || '');
      setModalConfig({
        type: 'error',
        title: 'Payment Encountered an Issue',
        message: userFriendlyError,
        actionText: 'I Understand',
        onAction: () => {
          setShowStatusModal(false);
          setLastError(errorType); // ← show recovery card
        }
      });
      setShowStatusModal(true);
      setLoading(false);
    }
  };

  // Pre-fill User Info
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', user.id)
            .single();

           if (profile && profile.phone) {
            // Parse Phone Number
            // Identify country code from the start of the string
            const foundCountry = COUNTRIES.find(c => profile.phone.startsWith(c.code));
            
            if (foundCountry) {
              setSelectedCountry(foundCountry);
              // Extract the number part
              const numberPart = profile.phone.replace(foundCountry.code, '');
              const cleanNumber = numberPart.trim(); // Ensure no leading spaces
              setPhoneNumber(cleanNumber);
            }
          }
        }
      } catch (err) {
        logger.log("Error pre-filling phone:", err);
      }
    };

    fetchUserProfile();
  }, []);
  const renderOrderSummary = () => (
    <View style={[styles.summaryCard, { 
      backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)' 
    }]}>
      <Text style={[styles.summaryTitle, { color: theme.colors.textPrimary }]}>
        Order Summary
      </Text>
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
          Plan
        </Text>
        <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
          {plan?.name}
        </Text>
      </View>
      {topic && (
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Topic
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {topic.title}
          </Text>
        </View>
      )}
      {!topic && course && (
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Course
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {course.title}
          </Text>
        </View>
      )}
      <View style={styles.summaryRow}>
        <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
          Duration
        </Text>
        <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
          {plan?.duration_hours < 24 ? `${plan?.duration_hours} hours` : `${plan?.duration_hours / 24} days`}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />
      <View style={styles.summaryRow}>
        <Text style={[styles.totalLabel, { color: theme.colors.textPrimary }]}>
          Total Amount
        </Text>
        <Text style={[styles.totalValue, { color: theme.colors.secondary }]}>
          {selectedCountry.currency} {Math.ceil(plan?.price * selectedCountry.rate).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderPaymentMethods = () => (
    <>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Select Payment Method
      </Text>

      <TouchableOpacity
        onPress={() => setPaymentMethod('momo')}
        style={[
          styles.paymentMethod,
          paymentMethod === 'momo' && styles.paymentMethodActive,
          { borderColor: paymentMethod === 'momo' ? '#FFCC00' : theme.colors.glassBorder }
        ]}
      >
        <View style={[styles.paymentMethodContent, { 
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)' 
        }]}>
          <View style={styles.paymentMethodLeft}>
            <View style={[styles.paymentIcon, { backgroundColor: '#FFCC00' }]}>
              <Smartphone size={scale(24)} color="#000" />
            </View>
            <View>
              <Text style={[styles.paymentMethodName, { color: theme.colors.textPrimary }]}>
                MTN Mobile Money
              </Text>
              <Text style={[styles.paymentMethodDesc, { color: theme.colors.textSecondary }]}>
                Pay with MTN MoMo
              </Text>
            </View>
          </View>
          {paymentMethod === 'momo' && (
            <CheckCircle size={scale(24)} color="#FFCC00" />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setPaymentMethod('airtel')}
        style={[
          styles.paymentMethod,
          paymentMethod === 'airtel' && styles.paymentMethodActive,
          { borderColor: paymentMethod === 'airtel' ? '#FF0000' : theme.colors.glassBorder }
        ]}
      >
        <View style={[styles.paymentMethodContent, { 
          backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)' 
        }]}>
          <View style={styles.paymentMethodLeft}>
            <View style={[styles.paymentIcon, { backgroundColor: '#FF0000' }]}>
              <Smartphone size={scale(24)} color="#FFF" />
            </View>
            <View>
              <Text style={[styles.paymentMethodName, { color: theme.colors.textPrimary }]}>
                Airtel Money
              </Text>
              <Text style={[styles.paymentMethodDesc, { color: theme.colors.textSecondary }]}>
                Pay with Airtel Money
              </Text>
            </View>
          </View>
          {paymentMethod === 'airtel' && (
            <CheckCircle size={scale(24)} color="#FF0000" />
          )}
        </View>
      </TouchableOpacity>
    </>
  );

  const renderPhoneNumberInput = () => (
    <>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Phone Number
      </Text>
      <View style={[styles.inputContainer, { 
        backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)' 
      }]}>
        <View style={styles.phoneInputContent}>
          <TouchableOpacity 
            style={[styles.countrySelector, { borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.1)' }]}
            onPress={() => setShowCountryPicker(true)}
          >
            <Image 
              source={{ uri: `https://flagcdn.com/w40/${selectedCountry.iso}.png` }}
              style={{ width: scale(24), height: scale(16), borderRadius: scale(2) }} 
            />
            <Text style={[styles.phonePrefix, { color: theme.colors.textPrimary }]}>{selectedCountry.code}</Text>
            <ChevronDown size={moderateScale(14)} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary }]}
            placeholder="7X XXX XXX"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
            maxLength={9}
          />
        </View>
      </View>
    </>
  );

  const renderRecoveryCard = () => {
    if (!lastError) return null;
    return (
      <View style={[styles.recoveryCard, {
        backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.07)',
        borderColor: 'rgba(239,68,68,0.3)',
      }]}>
        <Text style={[styles.recoveryTitle, { color: '#EF4444' }]}>
          💡 Recovery Options
        </Text>

        {lastError === 'telco' && (
          <>
            <Text style={[styles.recoveryDesc, { color: theme.colors.textSecondary }]}>
              This number may not belong to {paymentMethod === 'momo' ? 'MTN' : 'Airtel'}.
              Try switching providers or enter a different number.
            </Text>
            <TouchableOpacity
              style={[styles.recoveryBtn, { backgroundColor: paymentMethod === 'momo' ? '#FF0000' : '#FFCC00' }]}
              onPress={() => {
                setPaymentMethod(paymentMethod === 'momo' ? 'airtel' : 'momo');
                setLastError(null);
              }}
            >
              <Text style={[styles.recoveryBtnText, { color: paymentMethod === 'momo' ? '#FFF' : '#000' }]}>
                Switch to {paymentMethod === 'momo' ? 'Airtel Money' : 'MTN MoMo'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {lastError === 'insufficient' && (
          <Text style={[styles.recoveryDesc, { color: theme.colors.textSecondary }]}>
            Your wallet has insufficient funds. Top up your {paymentMethod === 'momo' ? 'MTN MoMo' : 'Airtel Money'} account and try again, or use a different number.
          </Text>
        )}

        {lastError === 'timeout' && (
          <Text style={[styles.recoveryDesc, { color: theme.colors.textSecondary }]}>
            No response was received. Make sure your phone has a strong signal, then tap Pay again. Or change your phone number below.
          </Text>
        )}

        {lastError === 'cancelled' && (
          <Text style={[styles.recoveryDesc, { color: theme.colors.textSecondary }]}>
            You cancelled the payment on your phone. When you're ready, tap Pay again to retry.
          </Text>
        )}

        {lastError === 'generic' && (
          <Text style={[styles.recoveryDesc, { color: theme.colors.textSecondary }]}>
            Something went wrong. You can try again with the same number, switch providers, or contact support if the issue persists.
          </Text>
        )}

        <TouchableOpacity onPress={() => setLastError(null)} style={styles.recoverDismiss}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: moderateScale(12) }}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSecurityNotice = () => (
    <View style={styles.securityNotice}>
      <Shield size={scale(16)} color={theme.colors.secondary} />
      <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
        Your payment is secure and encrypted
      </Text>
    </View>
  );

  const renderPayButton = (marginTop = 0) => (
    <TouchableOpacity
      onPress={handlePayment}
      disabled={loading}
      style={[
        styles.payButton,
        { 
          backgroundColor: paymentMethod === 'airtel' ? '#EF4444' : theme.colors.secondary,
          marginTop: verticalScale(marginTop)
        },
        loading && { opacity: 0.6 }
      ]}
    >
      <LinearGradient
        colors={paymentMethod === 'airtel' ? ['#EF4444', '#B91C1C'] : ['#FACC15', '#F59E0B']}
        style={styles.payButtonGradient}
      >
        <Text style={[styles.payButtonText, { color: paymentMethod === 'airtel' ? '#FFF' : '#000' }]}>
          {loading ? 'Processing...' : `Pay ${selectedCountry.currency} ${Math.ceil(plan?.price * selectedCountry.rate).toLocaleString()}`}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={moderateScale(24)} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              Complete Payment
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Choose payment method
            </Text>
          </View>

          <View style={{ width: scale(38) }} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={isLargeScreen ? styles.scrollContentLarge : styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {isLargeScreen ? (
              <View style={styles.largeScreenContainer}>
                <View style={styles.leftColumn}>
                  {renderOrderSummary()}
                  {renderRecoveryCard()}
                  {renderSecurityNotice()}
                </View>
                <BlurView 
                  intensity={20} 
                  tint={isDark ? "dark" : "light"} 
                  style={[styles.rightColumnGlass, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
                >
                  {renderPaymentMethods()}
                  {renderPhoneNumberInput()}
                  {renderPayButton(16)}
                </BlurView>
              </View>
            ) : (
              <>
                {renderOrderSummary()}
                {renderPaymentMethods()}
                {renderPhoneNumberInput()}
                {renderRecoveryCard()}
                {renderSecurityNotice()}
              </>
            )}

            {/* Modals are unaffected by layout split */}
            <CountrySelectorModal 
                  visible={showCountryPicker}
                  onClose={() => setShowCountryPicker(false)}
                  onSelect={setSelectedCountry}
                  selectedCountry={selectedCountry}
            />

            <PaymentValidationModal 
                  visible={showValidationModal}
                  onClose={() => setShowValidationModal(false)}
            />

            <StatusModal 
              visible={showStatusModal}
              onClose={() => setShowStatusModal(false)}
              type={modalConfig.type}
              title={modalConfig.title}
              message={modalConfig.message}
              actionText={modalConfig.actionText}
              onAction={modalConfig.onAction}
            />

            {/* Pending Payment Modal */}
             <Modal visible={showPending} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { 
                  backgroundColor: isDark ? '#1A1A1A' : '#FFF',
                  borderColor: theme.colors.glassBorder,
                  alignItems: 'center',
                  paddingTop: verticalScale(40),
                  paddingBottom: verticalScale(40)
                }]}>
                   <ActivityIndicator size="large" color={theme.colors.secondary} style={{ marginBottom: verticalScale(20), transform: [{ scale: scale(1.5) }] }} />
                   <Text style={[styles.modalTitle, { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: verticalScale(10), fontSize: moderateScale(22) }]}>Payment in Progress</Text>
                   <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', fontSize: moderateScale(16), lineHeight: moderateScale(24), paddingHorizontal: scale(20) }}>
                     Please check your phone ({selectedCountry.code} {phoneNumber}) and authorize the transaction.
                   </Text>
                   
                   {showTroubleshoot ? (
                      <View style={[styles.troubleshootContainer, { backgroundColor: isDark ? 'rgba(250, 204, 21, 0.1)' : '#FFFBEB' }]}>
                         <View style={styles.troubleshootInfoRow}>
                            <Clock size={scale(20)} color="#D97706" />
                            <Text style={[styles.troubleshootText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                              Still waiting? Your phone must have network coverage and sufficient balance.
                            </Text>
                         </View>
                         <View style={styles.troubleshootActions}>
                           <TouchableOpacity
                             style={[styles.troubleshootBtnPrimary, { backgroundColor: theme.colors.secondary }]}
                             onPress={() => {
                               // Reset timer and retry payment
                               setPendingTimer(60);
                               setShowTroubleshoot(false);
                               handlePayment();
                             }}
                           >
                             <Text style={[styles.troubleshootBtnText, { color: '#000' }]}>Retry Payment (Resend Prompt)</Text>
                           </TouchableOpacity>
                           
                           <View style={styles.troubleshootSecondaryRow}>
                             <TouchableOpacity
                               style={[styles.troubleshootBtn, { backgroundColor: '#10B981' }]} // Green
                               onPress={() => {
                                 setShowPending(false);
                                 setLastError('timeout');
                               }}
                             >
                               <Text style={[styles.troubleshootBtnText, { color: '#FFF' }]}>Change Number</Text>
                             </TouchableOpacity>
                             <TouchableOpacity
                               style={[styles.troubleshootBtn, { backgroundColor: '#FACC15' }]} // Yellow
                               onPress={() => {
                                 setShowPending(false);
                                 setPaymentMethod(paymentMethod === 'momo' ? 'airtel' : 'momo');
                                 setLastError('telco');
                               }}
                             >
                               <Text style={[styles.troubleshootBtnText, { color: '#000' }]}>
                                 Switch to {paymentMethod === 'momo' ? 'Airtel' : 'MTN'}
                               </Text>
                             </TouchableOpacity>
                           </View>
                         </View>
                      </View>
                   ) : (
                      <View style={{ marginTop: verticalScale(30), paddingHorizontal: scale(20), paddingVertical: verticalScale(10), backgroundColor: 'rgba(250, 204, 21, 0.1)', borderRadius: scale(12) }}>
                         <Text style={{ color: '#FACC15', fontWeight: 'bold', fontSize: moderateScale(14) }}>Waiting response ({pendingTimer}s)...</Text>
                      </View>
                   )}

                   <TouchableOpacity 
                      onPress={() => setShowPending(false)}
                      style={styles.cancelLink}
                   >
                      <Text style={[styles.cancelLinkText, { color: theme.colors.textSecondary }]}>Cancel and Try Again</Text>
                   </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <View style={{ height: verticalScale(20) }} />
          </ScrollView>

          {/* Fixed Footer with Pay Button for Mobile */}
          {!isLargeScreen && (
            <View style={[styles.footer, { 
              backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderTopColor: theme.colors.glassBorder 
            }]}>
              {renderPayButton()}
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(6),
    paddingBottom: verticalScale(10),
  },
  backButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(19),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(1),
    opacity: 0.7,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
  },
  scrollContentLarge: {
    paddingHorizontal: scale(40),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(40),
  },
  largeScreenContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(40),
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
  },
  leftColumn: {
    flex: 1,
    maxWidth: 400,
  },
  rightColumnGlass: {
    flex: 1.5,
    borderRadius: scale(24),
    borderWidth: 1,
    padding: scale(30),
  },
  summaryCard: {
    padding: scale(20),
    borderRadius: scale(20),
    borderWidth: 1,
    marginBottom: verticalScale(24),
    overflow: 'hidden',
  },
  summaryTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    marginBottom: verticalScale(16),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },
  summaryLabel: {
    fontSize: moderateScale(14),
  },
  summaryValue: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  divider: {
    height: verticalScale(1),
    marginVertical: verticalScale(12),
  },
  totalLabel: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  totalValue: {
    fontSize: moderateScale(22),
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginBottom: verticalScale(12),
    marginTop: verticalScale(8),
  },
  paymentMethod: {
    borderRadius: scale(16),
    borderWidth: 2,
    marginBottom: verticalScale(12),
  },
  paymentMethodActive: {
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(16),
    borderRadius: scale(14),
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  paymentIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  paymentMethodDesc: {
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  inputContainer: {
    borderRadius: scale(16),
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: verticalScale(16),
  },
  input: {
    flex: 1,
    padding: scale(16),
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  phoneInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scale(16),
  },
  phonePrefix: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginRight: scale(4),
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingRight: scale(12),
    borderRightWidth: 1,
    marginRight: scale(4),
  },
  countryFlag: {
    fontSize: moderateScale(20),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: scale(32),
    borderTopRightRadius: scale(32),
    padding: scale(24),
    maxHeight: '70%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
  },
  countryName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  countryCodeText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(24),
  },
  securityText: {
    fontSize: moderateScale(12),
  },
  payButton: {
    borderRadius: scale(16),
    overflow: 'hidden',
  },
  payButtonGradient: {
    paddingVertical: verticalScale(18),
    alignItems: 'center',
  },
   payButtonText: {
    color: '#000',
    fontSize: moderateScale(18),
    fontWeight: '900',
  },
  troubleshootContainer: {
    marginTop: verticalScale(24),
    padding: scale(16),
    borderRadius: scale(20),
    flexDirection: 'column',
    alignItems: 'stretch',
    marginHorizontal: scale(20),
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.2)',
  },
  troubleshootInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginBottom: verticalScale(16),
  },
  troubleshootText: {
    flex: 1,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    fontWeight: '600',
  },
  cancelLink: {
    marginTop: verticalScale(32),
    padding: scale(12),
  },
  cancelLinkText: {
    fontSize: moderateScale(14),
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(12),
    paddingBottom: Platform.OS === 'ios' ? 0 : verticalScale(20),
    borderTopWidth: 1,
  },

  // Troubleshoot action buttons inside the pending modal
  troubleshootActions: {
    flexDirection: 'column',
    gap: verticalScale(10),
    width: '100%',
  },
  troubleshootBtnPrimary: {
    width: '100%',
    borderRadius: scale(12),
    paddingVertical: verticalScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: scale(4),
    elevation: 2,
  },
  troubleshootSecondaryRow: {
    flexDirection: 'row',
    gap: scale(10),
    width: '100%',
  },
  troubleshootBtn: {
    flex: 1,
    borderRadius: scale(12),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  troubleshootBtnText: {
    fontSize: moderateScale(13),
    fontWeight: '800',
  },

  // Inline recovery card shown after a failed payment
  recoveryCard: {
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(16),
    marginBottom: verticalScale(16),
  },
  recoveryTitle: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    marginBottom: verticalScale(8),
  },
  recoveryDesc: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(12),
  },
  recoveryBtn: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  recoveryBtnText: {
    fontSize: moderateScale(14),
    fontWeight: '800',
  },
  recoverDismiss: {
    alignSelf: 'flex-end',
    paddingVertical: verticalScale(4),
    paddingHorizontal: scale(8),
  }
});

