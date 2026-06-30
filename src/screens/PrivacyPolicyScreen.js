import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ShieldCheck, Lock, Eye, Database, Info } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivacyPolicyScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  const Section = ({ icon: Icon, title, content }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(24ACC15, 0.1)' : 'rgba(13, 148, 136, 0.1)' }]}>
          <Icon size={20} color={isDark ? theme.colors.secondary : theme.colors.secondary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.sectionContent, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
        {content}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]} 
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
            Privacy Policy
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <ShieldCheck size={48} color={theme.colors.secondary} style={styles.introIcon} />
            <Text style={[styles.introTitle, { color: theme.colors.textPrimary }]}>Your Privacy Matters</Text>
            <Text style={[styles.introSubtitle, { color: theme.colors.textSecondary }]}>
              Last updated: April 2, 2026
            </Text>
          </View>

          <Section 
            icon={Info}
            title="Introduction"
            content="Welcome to Sikola+. We are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and share information when you use our educational platform."
          />

          <Section 
            icon={Database}
            title="Data Collection"
            content="We collect information that you provide directly to us (e.g., name, email, and academic preferences) and information about your usage of the app to provide a personalized learning experience."
          />

          <Section 
            icon={Eye}
            title="Usage of Data"
            content="Your data is primarily used to track progress through courses, suggest relevant content, and provide analytics on your learning performance. We do not sell your personal data to third parties."
          />

          <Section 
            icon={Lock}
            title="Security"
            content="We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee the internet itself is 100% secure."
          />

          <Section 
            icon={ShieldCheck}
            title="Your Rights"
            content="Depending on your location, you may have rights under applicable data protection laws. These include the right to access, rectify, or erase your personal information. You can manage most of these settings directly from your profile."
          />

          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.externalLinkButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
              onPress={() => {
                import('react-native').then(({ Linking }) => {
                  Linking.openURL('https://sites.google.com/view/sikolaplus/home');
                });
              }}
            >
              <Text style={[styles.externalLinkText, { color: theme.colors.textPrimary }]}>View Full Policy Online</Text>
            </TouchableOpacity>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              For any questions regarding this policy, please contact us at support@sikola.plus
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  introCard: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  introIcon: {
    marginBottom: 15,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8,
  },
  footer: {
    marginTop: 20,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
    alignItems: 'center',
  },
  externalLinkButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  externalLinkText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  }
});
