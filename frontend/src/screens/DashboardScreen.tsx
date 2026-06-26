import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { Text } from '../components/A11yText';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { TabBar } from '../components/TabBar';
import { ProfileModal } from '../components/ProfileModal';
import { getImageAsset } from '../theme/images';
import { Feather } from '@expo/vector-icons';
import { MOCK_LESSONS_BY_ID } from '../services/mockApi';

export const DashboardScreen: React.FC = () => {
  const {
    themeType,
    setActiveScreen,
    setSettingsModalVisible,
    profileName,
    profilePhotoUri,
    fontFamily,
    streak,
    weeklyMinutes,
    totalCardsRead,
    totalCorrect,
    totalAttempts,
    sessionStartTime,
    highlightColor,
    selectedMaterialId,
    dynamicLessons,
    moduleProgress,
    cardDifficulty,
    setSelectedMaterialId,
    setActiveReaderTab,
  } = useA11yStore();

  const theme = THEMES[themeType];
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Cognitive style determination for dynamic assets
  const cognitiveStyle = fontFamily === 'OpenDyslexic' ? 'dyslexic' : 'standard';

  // Derived metrics
  const accuracyPct = totalAttempts > 0
    ? Math.round((totalCorrect / totalAttempts) * 100)
    : 0;

  const totalWeekMins = useMemo(
    () => weeklyMinutes.reduce((a, b) => a + b, 0),
    [weeklyMinutes]
  );

  // Live session minutes (if currently in a session)
  const liveSessionMins = sessionStartTime
    ? Math.round((Date.now() - sessionStartTime) / 60000)
    : 0;

  const totalFocusMins = totalWeekMins + liveSessionMins;
  const focusHoursDisplay = totalFocusMins < 60
    ? `${totalFocusMins}m`
    : `${(totalFocusMins / 60).toFixed(1)}h`;

  const maxMins = Math.max(...weeklyMinutes, 1);

  // Map user-selected highlight color to hex codes
  const highlightColors: Record<string, string> = {
    theme: theme.accent,
    orange: '#F27A1A',
    teal: '#139A8C',
    purple: '#8A2BE2',
    green: '#2E8B57',
  };
  const activeHighlightColor = highlightColors[highlightColor] || theme.accent;

  // 1. Resolve Last Studied Material
  const activeMaterialId = selectedMaterialId || 'cell_biology'; // fallback to first mock
  const activeMaterial = dynamicLessons[activeMaterialId] || MOCK_LESSONS_BY_ID[activeMaterialId] || MOCK_LESSONS_BY_ID['cell_biology'];
  
  const activeProgress = moduleProgress[activeMaterialId] || { currentCardIndex: 0, progressPct: 0 };
  const activeProgressPct = Math.round(activeProgress.progressPct);

  // 2. Generate AI study recommendations based on stats and card difficulty levels
  const recommendation = useMemo(() => {
    const totalCards = activeMaterial.flashcards?.length || 0;
    
    // Count difficulties for active deck
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;
    let masteredCount = 0;

    if (activeMaterial.flashcards) {
      activeMaterial.flashcards.forEach((card, index) => {
        const lang = 'en'; // default english checking
        const key = `${activeMaterialId}_${lang}_${index}`;
        const level = cardDifficulty[key] || 'easy';
        if (level === 'easy') easyCount++;
        else if (level === 'medium') mediumCount++;
        else if (level === 'hard') hardCount++;
        else if (level === 'mastered') masteredCount++;
      });
    }

    // Recommendation rules engine
    if (Object.keys(dynamicLessons).length === 0) {
      return {
        title: "Scan your first Textbook Page!",
        desc: "Make your study materials personalized. Head to the 'Import' tab to scan textbook pages, upload PDF files, or snap photos, and let BelongED create interactive flashcards for you.",
        icon: "camera" as const,
        actionLabel: "Try Scanner",
        targetScreen: "import" as const,
        readerTab: undefined,
      };
    }

    if (activeProgressPct > 0 && activeProgressPct < 100) {
      return {
        title: `Finish studying "${activeMaterial.document_title}"`,
        desc: `You've completed ${activeProgressPct}% of this module. Let's finish the remaining cards to unlock active recall quizzes!`,
        icon: "book-open" as const,
        actionLabel: "Resume Reading",
        targetScreen: "reader" as const,
        readerTab: "review" as const,
      };
    }

    if (accuracyPct > 0 && accuracyPct < 65) {
      return {
        title: "Try MCQ Adaptive Practice",
        desc: `Your quiz accuracy is currently ${accuracyPct}%. Practice with Multiple Choice Questions (Easy Mode) on "${activeMaterial.document_title}" to build stronger base memory!`,
        icon: "check-circle" as const,
        actionLabel: "Practice Now",
        targetScreen: "reader" as const,
        readerTab: "flashcard" as const,
      };
    }

    if (easyCount > 0 && masteredCount < totalCards / 2) {
      return {
        title: "Drill with Typing Hints",
        desc: `You have ${easyCount} cards at Level 1 (Easy). Elevate them to Level 2 (Medium) by practicing Typing Mode with hints!`,
        icon: "edit-2" as const,
        actionLabel: "Start Typing Drill",
        targetScreen: "reader" as const,
        readerTab: "flashcard" as const,
      };
    }

    if (hardCount > 0) {
      return {
        title: "Test with Active Recall Voice",
        desc: `You have ${hardCount} cards ready at Level 3 (Hard). Challenge yourself using spoken answer checking to master this deck!`,
        icon: "mic" as const,
        actionLabel: "Start Voice Test",
        targetScreen: "reader" as const,
        readerTab: "flashcard" as const,
      };
    }

    // Default recommendation
    return {
      title: `Practice Active Recall on "${activeMaterial.document_title}"`,
      desc: "Regular active recall trains your brain to retrieve info. Run an Adaptive Drill to strengthen memory paths.",
      icon: "zap" as const,
      actionLabel: "Review Module",
      targetScreen: "reader" as const,
      readerTab: "review" as const,
    };
  }, [activeMaterial, activeMaterialId, cardDifficulty, dynamicLessons, activeProgressPct, accuracyPct]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Profile Welcome Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.profileRow}
            onPress={() => setIsProfileOpen(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.avatar, { borderColor: theme.accent, borderWidth: profilePhotoUri ? 2.5 : 1 }]}>
              {profilePhotoUri ? (
                <Image source={{ uri: profilePhotoUri }} style={styles.avatarImg as any} />
              ) : (
                <Feather name="user" size={20} color={theme.textPrimary} />
              )}
            </View>
            <View style={styles.userTextContainer}>
              <Text style={[styles.helloText, { color: theme.textSecondary }]}>Hello,</Text>
              <Text style={[styles.nameText, { color: theme.textPrimary }]}>{profileName}</Text>
            </View>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={[styles.settingsBtn, { borderColor: theme.textSecondary, backgroundColor: theme.background }]}
            onPress={() => setSettingsModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="settings" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Welcome Review Banner */}
        <View style={[styles.welcomeBanner, { backgroundColor: theme.topHeroCardBg || theme.accent }]}>
          <View style={styles.welcomeBannerLeft}>
            <Text style={styles.welcomeBannerTitle}>
              What would you like to review today?
            </Text>
            <TouchableOpacity
              style={[styles.welcomeBannerBtn, { backgroundColor: theme.topHeroBtnBg || '#FFFFFF' }]}
              onPress={() => setActiveScreen('library')}
              activeOpacity={0.85}
            >
              <Text style={[styles.welcomeBannerBtnText, { color: theme.topHeroBtnText || theme.accent }]}>
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
          <Image
            source={getImageAsset('girlStudying', cognitiveStyle)}
            style={styles.welcomeBannerImg as any}
            resizeMode="contain"
          />
        </View>

        {/* ── User Analytics Panel ── */}
        <View style={[styles.analyticsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.analyticsTitle, { color: theme.textPrimary }]}>Your Learning Journey</Text>
          
          <View style={styles.analyticsRow}>
            <View style={styles.analyticsTile}>
              <Text style={[styles.tileNumber, { color: activeHighlightColor }]}>{focusHoursDisplay}</Text>
              <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>Focus Time</Text>
            </View>
            <View style={styles.analyticsTile}>
              <Text style={[styles.tileNumber, { color: activeHighlightColor }]}>{totalCardsRead}</Text>
              <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>Cards Read</Text>
            </View>
            <View style={styles.analyticsTile}>
              <Text style={[styles.tileNumber, { color: activeHighlightColor }]}>
                {totalAttempts > 0 ? `${accuracyPct}%` : '—'}
              </Text>
              <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>Accuracy</Text>
            </View>
          </View>
          
          {/* Dynamic Weekly Progress Bar Chart */}
          <View style={styles.chartContainer}>
            <Text style={[styles.chartSub, { color: theme.textSecondary }]}>Weekly Focus Rate (minutes):</Text>
            <View style={styles.chartRow}>
              {[
                { day: 'Sun', mins: weeklyMinutes[0] || 0 },
                { day: 'Mon', mins: weeklyMinutes[1] || 0 },
                { day: 'Tue', mins: weeklyMinutes[2] || 0 },
                { day: 'Wed', mins: weeklyMinutes[3] || 0 },
                { day: 'Thu', mins: weeklyMinutes[4] || 0 },
                { day: 'Fri', mins: weeklyMinutes[5] || 0 },
                { day: 'Sat', mins: weeklyMinutes[6] || 0 },
              ].map((bar, idx) => {
                const fillPct = `${Math.min(100, Math.max(8, Math.round((bar.mins / maxMins) * 100)))}%`;
                return (
                  <View key={idx} style={styles.chartBarCol}>
                    <Text style={{ fontSize: 9, color: theme.textSecondary, marginBottom: 2 }}>{bar.mins}m</Text>
                    <View style={styles.chartBarTrack}>
                      <View style={[styles.chartBarFill, { height: fillPct as any, backgroundColor: activeHighlightColor }]} />
                    </View>
                    <Text style={[styles.chartBarDay, { color: theme.textSecondary }]}>{bar.day}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Resume Study Module ── */}
        <View style={[styles.sectionCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Resume Study</Text>
            <Text style={[styles.progressText, { color: theme.accent }]}>{activeProgressPct}% Complete</Text>
          </View>
          
          <View style={styles.resumeBody}>
            <View style={styles.resumeInfo}>
              <Text style={[styles.resumeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                {activeMaterial.document_title}
              </Text>
              <Text style={[styles.resumeSubtitle, { color: theme.textSecondary }]}>
                Last studied at card {activeProgress.currentCardIndex + 1}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.resumeBtn, { backgroundColor: theme.accent }]}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMaterialId(activeMaterialId);
                setActiveScreen('reader');
              }}
            >
              <Feather name="play" size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.resumeBtnText}>Resume</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${activeProgressPct}%`, backgroundColor: theme.accent }]} />
          </View>
        </View>

        {/* ── AI Recommendation Card ── */}
        <View style={[styles.recommendationCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.recommendationHeader}>
            <View style={[styles.aiBadge, { backgroundColor: 'rgba(62, 142, 126, 0.08)' }]}>
              <Feather name="cpu" size={14} color={theme.accent} />
            </View>
            <Text style={[styles.recommendationTitle, { color: theme.textPrimary }]}>AI Study Assistant</Text>
          </View>
          
          <View style={styles.recommendationBody}>
            <Text style={[styles.recTitleText, { color: theme.textPrimary }]}>
              {recommendation.title}
            </Text>
            <Text style={[styles.recDescText, { color: theme.textSecondary }]}>
              {recommendation.desc}
            </Text>
            
            <TouchableOpacity
              style={[styles.recActionBtn, { borderColor: theme.accent }]}
              activeOpacity={0.85}
              onPress={() => {
                if (recommendation.targetScreen === 'reader') {
                  setSelectedMaterialId(activeMaterialId);
                  if (recommendation.readerTab) {
                    setActiveReaderTab(recommendation.readerTab);
                  }
                }
                setActiveScreen(recommendation.targetScreen);
              }}
            >
              <Text style={[styles.recActionText, { color: theme.accent }]}>
                {recommendation.actionLabel}
              </Text>
              <Feather name="arrow-right" size={12} color={theme.accent} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info & Goal Cards */}
        <View style={styles.statsContainer}>
          {/* Study Tip Card */}
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.badge, { backgroundColor: 'rgba(62, 142, 126, 0.08)' }]}>
              <Feather name="info" size={20} color={theme.accent} />
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
            <View style={[styles.badge, { backgroundColor: 'rgba(92, 120, 186, 0.08)' }]}>
              <Feather name="check-circle" size={20} color={theme.accent} />
            </View>
            <View style={styles.statContent}>
              <Text style={[styles.statLabel, { color: theme.textPrimary }]}>Weekly Goal</Text>
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                You've mastered {totalCardsRead} new cards this week. Keep it up!
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Profile Modal */}
      <ProfileModal visible={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Tab Bar */}
      <TabBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 10,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 110, // clear bottom TabBar
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 10 : 15,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5ECE1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  userTextContainer: {
    flexDirection: 'column',
  },
  helloText: {
    fontSize: 14.5,
    fontWeight: '500',
  },
  nameText: {
    fontSize: 18.5,
    fontWeight: 'bold',
    marginTop: -2,
  },
  settingsBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  settingsIcon: {
    fontSize: 18.5,
  },
  welcomeBanner: {
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    height: 184,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  welcomeBannerLeft: {
    width: '58%',
    justifyContent: 'center',
    zIndex: 2,
  },
  welcomeBannerTitle: {
    fontSize: 18.5,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 25,
  },
  welcomeBannerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 18,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeBannerBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  welcomeBannerImg: {
    position: 'absolute',
    right: 6,
    bottom: -6,
    width: 146,
    height: 146,
    zIndex: 1,
  },
  analyticsCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
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
    height: 52,
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
    marginBottom: 12,
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
  sectionCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  resumeBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  resumeInfo: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  resumeSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  resumeBtnText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
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
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationBody: {
    marginTop: 2,
  },
  recTitleText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 22,
  },
  recDescText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: '500',
  },
  recActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1.2,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  recActionText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
});
