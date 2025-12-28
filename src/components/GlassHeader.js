import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Animated, 
  Dimensions, 
  Platform 
} from 'react-native';
import { Search, User, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function GlassHeader({ showSearch = true, onSearch = (text) => {} }) {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  
  const animationWidth = useRef(new Animated.Value(48)).current;
  const animationOpacity = useRef(new Animated.Value(1)).current;
  const inputRef = useRef(null);

  const toggleSearch = (expand) => {
    if (expand) {
      setIsExpanded(true);
      Animated.parallel([
        Animated.spring(animationWidth, {
          toValue: width - 40,
          useNativeDriver: false,
          bounciness: 0,
        }),
        Animated.timing(animationOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        inputRef.current?.focus();
      });
    } else {
      Animated.parallel([
        Animated.spring(animationWidth, {
          toValue: 48,
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

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {showSearch && (
          <Animated.View style={[
            styles.searchWrapper, 
            { 
              width: animationWidth,
              borderColor: theme.colors.glassBorder,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            }
          ]}>
            <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.fullBlur}>
              {!isExpanded ? (
                <TouchableOpacity 
                  style={styles.searchIconButton} 
                  onPress={() => toggleSearch(true)}
                  activeOpacity={0.7}
                >
                  <Search color={theme.colors.secondary} size={22} />
                </TouchableOpacity>
              ) : (
                <View style={styles.expandedContent}>
                  <Search color={theme.colors.secondary} size={18} style={styles.inputIcon} />
                  <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily }]}
                    placeholder="Search courses, topics..."
                    placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    value={query}
                    autoFocus={false}
                    onChangeText={(text) => {
                      setQuery(text);
                      onSearch(text);
                    }}
                  />
                  <TouchableOpacity onPress={() => toggleSearch(false)} style={styles.closeButton}>
                    <X color={theme.colors.textSecondary} size={18} />
                  </TouchableOpacity>
                </View>
              )}
            </BlurView>
          </Animated.View>
        )}
      </View>

      <Animated.View style={[styles.rightSection, { opacity: animationOpacity }]}>
        <TouchableOpacity 
          style={[
            styles.iconButton, 
            { 
              borderColor: theme.colors.glassBorder,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            }
          ]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Profile')}
        >
          <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={styles.fullBlur}>
            <User color={theme.colors.secondary} size={22} />
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
    width: '100%',
    zIndex: 1000,
  },
  leftSection: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  rightSection: {
    marginLeft: 15,
  },
  searchWrapper: {
    height: 48,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fullBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  expandedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    width: '100%',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    padding: 0,
    marginTop: Platform.OS === 'ios' ? 0 : 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
