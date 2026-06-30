import React, { useState, useRef } from 'react';
import { 
  View, 
  Text,
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Animated, 
  Dimensions, 
  Platform,
  Pressable,
  Alert,
  Modal
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { scale, verticalScale, moderateScale, width } from '../utils/Scaling';
import { Search, User, X, Settings, Moon, Sun, LogOut, Sliders, FileText } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../../App'; // Import global navigationRef
import { CopilotStep, walkthroughable, useCopilot } from 'react-native-copilot';

const WalkthroughableTouchableOpacity = walkthroughable(TouchableOpacity);

export default function GlassHeader({ 
  showSearch = true, 
  onSearch = (text) => {}, 
  onSearchPress = null,
  initialExpanded = false,
  overrideBack = null
}) {
  const { visible } = useCopilot();
  const { theme, isDark, toggleTheme, hapticsEnabled } = useTheme();
  const { userProfile } = useProgress();
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const [query, setQuery] = useState('');
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = (userProfile?.name || 'Sikola').split(' ')[0];
    
    if (hour >= 5 && hour < 9) return `Ready for your morning boost, ${firstName}? ☕`;
    if (hour >= 9 && hour < 12) return `Good Morning, ${firstName}! ☀️`;
    if (hour >= 12 && hour < 17) return `Good Afternoon, ${firstName}! ✨`;
    if (hour >= 17 && hour < 21) return `Good Evening, ${firstName}! 🌙`;
    return `Night study, ${firstName}? 🦉`;
  };
  
  const { width: windowWidth } = Dimensions.get('window');
  const isDesktop = windowWidth >= 768;
  const desktopWidthOpen = scale(500);
  const desktopWidthClosed = scale(250);
  
  const animationWidth = useRef(new Animated.Value(
    initialExpanded ? (isDesktop ? desktopWidthOpen : width - scale(40)) : (isDesktop ? desktopWidthClosed : scale(35))
  )).current;
  
  const animationOpacity = useRef(new Animated.Value(initialExpanded ? (isDesktop ? 1 : 0) : 1)).current;
  const searchScale = useRef(new Animated.Value(1)).current;
  const profileScale = useRef(new Animated.Value(1)).current;
  const inputRef = useRef(null);

  // Auto-focus if initially expanded
  React.useEffect(() => {
    if (initialExpanded) {
       setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [initialExpanded]);

  const toggleSearch = (expand) => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (expand && onSearchPress) {
      onSearchPress();
      return;
    }

    if (expand) {
      setIsExpanded(true);
      Animated.parallel([
        Animated.spring(animationWidth, {
          toValue: isDesktop ? desktopWidthOpen : width - scale(40),
          useNativeDriver: false,
          bounciness: 0,
        }),
        Animated.timing(animationOpacity, {
          toValue: isDesktop ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        inputRef.current?.focus();
      });
    } else {
      if (overrideBack) {
        overrideBack();
        return;
      }
      
      Animated.parallel([
        Animated.spring(animationWidth, {
          toValue: isDesktop ? desktopWidthClosed : scale(35),
          useNativeDriver: false,
          bounciness: 0,
        }),
        Animated.timing(animationOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => {
        setIsExpanded(false);
        setQuery('');
        onSearch('');
      });
    }
  };

  const handlePressIn = (anim) => {
    Animated.spring(anim, { toValue: 0.93, useNativeDriver: false, bounciness: 0 }).start();
  };

  const handlePressOut = (anim) => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: false, bounciness: 0 }).start();
  };

  const handleProfilePress = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newValue = !isDropdownOpen;
    setIsDropdownOpen(newValue);
    Animated.spring(dropdownAnim, {
      toValue: newValue ? 1 : 0,
      useNativeDriver: true,
      bounciness: 6,
      speed: 16,
    }).start();
  };

  const handleDropdownAction = async (action) => {
    setIsDropdownOpen(false);
    Animated.timing(dropdownAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    
    if (action === 'Close') return; // Just close it without haptics
    
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (action === 'Preferences') {
      if (navigationRef.isReady()) navigationRef.navigate('Preferences');
    } else if (action === 'PersonalInfo') {
      if (navigationRef.isReady()) navigationRef.navigate('PersonalInfo');
    } else if (action === 'Settings') {
      if (navigationRef.isReady()) navigationRef.navigate('MainApp', { screen: 'Profile' });
    } else if (action === 'Theme') {
      if (toggleTheme) toggleTheme();
    } else if (action === 'LogOut') {
      if (Platform.OS === 'web') {
        // Alert is not supported on web — show custom modal instead
        setShowLogoutConfirm(true);
      } else {
        Alert.alert(
          'Log Out',
          'Are you sure you want to log out?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Log Out',
              style: 'destructive',
              onPress: async () => {
                if (signOut) await signOut();
              },
            },
          ],
          { cancelable: true }
        );
      }
    }
  };

  return (
    <>
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {showSearch && (
          <Animated.View style={[
            styles.searchWrapper, 
            { 
              width: animationWidth,
              borderColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
              transform: [{ scale: searchScale }],
              borderRadius: isDesktop ? scale(10) : 50,
            },
            isDesktop && {
              position: 'absolute',
              alignSelf: 'center',
              zIndex: 10,
            }
          ]}>
            <View style={styles.fullBlur}>
              {!isExpanded ? (
                <CopilotStep text="Use the search bar to quickly find courses, subjects, and topics you want to learn." order={2} name="search">
                  <WalkthroughableTouchableOpacity 
                     pointerEvents={visible ? 'none' : 'auto'}
                     style={[
                       styles.searchIconButton, 
                       isDesktop && { width: scale(250), flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: scale(12), gap: scale(8) }
                     ]} 
                     onPress={() => toggleSearch(true)}
                     onPressIn={() => handlePressIn(searchScale)}
                     onPressOut={() => handlePressOut(searchScale)}
                     activeOpacity={0.8}
                  >
                    <Search color={theme.colors.secondary} size={isDesktop ? 16 : 20} />
                    {isDesktop && (
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: scale(12) }}>
                        <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', fontSize: moderateScale(13), fontFamily: theme.typography.fontFamily }}>Search courses...</Text>
                        <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: '600', fontFamily: theme.typography.fontFamily }}>⌘K</Text>
                        </View>
                      </View>
                    )}
                  </WalkthroughableTouchableOpacity>
                </CopilotStep>
              ) : (
                <View style={styles.expandedContent}>
                  <Search color={theme.colors.secondary} size={18} style={styles.inputIcon} />
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.input, 
                      { 
                        color: theme.colors.textPrimary, 
                        fontFamily: theme.typography.fontFamily,
                        backgroundColor: 'transparent', // Forced inline
                      }
                    ]}
                    placeholder="Search courses..."
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
                    value={query}
                    autoFocus={false}
                    underlineColorAndroid="transparent"
                    selectionColor={theme.colors.secondary}
                    cursorColor={theme.colors.secondary}
                    includeFontPadding={false}
                    autoCapitalize="none"
                    autoCorrect={false}
                    paddingHorizontal={0}
                    onChangeText={(text) => {
                      setQuery(text);
                      onSearch(text);
                    }}
                  />
                  <TouchableOpacity 
                    onPress={() => toggleSearch(false)} 
                    style={styles.cancelButton}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 0.3 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        )}
      </View>

      <Animated.View 
        style={[styles.rightSection, { opacity: animationOpacity }]}
        pointerEvents={isExpanded ? (isDesktop ? 'auto' : 'none') : 'auto'}
      >
        {!isExpanded && (
          <View style={styles.greetingContainer}>
            <Text 
              style={[styles.greetingText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
              numberOfLines={1}
            >
              {getGreeting()}
            </Text>
          </View>
        )}
        <Animated.View style={{ transform: [{ scale: profileScale }] }}>
          <CopilotStep text="Quickly view and edit your personal profile information right here." order={3} name="profileHeader">
            <WalkthroughableTouchableOpacity 
              pointerEvents={visible ? 'none' : 'auto'}
              style={[
                styles.profileButton, 
                { 
                  borderColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)',
                }
              ]}
              activeOpacity={0.8}
              onPress={handleProfilePress}
              onPressIn={() => handlePressIn(profileScale)}
              onPressOut={() => handlePressOut(profileScale)}
            >
              <User color={theme.colors.secondary} size={16} />
              <Text style={[styles.profileName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {userProfile?.name?.split(' ')[0] || 'Profile'}
              </Text>
            </WalkthroughableTouchableOpacity>
          </CopilotStep>

          {/* Invisible Overlay to close Dropdown */}
          {isDropdownOpen && (
            <Pressable 
              onPress={() => handleDropdownAction('Close')}
              style={{
                position: Platform.OS === 'web' ? 'fixed' : 'absolute',
                top: -3000,
                bottom: -3000,
                left: -3000,
                right: -3000,
                zIndex: 1000,
                cursor: 'default',
              }} 
            />
          )}

          {/* Dropdown Menu */}
          <Animated.View style={[
            styles.dropdownMenu,
            { 
              backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)',
              opacity: dropdownAnim,
              transform: [
                {
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0]
                  })
                },
                {
                  scale: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1]
                  })
                }
              ],
              zIndex: 1001
            }
          ]} pointerEvents={isDropdownOpen ? 'auto' : 'none'}>
            <View style={styles.dropdownHeader}>
              <Text style={[styles.dropdownName, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {userProfile?.name || 'Sikola User'}
              </Text>
              <Text style={[styles.dropdownEmail, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontFamily: theme.typography.fontFamily }]}>
                {userProfile?.email || 'user@sikola.com'}
              </Text>
            </View>
            
            <View style={[styles.dropdownDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]} />
            
            <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDropdownAction('Preferences')} activeOpacity={0.7}>
              <Sliders color={theme.colors.textPrimary} size={16} />
              <Text style={[styles.dropdownItemText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Preferences</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDropdownAction('PersonalInfo')} activeOpacity={0.7}>
              <FileText color={theme.colors.textPrimary} size={16} />
              <Text style={[styles.dropdownItemText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Personal Information</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDropdownAction('Settings')} activeOpacity={0.7}>
              <Settings color={theme.colors.textPrimary} size={16} />
              <Text style={[styles.dropdownItemText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDropdownAction('Theme')} activeOpacity={0.7}>
              {isDark ? <Sun color={theme.colors.textPrimary} size={16} /> : <Moon color={theme.colors.textPrimary} size={16} />}
              <Text style={[styles.dropdownItemText, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>
            
            <View style={[styles.dropdownDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]} />
            
            <TouchableOpacity style={styles.dropdownItem} onPress={() => handleDropdownAction('LogOut')} activeOpacity={0.7}>
              <LogOut color="#EF4444" size={16} />
              <Text style={[styles.dropdownItemText, { color: '#EF4444', fontFamily: theme.typography.fontFamily }]}>Log Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>

      {/* ── Web Logout Confirmation Modal ─────────────────────────────────── */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowLogoutConfirm(false)}
        >
          <Pressable style={[styles.modalCard, { backgroundColor: isDark ? '#1a1a2e' : '#ffffff' }]}>
            {/* Icon */}
            <View style={styles.modalIconWrap}>
              <LogOut color="#EF4444" size={28} />
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#111827', fontFamily: theme.typography.fontFamily }]}>
              Log Out
            </Text>

            {/* Message */}
            <Text style={[styles.modalMessage, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', fontFamily: theme.typography.fontFamily }]}>
              Are you sure you want to log out of your account?
            </Text>

            {/* Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]}
                onPress={() => setShowLogoutConfirm(false)}
                activeOpacity={0.75}
              >
                <Text style={[styles.modalBtnText, { color: isDark ? 'rgba(255,255,255,0.8)' : '#374151', fontFamily: theme.typography.fontFamily }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnLogout]}
                onPress={async () => {
                  setShowLogoutConfirm(false);
                  if (signOut) await signOut();
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalBtnText, { color: '#ffffff', fontFamily: theme.typography.fontFamily }]}>
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    height: verticalScale(45),
    width: '100%',
    zIndex: 1000,
  },
  leftSection: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  rightSection: {
    marginLeft: scale(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  greetingContainer: {
    marginRight: scale(4),
  },
  greetingText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    opacity: 0.9,
  },
  searchWrapper: {
    height: scale(35),
    borderWidth: 1,
    overflow: 'hidden',
  },
  fullBlur: {
    flex: 1,
  },
  searchIconButton: {
    width: scale(35),
    height: scale(35),
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: scale(35),
    height: scale(35),
    borderRadius: 50,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    height: scale(35),
    paddingHorizontal: scale(14),
    borderRadius: scale(12),
    borderWidth: 1,
  },
  profileName: {
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  dropdownMenu: {
    position: 'absolute',
    top: scale(45),
    right: 0,
    width: scale(200),
    borderRadius: scale(16),
    borderWidth: 1,
    padding: scale(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  dropdownHeader: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  dropdownName: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginBottom: scale(2),
  },
  dropdownEmail: {
    fontSize: moderateScale(12),
  },
  dropdownDivider: {
    height: 1,
    marginVertical: scale(4),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    gap: scale(10),
    borderRadius: scale(8),
  },
  dropdownItemText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  iconButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scale(14),
    paddingRight: 0, 
    width: '100%',
  },
  inputIcon: {
    marginRight: scale(8),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    height: scale(35),
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    outlineStyle: 'none',
  },
  cancelButton: {
    backgroundColor: '#EF4444', 
    paddingHorizontal: scale(14),
    paddingVertical: scale(7),
    borderRadius: moderateScale(12),
    marginRight: scale(6),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
  },
  // ── Logout confirmation modal ───────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: Math.min(360, Dimensions.get('window').width - 48),
    borderRadius: moderateScale(20),
    padding: scale(28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  modalIconWrap: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: 'rgba(239,68,68,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginBottom: scale(8),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    lineHeight: moderateScale(20),
    marginBottom: scale(24),
  },
  modalActions: {
    flexDirection: 'row',
    gap: scale(12),
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: scale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    borderWidth: 1.5,
  },
  modalBtnLogout: {
    backgroundColor: '#EF4444',
  },
  modalBtnText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});

