import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

export default function PaymentScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { plan, topic } = route.params || {};
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('momo'); // 'momo' or 'airtel'

  const handlePayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number (9 digits)');
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        navigation.navigate('Login');
        return;
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + plan.duration_hours);

      // Create subscription record
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: user.id,
          plan_id: plan.id,
          topic_id: topic?.id || null,
          expires_at: expiresAt.toISOString(),
          payment_reference: `${paymentMethod.toUpperCase()}-${Date.now()}`,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      // Show success message
      Alert.alert(
        'Payment Initiated',
        `Please check your ${paymentMethod === 'momo' ? 'MTN Mobile Money' : 'Airtel Money'} phone (${phoneNumber}) to complete the payment of ${plan.price.toLocaleString()} RWF.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MainApp'),
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Plan Summary */}
          <BlurView
            intensity={isDark ? 30 : 40}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.summaryCard, { borderColor: theme.colors.glassBorder }]}
          >
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
                {plan?.price?.toLocaleString()} RWF
              </Text>
            </View>
          </BlurView>

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
            <BlurView
              intensity={isDark ? 20 : 30}
              tint={isDark ? 'dark' : 'light'}
              style={styles.paymentMethodContent}
            >
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
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMethod('airtel')}
            style={[
              styles.paymentMethod,
              paymentMethod === 'airtel' && styles.paymentMethodActive,
              { borderColor: paymentMethod === 'airtel' ? '#FF0000' : theme.colors.glassBorder }
            ]}
          >
            <BlurView
              intensity={isDark ? 20 : 30}
              tint={isDark ? 'dark' : 'light'}
              style={styles.paymentMethodContent}
            >
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
            </BlurView>
          </TouchableOpacity>

          {/* Phone Number Input */}
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Phone Number
          </Text>
          <BlurView
            intensity={isDark ? 20 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.inputContainer, { borderColor: theme.colors.glassBorder }]}
          >
            <View style={styles.phoneInputContent}>
              <Text style={[styles.phonePrefix, { color: theme.colors.textPrimary }]}>+250</Text>
              <TextInput
                style={[styles.input, { color: theme.colors.textPrimary }]}
                placeholder="7X XXX XXXX"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={9} // Adjusted for without prefix (9 digits for Rwanda? usually 78... is 9 digits)
              />
            </View>
          </BlurView>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Shield size={16} color={theme.colors.secondary} />
            <Text style={[styles.securityText, { color: theme.colors.textSecondary }]}>
              Your payment is secure and encrypted
            </Text>
          </View>

          {/* Pay Button */}
          <TouchableOpacity
            onPress={handlePayment}
            disabled={loading}
            style={[
              styles.payButton,
              { backgroundColor: theme.colors.secondary },
              loading && { opacity: 0.6 }
            ]}
          >
            <LinearGradient
              colors={['#FACC15', '#F59E0B']}
              style={styles.payButtonGradient}
            >
              <Text style={styles.payButtonText}>
                {loading ? 'Processing...' : `Pay ${plan?.price?.toLocaleString()} RWF`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
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
    overflow: 'hidden',
  },
  paymentMethodActive: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
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
    fontWeight: '600',
    marginRight: 4,
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
});
