import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useA11yStore, ScreenType } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';

export const TabBar: React.FC = () => {
  const { activeScreen, setActiveScreen, themeType, highlightColor } = useA11yStore();
  const theme = THEMES[themeType];

  const tabs: { type: ScreenType; label: string; icon: string }[] = [
    { type: 'home', label: 'Home', icon: '🏠' },
    { type: 'library', label: 'Library', icon: '📚' },
    { type: 'camera', label: 'Scan & Import', icon: '📷' },
  ];

  // Map user-selected highlight color to hex codes
  const highlightColors: Record<string, string> = {
    theme: theme.accent,
    orange: '#F27A1A',
    teal: '#139A8C',
    purple: '#8A2BE2',
    green: '#2E8B57',
  };
  const activeHighlightColor = highlightColors[highlightColor] || theme.accent;

  const handleTabPress = (type: ScreenType) => {
    setActiveScreen(type);
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: theme.cardBackground,
          borderColor: themeType === 'dark' ? '#333' : '#EAE6DB',
        },
      ]}
    >
      {tabs.map((tab) => {
        const isSelected = activeScreen === tab.type;
        
        // Highlight pill background
        const pillBg = isSelected
          ? themeType === 'dark'
            ? 'rgba(255,255,255,0.08)'
            : '#E5EFFC' // Soft light blue/grey pill
          : 'transparent';

        const textColor = isSelected
          ? activeHighlightColor
          : theme.textSecondary;

        return (
          <TouchableOpacity
            key={tab.type}
            onPress={() => handleTabPress(tab.type)}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={[styles.pill, { backgroundColor: pillBg }]}>
              <Text style={[styles.tabIcon, { color: textColor }]}>
                {tab.icon}
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: textColor,
                    fontWeight: isSelected ? '800' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    height: 74,
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 70,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10.5,
  },
});
