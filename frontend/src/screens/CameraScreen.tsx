import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';

export const CameraScreen: React.FC = () => {
  const { themeType, setActiveScreen } = useA11yStore();
  const theme = THEMES[themeType];
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanSource, setScanSource] = useState<'camera' | 'image' | 'file'>('camera');

  const handleCapture = () => {
    setScanSource('camera');
    setIsScanning(true);
    // Simulate OCR text extraction loading animation
    setTimeout(() => {
      setIsScanning(false);
      setActiveScreen('reader'); // open the reader with scanned summary
    }, 1800);
  };

  const handleImportImage = () => {
    setScanSource('image');
    setIsScanning(true);
    // Simulate OCR text extraction from imported image
    setTimeout(() => {
      setIsScanning(false);
      setActiveScreen('reader');
    }, 1800);
  };

  const handleImportFile = () => {
    setScanSource('file');
    setIsScanning(true);
    // Simulate OCR text extraction from document file
    setTimeout(() => {
      setIsScanning(false);
      setActiveScreen('reader');
    }, 1800);
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={[styles.permissionTitle, { color: theme.textPrimary }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.permissionBody, { color: theme.textSecondary }]}>
            We need camera permissions to scan your textbook pages and extract lesson summaries.
          </Text>
          <TouchableOpacity
            style={[styles.grantBtn, { backgroundColor: theme.accent }]}
            onPress={requestPermission}
          >
            <Text style={styles.grantBtnText}>Grant Camera Access</Text>
          </TouchableOpacity>

          {/* Fallback import options when camera permissions aren't granted */}
          <Text style={[styles.orText, { color: theme.textSecondary }]}>— OR —</Text>

          <View style={styles.fallbackBtnRow}>
            <TouchableOpacity
              style={[styles.fallbackBtn, { backgroundColor: theme.cardBackground }]}
              onPress={handleImportImage}
              activeOpacity={0.8}
            >
              <Text style={styles.fallbackBtnIcon}>🖼️</Text>
              <Text style={[styles.fallbackBtnText, { color: theme.textPrimary }]}>Import Image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fallbackBtn, { backgroundColor: theme.cardBackground }]}
              onPress={handleImportFile}
              activeOpacity={0.8}
            >
              <Text style={styles.fallbackBtnIcon}>📄</Text>
              <Text style={[styles.fallbackBtnText, { color: theme.textPrimary }]}>Import File</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelLink}
            onPress={() => setActiveScreen('home')}
          >
            <Text style={{ color: theme.textSecondary, fontWeight: '700', marginTop: 12 }}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Real Viewfinder */}
      <CameraView style={StyleSheet.absoluteFillObject} facing="back">
        {/* Shutter Scan Guidelines Overlay */}
        <View style={styles.overlayContainer}>
          
          {/* Header */}
          <View style={styles.cameraHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setActiveScreen('home')}
            >
              <Text style={styles.backBtnText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Scan & Import</Text>
            <View style={{ width: 60 }} /> {/* balance back button */}
          </View>

          {/* Framing Target Box */}
          <View style={styles.cropTargetContainer}>
            <View style={styles.cropTargetFrame}>
              <Text style={styles.frameLabel}>ALIGN PAGE WITHIN FRAME</Text>
            </View>
          </View>

          {/* Capture Trigger Area */}
          <View style={styles.triggerContainer}>
            {/* Import Image Button */}
            <TouchableOpacity
              style={styles.importIconBtn}
              onPress={handleImportImage}
              disabled={isScanning}
              activeOpacity={0.7}
            >
              <Text style={styles.importIcon}>🖼️</Text>
              <Text style={styles.importIconLabel}>Import Image</Text>
            </TouchableOpacity>

            {/* Shutter Button */}
            <TouchableOpacity
              style={styles.shutterButton}
              onPress={handleCapture}
              disabled={isScanning}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            {/* Import File Button */}
            <TouchableOpacity
              style={styles.importIconBtn}
              onPress={handleImportFile}
              disabled={isScanning}
              activeOpacity={0.7}
            >
              <Text style={styles.importIcon}>📄</Text>
              <Text style={styles.importIconLabel}>Import File</Text>
            </TouchableOpacity>
          </View>

        </View>
      </CameraView>

      {/* OCR processing loading shield */}
      {isScanning && (
        <View style={styles.processingShield}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.processingTitle}>
            {scanSource === 'camera'
              ? 'Extracting Textbook Text...'
              : scanSource === 'image'
              ? 'Importing Image & Analyzing...'
              : 'Reading Document File...'}
          </Text>
          <Text style={styles.processingSub}>
            {scanSource === 'camera'
              ? 'Running OCR and generating bite-sized summary'
              : scanSource === 'image'
              ? 'Running text-to-syllable converter on selected photo'
              : 'Uploading, formatting structure, and building reading layout'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  permissionIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  grantBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grantBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  cancelLink: {
    marginTop: 20,
    paddingVertical: 8,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)', // light tint over viewfinder
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54, // Clear camera notch
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  cameraTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  cropTargetContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  cropTargetFrame: {
    width: '100%',
    height: '65%',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 16,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  triggerContainer: {
    height: 120,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingBottom: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  importIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  importIcon: {
    fontSize: 22,
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.18)',
    width: 44,
    height: 44,
    borderRadius: 22,
    lineHeight: 40,
    textAlign: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    marginBottom: 4,
  },
  importIconLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  orText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginVertical: 18,
    opacity: 0.6,
  },
  fallbackBtnRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    marginBottom: 10,
  },
  fallbackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  fallbackBtnIcon: {
    fontSize: 18,
  },
  fallbackBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  shutterButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
  },
  processingShield: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  processingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  processingSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
