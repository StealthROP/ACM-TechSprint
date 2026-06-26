import React, { useState, useEffect } from 'react';
import { useA11yStore } from './src/store/useA11yStore';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { ImportScreen } from './src/screens/ImportScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { SettingsModal } from './src/components/SettingsModal';
import { TutorChatButton } from './src/components/TutorChatButton';
import { TutorChatModal } from './src/components/TutorChatModal';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { AudioModule } from 'expo-audio';

export default function App() {
  const activeScreen = useA11yStore((state) => state.activeScreen);
  const [fontsLoaded] = useFonts({
    'OpenDyslexic': require('./assets/fonts/OpenDyslexic-Regular.ttf'),
    'AtkinsonHyperlegible': require('./assets/fonts/AtkinsonHyperlegible-Regular.otf'),
  });

  const [appIsReady, setAppIsReady] = useState(false);

  // ── iOS Audio Session Fix ──────────────────────────────────────────────────
  // expo-speech on iOS requires the audio session category to be set to
  // 'Playback' so TTS can play audio even when the silent switch is on.
  // Android handles this automatically; iOS does not.
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AudioModule.setAudioModeAsync({
        playsInSilentMode: true,
      }).catch((err) => console.warn('Audio mode setup failed:', err));
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B2533E" />
      </View>
    );
  }

  if (!appIsReady) {
    return <LoadingScreen onFinish={() => setAppIsReady(true)} />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'login':
        return <LoginScreen />;
      case 'signup':
        return <SignupScreen />;
      case 'onboarding':
        return <OnboardingScreen />;
      case 'home':
        return <DashboardScreen />;
      case 'library':
        return <LibraryScreen />;
      case 'import':
        return <ImportScreen />;
      case 'reader':
        return <ReaderScreen />;
      case 'camera':
        return <CameraScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  const isAuthScreen = activeScreen === 'login' || activeScreen === 'signup' || activeScreen === 'onboarding';

  return (
    <>
      {renderScreen()}
      {!isAuthScreen && (
        <>
          <SettingsModal />
          <TutorChatButton />
          <TutorChatModal />
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF5E6', // Soothing warm cream default background
  },
});
