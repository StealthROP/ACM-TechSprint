import React from 'react';
import { Text as RNText, TextProps, Platform, StyleProp, TextStyle } from 'react-native';
import { useA11yStore } from '../store/useA11yStore';

export const Text: React.FC<TextProps> = ({ style, ...props }) => {
  const fontFamily = useA11yStore((state) => state.fontFamily);

  const fontMap: Record<string, string | undefined> = {
    System: undefined,
    OpenDyslexic: 'OpenDyslexic',
    AtkinsonHyperlegible: 'AtkinsonHyperlegible',
    Serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    Monospace: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  };

  const activeFontFamily = fontMap[fontFamily];
  const isCustomFont = fontFamily === 'OpenDyslexic' || fontFamily === 'AtkinsonHyperlegible';

  const resolvedStyle: StyleProp<TextStyle> = [
    style,
    activeFontFamily ? { fontFamily: activeFontFamily } : null,
    isCustomFont ? { fontWeight: 'normal' as const } : null,
  ];

  return <RNText {...props} style={resolvedStyle} />;
};
