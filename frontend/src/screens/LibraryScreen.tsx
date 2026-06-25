import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { TabBar } from '../components/TabBar';

export const LibraryScreen: React.FC = () => {
  const { themeType, setActiveScreen, highlightColor, setSelectedMaterialId } = useA11yStore();
  const theme = THEMES[themeType];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'review' | 'import' | 'flashcard'>('all');

  // Map user-selected highlight color to hex codes
  const highlightColors: Record<string, string> = {
    theme: theme.accent,
    orange: '#F27A1A',
    teal: '#139A8C',
    purple: '#8A2BE2',
    green: '#2E8B57',
  };
  const activeHighlightColor = highlightColors[highlightColor] || theme.accent;

  const libraryItems = [
    {
      id: 'photo',
      title: 'Ch. 4: Photosynthesis & Energy',
      summary: 'Learn about chloroplasts, light-dependent reactions, and the Calvin cycle.',
      wordCount: '450 words',
      grade: 'Biology 101',
      progress: 0.75,
      type: 'review',
    },
    {
      id: 'neuro',
      title: 'Neurodiversity & Learning',
      summary: 'An introductory overview on reading modes, dyslexia, and ADHD accommodations.',
      wordCount: '320 words',
      grade: 'A11y Study',
      progress: 0.30,
      type: 'import',
    },
    {
      id: 'mitosis',
      title: 'Ch. 5: Mitosis & Cell Cycles',
      summary: 'Breaking down replication phases (prophase, metaphase, anaphase, telophase).',
      wordCount: '580 words',
      grade: 'Biology 101',
      progress: 0.0,
      type: 'flashcard',
    },
    {
      id: 'respiration',
      title: 'Ch. 6: Cellular Respiration Quiz',
      summary: 'Practice flashcards on glycolysis, the Krebs cycle, and electron transport.',
      wordCount: '24 flashcards',
      grade: 'Biology 101',
      progress: 1.0,
      type: 'flashcard',
    },
    {
      id: 'plant_anatomy',
      title: 'PDF Upload: Plant Anatomy',
      summary: 'Imported PDF lecture notes outlining xylem, phloem, and root systems.',
      wordCount: '890 words',
      grade: 'Botany 200',
      progress: 0.15,
      type: 'import',
    },
    {
      id: 'syllables_fil',
      title: 'Filipino Phonetics & Reading',
      summary: 'Core reading rules for Filipino syllables, highlighting digraphs and diphthongs.',
      wordCount: '620 words',
      grade: 'A11y Study',
      progress: 0.90,
      type: 'review',
    },
  ];

  const handleItemPress = (itemId: string) => {
    setSelectedMaterialId(itemId);
    setActiveScreen('reader');
  };

  const filteredItems = libraryItems.filter((item) => {
    // 1. Filter by category pill selection
    if (selectedFilter !== 'all' && item.type !== selectedFilter) {
      return false;
    }
    // 2. Filter by search query text keyword match
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchSummary = item.summary.toLowerCase().includes(query);
      const matchGrade = item.grade.toLowerCase().includes(query);
      return matchTitle || matchSummary || matchGrade;
    }
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.headerSubtitle, { color: activeHighlightColor }]}>STUDY CARDS</Text>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Your Library</Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBarContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search cards, grades, keywords..."
            placeholderTextColor={themeType === 'dark' ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={[styles.searchClearText, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Categories Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'review', label: 'Review Material' },
            { key: 'import', label: 'Imports' },
            { key: 'flashcard', label: 'Flashcards' },
          ].map((filter) => {
            const isSelected = selectedFilter === filter.key;
            const filterBg = isSelected
              ? activeHighlightColor
              : theme.cardBackground;
            const filterText = isSelected
              ? '#ffffff'
              : theme.textPrimary;
            const filterBorder = isSelected
              ? activeHighlightColor
              : themeType === 'dark'
              ? '#333'
              : '#EAE6DB';

            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: filterBg,
                    borderColor: filterBorder,
                  },
                ]}
                onPress={() => setSelectedFilter(filter.key as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, { color: filterText, fontWeight: isSelected ? '800' : '500' }]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List of items */}
        {filteredItems.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={styles.emptyCardIcon}>🔎</Text>
            <Text style={[styles.emptyCardTitle, { color: theme.textPrimary }]}>No Cards Found</Text>
            <Text style={[styles.emptyCardSubtitle, { color: theme.textSecondary }]}>
              Try adjusting your spelling or reset the categories to view all materials.
            </Text>
            <TouchableOpacity
              style={[styles.resetBtn, { backgroundColor: activeHighlightColor }]}
              onPress={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
            >
              <Text style={styles.resetBtnText}>Clear Search & Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { backgroundColor: theme.cardBackground }]}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardGrade, { color: activeHighlightColor }]}>{item.grade}</Text>
                  <Text style={[styles.cardWords, { color: theme.textSecondary }]}>{item.wordCount}</Text>
                </View>
                
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.cardSummary, { color: theme.textSecondary }]}>{item.summary}</Text>
                
                {/* Aesthetic Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarInfo}>
                    <View style={styles.statusBadgeRow}>
                      <Text style={styles.statusBadgeIcon}>
                        {item.progress === 0 ? '💤' : item.progress === 1 ? '✅' : '📖'}
                      </Text>
                      <Text style={[styles.progressStatus, { color: theme.textSecondary }]}>
                        {item.progress === 0 ? 'Not started' : item.progress === 1 ? 'Completed' : 'In progress'}
                      </Text>
                    </View>
                    <Text style={[styles.progressPct, { color: item.progress === 1 ? '#2E8B57' : activeHighlightColor }]}>
                      {Math.round(item.progress * 100)}%
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: themeType === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${item.progress * 100}%`,
                          backgroundColor: item.progress === 1 ? '#2E8B57' : activeHighlightColor,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={[styles.actionRow, { borderTopColor: themeType === 'dark' ? '#333' : '#EAE6DB' }]}>
                  <Text style={[styles.actionText, { color: activeHighlightColor }]}>Tap to open in Reader →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Tab Bar */}
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
    paddingTop: 24,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    flex: 1,
    minWidth: 260,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardGrade: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardWords: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardSummary: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  progressContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  progressBarInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgeIcon: {
    fontSize: 12,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressStatus: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  progressTrack: {
    height: 9,
    borderRadius: 4.5,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4.5,
  },
  actionRow: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    height: '100%',
  },
  searchClearText: {
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  filtersScroll: {
    flexGrow: 0,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  filtersContainer: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 12.5,
  },
  emptyCard: {
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  emptyCardIcon: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyCardSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: '80%',
    opacity: 0.8,
  },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
