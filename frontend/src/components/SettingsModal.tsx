import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useA11yStore, HighlightColorType } from '../store/useA11yStore';
import { THEMES, ThemeType } from '../theme/themes';

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
    focusModeEnabled,
    setFocusModeEnabled,
    ttsSpeed,
    setTtsSpeed,
    ttsPitch,
    setTtsPitch,
    highlightColor,
    setHighlightColor,
  } = useA11yStore();

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

  const highlightOptions: { type: HighlightColorType; label: string; color: string }[] = [
    { type: 'theme', label: 'Default', color: theme.accent },
    { type: 'orange', label: 'Orange', color: '#F27A1A' },
    { type: 'teal', label: 'Teal', color: '#139A8C' },
    { type: 'purple', label: 'Purple', color: '#8A2BE2' },
    { type: 'green', label: 'Green', color: '#2E8B57' },
  ];

  const handleReset = () => {
    setThemeType('cream');
    setFontSize(18);
    setLineSpacing(1.6);
    setLetterSpacing(2);
    setFocusModeEnabled(true);
    setTtsSpeed(1.0);
    setTtsPitch(1.0);
    setHighlightColor('theme');
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

            {/* Lettering adjustments */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>Lettering & Spacing</Text>
              
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
                    onPress={() => setTtsSpeed(Number((ttsSpeed - 0.1).toFixed(1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={ttsSpeed >= maxTtsSpeed}
                    onPress={() => setTtsSpeed(Number((ttsSpeed + 0.1).toFixed(1)))}
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
                    onPress={() => setTtsPitch(Number((ttsPitch - 0.1).toFixed(1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={ttsPitch >= maxTtsPitch}
                    onPress={() => setTtsPitch(Number((ttsPitch + 0.1).toFixed(1)))}
                    style={[styles.stepBtn, { backgroundColor: theme.accent }]}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Highlight Color Selector */}
              <View style={styles.colorSelectorContainer}>
                <Text style={[styles.colorLabel, { color: theme.textPrimary }]}>Highlight Accent:</Text>
                <View style={styles.highlightRow}>
                  {highlightOptions.map((opt) => {
                    const isSelected = highlightColor === opt.type;
                    return (
                      <TouchableOpacity
                        key={opt.type}
                        onPress={() => setHighlightColor(opt.type)}
                        style={[
                          styles.colorPill,
                          {
                            backgroundColor: opt.color,
                            borderColor: isSelected ? theme.textPrimary : 'transparent',
                            borderWidth: isSelected ? 2 : 0,
                          },
                        ]}
                      >
                        <Text style={[styles.colorPillText, { color: opt.type === 'theme' && themeType !== 'dark' ? '#fff' : '#fff' }]}>
                          {opt.label[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

          </ScrollView>
        </View>
      </View>
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
});
