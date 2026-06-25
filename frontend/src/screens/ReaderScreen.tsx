import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { ColorChopText } from '../components/ColorChopText';
import { FocusMaskOverlay } from '../components/FocusMaskOverlay';
import { MOCK_LESSON_DATA, MOCK_LESSONS_BY_ID, parseLessonPayload } from '../services/mockApi';

// Lookup map of material types
const MATERIAL_TYPES: Record<string, 'review' | 'import' | 'flashcard'> = {
  photo: 'review',
  neuro: 'import',
  mitosis: 'flashcard',
  respiration: 'flashcard',
  plant_anatomy: 'import',
  syllables_fil: 'review',
};

export const ReaderScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Flashcard States
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Review Module States
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);

  const selectedMaterialId = useA11yStore((state) => state.selectedMaterialId);
  const materialType = MATERIAL_TYPES[selectedMaterialId] || 'review';

  // Fetch parsed payload defensively
  const rawData = MOCK_LESSONS_BY_ID[selectedMaterialId] || MOCK_LESSON_DATA;
  const lessonData = parseLessonPayload(rawData);
  const totalPoints = lessonData.summary_points.length;

  const {
    themeType,
    fontSize,
    lineSpacing,
    letterSpacing,
    focusModeEnabled,
    activeLineIndex,
    setActiveLineIndex,
    itemLayouts,
    setItemLayout,
    contentHeight,
    setContentHeight,
    setActiveScreen,
    ttsSpeed,
    ttsPitch,
    highlightColor,
    setSettingsModalVisible,
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

  // Auto-scroll ScrollView to keep the active sentence centered
  useEffect(() => {
    if (activeLayout && scrollViewRef.current && viewportHeight > 0) {
      const targetY = Math.max(
        0,
        activeLayout.y - viewportHeight / 3.5 // Centers in the upper-middle region
      );
      
      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: true,
      });
    }
  }, [activeLineIndex, activeLayout, viewportHeight]);

  // Audio Player Handlers
  const stopSpeech = () => {
    Speech.stop();
    setIsPlaying(false);
    setActiveWordIndex(null);
  };

  // Parses Term vs Definition out of pre-syllabified flashcard payloads
  const parseFlashcardSyllables = (syllabified_words: string[][]) => {
    let termStartIdx = -1;
    let defStartIdx = -1;

    for (let i = 0; i < syllabified_words.length; i++) {
      const word = syllabified_words[i].join('').toLowerCase();
      if (word.includes('term:')) {
        termStartIdx = i + 1;
      }
      if (word.includes('definition:')) {
        defStartIdx = i + 1;
      }
    }

    if (termStartIdx !== -1 && defStartIdx !== -1) {
      const termSyllables = syllabified_words.slice(termStartIdx, defStartIdx - 1);
      const defSyllables = syllabified_words.slice(defStartIdx);
      return { termSyllables, defSyllables };
    }

    const half = Math.floor(syllabified_words.length / 2);
    return {
      termSyllables: syllabified_words.slice(0, half),
      defSyllables: syllabified_words.slice(half)
    };
  };

  const handleNextCard = () => {
    if (currentCardIndex < lessonData.summary_points.length - 1) {
      stopSpeech();
      setIsFlipped(false);
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      stopSpeech();
      setIsFlipped(false);
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const speakActiveSentence = () => {
    if (isPlaying) {
      stopSpeech();
      return;
    }

    let sentenceToSpeak = '';
    if (materialType === 'flashcard') {
      const card = lessonData.summary_points[currentCardIndex];
      if (!card) return;
      const { termSyllables, defSyllables } = parseFlashcardSyllables(card.syllabified_words);
      sentenceToSpeak = isFlipped
        ? defSyllables.map((w) => w.join('')).join(' ')
        : termSyllables.map((w) => w.join('')).join(' ');
    } else if (materialType === 'review') {
      if (selectedTopicIndex === null) return;
      sentenceToSpeak = lessonData.summary_points[selectedTopicIndex]?.full_sentence || '';
    } else {
      sentenceToSpeak = lessonData.summary_points[activeLineIndex]?.full_sentence || '';
    }

    if (!sentenceToSpeak) return;

    // Clean bullets prefix
    const cleanSentence = sentenceToSpeak.replace(/^•\s*/, '').trim();

    // Precompute character boundaries of words to map TTS callbacks
    const wordTokens = cleanSentence.split(/\s+/);
    let currentPos = 0;
    const wordRanges = wordTokens.map((word) => {
      const start = cleanSentence.indexOf(word, currentPos);
      const end = start + word.length;
      currentPos = end;
      return { start, end };
    });

    setIsPlaying(true);
    setActiveWordIndex(0); // Highlight first word on start

    Speech.speak(cleanSentence, {
      rate: ttsSpeed,
      pitch: ttsPitch,
      onBoundary: (event: any) => {
        const charIndex = event.charIndex;
        const currentIdx = wordRanges.findIndex(
          (r) => charIndex >= r.start && charIndex < r.end
        );
        if (currentIdx !== -1) {
          setActiveWordIndex(currentIdx);
        }
      },
      onDone: () => {
        setIsPlaying(false);
        setActiveWordIndex(null);
      },
      onError: () => {
        setIsPlaying(false);
        setActiveWordIndex(null);
      },
      onStopped: () => {
        setIsPlaying(false);
        setActiveWordIndex(null);
      },
    });
  };

  // Stop playback when moving to another sentence, changing cards, or changing topics
  useEffect(() => {
    stopSpeech();
  }, [activeLineIndex, currentCardIndex, selectedTopicIndex]);

  // Reset review module state when material changes
  useEffect(() => {
    setSelectedTopicIndex(null);
  }, [selectedMaterialId]);

  // Clean up Speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={themeType === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      
      {/* Elegant Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBackground }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => setActiveScreen('home')}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: activeHighlightColor }]}>← Home</Text>
          </TouchableOpacity>
          
          <Text style={[styles.docLabel, { color: activeHighlightColor }]}>LESSON SUMMARY</Text>
          
          {/* Top Settings Cog Icon */}
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => setSettingsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingsButtonText, { color: activeHighlightColor }]}>⚙️ Settings</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {lessonData.document_title}
        </Text>
      </View>

      {/* Audio Assistant Playback Bar */}
      {!(materialType === 'review' && selectedTopicIndex === null) && (
        <View style={[styles.audioRow, { backgroundColor: theme.cardBackground, borderBottomColor: themeType === 'dark' ? '#333' : '#EAE6DB' }]}>
          <TouchableOpacity
            style={[styles.audioPlayBtn, { backgroundColor: activeHighlightColor }]}
            onPress={speakActiveSentence}
            activeOpacity={0.85}
          >
            <Text style={styles.audioPlayBtnText}>
              {isPlaying ? '⏹️ Stop Audio Reader' : '🔊 Speak Sentence'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.audioSpeedText, { color: theme.textSecondary }]}>
            Speed: {ttsSpeed.toFixed(1)}x | Pitch: {ttsPitch.toFixed(1)}x
          </Text>
        </View>
      )}

      {/* Main Reading Canvas */}
      <View style={styles.readingContainer}>
        {(() => {
          if (materialType === 'flashcard') {
            const card = lessonData.summary_points[currentCardIndex];
            if (!card) return null;

            const { termSyllables, defSyllables } = parseFlashcardSyllables(card.syllabified_words);

            return (
              <View style={styles.flashcardContainer}>
                {/* Interactive Card */}
                <TouchableOpacity
                  style={[
                    styles.flashcard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: activeHighlightColor,
                    },
                  ]}
                  onPress={() => {
                    stopSpeech();
                    setIsFlipped(!isFlipped);
                  }}
                  activeOpacity={0.9}
                >
                  <View style={styles.cardIndicatorRow}>
                    <Text style={[styles.cardIndicatorText, { color: theme.textSecondary }]}>
                      {isFlipped ? '🔄 DEFINITION (BACK)' : '🔄 CONCEPT (FRONT)'}
                    </Text>
                  </View>
                  
                  <View style={styles.cardContentBox}>
                    {isFlipped ? (
                      <ColorChopText
                        syllabified_words={defSyllables}
                        activeWordIndex={activeWordIndex}
                      />
                    ) : (
                      <ColorChopText
                        syllabified_words={termSyllables}
                        activeWordIndex={activeWordIndex}
                      />
                    )}
                  </View>
                  
                  <Text style={[styles.flipPrompt, { color: activeHighlightColor }]}>
                    Tap card to flip
                  </Text>
                </TouchableOpacity>

                {/* Navigation Controls */}
                <View style={styles.cardControlsRow}>
                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: currentCardIndex === 0 ? 'rgba(0,0,0,0.03)' : activeHighlightColor,
                        opacity: currentCardIndex === 0 ? 0.4 : 1,
                      },
                    ]}
                    onPress={handlePrevCard}
                    disabled={currentCardIndex === 0}
                  >
                    <Text style={[styles.navBtnText, { color: activeHighlightColor }]}>← Back</Text>
                  </TouchableOpacity>

                  <Text style={[styles.cardProgressText, { color: theme.textPrimary }]}>
                    Card {currentCardIndex + 1} of {lessonData.summary_points.length}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: currentCardIndex === lessonData.summary_points.length - 1 ? 'rgba(0,0,0,0.03)' : activeHighlightColor,
                        opacity: currentCardIndex === lessonData.summary_points.length - 1 ? 0.4 : 1,
                      },
                    ]}
                    onPress={handleNextCard}
                    disabled={currentCardIndex === lessonData.summary_points.length - 1}
                  >
                    <Text style={[styles.navBtnText, { color: activeHighlightColor }]}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          if (materialType === 'review') {
            if (selectedTopicIndex === null) {
              return (
                <ScrollView
                  contentContainerStyle={styles.topicMenuContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.topicMenuList}>
                    {lessonData.summary_points.map((point, index) => {
                      const fullText = point.full_sentence;
                      const titleMatch = fullText.match(/^([^.?!]+[.?!])/);
                      const title = titleMatch ? titleMatch[1] : fullText;
                      const preview = titleMatch ? fullText.substring(titleMatch[0].length).trim() : '';

                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.topicMenuBtn,
                            {
                              backgroundColor: theme.cardBackground,
                              borderColor: themeType === 'dark' ? '#333' : '#EAE6DB',
                            },
                          ]}
                          onPress={() => setSelectedTopicIndex(index)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.topicCardHeader}>
                            <Text style={[styles.topicCardTitle, { color: activeHighlightColor }]}>
                              {title.toUpperCase()}
                            </Text>
                          </View>
                          {preview ? (
                            <Text style={[styles.topicCardPreview, { color: theme.textSecondary }]} numberOfLines={2}>
                              {preview}
                            </Text>
                          ) : null}
                          <View style={styles.readMoreRow}>
                            <Text style={[styles.readMoreText, { color: activeHighlightColor }]}>
                              Read Topic →
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              );
            }

            // Otherwise, selectedTopicIndex !== null: show the reading screen for the selected topic
            const activeTopic = lessonData.summary_points[selectedTopicIndex];
            if (!activeTopic) return null;

            const fullText = activeTopic.full_sentence;
            const titleMatch = fullText.match(/^([^.?!]+[.?!])/);
            const title = titleMatch ? titleMatch[1] : fullText;

            return (
              <ScrollView
                contentContainerStyle={styles.focusedTopicContainer}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={[styles.backToTopicsBtn, { backgroundColor: theme.cardBackground, borderColor: activeHighlightColor }]}
                  onPress={() => setSelectedTopicIndex(null)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.backToTopicsBtnText, { color: activeHighlightColor }]}>
                    ← Back to Topics
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.focusedTopicCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: activeHighlightColor,
                    },
                  ]}
                >
                  <Text style={[styles.topicHeading, { color: activeHighlightColor }]}>
                    {title.toUpperCase()}
                  </Text>
                  
                  <View style={styles.topicBody}>
                    <ColorChopText
                      syllabified_words={activeTopic.syllabified_words}
                      activeWordIndex={activeWordIndex}
                    />
                  </View>
                </View>
              </ScrollView>
            );
          }

          // default 'import' Mode: normal list
          return (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}
              onContentSizeChange={(_, height) => setContentHeight(height)}
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
            >
              {/* Relative container to anchor absolute overlays */}
              <View style={[styles.relativeContainer, { minHeight: viewportHeight }]}>
                {lessonData.summary_points.map((point, index) => {
                  const isActive = index === activeLineIndex;
                  
                  return (
                    <TouchableOpacity
                      key={`point-${index}`}
                      activeOpacity={0.9}
                      onPress={() => setActiveLineIndex(index)}
                      onLayout={(e) => {
                        const { y, height } = e.nativeEvent.layout;
                        setItemLayout(index, { y, height });
                      }}
                      style={[
                        styles.sentenceCard,
                        {
                          backgroundColor: isActive ? theme.cardBackground : 'transparent',
                          borderColor: isActive ? activeHighlightColor : 'transparent',
                          paddingVertical: fontSize * 0.6,
                          borderLeftWidth: 4,
                          borderLeftColor: isActive ? activeHighlightColor : 'transparent',
                        },
                      ]}
                    >
                      <ColorChopText
                        syllabified_words={point.syllabified_words}
                        isMuted={focusModeEnabled && !isActive}
                        activeWordIndex={isActive ? activeWordIndex : null}
                      />
                    </TouchableOpacity>
                  );
                })}

                {/* Immersive Focus Overlay Mask */}
                <FocusMaskOverlay contentHeight={contentHeight} />
              </View>
            </ScrollView>
          );
        })()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingsButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  settingsButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  docLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
  audioPlayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  audioPlayBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  audioSpeedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  readingContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  relativeContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
  sentenceCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  flashcardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  flashcard: {
    width: '100%',
    height: 280,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
  },
  cardIndicatorRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 8,
  },
  cardIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  cardContentBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  flashcardFrontText: {
    textAlign: 'center',
    fontWeight: '800',
  },
  flipPrompt: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  cardProgressText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  topicMenuContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topicMenuList: {
    gap: 16,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  topicMenuBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  topicCardHeader: {
    marginBottom: 8,
  },
  topicCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  topicCardPreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreRow: {
    alignItems: 'flex-end',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  focusedTopicContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  backToTopicsBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  backToTopicsBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  focusedTopicCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  topicHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 8,
  },
  topicBody: {
    marginTop: 4,
  },
});
