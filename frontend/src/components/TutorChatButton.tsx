import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';

export const TutorChatButton: React.FC = () => {
  const {
    activeScreen,
    setTutorChatVisible,
    themeType,
    highlightColor,
  } = useA11yStore();

  const theme = THEMES[themeType];

  // Hide floating chat button when camera is active (to avoid covering viewfinder shutter triggers)
  if (activeScreen === 'camera') {
    return null;
  }

  // Map user-selected highlight color to hex codes
  const highlightColors: Record<string, string> = {
    theme: theme.accent,
    orange: '#F27A1A',
    teal: '#139A8C',
    purple: '#8A2BE2',
    green: '#2E8B57',
  };
  const activeHighlightColor = highlightColors[highlightColor] || theme.accent;

  return (
    <TouchableOpacity
      style={[styles.floatingBtn, { backgroundColor: activeHighlightColor }]}
      onPress={() => setTutorChatVisible(true)}
      activeOpacity={0.8}
    >
      <Text style={styles.btnIcon}>💬</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AI</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    bottom: 96, // Sits comfortably above the bottom tab bar (height 72)
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999, // Floating overlay
  },
  btnIcon: {
    fontSize: 26,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff3b30', // Notification red
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
});
