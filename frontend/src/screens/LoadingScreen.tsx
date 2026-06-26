import React, { useEffect } from 'react';
import { StyleSheet, View, Image, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';

interface LoadingScreenProps {
  onFinish: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Show loading splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF6EE" />
      
      {/* Center Logo */}
      <View style={styles.centerContainer}>
        <Image
          source={require('../../assets/splash-icon.png')}
          style={styles.logo as any}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color="#3E8E7E" style={styles.spinner} />
      </View>

      {/* Bottom Open Book Illustration */}
      <View style={styles.bottomContainer}>
        <Image
          source={require('../../assets/book.png')}
          style={styles.book as any}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6EE', // Soothing warm cream background matching figma mockup
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  logo: {
    width: 260,
    height: 220,
  },
  spinner: {
    marginTop: 24,
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
  },
  book: {
    width: '100%',
    height: 180,
  },
});
