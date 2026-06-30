import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
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
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import StatusModal from '../components/StatusModal';
import { scale, verticalScale, moderateScale } from '../utils/Scaling';

export default function PersonalInfoScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { theme, isDark } = useTheme();
  const { refreshStats } = useProgress();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [showStatus, setShowStatus] = useState(false);
  const [statusConfig, setStatusConfig] = useState({ type: 'success', title: '', message: '' });
  
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
        setStatusConfig({
          type: 'error',
          title: 'Not Authenticated',
          message: 'Please login to continue managing your profile.'
        });
        setShowStatus(true);
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
      logger.error('Error fetching user data:', error);
      setStatusConfig({
        type: 'error',
        title: 'Fetch Failed',
        message: 'We couldn\'t load your profile information. Please check your connection.'
      });
      setShowStatus(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editData.full_name.trim()) {
      setStatusConfig({
        type: 'error',
        title: 'Missing Name',
        message: 'Please enter your full name to update your profile.'
      });
      setShowStatus(true);
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

      // Ensure global state is updated
      if (refreshStats) {
        await refreshStats();
      }

      // Update local state
      setUserData({
        ...userData,
        full_name: editData.full_name.trim(),
        phone: editData.phone.trim(),
      });

      setEditing(false);
      setStatusConfig({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your personal information has been successfully saved.'
      });
      setShowStatus(true);
    } catch (error) {
      logger.error('Error updating profile:', error);
      setStatusConfig({
        type: 'error',
        title: 'Update Failed',
        message: 'Something went wrong while saving your profile. Please try again.'
      });
      setShowStatus(true);
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

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and all your progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase.rpc('delete_user_account');
              if (error) throw error;
              
              Alert.alert("Account Deleted", "Your account and all associated data have been permanently deleted.", [
                { text: "OK", onPress: () => signOut() }
              ]);
            } catch (error) {
              logger.error('Error deleting account:', error);
              setStatusConfig({
                type: 'error',
                title: 'Deletion Failed',
                message: 'Something went wrong while deleting your account. Please try again.'
              });
              setShowStatus(true);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const InfoField = ({ icon: Icon, label, value, editable = false, field = '' }) => (
    <View style={[styles.infoField, { borderColor: theme.colors.glassBorder }]}>
      <View style={styles.infoFieldHeader}>
        <View style={styles.infoFieldLabel}>
          <Icon size={scale(18)} color={theme.colors.textSecondary} />
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
        </View>
        {editable && !editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Edit3 size={scale(16)} color={theme.colors.secondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {editing && editable ? (
        <TextInput
          style={[styles.input, { 
            color: theme.colors.textPrimary,
            backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
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
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.15)' }]}
          >
            <ArrowLeft color={theme.colors.textPrimary} size={scale(24)} />
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
            {isLargeScreen ? (
              <View style={styles.largeScreenContainer}>
                <BlurView 
                  intensity={25} 
                  tint={isDark ? "dark" : "light"} 
                  style={[styles.leftColumn, styles.glassPanel, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
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
                        <CheckCircle size={scale(16)} color="#10B981" />
                        <Text style={styles.verifiedText}>Verified Account</Text>
                      </View>
                    )}
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

                  {/* Account Deletion Section */}
                  {!editing && (
                    <View style={[styles.section, { marginTop: verticalScale(10), alignItems: 'center' }]}>
                       <TouchableOpacity 
                          style={[styles.deleteButton, { borderColor: 'rgba(239, 68, 68, 0.5)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                          onPress={handleDeleteAccount}
                       >
                          <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: moderateScale(14) }}>Delete Account</Text>
                       </TouchableOpacity>
                       <Text style={{ color: theme.colors.textSecondary, fontSize: moderateScale(11), marginTop: verticalScale(8), textAlign: 'center', opacity: 0.7 }}>
                          Permanently delete your account and all associated data.
                       </Text>
                    </View>
                  )}
                </BlurView>

                <BlurView 
                  intensity={25} 
                  tint={isDark ? "dark" : "light"} 
                  style={[styles.rightColumn, styles.glassPanel, { backgroundColor: theme.colors.glass, borderColor: theme.colors.glassBorder }]}
                >
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

                  {/* Action Buttons */}
                  {editing && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        onPress={handleCancel}
                        style={[styles.cancelButton, { borderColor: theme.colors.glassBorder }]}
                        disabled={saving}
                      >
                        <X size={scale(20)} color={theme.colors.textSecondary} />
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
                            <Save size={scale(20)} color="#000" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </BlurView>
              </View>
            ) : (
              <View>
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
                      <CheckCircle size={scale(16)} color="#10B981" />
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

                {/* Account Deletion Section */}
                {!editing && (
                  <View style={[styles.section, { marginTop: verticalScale(10), alignItems: 'center' }]}>
                     <TouchableOpacity 
                        style={[styles.deleteButton, { borderColor: 'rgba(239, 68, 68, 0.5)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                        onPress={handleDeleteAccount}
                     >
                        <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: moderateScale(14) }}>Delete Account</Text>
                     </TouchableOpacity>
                     <Text style={{ color: theme.colors.textSecondary, fontSize: moderateScale(11), marginTop: verticalScale(8), textAlign: 'center', opacity: 0.7 }}>
                        Permanently delete your account and all associated data.
                     </Text>
                  </View>
                )}

                {/* Action Buttons */}
                {editing && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={handleCancel}
                      style={[styles.cancelButton, { borderColor: theme.colors.glassBorder }]}
                      disabled={saving}
                    >
                      <X size={scale(20)} color={theme.colors.textSecondary} />
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
                          <Save size={scale(20)} color="#000" />
                          <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      <StatusModal
        visible={showStatus}
        onClose={() => setShowStatus(false)}
        type={statusConfig.type}
        title={statusConfig.title}
        message={statusConfig.message}
        onAction={() => {
          setShowStatus(false);
          if (statusConfig.type === 'success') {
            navigation.goBack();
          } else if (statusConfig.title === 'Not Authenticated') {
            navigation.navigate('Login');
          }
        }}
      />
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
  headerInfo: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: moderateScale(15),
    marginTop: verticalScale(4),
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(16),
  },
  scrollContent: {
    paddingHorizontal: scale(20),
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: verticalScale(32),
  },
  avatarContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  avatarText: {
    fontSize: moderateScale(40),
    fontWeight: '900',
    color: '#000',
  },
  userName: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    marginBottom: verticalScale(8),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(12),
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  section: {
    marginBottom: verticalScale(32),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    marginBottom: verticalScale(16),
  },
  infoField: {
    marginBottom: verticalScale(16),
    padding: scale(16),
    borderRadius: scale(16),
    borderWidth: scale(1),
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  infoFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  infoFieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  label: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  input: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: scale(1),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: scale(12),
    marginTop: verticalScale(8),
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: verticalScale(16),
    borderRadius: scale(16),
    borderWidth: scale(2),
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
    paddingVertical: verticalScale(16),
    borderRadius: scale(16),
  },
  saveButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '900',
    color: '#000',
  },
  deleteButton: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(24),
    borderRadius: scale(12),
    borderWidth: 1,
    width: '100%',
    alignItems: 'center',
  },
  largeScreenContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(30),
    marginTop: verticalScale(10),
    width: '100%',
  },
  leftColumn: {
    width: scale(300),
    maxWidth: '40%',
  },
  rightColumn: {
    flex: 1,
    maxWidth: scale(600),
  },
  glassPanel: {
    borderRadius: scale(30),
    borderWidth: scale(1),
    paddingVertical: verticalScale(25),
    paddingHorizontal: scale(20),
    overflow: 'hidden',
  },
});
