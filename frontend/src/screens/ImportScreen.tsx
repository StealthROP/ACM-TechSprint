import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { TabBar } from '../components/TabBar';

export const ImportScreen: React.FC = () => {
  const { themeType, setActiveScreen, highlightColor } = useA11yStore();
  const theme = THEMES[themeType];
  const [isImporting, setIsImporting] = useState(false);

  // Map user-selected highlight color to hex codes
  const highlightColors: Record<string, string> = {
    theme: theme.accent,
    orange: '#F27A1A',
    teal: '#139A8C',
    purple: '#8A2BE2',
    green: '#2E8B57',
  };
  const activeHighlightColor = highlightColors[highlightColor] || theme.accent;

  const handleImportPress = () => {
    setIsImporting(true);
    // Simulate document upload and parsing
    setTimeout(() => {
      setIsImporting(false);
      setActiveScreen('reader');
    }, 1800);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.headerSubtitle, { color: activeHighlightColor }]}>ADD STUDY MATERIAL</Text>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Import Document</Text>
        </View>

        {/* Upload Container Box */}
        <TouchableOpacity
          style={[styles.uploadBox, { backgroundColor: theme.cardBackground }]}
          onPress={handleImportPress}
          disabled={isImporting}
          activeOpacity={0.8}
        >
          {isImporting ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={activeHighlightColor} />
              <Text style={[styles.loaderText, { color: theme.textPrimary }]}>
                Processing imported document...
              </Text>
              <Text style={[styles.loaderSubText, { color: theme.textSecondary }]}>
                Running formatting analysis and syllabary chopping
              </Text>
            </View>
          ) : (
            <View style={styles.boxContent}>
              <Text style={styles.boxIcon}>📄</Text>
              <Text style={[styles.boxTitle, { color: theme.textPrimary }]}>
                Tap to Select File
              </Text>
              <Text style={[styles.boxSubtitle, { color: theme.textSecondary }]}>
                Supports PDF, TXT, EPUB or Word Document files
              </Text>
              <View style={[styles.selectBtn, { backgroundColor: activeHighlightColor }]}>
                <Text style={styles.selectBtnText}>Browse Device</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Info panel */}
        <View style={[styles.infoPanel, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>💡 Dyslexia-First Formatting</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            When you import a document, our API chops the sentences into phonemic syllables. It alternates colors to help speed up word decoding and reduce visual clutter automatically.
          </Text>
        </View>

      </ScrollView>

      {/* Tab Bar */}
      <TabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  uploadBox: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    borderStyle: 'dashed',
    paddingVertical: 56,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  boxContent: {
    alignItems: 'center',
  },
  boxIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  boxSubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  selectBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  selectBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loaderText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 6,
  },
  loaderSubText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  infoPanel: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
