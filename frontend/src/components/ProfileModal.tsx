import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Text } from './A11yText';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import * as ImagePicker from 'expo-image-picker';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const {
    themeType,
    profileName,
    profilePhotoUri,
    setProfileName,
    setProfilePhotoUri,
    setActiveScreen,
    endSession,
    setOnboardingCompleted,
    setSettingsModalVisible,
  } = useA11yStore();

  const theme = THEMES[themeType];
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const modalWidth = Math.min(500, windowWidth * 0.9);

  const [localName, setLocalName] = useState(profileName);

  // Keep localName in sync when modal opens
  React.useEffect(() => {
    if (visible) setLocalName(profileName);
  }, [visible, profileName]);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setProfilePhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setProfilePhotoUri(result.assets[0].uri);
    }
  };

  const handlePhotoPress = () => {
    Alert.alert('Change Profile Photo', 'Choose a method', [
      { text: '📷 Take Photo', onPress: takePhoto },
      { text: '🖼️ Choose from Gallery', onPress: pickFromGallery },
      { text: '🗑️ Remove Photo', style: 'destructive', onPress: () => setProfilePhotoUri(null) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    const trimmed = localName.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setProfileName(trimmed);
    onClose();
  };

  const handleLogout = () => {
    endSession();
    setActiveScreen('login');
    setIsLogoutConfirmVisible(false);
    onClose();
  };

  const handleRetakeOnboarding = () => {
    setOnboardingCompleted(false);
    setActiveScreen('onboarding');
    setSettingsModalVisible(false);
    onClose();
  };

  const isDark = themeType === 'dark';

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* Bottom Sheet Card */}
        <View style={[styles.sheet, {
          backgroundColor: theme.background,
          width: modalWidth,
          borderColor: isDark ? '#333' : '#E6E2D8',
        }]}>

          {/* Handle */}
          <View style={[styles.handle, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'
          }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.sheetLabel, { color: theme.accent }]}>ACCOUNT</Text>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: theme.accent }]}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={[styles.avatarWrap, {
                borderColor: theme.accent,
                shadowColor: theme.accent,
              }]}
              onPress={handlePhotoPress}
              activeOpacity={0.8}
            >
              {profilePhotoUri ? (
                <Image source={{ uri: profilePhotoUri }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.cardBackground }]}>
                  <Text style={styles.avatarEmoji}>👦</Text>
                </View>
              )}
              {/* Camera badge */}
              <View style={[styles.cameraBadge, { backgroundColor: theme.accent }]}>
                <Text style={styles.cameraBadgeIcon}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.tapHint, { color: theme.textSecondary }]}>
              Tap to change photo
            </Text>
          </View>

          {/* Name Input */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Display Name</Text>
            <View style={[styles.inputWrap, {
              backgroundColor: theme.cardBackground,
              borderColor: isDark ? '#444' : '#DDD9CF',
            }]}>
              <Text style={styles.inputIcon}>✏️</Text>
              <TextInput
                style={[styles.nameInput, { color: theme.textPrimary }]}
                value={localName}
                onChangeText={setLocalName}
                placeholder="Enter your name"
                placeholderTextColor={theme.textSecondary}
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
          </View>

          {/* Stats preview */}
          <View style={[styles.statsPreview, {
            backgroundColor: theme.cardBackground,
            borderColor: isDark ? '#333' : '#EAE6DB',
          }]}>
            <Text style={[styles.statsPreviewLabel, { color: theme.textSecondary }]}>
              Your profile appears on the Home screen and in the AI Tutor chat.
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: '#435B4E' }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </TouchableOpacity>

          {/* Retake Onboarding Button */}
          <TouchableOpacity
            style={[styles.retakeBtn, { borderColor: theme.accent, borderWidth: 1.5 }]}
            onPress={handleRetakeOnboarding}
            activeOpacity={0.85}
          >
            <Text style={[styles.retakeBtnText, { color: theme.accent }]}>💡 Retake Setup Wizard</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: '#d9534f', borderWidth: 1.5 }]}
            onPress={() => setIsLogoutConfirmVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.logoutBtnText, { color: '#d9534f' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={isLogoutConfirmVisible}
        onRequestClose={() => setIsLogoutConfirmVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <TouchableOpacity
            style={styles.confirmBackdrop}
            activeOpacity={1}
            onPress={() => setIsLogoutConfirmVisible(false)}
          />
          <View style={[styles.confirmCard, {
            backgroundColor: theme.background,
            borderColor: isDark ? '#444' : '#E6E2D8',
            width: modalWidth - 40,
          }]}>
            <Text style={[styles.confirmEmoji, { textAlign: 'center' }]}>🚪</Text>
            <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>Log Out?</Text>
            <Text style={[styles.confirmMessage, { color: theme.textSecondary }]}>
              Are you sure you want to log out? Your current study session will be saved.
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.cancelBtn, {
                  backgroundColor: theme.cardBackground,
                  borderColor: isDark ? '#444' : '#DDD9CF',
                  borderWidth: 1,
                }]}
                onPress={() => setIsLogoutConfirmVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.logoutConfirmBtn, {
                  backgroundColor: theme.accent,
                }]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutConfirmBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    alignSelf: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  sheetLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 46,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraBadgeIcon: {
    fontSize: 14,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 10,
  },

  // Name field
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputIcon: {
    fontSize: 18,
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },

  // Stats hint
  statsPreview: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  statsPreviewLabel: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },

  // Save
  saveBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Retake Onboarding
  retakeBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  retakeBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Logout
  logoutBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // Confirmation Modal
  confirmOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  confirmCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  confirmEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {},
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  logoutConfirmBtn: {},
  logoutConfirmBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
