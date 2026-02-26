import React, { useState, useEffect } from 'react';
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
} from 'react-native';
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

export default function PaymentScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { refreshData } = useProgress();
  const { plan, topic, subject } = route.params || {};
  
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

  // Helper to parse complex PawaPay/Edge Function errors into human-readable strings
  const parsePaymentError = (error, currentMethod = paymentMethod, num = phoneNumber) => {
    if (!error) return 'An unexpected error occurred. Please try again.';
    
    // 1. Handle string errors (some might be JSON strings)
    let errorMessage = typeof error === 'string' ? error : (error.message || JSON.stringify(error));

    // Handle "Wrong Telco" or "Missing Wallet" errors with specific suggestions as requested by user
    const isTelcoError = 
      errorMessage.includes('does not have a mobile money wallet') || 
      errorMessage.includes('does not belong to the telco') ||
      errorMessage.includes('OTHER_ERROR'); // Custom handling if needed for unspecified telco errors

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
      console.log('Error parsing JSON error message:', e);
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
          console.log('Payment Status Update:', newStatus);

          if (newStatus === 'COMPLETED') {
            console.log('PaymentScreen: Payment COMPLETED, triggering refresh...');
            refreshData(); // Refresh context to unlock courses immediately
            setShowPending(false);
            setModalConfig({
              type: 'success',
              title: 'Payment Successful',
              message: `Your "${plan?.name}" plan is now active! Enjoy your learning journey with Sikola+.`,
              actionText: 'Start Learning',
              onAction: () => navigation.replace('MainApp')
            });
            setShowStatusModal(true);
          } else if (newStatus === 'FAILED' || newStatus === 'CANCELLED' || newStatus === 'EXPIRED') {
            setShowPending(false);
            const userFriendlyError = parsePaymentError(payload.new.error_message);
            setModalConfig({
              type: 'error',
              title: 'Payment Failed',
              message: userFriendlyError,
              actionText: 'Try Again',
              onAction: () => setShowStatusModal(false)
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
      console.log('Initiating PawaPay deposit for:', fullPhoneNumber);
      
      const { data, error } = await supabase.functions.invoke('pawapay-deposit', {
        body: {
          planId: plan.id,
          phoneNumber: fullPhoneNumber,
          countryIso: selectedCountry.iso,
          paymentMethod: paymentMethod,
          topicId: topic?.id || null,
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
      console.error('---- PAYMENT INVOCATION ERROR ----');
      console.error('Message:', error.message);
      if (error.context) console.error('Context:', JSON.stringify(error.context));
      console.error('-----------------------------------');
      
      
      // Use StatusModal for a better error experience
      const userFriendlyError = parsePaymentError(error);
      setModalConfig({
        type: 'error',
        title: 'Payment Encountered an Issue',
        message: userFriendlyError,
        actionText: 'I Understand',
        onAction: () => setShowStatusModal(false)
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
        console.log("Error pre-filling phone:", err);
      }
    };

    fetchUserProfile();
  }, []);

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
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              Complete Payment
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Choose your payment method
            </Text>
          </View>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
          {/* Plan Summary */}
          <View style={[styles.summaryCard, { 
            backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
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

          {/* Payment Methods */}
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
                  <Smartphone size={24} color="#000" />
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
                <CheckCircle size={24} color="#FFCC00" />
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
                  <Smartphone size={24} color="#FFF" />
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
                <CheckCircle size={24} color="#FF0000" />
              )}
            </View>
          </TouchableOpacity>

          {/* Phone Number Input */}
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Phone Number
          </Text>
          <View style={[styles.inputContainer, { 
            backgroundColor: isDark ? 'rgba(25, 25, 25, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' 
          }]}>
            <View style={styles.phoneInputContent}>
              <TouchableOpacity 
                style={[styles.countrySelector, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                onPress={() => setShowCountryPicker(true)}
              >
                <Image 
                  source={{ uri: `https://flagcdn.com/w40/${selectedCountry.iso}.png` }}
                  style={{ width: 24, height: 16, borderRadius: 2 }} 
                />
                <Text style={[styles.phonePrefix, { color: theme.colors.textPrimary }]}>{selectedCountry.code}</Text>
                <ChevronDown size={14} color={theme.colors.textSecondary} />
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

          {/* Country Picker Modal */}
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
                paddingTop: 40,
                paddingBottom: 40
              }]}>
                 <ActivityIndicator size="large" color={theme.colors.secondary} style={{ marginBottom: 20, transform: [{ scale: 1.5 }] }} />
                 <Text style={[styles.modalTitle, { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 10, fontSize: 22 }]}>Payment in Progress</Text>
                 <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', fontSize: 16, lineHeight: 24, paddingHorizontal: 20 }}>
                   Please check your phone ({selectedCountry.code} {phoneNumber}) and authorize the transaction.
                 </Text>
                 
                 {showTroubleshoot ? (
                    <View style={styles.troubleshootContainer}>
                       <Clock size={20} color="#FACC15" />
                       <Text style={styles.troubleshootText}>
                         Still waiting? Ensure your phone is nearby, has signal, and sufficient balance. You can also try again with a different number.
                       </Text>
                    </View>
                 ) : (
                    <View style={{ marginTop: 30, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(250, 204, 21, 0.1)', borderRadius: 12 }}>
                       <Text style={{ color: '#FACC15', fontWeight: 'bold' }}>Waiting response ({pendingTimer}s)...</Text>
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

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Shield size={16} color={theme.colors.secondary} />
            <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
              Your payment is secure and encrypted
            </Text>
          </View>

          <View style={{ height: 20 }} />
          </ScrollView>

          {/* Fixed Footer with Pay Button */}
          <View style={[styles.footer, { 
            backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderTopColor: theme.colors.glassBorder 
          }]}>
            <TouchableOpacity
              onPress={handlePayment}
              disabled={loading}
              style={[
                styles.payButton,
                { backgroundColor: paymentMethod === 'airtel' ? '#EF4444' : theme.colors.secondary },
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
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    marginTop: 4,
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    overflow: 'hidden',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  paymentMethod: {
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  paymentMethodActive: {
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentMethodDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  inputContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  phonePrefix: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 12,
    borderRightWidth: 1,
    marginRight: 4,
  },
  countryFlag: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '70%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '700',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 12,
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  payButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
   payButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
  },
  troubleshootContainer: {
    marginTop: 24,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
  },
  troubleshootText: {
    flex: 1,
    color: '#FACC15',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  cancelLink: {
    marginTop: 32,
    padding: 12,
  },
  cancelLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20, // SafeAreaView handles bottom inset on iOS
    borderTopWidth: 1,
  },
});
