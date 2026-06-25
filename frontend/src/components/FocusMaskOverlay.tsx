import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';

interface FocusMaskOverlayProps {
  contentHeight: number;
}

export const FocusMaskOverlay: React.FC<FocusMaskOverlayProps> = ({
  contentHeight,
}) => {
  const {
    themeType,
    focusModeEnabled: isFocusModeEnabled,
    activeLineIndex,
    itemLayouts,
    highlightColor,
  } = useA11yStore();

  const theme = THEMES[themeType];
  const activeLayout = itemLayouts[activeLineIndex];

  // Map user-selected highlight color to hex codes
  const highlightColors: Record<string, string> = {
    theme: theme.accent,
    orange: '#F27A1A',
    teal: '#139A8C',
    purple: '#8A2BE2',
    green: '#2E8B57',
  };
  const activeHighlightColor = highlightColors[highlightColor] || theme.accent;

  // Initialize animated values using React Native's built-in Animated API
  const topMaskHeight = useRef(new Animated.Value(0)).current;
  const bottomMaskTop = useRef(new Animated.Value(0)).current;
  const focusHighlightTop = useRef(new Animated.Value(0)).current;
  const focusHighlightHeight = useRef(new Animated.Value(0)).current;

  // Track changes and animate smoothly using native springs
  useEffect(() => {
    if (activeLayout) {
      const targetTopHeight = activeLayout.y;
      const targetBottomTop = activeLayout.y + activeLayout.height;

      // Accessibility-friendly spring configuration (smooth, no bouncy flickering)
      const springConfig = {
        tension: 40,
        friction: 9,
        useNativeDriver: false, // Height/top layouts do not support useNativeDriver: true
      };

      Animated.parallel([
        Animated.spring(topMaskHeight, {
          toValue: targetTopHeight,
          ...springConfig,
        }),
        Animated.spring(bottomMaskTop, {
          toValue: targetBottomTop,
          ...springConfig,
        }),
        Animated.spring(focusHighlightTop, {
          toValue: activeLayout.y,
          ...springConfig,
        }),
        Animated.spring(focusHighlightHeight, {
          toValue: activeLayout.height,
          ...springConfig,
        }),
      ]).start();
    }
  }, [activeLayout]);

  // If focus mode is disabled or no item has been measured yet, return null
  if (!isFocusModeEnabled || !activeLayout) {
    return null;
  }

  return (
    <View style={styles.absoluteContainer} pointerEvents="none">
      {/* Top Dimming Mask */}
      <Animated.View
        style={[
          styles.mask,
          {
            top: 0,
            height: topMaskHeight,
            backgroundColor: theme.maskColor,
            opacity: theme.maskOpacity,
          },
        ]}
      />

      {/* Focus Highlight Frame (Adds visual left eye anchor dyed with active highlight color) */}
      <Animated.View
        style={[
          styles.focusHighlight,
          {
            top: focusHighlightTop,
            height: focusHighlightHeight,
            borderLeftColor: activeHighlightColor,
            backgroundColor: 'transparent',
          },
        ]}
      />

      {/* Bottom Dimming Mask */}
      <Animated.View
        style={[
          styles.mask,
          {
            top: bottomMaskTop,
            bottom: 0, // Anchored to bottom, height dynamically expands/contracts
            backgroundColor: theme.maskColor,
            opacity: theme.maskOpacity,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mask: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  focusHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderLeftWidth: 4, // Bold eye anchor border
  },
});
