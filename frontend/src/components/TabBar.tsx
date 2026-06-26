import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from './A11yText';
import { useA11yStore, ScreenType } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { Feather } from '@expo/vector-icons';

export const TabBar: React.FC = () => {
  const { activeScreen, setActiveScreen, themeType } = useA11yStore();
  const theme = THEMES[themeType];

  const tabs: { type: ScreenType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { type: 'home', label: 'Home', icon: 'home' },
    { type: 'library', label: 'Library', icon: 'book-open' },
    { type: 'import', label: 'Scan & Import', icon: 'camera' },
  ];

  const handleTabPress = (type: ScreenType) => {
    setActiveScreen(type);
  };

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: theme.tabBarBg || theme.cardBackground,
          borderColor: themeType === 'dark' ? '#333' : '#EAE6DB',
        },
      ]}
    >
      {tabs.map((tab) => {
        const isSelected = activeScreen === tab.type;
        
        // Highlight pill background
        const pillBg = isSelected
          ? theme.tabActiveBg || (themeType === 'dark' ? 'rgba(255,255,255,0.08)' : '#E5EFFC')
          : 'transparent';

        const textColor = isSelected
          ? theme.tabActiveIcon || theme.accent
          : theme.textSecondary;

        return (
          <TouchableOpacity
            key={tab.type}
            onPress={() => handleTabPress(tab.type)}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={[styles.pill, { backgroundColor: pillBg }]}>
              <Feather
                name={tab.icon}
                size={18}
                color={textColor}
                style={styles.tabIcon as any}
              />
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
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10.5,
  },
});
