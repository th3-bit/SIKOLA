import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  MessageCircle,
  Mail,
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  Zap,
  BookOpen,
  ArrowRight
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    question: "How do I access premium courses?",
    answer: "You can subscribe to SIKOLA PLUS from the 'Subscription' section in your profile. Once subscribed, all courses and tests will be instantly unlocked."
  },
  {
    question: "Can I use Sikola offline?",
    answer: "Currently, Sikola requires an internet connection to sync your progress and access the latest curriculum. We are working on an offline mode for future updates."
  },
  {
    question: "How do I track my learning progress?",
    answer: "Your progress is automatically tracked as you complete lessons and quizzes. You can view your detailed stats in the 'Learning Progress' section on your Account page."
  },
  {
    question: "Is my payment information secure?",
    answer: "Yes, we use industry-standard encryption and trusted payment gateways to ensure your financial data is always protected."
  },
  {
    question: "How can I report a bug or suggest a feature?",
    answer: "You can contact us directly via WhatsApp or Email using the buttons above. We value your feedback and aim to respond within 24 hours."
  }
];

export default function HelpSupportScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { theme, isDark } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const ContactCard = ({ icon: Icon, title, subtitle, color, onPress }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.contactCardWrapper}
    >
      <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={[styles.contactCard, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Icon size={24} color={color} />
        </View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{title}</Text>
          <Text style={[styles.contactSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>{subtitle}</Text>
        </View>
        <ArrowRight size={18} color={theme.colors.textSecondary} style={{ opacity: 0.3 }} />
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.background}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
          >
            <ChevronLeft color={theme.colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Help Center</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {isLargeScreen ? (
            <View style={styles.largeScreenContainer}>
              <View style={styles.leftColumn}>
                {/* Hero Section */}
                <View style={[styles.heroSection, { alignItems: 'flex-start' }]}>
                  <View style={[styles.heroIconBg, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)' }]}>
                    <MessageSquare size={48} color={theme.colors.secondary} strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.heroTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily, textAlign: 'left' }]}>How can we help?</Text>
                  <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily, textAlign: 'left', paddingHorizontal: 0 }]}>
                    Our support team is here to ensure you have the best learning experience.
                  </Text>
                </View>

                {/* Contact Methods */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Direct Support</Text>
                  <ContactCard
                    icon={MessageCircle}
                    title="Chat on WhatsApp"
                    subtitle="Quick response for urgent queries"
                    color="#25D366"
                    onPress={() => Linking.openURL('https://wa.me/250728439394')}
                  />
                  <ContactCard
                    icon={Mail}
                    title="Email Support"
                    subtitle="Send us a message anytime"
                    color="#3B82F6"
                    onPress={() => Linking.openURL('mailto:sikolaplus@gmail.com')}
                  />
                </View>

                {/* Additional Info */}
                <View style={[styles.footer, { alignItems: 'flex-start' }]}>
                  <View style={[styles.infoBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]}>
                    <ShieldAlert size={14} color={theme.colors.textSecondary} />
                    <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                      Response time: Typically within 24 hours
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.rightColumn}>
                {/* FAQs */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Common Questions</Text>
                    <HelpCircle size={18} color={theme.colors.textSecondary} opacity={0.5} />
                  </View>
                  
                  <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.faqContainer, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
                    {FAQ_DATA.map((faq, index) => {
                      const isExpanded = expandedIndex === index;
                      return (
                        <TouchableOpacity
                          key={index}
                          activeOpacity={0.7}
                          onPress={() => toggleExpand(index)}
                          style={[
                            styles.faqItem,
                            index !== FAQ_DATA.length - 1 && { borderBottomColor: theme.colors.glassBorder, borderBottomWidth: 1 }
                          ]}
                        >
                          <View style={styles.faqHeader}>
                            <Text style={[styles.faqQuestion, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{faq.question}</Text>
                            <ChevronDown
                              size={20}
                              color={isExpanded ? theme.colors.secondary : theme.colors.textSecondary}
                              style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                            />
                          </View>
                          {isExpanded && (
                            <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                              {faq.answer}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </BlurView>
                </View>
              </View>
            </View>
          ) : (
            <View>
              {/* Hero Section */}
              <View style={styles.heroSection}>
                <View style={[styles.heroIconBg, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.05)' }]}>
                  <MessageSquare size={48} color={theme.colors.secondary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.heroTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>How can we help?</Text>
                <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                  Our support team is here to ensure you have the best learning experience.
                </Text>
              </View>

              {/* Contact Methods */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Direct Support</Text>
                <ContactCard
                  icon={MessageCircle}
                  title="Chat on WhatsApp"
                  subtitle="Quick response for urgent queries"
                  color="#25D366"
                  onPress={() => Linking.openURL('https://wa.me/250728439394')}
                />
                <ContactCard
                  icon={Mail}
                  title="Email Support"
                  subtitle="Send us a message anytime"
                  color="#3B82F6"
                  onPress={() => Linking.openURL('mailto:sikolaplus@gmail.com')}
                />
              </View>

              {/* FAQs */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>Common Questions</Text>
                  <HelpCircle size={18} color={theme.colors.textSecondary} opacity={0.5} />
                </View>
                
                <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={[styles.faqContainer, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}>
                  {FAQ_DATA.map((faq, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.7}
                        onPress={() => toggleExpand(index)}
                        style={[
                          styles.faqItem,
                          index !== FAQ_DATA.length - 1 && { borderBottomColor: theme.colors.glassBorder, borderBottomWidth: 1 }
                        ]}
                      >
                        <View style={styles.faqHeader}>
                          <Text style={[styles.faqQuestion, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>{faq.question}</Text>
                          <ChevronDown
                            size={20}
                            color={isExpanded ? theme.colors.secondary : theme.colors.textSecondary}
                            style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                          />
                        </View>
                        {isExpanded && (
                          <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                            {faq.answer}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </BlurView>
              </View>

              {/* Additional Info */}
              <View style={styles.footer}>
                <View style={[styles.infoBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]}>
                  <ShieldAlert size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    Response time: Typically within 24 hours
                  </Text>
                </View>
              </View>
            </View>
          )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  heroIconBg: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactCardWrapper: {
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  faqContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 20,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    paddingRight: 20,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  largeScreenContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    width: '100%',
  },
  leftColumn: {
    flex: 1,
    maxWidth: 350,
  },
  rightColumn: {
    flex: 2,
    maxWidth: 600,
  },
});
