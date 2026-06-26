import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { Text } from '../components/A11yText';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';

export const SignupScreen: React.FC = () => {
  const { themeType, setActiveScreen, isOnboardingCompleted, setProfileName } = useA11yStore();
  const theme = THEMES[themeType];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    // Mock signup functionality
    const displayName = name.trim();
    if (displayName) {
      setProfileName(displayName);
    }
    if (isOnboardingCompleted) {
      setActiveScreen('home');
    } else {
      setActiveScreen('onboarding');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerContainer}>
            <Image
              source={require('../../assets/splash-icon.png')}
              style={styles.logoImage as any}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.formContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.formTitle, { color: theme.textPrimary }]}>Create Account</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: 'rgba(0,0,0,0.08)' }]}
                placeholder="Alex Student"
                placeholderTextColor={themeType === 'dark' ? '#666' : '#999'}
                autoCapitalize="words"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: 'rgba(0,0,0,0.08)' }]}
                placeholder="you@example.com"
                placeholderTextColor={themeType === 'dark' ? '#666' : '#999'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: 'rgba(0,0,0,0.08)' }]}
                placeholder="••••••••"
                placeholderTextColor={themeType === 'dark' ? '#666' : '#999'}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.accent }]}
              onPress={handleSignup}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setActiveScreen('login')}
            >
              <Text style={[styles.switchButtonText, { color: theme.textSecondary }]}>
                Already have an account? <Text style={{ color: theme.accent, fontWeight: '700' }}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 220,
    height: 160,
    alignSelf: 'center',
  },
  formContainer: {
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
