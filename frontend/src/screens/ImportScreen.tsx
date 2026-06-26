import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { Text } from '../components/A11yText';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { TabBar } from '../components/TabBar';
import { ImportQrModal } from '../components/ImportQrModal';
import { getImageAsset } from '../theme/images';
import { Feather } from '@expo/vector-icons';

export const ImportScreen: React.FC = () => {
  const {
    themeType,
    setActiveScreen,
    setSelectedMaterialId,
    addDynamicLesson,
    setActiveReaderTab,
    apiUrl,
    fontFamily,
  } = useA11yStore();
  const theme = THEMES[themeType];
  
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'menu' | 'paste'>('menu');
  const [pastedText, setPastedText] = useState('');
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);

  // Cognitive style determination for dynamic assets
  const cognitiveStyle = fontFamily === 'OpenDyslexic' ? 'dyslexic' : 'standard';

  // Hero theme values based on selected app theme
  const getHeroTheme = (type: string) => {
    switch (type) {
      case 'cream':
        return { cardBg: '#93A392', btnBg: '#3E5445', text: '#FFFFFF' };
      case 'mint':
        return { cardBg: '#8A9E8A', btnBg: '#3E5445', text: '#FFFFFF' };
      case 'lavender':
        return { cardBg: '#8888A2', btnBg: '#383854', text: '#FFFFFF' };
      case 'dark':
        return { cardBg: '#2E3A2E', btnBg: '#1A281E', text: '#FFFFFF' };
      case 'harsh':
        return { cardBg: '#000000', btnBg: '#333333', text: '#FFFFFF' };
      default:
        return { cardBg: '#93A392', btnBg: '#3E5445', text: '#FFFFFF' };
    }
  };

  const heroTheme = getHeroTheme(themeType);

  const handleUploadPastedText = async () => {
    if (!pastedText.trim()) {
      Alert.alert("Empty Text", "Please paste or type some text first.");
      return;
    }
    
    setIsImporting(true);
    try {
      const uploadUrl = `${apiUrl}/api/v1/generate-review`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          raw_text: pastedText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate review material.');
      }

      const lessonData = await response.json();
      
      const newId = `imported-${Date.now()}`;
      addDynamicLesson(newId, lessonData);
      setSelectedMaterialId(newId);
      setActiveReaderTab('import');
      setActiveScreen('reader');
      setPastedText('');
    } catch (error) {
      console.error("Paste error:", error);
      Alert.alert("Error", "Could not process text. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const uploadFileToBackend = async (uri: string, name: string, type: string) => {
    try {
      let lessonData;
      const uploadUrl = `${apiUrl}/api/v1/generate-review-file`;

      if (Platform.OS === 'web') {
        const formData = new FormData();
        formData.append('file', {
          uri,
          name,
          type,
        } as any);

        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to generate review material.');
        }

        lessonData = await response.json();
      } else {
        // Native devices: Use expo-file-system for robust chunk/multipart uploading
        const uploadResult = await FileSystem.uploadAsync(
          uploadUrl,
          uri,
          {
            fieldName: 'file',
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            mimeType: type,
            headers: {
              'Bypass-Tunnel-Reminder': 'true',
            },
          }
        );

        if (uploadResult.status !== 200) {
          throw new Error(`Failed to generate review material. Status: ${uploadResult.status}`);
        }

        lessonData = JSON.parse(uploadResult.body);
      }

      const newId = `imported-${Date.now()}`;
      addDynamicLesson(newId, lessonData);
      setSelectedMaterialId(newId);
      setActiveReaderTab('import');
      setActiveScreen('reader');
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Could not process document. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportPress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsImporting(true);
        const asset = result.assets[0];
        const type = asset.mimeType || 'application/octet-stream';
        await uploadFileToBackend(asset.uri, asset.name, type);
      }
    } catch (error) {
      console.error(error);
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.headerSubtitle, { color: theme.accent }]}>ADD STUDY MATERIAL</Text>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Import Document</Text>
        </View>

        {importMode === 'paste' ? (
          <View style={[styles.pasteInputCard, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity 
              style={[styles.backBtn, { flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setImportMode('menu')}
            >
              <Feather name="arrow-left" size={16} color={theme.textSecondary} style={{ marginRight: 6 }} />
              <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>Back to Options</Text>
            </TouchableOpacity>
            {isImporting ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={[styles.loaderText, { color: theme.textPrimary }]}>
                  Processing pasted text...
                </Text>
                <Text style={[styles.loaderSubText, { color: theme.textSecondary }]}>
                  Analyzing contents, generating translations, and syllabifying words
                </Text>
              </View>
            ) : (
              <View>
                <Text style={[styles.pasteCardLabel, { color: theme.textSecondary }]}>
                  Enter or paste your study text below:
                </Text>
                <TextInput
                  style={[
                    styles.pasteTextInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: themeType === 'dark' ? '#444' : '#E0DCD0',
                    }
                  ]}
                  multiline
                  placeholder="Paste textbook pages, articles, study guides, etc..."
                  placeholderTextColor={theme.textSecondary}
                  value={pastedText}
                  onChangeText={setPastedText}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: theme.accent }]}
                  onPress={handleUploadPastedText}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitBtnText}>✨ Generate Study Material</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.menuContainer}>
            {isImporting ? (
              <View style={[styles.uploadBox, { backgroundColor: theme.cardBackground }]}>
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="large" color={theme.accent} />
                  <Text style={[styles.loaderText, { color: theme.textPrimary }]}>
                    Processing imported document...
                  </Text>
                  <Text style={[styles.loaderSubText, { color: theme.textSecondary }]}>
                    Running formatting analysis and syllabary chopping
                  </Text>
                </View>
              </View>
            ) : (
              <>
                {/* Hero Card - Scan Textbook */}
                <View style={styles.heroCardWrapper}>
                  <View style={[styles.heroCard, { backgroundColor: heroTheme.cardBg }]}>
                    {/* Overlapping Book Image */}
                    <Image
                      source={getImageAsset('book', cognitiveStyle)}
                      style={styles.heroBookImage}
                      resizeMode="contain"
                    />
                    
                    <Text style={[styles.heroText, { color: heroTheme.text }]}>
                      Ready to make studying from your textbook simpler?
                    </Text>

                    <TouchableOpacity
                      style={[styles.heroBtn, { backgroundColor: heroTheme.btnBg }]}
                      onPress={() => setActiveScreen('camera')}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={getImageAsset('camera', cognitiveStyle)}
                        style={styles.heroBtnIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.heroBtnText}>Scan Textbook</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Other Options Header */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Other Ways to Study</Text>
                </View>

                {/* Secondary Option - File Upload */}
                <TouchableOpacity
                  style={[styles.secondaryOptionBox, { backgroundColor: theme.cardBackground }]}
                  onPress={handleImportPress}
                  activeOpacity={0.8}
                >
                  <View style={[styles.secondaryOptionIconContainer, { backgroundColor: 'rgba(92, 120, 186, 0.08)' }]}>
                    <Feather name="file-text" size={20} color="#5C748C" />
                  </View>
                  <View style={styles.secondaryOptionTextContainer}>
                    <Text style={[styles.secondaryOptionTitle, { color: theme.textPrimary }]}>Upload Document</Text>
                    <Text style={[styles.secondaryOptionSubtitle, { color: theme.textSecondary }]}>Import PDF, TXT, EPUB or Word</Text>
                  </View>
                  <Text style={[styles.secondaryOptionArrow, { color: theme.accent }]}>›</Text>
                </TouchableOpacity>

                {/* Secondary Option - Paste Text */}
                <TouchableOpacity
                  style={[styles.secondaryOptionBox, { backgroundColor: theme.cardBackground }]}
                  onPress={() => setImportMode('paste')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.secondaryOptionIconContainer, { backgroundColor: 'rgba(178, 83, 62, 0.08)' }]}>
                    <Feather name="edit-3" size={20} color="#B2533E" />
                  </View>
                  <View style={styles.secondaryOptionTextContainer}>
                    <Text style={[styles.secondaryOptionTitle, { color: theme.textPrimary }]}>Paste Text</Text>
                    <Text style={[styles.secondaryOptionSubtitle, { color: theme.textSecondary }]}>Type or paste your text manually</Text>
                  </View>
                  <Text style={[styles.secondaryOptionArrow, { color: theme.accent }]}>›</Text>
                </TouchableOpacity>

                {/* Secondary Option - Receive from Peer */}
                <TouchableOpacity
                  style={[styles.secondaryOptionBox, { backgroundColor: theme.cardBackground }]}
                  onPress={() => setIsImportModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.secondaryOptionIconContainer, { backgroundColor: 'rgba(62, 142, 126, 0.08)' }]}>
                    <Feather name="smartphone" size={20} color="#3E8E7E" />
                  </View>
                  <View style={styles.secondaryOptionTextContainer}>
                    <Text style={[styles.secondaryOptionTitle, { color: theme.textPrimary }]}>Receive from Peer</Text>
                    <Text style={[styles.secondaryOptionSubtitle, { color: theme.textSecondary }]}>Scan local QR code from a classmate</Text>
                  </View>
                  <Text style={[styles.secondaryOptionArrow, { color: theme.accent }]}>›</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Info panel */}
        <View style={[styles.infoPanel, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>💡 Dyslexia-First Formatting</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            When you import a document, our API chops the sentences into phonemic syllables. It alternates colors to help speed up word decoding and reduce visual clutter automatically.
          </Text>
        </View>

      </ScrollView>

      <ImportQrModal 
        visible={isImportModalVisible} 
        onClose={() => setIsImportModalVisible(false)} 
        onScanSuccess={(payload) => {
          const newId = `imported-${Date.now()}`;
          addDynamicLesson(newId, payload);
          setSelectedMaterialId(newId);
          setActiveReaderTab('import');
          setActiveScreen('reader');
        }} 
      />

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
    paddingBottom: 110, // Extra space to scroll clear of TabBar
  },
  header: {
    marginBottom: 16,
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
    marginTop: 8,
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
  menuContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginBottom: 24,
  },
  heroCardWrapper: {
    marginTop: 65,
    marginBottom: 28,
    width: '100%',
  },
  heroCard: {
    borderRadius: 24,
    paddingTop: 70,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  heroBookImage: {
    position: 'absolute',
    top: -65,
    width: 145,
    height: 125,
    alignSelf: 'center',
  },
  heroText: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 22,
    maxWidth: '90%',
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 26,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  heroBtnIcon: {
    width: 22,
    height: 18,
    tintColor: '#FFFFFF',
    marginRight: 10,
  },
  heroBtnText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '800',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    opacity: 0.85,
  },
  secondaryOptionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  secondaryOptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  secondaryOptionTextContainer: {
    flex: 1,
  },
  secondaryOptionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  secondaryOptionSubtitle: {
    fontSize: 12,
    opacity: 0.75,
  },
  secondaryOptionArrow: {
    fontSize: 24,
    fontWeight: '300',
    paddingHorizontal: 6,
  },
  backBtn: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  pasteInputCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 24,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  pasteCardLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 10,
  },
  pasteTextInput: {
    height: 250,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    marginBottom: 20,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
