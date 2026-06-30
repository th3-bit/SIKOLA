import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Linking,
  Alert,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { 
  ChevronLeft, 
  Moon, 
  Sun, 
  Bell, 
  Smartphone, 
  Wifi, 
  FileText 
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PreferencesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { theme, isDark, toggleTheme, hapticsEnabled, toggleHaptics } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(false);

  const SettingRow = ({ icon: Icon, label, value, onToggle, isLast, type = 'switch' }) => (
    <View style={[
      styles.row, 
      { borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' },
      !isLast && styles.rowBorder
    ]}>
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
        <Icon size={scale(20)} color={theme.colors.textPrimary} />
      </View>
      <Text style={[styles.label, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
        {label}
      </Text>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#334155', true: '#FACC15' }}
          thumbColor={'#FFFFFF'}
          ios_backgroundColor="#334155"
        />
      ) : (
        <ChevronLeft size={scale(20)} color={theme.colors.textSecondary} style={{ transform: [{ rotate: '180deg' }] }} />
      )}
    </View>
  );

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#475569' : theme.colors.textSecondary }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.sectionContent, { 
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
        borderColor: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)'
      }]}>
        {children}
      </View>
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
          <ChevronLeft size={scale(24)} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
          Preferences
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLargeScreen ? (
          <View style={styles.largeScreenContainer}>
            <BlurView 
              intensity={25} 
              tint={isDark ? "dark" : "light"} 
              style={[styles.column, styles.glassPanel, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
            >
              {/* Appearance */}
              <Section title="Appearance">
                <View style={styles.darkRow}>
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
                    <Moon size={scale(20)} color={theme.colors.textPrimary} />
                  </View>
                  <Text style={[styles.label, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                    Dark Mode
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={toggleTheme}
                    activeOpacity={0.8}
                    style={[styles.themeToggle, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9', borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'transparent', borderWidth: isDark ? scale(1) : 0 }]}
                  >
                    <View style={[styles.themeOption, !isDark && styles.activeTheme]}>
                      <Sun size={scale(14)} color={!isDark ? '#FACC15' : '#475569'} />
                    </View>
                    <View style={[styles.themeOption, isDark && styles.activeTheme, { backgroundColor: isDark ? '#FACC15' : 'transparent' }]}>
                      <Moon size={scale(14)} color={isDark ? '#000000' : '#475569'} />
                    </View>
                  </TouchableOpacity>
                </View>
              </Section>

              {/* Notifications */}
              <Section title="Notifications">
                <SettingRow 
                  icon={Bell} 
                  label="Push Notifications" 
                  value={notifications} 
                  onToggle={setNotifications} 
                />
                <SettingRow 
                  icon={Smartphone} 
                  label="Haptic Feedback" 
                  value={hapticsEnabled} 
                  onToggle={toggleHaptics} 
                  isLast={true}
                />
              </Section>
            </BlurView>

            <BlurView 
              intensity={25} 
              tint={isDark ? "dark" : "light"} 
              style={[styles.column, styles.glassPanel, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
            >
              {/* Data & Storage */}
              <Section title="Data & Storage">
                <SettingRow 
                  icon={Wifi} 
                  label="Download over Wi-Fi only" 
                  value={wifiOnly} 
                  onToggle={setWifiOnly} 
                  isLast={true}
                />
              </Section>

              {/* About */}
              <Section title="About">
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('PrivacyPolicy')}
                >
                  <SettingRow 
                    icon={FileText} 
                    label="Privacy Policy" 
                    isLast={true} 
                    type="link" 
                  />
                </TouchableOpacity>
              </Section>

              {/* Developer / Testing */}
              <Section title="Developer">
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={async () => {
                    try {
                      await AsyncStorage.removeItem('hasSeenHomeCoachmarks');
                      Alert.alert("Success", "Walkthrough has been reset. Go to Home screen to see it again.");
                    } catch (e) {
                      Alert.alert("Error", "Could not reset walkthrough.");
                    }
                  }}
                >
                  <SettingRow 
                    icon={Smartphone} 
                    label="Reset App Walkthrough" 
                    isLast={true} 
                    type="link" 
                  />
                </TouchableOpacity>
              </Section>
            </BlurView>
          </View>
        ) : (
          <View>
            {/* Appearance */}
            <Section title="Appearance">
              <View style={styles.darkRow}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)' }]}>
                  <Moon size={scale(20)} color={theme.colors.textPrimary} />
                </View>
                <Text style={[styles.label, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                  Dark Mode
                </Text>
                
                <TouchableOpacity 
                  onPress={toggleTheme}
                  activeOpacity={0.8}
                  style={[styles.themeToggle, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9', borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'transparent', borderWidth: isDark ? scale(1) : 0 }]}
                >
                  <View style={[styles.themeOption, !isDark && styles.activeTheme]}>
                    <Sun size={scale(14)} color={!isDark ? '#FACC15' : '#475569'} />
                  </View>
                  <View style={[styles.themeOption, isDark && styles.activeTheme, { backgroundColor: isDark ? '#FACC15' : 'transparent' }]}>
                    <Moon size={scale(14)} color={isDark ? '#000000' : '#475569'} />
                  </View>
                </TouchableOpacity>
              </View>
            </Section>

            {/* Notifications */}
            <Section title="Notifications">
              <SettingRow 
                icon={Bell} 
                label="Push Notifications" 
                value={notifications} 
                onToggle={setNotifications} 
              />
              <SettingRow 
                icon={Smartphone} 
                label="Haptic Feedback" 
                value={hapticsEnabled} 
                onToggle={toggleHaptics} 
                isLast={true}
              />
            </Section>

            {/* Data & Storage */}
            <Section title="Data & Storage">
              <SettingRow 
                icon={Wifi} 
                label="Download over Wi-Fi only" 
                value={wifiOnly} 
                onToggle={setWifiOnly} 
                isLast={true}
              />
            </Section>

            {/* About */}
            <Section title="About">
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                <SettingRow 
                  icon={FileText} 
                  label="Privacy Policy" 
                  isLast={true} 
                  type="link" 
                />
              </TouchableOpacity>
            </Section>

            {/* Developer / Testing */}
            <Section title="Developer">
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={async () => {
                  try {
                    await AsyncStorage.removeItem('hasSeenHomeCoachmarks');
                    Alert.alert("Success", "Walkthrough has been reset. Go to Home screen to see it again.");
                  } catch (e) {
                    Alert.alert("Error", "Could not reset walkthrough.");
                  }
                }}
              >
                <SettingRow 
                  icon={Smartphone} 
                  label="Reset App Walkthrough" 
                  isLast={true} 
                  type="link" 
                />
              </TouchableOpacity>
            </Section>
          </View>
        )}

        <Text style={styles.version}>Sikola+ v1.0.0</Text>
        <View style={{ height: verticalScale(140) }} />
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
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '800',
  },
  scrollContent: {
    padding: scale(20),
    paddingBottom: verticalScale(40),
  },
  section: {
    marginBottom: verticalScale(25),
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    marginBottom: verticalScale(12),
    letterSpacing: 1,
    paddingLeft: scale(4),
  },
  sectionContent: {
    borderRadius: scale(24),
    borderWidth: scale(1),
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
  },
  rowBorder: {
    borderBottomWidth: scale(1),
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(15),
  },
  label: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    flex: 1,
  },
  darkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(16),
  },
  themeToggle: {
    flexDirection: 'row',
    padding: scale(4),
    borderRadius: scale(20),
    width: scale(80),
    justifyContent: 'space-between',
  },
  themeOption: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTheme: {
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.2,
    shadowRadius: scale(4),
  },
  version: {
    textAlign: 'center',
    marginTop: verticalScale(20),
    fontSize: moderateScale(12),
    opacity: 0.3,
    color: '#888888',
  },
  largeScreenContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(30),
    width: '100%',
  },
  column: {
    flex: 1,
    maxWidth: scale(450),
  },
  glassPanel: {
    borderRadius: scale(30),
    borderWidth: scale(1),
    paddingVertical: verticalScale(20),
    paddingHorizontal: scale(10),
    overflow: 'hidden',
  },
});
