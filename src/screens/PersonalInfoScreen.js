import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Edit3,
  Save,
  X,
  Shield,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

export default function PersonalInfoScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [userData, setUserData] = useState({
    id: '',
    full_name: '',
    email: '',
    phone: '',
    created_at: '',
    email_verified: false,
  });

  const [editData, setEditData] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        Alert.alert('Error', 'Please login to continue');
        navigation.navigate('Login');
        return;
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const userInfo = {
        id: user.id,
        full_name: profile?.full_name || 'Not set',
        email: user.email || 'No email',
        phone: user.phone || profile?.phone || '',
        created_at: user.created_at,
        email_verified: user.email_confirmed_at ? true : false,
      };

      setUserData(userInfo);
      setEditData({
        full_name: profile?.full_name || '',
        phone: user.phone || profile?.phone || '',
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editData.full_name.trim()) {
      Alert.alert('Validation Error', 'Full name cannot be empty');
      return;
    }

    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: editData.full_name.trim(),
          phone: editData.phone.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      // Update local state
      setUserData({
        ...userData,
        full_name: editData.full_name.trim(),
        phone: editData.phone.trim(),
      });

      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      full_name: userData.full_name,
      phone: userData.phone,
    });
    setEditing(false);
  };

  const InfoField = ({ icon: Icon, label, value, editable = false, field = '' }) => (
    <View style={[styles.infoField, { borderColor: theme.colors.glassBorder }]}>
      <View style={styles.infoFieldHeader}>
        <View style={styles.infoFieldLabel}>
          <Icon size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
        </View>
        {editable && !editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Edit3 size={16} color={theme.colors.secondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {editing && editable ? (
        <TextInput
          style={[styles.input, { 
            color: theme.colors.textPrimary,
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderColor: theme.colors.glassBorder,
          }]}
          value={editData[field]}
          onChangeText={(text) => setEditData({ ...editData, [field]: text })}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
        />
      ) : (
        <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
          {value || 'Not set'}
        </Text>
      )}
    </View>
  );

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
              Personal Information
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              Manage your account details
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.textPrimary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Loading your information...
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Avatar */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatarContainer, { backgroundColor: theme.colors.secondary }]}>
                <Text style={styles.avatarText}>
                  {userData.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                {userData.full_name}
              </Text>
              {userData.email_verified && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={styles.verifiedText}>Verified Account</Text>
                </View>
              )}
            </View>

            {/* Editable Fields */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Account Details
              </Text>
              
              <InfoField
                icon={User}
                label="Full Name"
                value={userData.full_name}
                editable={true}
                field="full_name"
              />

              <InfoField
                icon={Phone}
                label="Phone Number"
                value={userData.phone}
                editable={true}
                field="phone"
              />
            </View>

            {/* Read-only Fields */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                Account Information
              </Text>

              <InfoField
                icon={Mail}
                label="Email Address"
                value={userData.email}
                editable={false}
              />

              <InfoField
                icon={Calendar}
                label="Member Since"
                value={new Date(userData.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                editable={false}
              />

              <InfoField
                icon={Shield}
                label="User ID"
                value={userData.id.substring(0, 8) + '...'}
                editable={false}
              />
            </View>

            {/* Action Buttons */}
            {editing && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[styles.cancelButton, { borderColor: theme.colors.glassBorder }]}
                  disabled={saving}
                >
                  <X size={20} color={theme.colors.textSecondary} />
                  <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveButton, { backgroundColor: theme.colors.secondary }]}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <Save size={20} color="#000" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

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
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#000',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  infoField: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  infoFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoFieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
});
