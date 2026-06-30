import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  useWindowDimensions,
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
import { useProgress } from '../context/ProgressContext';
import { supabase } from '../lib/supabase';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

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
  weekly: '#FF7A00',
  monthly: '#F50707',
};

export default function SubscriptionScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { theme, isDark } = useTheme();
  const { isTrialExpired, subscriptions } = useProgress();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  // Course context passed from a locked course modal (if any)
  const lockedCourse = route.params?.lockedCourse || null;
  const isFirstTime  = route.params?.firstTime    || false;

  const hasActiveSub = subscriptions && subscriptions.length > 0;

  // Filter plans based on eligibility
  const eligiblePlans = plans.filter(plan => {
    if (isTrialExpired && plan.price === 0) return false;
    if (hasActiveSub && plan.plan_type === 'free_trial') return false;
    return true;
  });

  // Keep expandedPlanId pointing at a valid eligible plan
  React.useEffect(() => {
    if (eligiblePlans.length > 0 && !eligiblePlans.find(p => p.id === expandedPlanId)) {
      setExpandedPlanId(eligiblePlans[0].id);
    }
  }, [eligiblePlans.length]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;

      const data2 = data || [];
      logger.log('SubscriptionScreen: fetched', data2.length, 'plans');
      setPlans(data2);

      // Auto-expand the first popular or middle plan if available
      const defaultType = route.params?.defaultPlanType;
      const targetPlan = defaultType ? data2.find(p => p.plan_type === defaultType) : null;
      const popular = targetPlan || data2.find(p => p.plan_type === 'weekly') || data2[0];
      if (popular) setExpandedPlanId(popular.id);

    } catch (error) {
      logger.error('Error fetching plans:', error);
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
    if (!plan) return;

    if (plan.plan_type === 'per_course') {
      if (lockedCourse) {
        navigation.navigate('Payment', { plan, course: lockedCourse });
      } else {
        navigation.navigate('MainApp', {
          screen: 'Course',
          params: { selectingForSubscription: true, plan: plan }
        });
      }
    } else {
      navigation.navigate('Payment', { plan });
    }
  };

  const handlePressCard = (planId) => {
    if (expandedPlanId !== planId) {
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
          intensity={isLargeScreen ? 20 : 80}
          tint={isDark ? "dark" : "light"}
          style={[styles.planCard, {
            backgroundColor: isLargeScreen ? theme.colors.glass : (isDark ? 'rgba(25, 25, 25, 0.8)' : 'rgba(255, 255, 255, 0.8)'),
            borderColor: isExpanded ? color : (isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)')
          }]}
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
                {isExpanded && <Check size={scale(14)} color="#FFF" />}
              </View>
            </View>
          </TouchableOpacity>

          {/* Expanded Content */}
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
          {isFirstTime ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('MainApp')}
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
            >
              <Text style={[styles.skipText, { color: theme.colors.textPrimary }]}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
            >
              <ArrowLeft color={theme.colors.textPrimary} size={scale(24)} />
            </TouchableOpacity>
          )}

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, textAlign: isLargeScreen ? 'center' : 'left' }]}>
              Choose Plan
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.textPrimary} />
          </View>
        ) : eligiblePlans.length === 0 ? (
          /* ── Empty / Error state ── */
          <View style={styles.emptyContainer}>
            <Crown size={scale(48)} color={theme.colors.textSecondary} style={{ opacity: 0.4, marginBottom: verticalScale(16) }} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              No Plans Available
            </Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
              We couldn't load the plans right now.{'\n'}Please check your connection and try again.
            </Text>
            <TouchableOpacity
              onPress={() => { setLoading(true); fetchPlans(); }}
              style={[styles.retryBtn, { backgroundColor: theme.colors.secondary }]}
            >
              <Text style={[styles.retryText, { color: isDark ? '#000' : '#fff' }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {isLargeScreen ? (
              <View style={styles.largeScreenWrapper}>
                <BlurView 
                  intensity={15} 
                  tint={isDark ? "dark" : "light"} 
                  style={[styles.largeGlassContainer, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
                >
                  <View style={styles.gridContainer}>
                    {eligiblePlans.map((plan) => (
                      <View key={plan.id} style={styles.gridItem}>
                        <PlanCard plan={plan} />
                      </View>
                    ))}
                  </View>
                </BlurView>
              </View>
            ) : (
              eligiblePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))
            )}
            <View style={{ height: verticalScale(40) }} />
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
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(20),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  skipText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  headerInfo: {
    marginBottom: verticalScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: scale(20),
  },
  planCardWrapper: {
    marginBottom: verticalScale(16),
    borderRadius: scale(16),
  },
  planCard: {
    borderRadius: scale(16),
    overflow: 'hidden',
    padding: 0,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: scale(20),
    minHeight: verticalScale(80),
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  planName: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    marginBottom: verticalScale(4),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPriceMini: {
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  planDurationMini: {
    fontSize: moderateScale(14),
  },
  radioButton: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popularBadgeMini: {
    paddingHorizontal: scale(8),
    paddingVertical: verticalScale(4),
    borderRadius: scale(8),
  },
  popularTextMini: {
    color: '#FFF',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  expandedContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
  divider: {
    height: verticalScale(1),
    marginBottom: verticalScale(16),
  },
  featuresContainer: {
    marginTop: verticalScale(16),
    marginBottom: verticalScale(20),
    gap: scale(10),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  featureText: {
    fontSize: moderateScale(14),
  },
  planDescription: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  selectButton: {
    paddingVertical: verticalScale(14),
    borderRadius: scale(12),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#FFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },

  // Empty / error state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  emptyTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    textAlign: 'center',
    marginBottom: verticalScale(28),
    opacity: 0.8,
  },
  retryBtn: {
    paddingHorizontal: scale(32),
    paddingVertical: verticalScale(14),
    borderRadius: scale(14),
  },
  retryText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
  gridContainer: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  gridItem: {
    width: '100%',
  },
  largeScreenWrapper: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  largeGlassContainer: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 24,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
  },
});
