import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';

interface ColorChopTextProps {
  syllabified_words: string[][];
  isMuted?: boolean; // Used to dim the sentence if it's inactive in Focus Mode
  activeWordIndex?: number | null; // Index of the word currently spoken
}

export const ColorChopText: React.FC<ColorChopTextProps> = ({
  syllabified_words,
  isMuted = false,
  activeWordIndex = null,
}) => {
  const { themeType, fontSize, lineSpacing, letterSpacing, highlightColor } = useA11yStore();
  const theme = THEMES[themeType];
  const lineHeight = fontSize * lineSpacing;

  // Outer text container styles
  const baseTextStyle: TextStyle = {
    fontSize,
    lineHeight,
    letterSpacing,
    textAlign: 'left', // Dyslexia-friendly left-alignment
  };

  // Base opacity adjustment for active tracking state
  const textOpacity = isMuted ? 0.25 : 1.0;

  // Map user-selected highlight accent to soft background markers
  const highlightBgs: Record<string, string> = {
    theme: themeType === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)',
    orange: '#FFE8D6', // Pastel orange highlighter
    teal: '#D0F0EC',   // Pastel teal highlighter
    purple: '#E8DFFF', // Pastel purple highlighter
    green: '#D5F3E5',  // Pastel green highlighter
  };
  const activeHighlightBg = highlightBgs[highlightColor] || 'rgba(0, 0, 0, 0.05)';

  return (
    <Text style={[baseTextStyle, { opacity: textOpacity }]}>
      {syllabified_words.map((wordSyllables, wordIdx) => {
        // Build the full word for the screen reader
        const fullWord = wordSyllables.join('');
        const isCurrentWordSpoken = activeWordIndex !== null && wordIdx === activeWordIndex;

        return (
          <Text
            key={`w-${wordIdx}`}
            accessible={true}
            accessibilityLabel={fullWord}
            style={
              isCurrentWordSpoken
                ? {
                    backgroundColor: activeHighlightBg,
                    borderRadius: 4,
                  }
                : undefined
            }
          >
            {wordSyllables.map((syllable, sylIdx) => {
              // Alternating color chop algorithm
              const textColor =
                sylIdx % 2 === 0 ? theme.textPrimary : theme.textSecondary;

              return (
                <Text
                  key={`s-${sylIdx}`}
                  accessible={false}
                  importantForAccessibility="no"
                  style={{
                    color: textColor,
                    fontWeight: '600', // Semi-bold helps outline letters distinctly
                  }}
                >
                  {syllable}
                </Text>
              );
            })}
            {/* Standard spacing between words. Nested within parent text flow */}
            <Text
              accessible={false}
              importantForAccessibility="no"
              style={{ letterSpacing: letterSpacing * 2 }}
            >
              {' '}
            </Text>
          </Text>
        );
      })}
    </Text>
  );
};

const styles = StyleSheet.create({});
