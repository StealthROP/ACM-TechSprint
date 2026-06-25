import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { TabBar } from '../components/TabBar';

export const DashboardScreen: React.FC = () => {
  const {
    themeType,
    setActiveScreen,
    setSettingsModalVisible,
    highlightColor,
  } = useA11yStore();

  const theme = THEMES[themeType];

  // Map user-selected highlight color to hex codes
  const highlightColors: Record<string, string> = {
    theme: theme.accent,
    orange: '#F27A1A',
    teal: '#139A8C',
    purple: '#8A2BE2',
    green: '#2E8B57',
  };
  const activeHighlightColor = highlightColors[highlightColor] || theme.accent;

  const handleScanTextbook = () => {
    setActiveScreen('camera');
  };

  const handleViewStudyCards = () => {
    setActiveScreen('library');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Analytics Panel & Greeting (Integrated First) */}
        <View style={[styles.analyticsCard, { backgroundColor: theme.cardBackground, marginTop: 8 }]}>
          {/* Integrated Header Row */}
          <View style={styles.integratedHeaderRow}>
            <View style={styles.userProfileCol}>
              <View style={[styles.avatar, { backgroundColor: theme.background }]}>
                <Text style={styles.avatarText}>👦</Text>
              </View>
              <View style={styles.userTextCol}>
                <Text style={[styles.welcomeText, { color: theme.textSecondary, fontSize: 13 }]}>Welcome back,</Text>
                <Text style={[styles.usernameText, { color: theme.textPrimary, fontSize: 20 }]}>Alex</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.topSettingsContainer, { backgroundColor: theme.background }]}
              onPress={() => setSettingsModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.topSettingsIcon}>⚙️</Text>
              <Text style={[styles.topSettingsLabel, { color: theme.textPrimary }]}>Settings</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: themeType === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

          <Text style={[styles.analyticsTitle, { color: theme.textPrimary, marginTop: 12 }]}>Your Learning Journey</Text>
          
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsTile}>
              <Text style={[styles.tileNumber, { color: activeHighlightColor }]}>4.2h</Text>
              <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>Focus Time</Text>
            </View>
            <View style={styles.analyticsTile}>
              <Text style={[styles.tileNumber, { color: activeHighlightColor }]}>12</Text>
              <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>Cards Read</Text>
            </View>
            <View style={styles.analyticsTile}>
              <Text style={[styles.tileNumber, { color: activeHighlightColor }]}>94%</Text>
              <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>Accuracy</Text>
            </View>
          </View>
          
          {/* Aesthetic Weekly Progress Bar Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartSub, { color: theme.textSecondary }]}>Weekly Focus Rate (minutes):</Text>
            <View style={styles.chartRow}>
              {[
                { day: 'M', mins: 30, h: '45%' },
                { day: 'T', mins: 45, h: '65%' },
                { day: 'W', mins: 25, h: '35%' },
                { day: 'T', mins: 60, h: '85%' },
                { day: 'F', mins: 15, h: '25%' },
              ].map((bar, idx) => (
                <View key={idx} style={styles.chartBarCol}>
                  <View style={styles.chartBarTrack}>
                    <View style={[styles.chartBarFill, { height: bar.h as any, backgroundColor: activeHighlightColor }]} />
                  </View>
                  <Text style={[styles.chartBarDay, { color: theme.textSecondary }]}>{bar.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Hero Card Transform Section */}
        <View style={[styles.heroCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={styles.heroBookIcon}>📖</Text>
          <Text style={[styles.heroText, { color: theme.textSecondary }]}>
            Ready to transform your textbook into bite-sized learning moments?
          </Text>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#435B4E' }]} // Deep study green
            onPress={handleScanTextbook}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonIcon}>📷</Text>
            <Text style={styles.primaryButtonText}>Scan or Import Textbook</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: '#5C748C', backgroundColor: theme.background }]}
            onPress={handleViewStudyCards}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonIcon, { color: '#5C748C' }]}>🗂️</Text>
            <Text style={[styles.secondaryButtonText, { color: '#3A4D62' }]}>View Saved Study Cards</Text>
          </TouchableOpacity>
        </View>

        {/* Info & Goal Cards */}
        <View style={styles.statsContainer}>
          {/* Study Tip Card */}
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.badge, { backgroundColor: '#D4ECE0' }]}>
              <Text style={styles.badgeText}>💡</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: theme.textPrimary }]}>Study Tip</Text>
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                Breaking chapters into 15-minute sprints helps maintain focus.
              </Text>
            </View>
          </View>

          {/* Weekly Goal Card */}
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.badge, { backgroundColor: '#D4E2FC' }]}>
              <Text style={styles.badgeText}>✅</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: theme.textPrimary }]}>Weekly Goal</Text>
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                You've mastered 12 new cards this week. Keep it up!
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Navigation Tab Bar */}
      <TabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  integratedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  userProfileCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  avatarText: {
    fontSize: 28,
  },
  userTextCol: {
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.8,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: -2,
  },
  topSettingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 6,
  },
  topSettingsIcon: {
    fontSize: 16,
  },
  topSettingsLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  analyticsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  analyticsTile: {
    alignItems: 'center',
  },
  tileNumber: {
    fontSize: 24,
    fontWeight: '900',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  chartContainer: {
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 14,
  },
  chartSub: {
    fontSize: 11.5,
    fontWeight: '600',
    marginBottom: 10,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingHorizontal: 10,
  },
  chartBarCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarTrack: {
    width: 14,
    height: 65,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 7,
  },
  chartBarDay: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 6,
  },
  heroCard: {
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  heroBookIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  heroText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '85%',
  },
  actionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  primaryButton: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  statCard: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 20,
  },
  statContent: {
    flex: 1,
    marginLeft: 14,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  statText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
});
