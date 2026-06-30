import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions 
} from 'react-native';
import { X, Shield, FileText } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

const { height, width } = Dimensions.get('window');

const TermsModal = ({ visible, onClose, onAccept, type = 'terms' }) => {
  const { theme, isDark } = useTheme();

  const termsContent = {
    privacy: {
      title: 'Privacy Policy',
      icon: Shield,
      content: [
        {
          title: '1. Data Collection',
          text: 'We collect minimal personal information necessary to provide and improve our services. This includes Name, Email Address, Phone Number (optional), and Learning Progress (XP, Quiz Scores).'
        },
        {
          title: '2. How We Use Your Data',
          text: 'Your data is used specifically for managing your user account, tracking learning progress, and providing personalized subject recommendations.'
        },
        {
          title: '3. Data Sharing',
          text: 'We do not sell, trade, or rent your personal data to third parties. Data is only shared when necessary for core app functionality (e.g., authentication via Supabase).'
        },
        {
          title: '4. Data Security',
          text: 'We implement industry-standard security measures, including encryption and secure database protocols via Supabase, to protect your information.'
        },
        {
          title: '5. Your Rights',
          text: 'You have the right to access, update, or request the deletion of your personal data at any time through the account settings within the app.'
        }
      ]
    },
    terms: {
      title: 'Terms of Service',
      icon: FileText,
      content: [
        {
          title: '1. Acceptance of Terms',
          text: 'By creating an account and using Sikola+, you agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you and Sikola+.'
        },
        {
          title: '2. User Accounts',
          text: 'You are responsible for maintaining the confidentiality of your account credentials. Accounts are for individual use only and may not be shared.'
        },
        {
          title: '3. Subscriptions & Payments',
          text: 'Sikola+ offers both free and premium content. Payments are processed via standard Google Play billing systems. Subscriptions auto-renew unless canceled 24 hours before the period ends.'
        },
        {
          title: '4. Intellectual Property',
          text: 'All content provided within Sikola+, including lessons, texts, tests, and graphics, are the exclusive property of Sikola+ and are protected by copyright laws.'
        },
        {
          title: '5. Prohibited Conduct',
          text: 'Users are prohibited from reverse-engineering the app, scraping content, or creating multiple accounts for trial manipulation.'
        }
      ]
    }
  };

  const activeContent = type === 'privacy' ? termsContent.privacy : termsContent.terms;
  const ActiveIcon = activeContent.icon;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        </BlurView>
        
        <View style={[styles.modalView, { backgroundColor: theme.colors.surface, borderColor: theme.colors.glassBorder }]}>
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.secondary}20` }]}>
              <ActiveIcon color={theme.colors.secondary} size={24} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
              {activeContent.title}
            </Text>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]} 
              onPress={onClose}
            >
              <X color={theme.colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {activeContent.content.map((section, index) => (
              <View key={index} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  {section.title}
                </Text>
                <Text style={[styles.sectionText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                  {section.text}
                </Text>
              </View>
            ))}
            
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontFamily: theme.typography.fontFamily }]}>
                    Last Updated: March 1, 2026
                </Text>
            </View>
            
            {type === 'privacy' && (
              <TouchableOpacity 
                style={[styles.externalLinkButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}
                onPress={() => {
                  import('react-native').then(({ Linking }) => {
                    Linking.openURL('https://sites.google.com/view/sikolaplus/home');
                  });
                }}
              >
                <Text style={[styles.externalLinkText, { color: theme.colors.textPrimary }]}>View Full Policy Online</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity 
            style={[styles.doneButton, { backgroundColor: theme.colors.secondary }]} 
            onPress={() => {
              if (onAccept) onAccept();
              else onClose();
            }}
          >
            <Text style={[styles.doneButtonText, { color: theme.colors.textContrast, fontFamily: theme.typography.fontFamily }]}>
              I Understand
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: width * 0.9,
    maxWidth: 650, // Prevent it from stretching entirely across on large screens
    maxHeight: height * 0.8,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  footer: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
  },
  footerText: {
      fontSize: 12,
      opacity: 0.5,
  },
  doneButton: {
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  externalLinkButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  externalLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TermsModal;
