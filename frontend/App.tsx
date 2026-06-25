import React from 'react';
import { useA11yStore } from './src/store/useA11yStore';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { ImportScreen } from './src/screens/ImportScreen';
import { ReaderScreen } from './src/screens/ReaderScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { SettingsModal } from './src/components/SettingsModal';
import { TutorChatButton } from './src/components/TutorChatButton';
import { TutorChatModal } from './src/components/TutorChatModal';

export default function App() {
  const activeScreen = useA11yStore((state) => state.activeScreen);

  const renderScreen = () => {
    switch (activeScreen) {
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

  return (
    <>
      {renderScreen()}
      <SettingsModal />
      <TutorChatButton />
      <TutorChatModal />
    </>
  );
}
