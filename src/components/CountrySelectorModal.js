import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Platform, Image } from 'react-native';
import { Search, X, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { COUNTRIES } from '../constants/CountryList';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

export default function CountrySelectorModal({ visible, onClose, onSelect, selectedCountry }) {
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code.includes(searchQuery)
    );
  }, [searchQuery]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
           activeOpacity={1} 
           style={[styles.modalContent, { 
             backgroundColor: isDark ? '#1A1A1A' : '#FFF',
             borderColor: theme.colors.glassBorder 
           }]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Select Country</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={moderateScale(24)} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.inputBorder }]}>
            <Search size={moderateScale(20)} color={theme.colors.textSecondary} style={{ marginRight: scale(10) }} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              placeholder="Search country or code..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {filteredCountries.map((country) => {
              const isSelected = selectedCountry?.code === country.code;
              return (
                <TouchableOpacity 
                  key={country.code} 
                  style={[
                    styles.countryItem, 
                    { 
                        borderBottomColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                        backgroundColor: isSelected ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)') : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    onSelect(country);
                    setSearchQuery(''); // Reset search
                    onClose();
                  }}
                >
                  <View style={styles.countryLeft}>
                    <Image 
                      source={{ uri: `https://flagcdn.com/w80/${country.iso}.png` }}
                      style={styles.flagImage} 
                      resizeMode="cover"
                    />
                    <View>
                        <Text style={[styles.countryName, { color: theme.colors.textPrimary }]}>{country.name}</Text>
                        <Text style={[styles.countryCodeDetail, { color: theme.colors.textSecondary }]}>{country.code}</Text>
                    </View>
                  </View>
                  
                  {isSelected && <Check size={moderateScale(20)} color={theme.colors.secondary} />}
                </TouchableOpacity>
              );
            })}
            
            {filteredCountries.length === 0 && (
                <View style={{ padding: scale(20), alignItems: 'center' }}>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: moderateScale(14) }}>No countries found</Text>
                </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: scale(32),
    borderTopRightRadius: scale(32),
    padding: scale(24),
    height: '80%', // Taller modal
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '900',
  },
  closeButton: {
    padding: scale(4),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    height: verticalScale(50),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: verticalScale(20),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    height: '100%',
  },
  listContent: {
    paddingBottom: verticalScale(40),
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(10),
    borderBottomWidth: 1,
    borderRadius: scale(12),
  },
  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(16),
  },
  flagImage: {
    width: scale(32),
    height: scale(24),
    borderRadius: scale(4),
  },
  countryName: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  countryCodeDetail: {
    fontSize: moderateScale(14),
    marginTop: verticalScale(2),
  },
});
