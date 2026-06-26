import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  useWindowDimensions,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { Text } from './A11yText';
import { useA11yStore, HighlightColorType, getDefaultApiUrl } from '../store/useA11yStore';
import { THEMES, ThemeType } from '../theme/themes';
import * as Speech from 'expo-speech';
import { ProfileModal } from './ProfileModal';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsModalVisible,
    setSettingsModalVisible,
    themeType,
    setThemeType,
    fontSize,
    setFontSize,
    lineSpacing,
    setLineSpacing,
    letterSpacing,
    setLetterSpacing,
    fontFamily,
    setFontFamily,
    focusModeEnabled,
    setFocusModeEnabled,
    ttsSpeed,
    setTtsSpeed,
    ttsPitch,
    setTtsPitch,
    highlightColor,
    setHighlightColor,
    apiUrl,
    setApiUrl,
    profileName,
    profilePhotoUri,
  } = useA11yStore();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const theme = THEMES[themeType];
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  // Dynamic responsive heights
  const modalMaxHeight = windowHeight * 0.85;
  const modalWidth = Math.min(550, windowWidth * 0.9);

  // Stepper bounds
  const minFontSize = 14;
  const maxFontSize = 32;
  const minLineSpacing = 1.3;
  const maxLineSpacing = 2.4;
  const minLetterSpacing = 0;
  const maxLetterSpacing = 8;
  
  const minTtsSpeed = 0.5;
  const maxTtsSpeed = 2.0;
  const minTtsPitch = 0.5;
  const maxTtsPitch = 2.0;

  const highlightBgs: Record<string, string> = {
    theme: themeType === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
    orange: '#FFE8D6',
    teal: '#D0F0EC',
    purple: '#E8DFFF',
    green: '#D5F3E5',
  };

  const highlightColors: Record<string, string> = {
    theme: theme.accent,
    orange: '#F27A1A',
    teal: '#139A8C',
    purple: '#8A2BE2',
    green: '#2E8B57',
  };

  const activeHighlightBg = highlightBgs[highlightColor] || 'rgba(0, 0, 0, 0.05)';
  const activeHighlightBorder = highlightColors[highlightColor] || theme.accent;

  const highlightOptions: { type: HighlightColorType; label: string; color: string }[] = [
    { type: 'theme', label: 'Default', color: theme.accent },
    { type: 'orange', label: 'Orange', color: '#F27A1A' },
    { type: 'teal', label: 'Teal', color: '#139A8C' },
    { type: 'purple', label: 'Purple', color: '#8A2BE2' },
    { type: 'green', label: 'Green', color: '#2E8B57' },
  ];

  const fontOptions = [
    { id: 'System', label: 'Default', nativeName: undefined },
    { id: 'OpenDyslexic', label: 'OpenDyslexic', nativeName: 'OpenDyslexic' },
    { id: 'AtkinsonHyperlegible', label: 'Atkinson Hyperlegible', nativeName: 'AtkinsonHyperlegible' },
    { id: 'Serif', label: 'Serif', nativeName: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    { id: 'Monospace', label: 'Monospace', nativeName: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  ];

  const handleReset = () => {
    setThemeType('cream');
    setFontSize(18);
    setLineSpacing(1.6);
    setLetterSpacing(2);
    setFontFamily('System');
    setFocusModeEnabled(true);
    setTtsSpeed(1.0);
    setTtsPitch(1.0);
    setHighlightColor('theme');
  };

  const speakTest = (speed: number, pitch: number) => {
    Speech.stop();
    Speech.speak("This is the current sound.", {
      rate: speed,
      pitch: pitch,
    });
  };

  const handleTtsSpeedChange = (newSpeed: number) => {
    setTtsSpeed(newSpeed);
    speakTest(newSpeed, ttsPitch);
  };

  const handleTtsPitchChange = (newPitch: number) => {
    setTtsPitch(newPitch);
    speakTest(ttsSpeed, newPitch);
  };

  const handleHighlightChange = (colorType: HighlightColorType, label: string) => {
    setHighlightColor(colorType);
    Speech.stop();
    Speech.speak(`${label} highlight accent selected.`, {
      rate: ttsSpeed,
      pitch: ttsPitch,
    });
  };

  const handleFontChange = (fontId: string, label: string) => {
    setFontFamily(fontId);
    Speech.stop();
    Speech.speak(`${label} font style selected.`, {
      rate: ttsSpeed,
      pitch: ttsPitch,
    });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isSettingsModalVisible}
      onRequestClose={() => setSettingsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.background,
              borderColor: themeType === 'dark' ? '#333' : '#E6E2D8',
              maxHeight: modalMaxHeight,
              width: modalWidth,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.cardBackground }]}>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Reader Settings
            </Text>
            <View style={styles.headerBtnRow}>
              <TouchableOpacity
                onPress={handleReset}
                style={[styles.resetBtn, { backgroundColor: theme.cardBackground }]}
              >
                <Text style={[styles.resetBtnText, { color: theme.accent }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSettingsModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* ── Profile Card ──────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>My Profile</Text>
              <TouchableOpacity
                style={[styles.profileCard, { backgroundColor: theme.cardBackground }]}
                onPress={() => setIsProfileOpen(true)}
                activeOpacity={0.8}
              >
                <View style={[styles.profileAvatar, { borderColor: theme.accent }]}>
                  {profilePhotoUri ? (
                    <Image source={{ uri: profilePhotoUri }} style={styles.profileAvatarImg} />
                  ) : (
                    <Text style={{ fontSize: 26 }}>👦</Text>
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: theme.textPrimary }]}>{profileName}</Text>
                  <Text style={[styles.profileSub, { color: theme.textSecondary }]}>Tap to edit name & photo</Text>
                </View>
                <Text style={[styles.profileChevron, { color: theme.accent }]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Theme Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>Visual Theme</Text>
              <View style={styles.themeGrid}>
                {(Object.keys(THEMES) as ThemeType[]).map((key) => {
                  const item = THEMES[key];
                  const isSelected = themeType === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setThemeType(key)}
                      style={[
                        styles.themeButton,
                        {
                          backgroundColor: item.background,
                          borderColor: isSelected ? theme.accent : 'rgba(0,0,0,0.06)',
                          borderWidth: isSelected ? 2.5 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.colorIndicator, { backgroundColor: item.textPrimary }]} />
                      <View style={[styles.colorIndicator, { backgroundColor: item.textSecondary }]} />
                      <Text style={[styles.themeLabel, { color: item.textPrimary, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Reading Highlight Accent Selector */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>Reading Highlight Accent</Text>
              
              <View 
                style={[
                  styles.previewBox, 
                  { 
                    backgroundColor: theme.cardBackground, 
                    borderLeftWidth: 4, 
                    borderLeftColor: activeHighlightBorder,
                    marginBottom: 12,
                  }
                ]}
              >
                <Text style={{ color: theme.textPrimary, fontSize: 14, lineHeight: 20 }}>
                  This is how a <Text style={{ backgroundColor: activeHighlightBg, fontWeight: 'bold' }}>highlighted word</Text> and the active line border look in the reader.
                </Text>
              </View>

              <View style={styles.highlightRow}>
                {highlightOptions.map((opt) => {
                  const isSelected = highlightColor === opt.type;
                  return (
                    <TouchableOpacity
                      key={opt.type}
                      onPress={() => handleHighlightChange(opt.type, opt.label)}
                      style={[
                        styles.colorPill,
                        {
                          backgroundColor: opt.color,
                          borderColor: isSelected ? theme.textPrimary : 'transparent',
                          borderWidth: isSelected ? 2.5 : 0,
                        },
                      ]}
                    >
                      <Text style={[styles.colorPillText, { color: '#ffffff' }]}>
                        {opt.label[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Lettering adjustments */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>Lettering & Spacing</Text>
              
              <View style={[styles.previewBox, { backgroundColor: theme.cardBackground }]}>
                <Text
                  style={{
                    color: theme.textPrimary,
                    fontSize: fontSize,
                    lineHeight: fontSize * lineSpacing,
                    letterSpacing: letterSpacing,
                    fontFamily: fontOptions.find((opt) => opt.id === fontFamily)?.nativeName,
                  }}
                >
                  "The quick brown fox jumps over the lazy dog."
                </Text>
              </View>

              {/* Font Family Selector */}
              <View style={styles.fontSelectorContainer}>
                <Text style={[styles.fontSelectorLabel, { color: theme.textPrimary }]}>Font Style:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontRow}>
                  {fontOptions.map((opt) => {
                    const isSelected = fontFamily === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => handleFontChange(opt.id, opt.label)}
                        style={[
                          styles.fontPill,
                          {
                            backgroundColor: isSelected ? theme.accent : theme.cardBackground,
                            borderColor: isSelected ? theme.accent : themeType === 'dark' ? '#333' : '#EAE6DB',
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.fontPillText,
                            {
                              color: isSelected ? '#ffffff' : theme.textPrimary,
                              fontFamily: opt.nativeName,
                              fontWeight: isSelected ? 'bold' : 'normal',
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              
              {/* Font Size */}
              <View style={[styles.stepperRow, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.stepperLabel, { color: theme.textPrimary }]}>Font Size: {fontSize}px</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    disabled={fontSize <= minFontSize}
                    onPress={() => setFontSize(fontSize - 1)}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={fontSize >= maxFontSize}
                    onPress={() => setFontSize(fontSize + 1)}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Line Height */}
              <View style={[styles.stepperRow, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.stepperLabel, { color: theme.textPrimary }]}>Line Spacing: {lineSpacing.toFixed(1)}x</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    disabled={lineSpacing <= minLineSpacing}
                    onPress={() => setLineSpacing(Number((lineSpacing - 0.1).toFixed(1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={lineSpacing >= maxLineSpacing}
                    onPress={() => setLineSpacing(Number((lineSpacing + 0.1).toFixed(1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Letter Tracking */}
              <View style={[styles.stepperRow, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.stepperLabel, { color: theme.textPrimary }]}>Letter Tracking: +{letterSpacing}</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    disabled={letterSpacing <= minLetterSpacing}
                    onPress={() => setLetterSpacing(letterSpacing - 1)}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={letterSpacing >= maxLetterSpacing}
                    onPress={() => setLetterSpacing(letterSpacing + 1)}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Immersive Focus Mode Toggle */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>Immersive Focus Mode</Text>
              <View style={[styles.toggleRow, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.toggleLabelCol}>
                  <Text style={[styles.toggleText, { color: theme.textPrimary }]}>Reading Ruler Mask</Text>
                  <Text style={[styles.toggleSubtext, { color: theme.textSecondary }]}>Dims surrounding paragraphs to assist tracking.</Text>
                </View>
                <Switch
                  value={focusModeEnabled}
                  onValueChange={setFocusModeEnabled}
                  trackColor={{ false: '#767577', true: theme.accent }}
                  thumbColor={focusModeEnabled ? '#ffffff' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Text-To-Speech (TTS) Settings */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>Audio Assistant (Text-to-Speech)</Text>

              {/* TTS Speed */}
              <View style={[styles.stepperRow, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.stepperLabel, { color: theme.textPrimary }]}>Speech Rate: {ttsSpeed.toFixed(1)}x</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    disabled={ttsSpeed <= minTtsSpeed}
                    onPress={() => handleTtsSpeedChange(Number((ttsSpeed - 0.1).toFixed(1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={ttsSpeed >= maxTtsSpeed}
                    onPress={() => handleTtsSpeedChange(Number((ttsSpeed + 0.1).toFixed(1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* TTS Pitch */}
              <View style={[styles.stepperRow, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.stepperLabel, { color: theme.textPrimary }]}>Voice Pitch: {ttsPitch.toFixed(1)}x</Text>
                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    disabled={ttsPitch <= minTtsPitch}
                    onPress={() => handleTtsPitchChange(Number((ttsPitch - 0.1).toFixed(1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={ttsPitch >= maxTtsPitch}
                    onPress={() => handleTtsPitchChange(Number((ttsPitch + 0.1).toFixed(1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Backend Connection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>Backend Connection</Text>
              <View style={[styles.stepperRow, { backgroundColor: theme.cardBackground, flexDirection: 'column', alignItems: 'stretch', gap: 10, paddingVertical: 14 }]}>
                <Text style={[styles.stepperLabel, { color: theme.textPrimary, fontSize: 13 }]}>
                  Server API URL:
                </Text>
                <TextInput
                  style={[
                    styles.apiUrlInput,
                    {
                      color: theme.textPrimary,
                      borderColor: theme.accent,
                      backgroundColor: theme.background,
                    }
                  ]}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  placeholder="http://localhost:8000"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setApiUrl(getDefaultApiUrl())}
                  style={[styles.resetUrlBtn, { backgroundColor: theme.accent }]}
                >
                  <Text style={styles.resetUrlBtnText}>Reset to Local Server</Text>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </View>
      </View>

      <ProfileModal visible={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  previewBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  headerBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    minWidth: '47%',
    flex: 1,
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  themeLabel: {
    fontSize: 12,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepperControls: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  toggleLabelCol: {
    flex: 1,
    marginRight: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleSubtext: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  colorSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 6,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  fontSelectorContainer: {
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  fontSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  fontRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  fontPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fontPillText: {
    fontSize: 13,
  },
  apiUrlInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  resetUrlBtn: {
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  resetUrlBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  // Profile card styles
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  profileAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileSub: { fontSize: 12, marginTop: 2 },
  profileChevron: { fontSize: 24, fontWeight: '300' },
});
