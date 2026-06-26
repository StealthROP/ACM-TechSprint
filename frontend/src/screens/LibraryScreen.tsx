import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Text as RNText,
  Image,
} from 'react-native';
import { Text } from '../components/A11yText';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { MOCK_LESSONS_BY_ID, LessonMaterial } from '../services/mockApi';
import { TabBar } from '../components/TabBar';
import { ShareNoteModal } from '../components/ShareNoteModal';
import { getImageAsset } from '../theme/images';
import { Feather } from '@expo/vector-icons';

export const LibraryScreen: React.FC = () => {
  const {
    themeType,
    setActiveScreen,
    setSelectedMaterialId,
    moduleProgress,
    setActiveReaderTab,
    dynamicLessons,
    fontFamily,
  } = useA11yStore();
  const theme = THEMES[themeType];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'review' | 'import' | 'flashcard'>('all');

  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [selectedShareTitle, setSelectedShareTitle] = useState('');
  const [selectedShareSubtitle, setSelectedShareSubtitle] = useState('');
  const [selectedSharePayload, setSelectedSharePayload] = useState<LessonMaterial | null>(null);

  // Cognitive style determination for dynamic assets
  const cognitiveStyle = fontFamily === 'OpenDyslexic' ? 'dyslexic' : 'standard';

  const dynamicItems = Object.keys(dynamicLessons || {}).map(id => {
    const lesson = dynamicLessons[id];
    return {
      id: id,
      title: lesson.document_title || 'Imported Lesson',
      summary: lesson.raw_text ? lesson.raw_text.substring(0, 80) + '...' : 'Generated lesson.',
      wordCount: `${lesson.review_points?.length || 0} Points`,
      grade: 'SOCS005',
      progress: 0.0,
      type: 'import',
    };
  });

  const libraryItems = [
    ...dynamicItems,
    {
      id: 'photo',
      title: 'Module 1',
      summary: 'Learn about the life, works, and contributions of Dr. Jose Rizal, the Philippine national hero. This module explores his writings, ideas, and role in inspiring the movement for Philippine independence.',
      wordCount: '450 words',
      grade: 'SOCS005',
      progress: 0.22,
      type: 'review',
    },
    {
      id: 'mitosis',
      title: 'Module 2',
      summary: 'Breaking down replication phases (prophase, metaphase, anaphase, telophase) of cell cycles, with simplified vocabulary builder.',
      wordCount: '580 words',
      grade: 'BIO101',
      progress: 0.43,
      type: 'flashcard',
    },
    {
      id: 'neuro',
      title: 'Neurodiversity & Learning',
      summary: 'An introductory overview on reading modes, dyslexia, and ADHD accommodations.',
      wordCount: '320 words',
      grade: 'A11Y101',
      progress: 0.72,
      type: 'import',
    },
    {
      id: 'respiration',
      title: 'Cellular Respiration Quiz',
      summary: 'Practice flashcards on glycolysis, the Krebs cycle, and electron transport.',
      wordCount: '24 flashcards',
      grade: 'BIO101',
      progress: 1.0,
      type: 'flashcard',
    },
    {
      id: 'plant_anatomy',
      title: 'Plant Anatomy Notes',
      summary: 'Imported PDF lecture notes outlining xylem, phloem, and root systems.',
      wordCount: '890 words',
      grade: 'BOT200',
      progress: 0.15,
      type: 'import',
    },
    {
      id: 'syllables_fil',
      title: 'Filipino Phonetics & Reading',
      summary: 'Core reading rules for Filipino syllables, highlighting digraphs and diphthongs.',
      wordCount: '620 words',
      grade: 'FIL102',
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
      
      {/* Header Banner - Full Width HeaderBg */}
      <View style={[styles.headerBanner, { backgroundColor: theme.headerBg || theme.accent }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Your Library</Text>
          <Image
            source={getImageAsset('libraryHeader', cognitiveStyle)}
            style={styles.headerBookIcon as any}
            resizeMode="contain"
          />
        </View>

        {/* Embedded Search Bar */}
        <View style={styles.searchBarContainer}>
          <Feather name="search" size={16} color="#999999" style={styles.searchIcon as any} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color="#999999" style={styles.searchClearText as any} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
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
              ? (theme.headerBg || theme.accent)
              : theme.cardBackground;
            const filterText = isSelected
              ? '#ffffff'
              : theme.textPrimary;
            const filterBorder = isSelected
              ? (theme.headerBg || theme.accent)
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
            <Feather name="search" size={40} color={theme.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyCardTitle, { color: theme.textPrimary }]}>No Cards Found</Text>
            <Text style={[styles.emptyCardSubtitle, { color: theme.textSecondary }]}>
              Try adjusting your spelling or reset the categories to view all materials.
            </Text>
            <TouchableOpacity
              style={[styles.resetBtn, { backgroundColor: theme.accent }]}
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
            {filteredItems.map((item) => {
              const progressData = moduleProgress[item.id];
              const displayProgress = progressData ? progressData.progressPct : item.progress;

              return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { backgroundColor: theme.moduleCardBg || theme.cardBackground }]}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardMainRow}>
                  {/* Guy Thinking Illustration on the Left */}
                  <Image
                    source={getImageAsset('guyThinkingModule', cognitiveStyle)}
                    style={styles.cardImage as any}
                    resizeMode="contain"
                  />

                  {/* Text Contents on the Right */}
                  <View style={styles.cardTextContent}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, { color: theme.moduleCardText || theme.textPrimary }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {/* Grade Code Badge */}
                      <View style={[styles.gradeBadge, { borderColor: theme.moduleCardSub || '#FFFFFF' }]}>
                        <Text style={[styles.gradeBadgeText, { color: theme.moduleCardSub || '#FFFFFF' }]}>
                          {item.grade}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.cardSummary, { color: theme.moduleCardSub || theme.textSecondary }]} numberOfLines={3}>
                      {item.summary}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar Container at the Bottom */}
                <View style={styles.progressContainer}>
                  <Text style={[styles.progressPct, { color: theme.moduleCardText || '#FFFFFF' }]}>
                    {Math.round(displayProgress * 100)}%
                  </Text>
                  <View style={[styles.progressTrack, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${displayProgress * 100}%`,
                          backgroundColor: theme.progressBarColor || '#FCE762',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Quick Action Row */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => { handleItemPress(item.id); setActiveReaderTab('import'); }}>
                    <Feather name="file-text" size={12} color={theme.moduleCardSub || '#FFFFFF'} style={{ marginBottom: 3 }} />
                    <Text style={[styles.actionText, { color: theme.moduleCardSub || '#FFFFFF' }]}>Read</Text>
                  </TouchableOpacity>

                  <View style={[styles.actionDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />

                  <TouchableOpacity style={styles.actionBtn} onPress={() => { handleItemPress(item.id); setActiveReaderTab('review'); }}>
                    <Feather name="list" size={12} color={theme.moduleCardSub || '#FFFFFF'} style={{ marginBottom: 3 }} />
                    <Text style={[styles.actionText, { color: theme.moduleCardSub || '#FFFFFF' }]}>Review</Text>
                  </TouchableOpacity>

                  <View style={[styles.actionDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />

                  <TouchableOpacity style={styles.actionBtn} onPress={() => { handleItemPress(item.id); setActiveReaderTab('flashcard'); }}>
                    <Feather name="zap" size={12} color={theme.moduleCardSub || '#FFFFFF'} style={{ marginBottom: 3 }} />
                    <Text style={[styles.actionText, { color: theme.moduleCardSub || '#FFFFFF' }]}>Quiz</Text>
                  </TouchableOpacity>

                  <View style={[styles.actionDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />

                  {/* Share button */}
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => {
                      const payload = dynamicLessons[item.id] || MOCK_LESSONS_BY_ID[item.id];
                      setSelectedShareTitle(item.title);
                      setSelectedShareSubtitle(item.grade);
                      setSelectedSharePayload(payload || null);
                      setIsShareModalVisible(true);
                    }}>
                    <Feather name="share-2" size={12} color={theme.moduleCardSub || '#FFFFFF'} style={{ marginBottom: 3 }} />
                    <Text style={[styles.actionText, { color: theme.moduleCardSub || '#FFFFFF' }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* Modals */}
      <ShareNoteModal 
        visible={isShareModalVisible} 
        onClose={() => setIsShareModalVisible(false)} 
        title={selectedShareTitle} 
        subtitle={selectedShareSubtitle}
        payload={selectedSharePayload}
      />

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
  headerBanner: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerBookIcon: {
    width: 50,
    height: 50,
  },
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#333333',
    paddingVertical: 8,
  },
  searchClearText: {
    paddingHorizontal: 6,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 110, // clear the tab bar
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginRight: 10,
  },
  filterPillText: {
    fontSize: 13,
  },
  listContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    marginRight: 14,
  },
  cardTextContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  gradeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  cardSummary: {
    fontSize: 11.5,
    lineHeight: 16.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressPct: {
    fontSize: 11.5,
    fontWeight: '800',
    marginRight: 10,
    width: 38,
    textAlign: 'right',
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    flex: 1,
  },
  actionDivider: {
    width: 1,
    height: 32,
    borderRadius: 1,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  emptyCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyCardSubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
    lineHeight: 18,
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
