import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, useWindowDimensions } from 'react-native';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES, ThemeType } from '../theme/themes';

interface ControlPanelProps {
  totalLines: number;
}

// Helper limits for custom spacing steppers
const minFontSize = 14;
const maxFontSize = 32;
const minLineSpacing = 1.3;
const maxLineSpacing = 2.4;
const minLetterSpacing = 0;
const maxLetterSpacing = 8;

export const ControlPanel: React.FC<ControlPanelProps> = ({ totalLines }) => {
  const {
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
    activeLineIndex,
    setActiveLineIndex,
  } = useA11yStore();

  const theme = THEMES[themeType];
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  // Dynamic responsive sizing
  const panelHeight = Math.min(380, windowHeight * 0.45);
  const containerMaxWidth = Math.min(650, windowWidth);

  const handleReset = () => {
    setThemeType('cream');
    setFontSize(18);
    setLineSpacing(1.6);
    setLetterSpacing(2);
    setFocusModeEnabled(true);
    setActiveLineIndex(0);
  };

  const currentThemeInfo = THEMES[themeType];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: themeType === 'dark' ? '#333' : '#E0DCD3',
          height: panelHeight,
          maxWidth: containerMaxWidth,
          alignSelf: 'center',
          width: '100%',
        },
      ]}
    >
      {/* Header and Reset */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          A11y Settings
        </Text>
        <TouchableOpacity
          onPress={handleReset}
          style={[styles.resetButton, { backgroundColor: theme.accent }]}
        >
          <Text style={styles.resetButtonText}>Reset Defaults</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Theme Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Color Themes (Dyslexia-Optimized Pastels)
          </Text>
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
                      borderColor: isSelected ? theme.accent : 'transparent',
                      borderWidth: isSelected ? 3 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.themeIndicatorColor,
                      { backgroundColor: item.textPrimary },
                    ]}
                  />
                  <View
                    style={[
                      styles.themeIndicatorColor,
                      { backgroundColor: item.textSecondary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.themeText,
                      {
                        color: item.textPrimary,
                        fontWeight: isSelected ? 'bold' : 'normal',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sentence Navigation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Sentence Focus Tracker
          </Text>
          <View style={styles.navRow}>
            <TouchableOpacity
              disabled={activeLineIndex === 0}
              onPress={() => setActiveLineIndex(activeLineIndex - 1)}
              style={[
                styles.navButton,
                { backgroundColor: theme.accent, opacity: activeLineIndex === 0 ? 0.4 : 1 },
              ]}
            >
              <Text style={styles.navButtonText}>Prev</Text>
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: theme.textPrimary }]}>
                {totalLines > 0 ? `${activeLineIndex + 1} of ${totalLines}` : '0 of 0'}
              </Text>
            </View>

            <TouchableOpacity
              disabled={activeLineIndex >= totalLines - 1}
              onPress={() => setActiveLineIndex(activeLineIndex + 1)}
              style={[
                styles.navButton,
                {
                  backgroundColor: theme.accent,
                  opacity: activeLineIndex >= totalLines - 1 ? 0.4 : 1,
                },
              ]}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Steppers */}
        <View style={styles.stepperContainer}>
          {/* Font Size Stepper */}
          <View style={styles.stepperRow}>
            <Text style={[styles.stepperLabel, { color: theme.textPrimary }]}>
              Font Size: {fontSize}px
            </Text>
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

          {/* Line Height Stepper */}
          <View style={styles.stepperRow}>
            <Text style={[styles.stepperLabel, { color: theme.textPrimary }]}>
              Line Spacing: {lineSpacing.toFixed(1)}x
            </Text>
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

          {/* Letter/Word Spacing Stepper */}
          <View style={styles.stepperRow}>
            <Text style={[styles.stepperLabel, { color: theme.textPrimary }]}>
              Letter Tracking: +{letterSpacing}
            </Text>
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

        {/* Focus Mode Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleLabelCol}>
            <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>
              Immersive Focus Mask
            </Text>
            <Text style={[styles.toggleSublabel, { color: theme.textSecondary }]}>
              Blocks out surrounding lines to enhance attention.
            </Text>
          </View>
          <Switch
            value={focusModeEnabled}
            onValueChange={setFocusModeEnabled}
            trackColor={{ false: '#767577', true: theme.accent }}
            thumbColor={focusModeEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
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
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '31%',
    justifyContent: 'center',
  },
  themeIndicatorColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  themeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  stepperContainer: {
    marginBottom: 16,
    gap: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  toggleLabelCol: {
    flex: 1,
    marginRight: 8,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  toggleSublabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
