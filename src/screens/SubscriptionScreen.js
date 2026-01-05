import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  Check,
  Clock,
  Zap,
  Calendar,
  CalendarDays,
  BookOpen,
  Crown,
  ArrowLeft,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

const planIcons = {
  free_trial: Zap,
  per_course: BookOpen,
  daily: Clock,
  weekly: Calendar,
  monthly: CalendarDays,
};

const planColors = {
  free_trial: '#10B981',
  per_course: '#3B82F6',
  daily: '#F59E0B',
  weekly: '#8B5CF6',
  monthly: '#EC4899',
};

export default function SubscriptionScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*') // Reverted to * to ensure all fields are present
        .eq('is_active', true)
        .order('price');

      console.log('Plans fetched:', data.length);

      if (error) throw error;
      setPlans(data || []);
      // Auto-expand the first popular or middle plan if available
      const popular = data?.find(p => p.plan_type === 'weekly') || data?.[0];
      if (popular) setExpandedPlanId(popular.id);

    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours) => {
    if (hours < 24) return `${hours} hours`;
    const days = hours / 24;
    return days === 1 ? '1 day' : `${days} days`;
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `${price.toLocaleString()} RWF`;
  };

  const handleSelectPlan = (plan) => {
    console.log('handleSelectPlan called with:', plan);
    if (!plan) return;
    
    // Navigate based on plan type
    if (plan.plan_type === 'per_course') {
      console.log('Navigating to Subjects for Per Course');
      // Use nested navigation to reach the Tab screen with params
      navigation.navigate('MainApp', {
        screen: 'Subjects',
        params: { selectingForSubscription: true, plan: plan }
      });
    } else {
      console.log('Navigating to Payment');
      navigation.navigate('Payment', { plan });
    }
  };

  const handlePressCard = (planId) => {
    // Toggle expand
    if (expandedPlanId === planId) {
      // Optional: setExpandedPlanId(null); // Allow collapsing? formatting suggests radio behavior so maybe not needed to collapse fully
    } else {
      setExpandedPlanId(planId);
    }
  };

  const PlanCard = ({ plan }) => {
    const isExpanded = expandedPlanId === plan.id;
    const color = planColors[plan.plan_type] || '#8B5CF6';
    const isPopular = plan.plan_type === 'weekly';

    return (
      <View
        style={[
          styles.planCardWrapper, 
          { 
            shadowColor: isExpanded ? color : 'transparent',
            borderColor: isExpanded ? color : theme.colors.glassBorder,
            borderWidth: isExpanded ? 2 : 1,
          }
        ]}
      >
        <BlurView
          intensity={isDark ? 20 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={styles.planCard}
        >
          {/* Header: Clickable to Toggle Expand */}
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => handlePressCard(plan.id)}
            style={styles.cardHeader}
          >
            <View style={styles.headerLeft}>
               <Text style={[styles.planName, { color: theme.colors.textPrimary }]}>
                  {plan.name}
               </Text>
               <View style={styles.priceRow}>
                 <Text style={[styles.planPriceMini, { color: theme.colors.textSecondary }]}>
                   {formatPrice(plan.price)}
                 </Text>
                 <Text style={[styles.planDurationMini, { color: theme.colors.textSecondary }]}>
                   {plan.price > 0 ? ` / ${formatDuration(plan.duration_hours)}` : ''}
                 </Text>
               </View>
            </View>

            <View style={styles.headerRight}>
               {isPopular && !isExpanded && (
                  <View style={[styles.popularBadgeMini, { backgroundColor: color }]}>
                    <Text style={styles.popularTextMini}>Best Value</Text>
                  </View>
               )}
               {/* Radio Button */}
               <View style={[
                 styles.radioButton, 
                 { borderColor: isExpanded ? color : theme.colors.textSecondary },
                 isExpanded && { backgroundColor: color, borderColor: color }
               ]}>
                 {isExpanded && <Check size={14} color="#FFF" />}
               </View>
            </View>
          </TouchableOpacity>

          {/* Expanded Content: Independent click area */}
          {isExpanded && (
            <View style={styles.expandedContent}>
               <View style={[styles.divider, { backgroundColor: theme.colors.glassBorder }]} />
               
               <Text style={[styles.planDescription, { color: theme.colors.textSecondary }]}>
                 {plan.description}
               </Text>

               <View style={styles.featuresContainer}>
                  <View style={styles.featureRow}>
                    <Check size={16} color={color} />
                    <Text style={[styles.featureText, { color: theme.colors.textPrimary }]}>
                      {plan.access_type === 'all_courses' ? 'Access All Courses' : 'Single Course Access'}
                    </Text>
                  </View>
                   <View style={styles.featureRow}>
                    <Check size={16} color={color} />
                    <Text style={[styles.featureText, { color: theme.colors.textPrimary }]}>
                       Quizzes & Practice
                    </Text>
                  </View>
               </View>

               <TouchableOpacity
                  style={[styles.selectButton, { backgroundColor: color }]}
                  onPress={() => handleSelectPlan(plan)}
                >
                  <Text style={styles.selectButtonText}>
                    {plan.price === 0 ? 'Start Free Trial' : 'Continue'}
                  </Text>
                </TouchableOpacity>
            </View>
          )}
        </BlurView>
      </View>
    );

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
              Choose Plan
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.textPrimary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  planCardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 0, 
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    minHeight: 80,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPriceMini: {
    fontSize: 15,
    fontWeight: '600',
  },
  planDurationMini: {
    fontSize: 14,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
  popularBadgeMini: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularTextMini: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  featuresContainer: {
    marginTop: 16,
    marginBottom: 20,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  selectButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
