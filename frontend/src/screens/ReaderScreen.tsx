import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import { Text } from '../components/A11yText';
import * as Speech from 'expo-speech';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { ColorChopText } from '../components/ColorChopText';
import { FocusMaskOverlay } from '../components/FocusMaskOverlay';
import { MOCK_LESSON_DATA, MOCK_LESSONS_BY_ID, parseLessonPayload } from '../services/mockApi';
import { Feather } from '@expo/vector-icons';

// Lookup map of material types
const MATERIAL_TYPES: Record<string, 'review' | 'import' | 'flashcard'> = {
  photo: 'review',
  neuro: 'import',
  mitosis: 'flashcard',
  respiration: 'flashcard',
  plant_anatomy: 'import',
syllables_fil: 'review',
};

// ── Fuzzy Matching Helpers ──
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = getLevenshteinDistance(s1, s2);
  return 1.0 - dist / maxLen;
}

export const ReaderScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Quick Controls Sheet state
  const [isControlSheetOpen, setIsControlSheetOpen] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  // Flashcard States
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSelfGrade, setShowSelfGrade] = useState(false);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);

  // Adaptive Drill States
  const [studyMode, setStudyMode] = useState<'sequential' | 'adaptive'>('sequential');
  const [hintLevel, setHintLevel] = useState(0);
  const [mcqOptions, setMcqOptions] = useState<string[]>([]);

  // expo-audio recorder hook
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Review Module States
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);

  const selectedMaterialId = useA11yStore((state) => state.selectedMaterialId);
  const dynamicLessons = useA11yStore((state) => state.dynamicLessons);

  const materialType = MATERIAL_TYPES[selectedMaterialId] || 'review';

  // Fetch parsed payload defensively
  const rawData = dynamicLessons[selectedMaterialId] || MOCK_LESSONS_BY_ID[selectedMaterialId] || MOCK_LESSON_DATA;
  const lessonData = useMemo(() => parseLessonPayload(rawData), [rawData]);

  const {
    themeType,
    fontSize,
    lineSpacing,
    letterSpacing,
    fontFamily,
    setFontFamily,
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
    activeReaderTab,
    setActiveReaderTab,
    activeLanguage,
    setActiveLanguage,
    activeRecallEnabled,
    setActiveRecallEnabled,
    moduleProgress,
    setModuleProgress,
    apiUrl,
    startSession,
    endSession,
    touchStreak,
    recordAnswer,
    recordCardRead,
    cardDifficulty,
    updateCardDifficulty,
    resetCardDifficulty,
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

  // ─── Quick Controls Sheet Animations ──────────────────────────────────────
  const openSheet = () => {
    setIsControlSheetOpen(true);
    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 160,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setIsControlSheetOpen(false));
  };

  const sheetTranslateY = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const backdropOpacity = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  // ─── Focus Bar Status Chip text ───────────────────────────────────────────
  const langLabel = activeLanguage === 'en' ? 'EN' : 'FIL';
  const fontLabel = fontFamily === 'OpenDyslexic' ? 'Dyslexic' : 'System';
  const recallLabel = activeReaderTab === 'flashcard'
    ? (activeRecallEnabled ? '· Mic' : '· Typing')
    : '';
  const statusChipText = `${langLabel} · ${fontLabel}${recallLabel}`;

  // Auto-scroll ScrollView to keep the active sentence centered
  useEffect(() => {
    if (activeLayout && scrollViewRef.current && viewportHeight > 0) {
      const targetY = Math.max(
        0,
        activeLayout.y - viewportHeight / 3.5
      );
      scrollViewRef.current.scrollTo({
        y: targetY,
        animated: true,
      });
    }
  }, [activeLineIndex, activeLayout, viewportHeight]);

  // Reset feedback and recording state on material change
  useEffect(() => {
    const saved = moduleProgress[selectedMaterialId];
    if (saved && saved.currentCardIndex !== undefined) {
      setCurrentCardIndex(saved.currentCardIndex);
    } else {
      setCurrentCardIndex(0);
    }
    setIsFlipped(false);
    setTypedAnswer('');
    setAnswerFeedback(null);
    setFeedbackMessage('');
    setIsListening(false);
    setIsValidating(false);
    setShowSelfGrade(false);
  }, [selectedMaterialId]);

  // Request mic permission on mount
  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync().then((res) => {
      setMicPermission(res.granted);
    });
  }, []);

  // Analytics: start session and touch streak when screen mounts
  useEffect(() => {
    startSession();
    touchStreak();
    return () => {
      endSession();
    };
  }, []);

  // Update progress in store when card index changes
  useEffect(() => {
    if (activeReaderTab === 'flashcard') {
      const cardSource = activeLanguage === 'en' ? lessonData.flashcards : lessonData.flashcards_fil;
      if (cardSource && cardSource.length > 0) {
        const progressPct = (currentCardIndex + 1) / cardSource.length;
        setModuleProgress(selectedMaterialId, {
          currentCardIndex,
          progressPct: progressPct > 1 ? 1 : progressPct,
        });
      }
    }
  }, [currentCardIndex, selectedMaterialId, activeReaderTab, activeLanguage]);

  // Auto-speak definition when currentCardIndex changes and front is visible
  useEffect(() => {
    if (activeReaderTab === 'flashcard' && !isFlipped) {
      const cardSource = activeLanguage === 'en' ? lessonData.flashcards : lessonData.flashcards_fil;
      const card = cardSource[currentCardIndex];
      if (card && card.definition) {
        Speech.stop();
        setIsPlaying(true);
        setActiveWordIndex(0);

        const cleanSentence = card.definition.replace(/^•\s*/, '').trim();
        const wordTokens = cleanSentence.split(/\s+/);
        let currentPos = 0;
        const wordRanges = wordTokens.map((word) => {
          const start = cleanSentence.indexOf(word, currentPos);
          const end = start + word.length;
          currentPos = end;
          return { start, end };
        });

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
        });
      }
    } else {
      Speech.stop();
      setIsPlaying(false);
      setActiveWordIndex(null);
    }
  }, [currentCardIndex, activeReaderTab, activeLanguage, isFlipped]);

  // Reset feedback on card change and generate MCQ options
  useEffect(() => {
    setIsFlipped(false);
    setTypedAnswer('');
    setAnswerFeedback(null);
    setFeedbackMessage('');
    setIsListening(false);
    setIsValidating(false);
    setShowSelfGrade(false);
    setHintLevel(0);

    const cardSource = activeLanguage === 'en' ? lessonData.flashcards : lessonData.flashcards_fil;
    if (cardSource.length > 0 && currentCardIndex < cardSource.length) {
      const correctTerm = cardSource[currentCardIndex].term;
      const options = new Set<string>([correctTerm]);
      let attempts = 0;
      while (options.size < Math.min(4, cardSource.length) && attempts < 50) {
        const randIdx = Math.floor(Math.random() * cardSource.length);
        options.add(cardSource[randIdx].term);
        attempts++;
      }
      setMcqOptions(Array.from(options).sort(() => Math.random() - 0.5));
    }
  }, [currentCardIndex, activeLanguage, lessonData]);

  // Real mic recording: start
  const startRecording = async (expectedAnswer: string) => {
    if (!micPermission) {
      const res = await AudioModule.requestRecordingPermissionsAsync();
      if (!res.granted) {
        Alert.alert('Microphone Permission', 'Please allow microphone access to use Active Recall mode.');
        return;
      }
      setMicPermission(true);
    }
    try {
      Speech.stop();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsListening(true);
      setAnswerFeedback(null);
      setFeedbackMessage('');
    } catch (e) {
      console.error('Recording start error:', e);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  // Real mic recording: stop and transcribe
  const stopRecordingAndValidate = async (expectedAnswer: string, expectedDefinition: string, cardKey: string) => {
    setIsListening(false);
    setIsValidating(true);
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (!uri) {
        throw new Error('No audio recorded.');
      }

      const uploadResult = await FileSystem.uploadAsync(
        `${apiUrl}/api/v1/transcribe`,
        uri,
        {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          mimeType: 'audio/m4a',
          headers: { 'Bypass-Tunnel-Reminder': 'true' },
        }
      );

      if (uploadResult.status !== 200) {
        throw new Error('Transcription failed.');
      }

      const transcribeData = JSON.parse(uploadResult.body);
      const transcript: string = transcribeData.transcript || '';

      const validateResponse = await fetch(`${apiUrl}/api/v1/validate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({ spoken: transcript, expected: expectedAnswer, definition: expectedDefinition }),
      });

      const validateData = await validateResponse.json();
      setFeedbackMessage(
        `You said: "${transcript || '(nothing)'}"\\n${validateData.feedback}`
      );

      if (validateData.is_correct) {
        setAnswerFeedback('correct');
        recordAnswer(true);
        updateCardDifficulty(cardKey, true);
        setIsFlipped(true);
      } else {
        setAnswerFeedback('incorrect');
        recordAnswer(false);
        updateCardDifficulty(cardKey, false);
      }
    } catch (e: any) {
      console.error('Transcription error:', e);
      setFeedbackMessage('Could not transcribe audio. Please try again.');
      setAnswerFeedback('incorrect');
      updateCardDifficulty(cardKey, false);
    } finally {
      setIsValidating(false);
    }
  };

  // Typing mode: validate via backend fuzzy match
  const validateTypedAnswer = async (typed: string, expectedAnswer: string, expectedDefinition: string, cardKey: string) => {
    if (!typed.trim()) return;
    setIsValidating(true);
    try {
      const response = await fetch(`${apiUrl}/api/v1/validate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({ spoken: typed, expected: expectedAnswer, definition: expectedDefinition }),
      });
      const data = await response.json();
      setFeedbackMessage(data.feedback);
      if (data.is_correct) {
        setAnswerFeedback('correct');
        recordAnswer(true);
        updateCardDifficulty(cardKey, true);
        setIsFlipped(true);
      } else {
        setAnswerFeedback('incorrect');
        recordAnswer(false);
        updateCardDifficulty(cardKey, false);
      }
    } catch (e) {
      const sim = calculateSimilarity(typed, expectedAnswer);
      const isExact = sim >= 0.75; // Allow minor typos locally
      
      setFeedbackMessage(isExact ? 'Correct!' : 'Incorrect. Try again.');
      setAnswerFeedback(isExact ? 'correct' : 'incorrect');
      recordAnswer(isExact);
      updateCardDifficulty(cardKey, isExact);
      if (isExact) setIsFlipped(true);
    } finally {
      setIsValidating(false);
    }
  };

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
    const cardSource = activeLanguage === 'en' ? lessonData.flashcards : lessonData.flashcards_fil;
    stopSpeech();
    setIsFlipped(false);
    recordCardRead();

    if (studyMode === 'adaptive') {
      const nonMastered = [];
      for (let i = 0; i < cardSource.length; i++) {
        const key = `${selectedMaterialId}_${activeLanguage}_${i}`;
        if (cardDifficulty[key] !== 'mastered') {
          nonMastered.push(i);
        }
      }
      if (nonMastered.length === 0) {
        setCurrentCardIndex(cardSource.length);
      } else {
        const nextIdx = nonMastered.find(i => i > currentCardIndex);
        if (nextIdx !== undefined) {
          setCurrentCardIndex(nextIdx);
        } else {
          setCurrentCardIndex(nonMastered[0]);
        }
      }
    } else {
      if (currentCardIndex < cardSource.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        setCurrentCardIndex(cardSource.length);
      }
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
    if (activeReaderTab === 'flashcard') {
      const cardSource = activeLanguage === 'en' ? lessonData.flashcards : lessonData.flashcards_fil;
      const card = cardSource[currentCardIndex];
      if (!card) return;
      sentenceToSpeak = isFlipped ? card.term : card.definition;
    } else if (activeReaderTab === 'review') {
      if (selectedTopicIndex === null) return;
      const points = activeLanguage === 'en' ? lessonData.review_points : lessonData.review_points_fil;
      sentenceToSpeak = points[selectedTopicIndex]?.full_sentence || '';
    } else {
      sentenceToSpeak = activeLanguage === 'en' ? lessonData.raw_text : lessonData.raw_text_fil;
    }

    if (!sentenceToSpeak) return;

    const cleanSentence = sentenceToSpeak.replace(/^•\s*/, '').trim();
    const wordTokens = cleanSentence.split(/\s+/);
    let currentPos = 0;
    const wordRanges = wordTokens.map((word) => {
      const start = cleanSentence.indexOf(word, currentPos);
      const end = start + word.length;
      currentPos = end;
      return { start, end };
    });

    setIsPlaying(true);
    setActiveWordIndex(0);

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

  // ─── Quick Controls Sheet ─────────────────────────────────────────────────
  const QuickControlsSheet = () => (
    <Modal transparent visible={isControlSheetOpen} onRequestClose={closeSheet} animationType="none">
      {/* Backdrop */}
      <Animated.View style={[styles.sheetBackdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      {/* Sheet Panel */}
      <Animated.View
        style={[
          styles.sheetPanel,
          {
            backgroundColor: theme.cardBackground,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        {/* Sheet Handle */}
        <View style={styles.sheetHandle} />

        {/* Sheet Header */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Quick Controls</Text>
          <TouchableOpacity onPress={closeSheet} style={[styles.sheetCloseBtn, { backgroundColor: theme.background }]}>
            <Feather name="x" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Language Toggle */}
        <View style={styles.sheetSection}>
          <Text style={[styles.sheetSectionLabel, { color: theme.textSecondary }]}>LANGUAGE</Text>
          <View style={styles.sheetToggleRow}>
            <TouchableOpacity
              style={[
                styles.sheetToggleBtn,
                { borderColor: activeHighlightColor },
                activeLanguage === 'en' && { backgroundColor: activeHighlightColor },
              ]}
              onPress={() => setActiveLanguage('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.sheetToggleBtnText, { color: activeLanguage === 'en' ? '#fff' : activeHighlightColor }]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sheetToggleBtn,
                { borderColor: activeHighlightColor },
                activeLanguage === 'fil' && { backgroundColor: activeHighlightColor },
              ]}
              onPress={() => setActiveLanguage('fil')}
              activeOpacity={0.8}
            >
              <Text style={[styles.sheetToggleBtnText, { color: activeLanguage === 'fil' ? '#fff' : activeHighlightColor }]}>
                Filipino
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Font Toggle */}
        <View style={styles.sheetSection}>
          <Text style={[styles.sheetSectionLabel, { color: theme.textSecondary }]}>READING FONT</Text>
          <View style={styles.sheetToggleRow}>
            <TouchableOpacity
              style={[
                styles.sheetToggleBtn,
                { borderColor: activeHighlightColor },
                fontFamily !== 'OpenDyslexic' && { backgroundColor: activeHighlightColor },
              ]}
              onPress={() => setFontFamily('System')}
              activeOpacity={0.8}
            >
              <Text style={[styles.sheetToggleBtnText, { color: fontFamily !== 'OpenDyslexic' ? '#fff' : activeHighlightColor }]}>
                System
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sheetToggleBtn,
                { borderColor: activeHighlightColor },
                fontFamily === 'OpenDyslexic' && { backgroundColor: activeHighlightColor },
              ]}
              onPress={() => setFontFamily('OpenDyslexic')}
              activeOpacity={0.8}
            >
              <Text style={[styles.sheetToggleBtnText, { color: fontFamily === 'OpenDyslexic' ? '#fff' : activeHighlightColor }]}>
                Dyslexic
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quiz Mode — only shown in Study Session tab */}
        {activeReaderTab === 'flashcard' && (
          <View style={styles.sheetSection}>
            <Text style={[styles.sheetSectionLabel, { color: theme.textSecondary }]}>QUIZ MODE</Text>
            <View style={styles.sheetToggleRow}>
              <TouchableOpacity
                style={[
                  styles.sheetToggleBtn,
                  { borderColor: activeHighlightColor },
                  activeRecallEnabled && { backgroundColor: activeHighlightColor },
                ]}
                onPress={() => setActiveRecallEnabled(true)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="mic" size={14} color={activeRecallEnabled ? '#fff' : activeHighlightColor} />
                  <Text style={[styles.sheetToggleBtnText, { color: activeRecallEnabled ? '#fff' : activeHighlightColor }]}>
                    Mic
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sheetToggleBtn,
                  { borderColor: activeHighlightColor },
                  !activeRecallEnabled && { backgroundColor: activeHighlightColor },
                ]}
                onPress={() => setActiveRecallEnabled(false)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="edit-3" size={14} color={!activeRecallEnabled ? '#fff' : activeHighlightColor} />
                  <Text style={[styles.sheetToggleBtnText, { color: !activeRecallEnabled ? '#fff' : activeHighlightColor }]}>
                    Typing
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TTS Speed Info */}
        <View style={[styles.sheetSection, styles.sheetSpeedRow]}>
          <Feather name="volume-2" size={14} color={theme.textSecondary} />
          <Text style={[styles.sheetSpeedText, { color: theme.textSecondary }]}>
            TTS Speed: {ttsSpeed.toFixed(1)}x · Pitch: {ttsPitch.toFixed(1)}x
          </Text>
          <TouchableOpacity onPress={() => { closeSheet(); setSettingsModalVisible(true); }}>
            <Text style={[styles.sheetSpeedAdjust, { color: activeHighlightColor }]}>Adjust →</Text>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.sheetDoneBtn, { backgroundColor: activeHighlightColor }]}
          onPress={closeSheet}
          activeOpacity={0.85}
        >
          <Text style={styles.sheetDoneBtnText}>Done</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={themeType === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Quick Controls Modal */}
      <QuickControlsSheet />

      {/* ── Elegant Header ── */}
      <View style={[styles.header, { borderBottomColor: theme.cardBackground }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => setActiveScreen('home')}
            activeOpacity={0.7}
          >
            <Text style={[styles.backButtonText, { color: theme.accent }]}>← Home</Text>
          </TouchableOpacity>

          <Text style={[styles.docLabel, { color: theme.accent }]}>LESSON SUMMARY</Text>

          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => setSettingsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={14} color={theme.accent} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
          {lessonData.document_title}
        </Text>
      </View>

      {/* ── Sub-Navigation Tabs ── */}
      <View style={[styles.tabBar, { borderBottomColor: theme.cardBackground }]}>
        <TouchableOpacity
          style={[styles.tabItem, activeReaderTab === 'import' && { borderBottomColor: activeHighlightColor, borderBottomWidth: 3 }]}
          onPress={() => setActiveReaderTab('import')}
        >
          <Text style={[styles.tabText, { color: activeReaderTab === 'import' ? activeHighlightColor : theme.textSecondary }]}>Raw Text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeReaderTab === 'review' && { borderBottomColor: activeHighlightColor, borderBottomWidth: 3 }]}
          onPress={() => setActiveReaderTab('review')}
        >
          <Text style={[styles.tabText, { color: activeReaderTab === 'review' ? activeHighlightColor : theme.textSecondary }]}>Review Material</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeReaderTab === 'flashcard' && { borderBottomColor: activeHighlightColor, borderBottomWidth: 3 }]}
          onPress={() => setActiveReaderTab('flashcard')}
        >
          <Text style={[styles.tabText, { color: activeReaderTab === 'flashcard' ? activeHighlightColor : theme.textSecondary }]}>Study Session</Text>
        </TouchableOpacity>
      </View>

      {/* ── Slim Focus Bar (replaces all the old inline togglers + audio bar) ── */}
      <View style={[styles.focusBar, { backgroundColor: theme.cardBackground, borderBottomColor: themeType === 'dark' ? '#2a2a2a' : '#EDEAE0' }]}>
        {/* Left: Play / Stop audio */}
        {!(activeReaderTab === 'review' && selectedTopicIndex === null) ? (
          <TouchableOpacity
            style={[styles.focusBarPlayBtn, { backgroundColor: isPlaying ? '#E53E3E' : activeHighlightColor }]}
            onPress={speakActiveSentence}
            activeOpacity={0.85}
          >
            <Feather name={isPlaying ? 'square' : 'volume-2'} size={14} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={[styles.focusBarPlayBtn, { backgroundColor: 'rgba(0,0,0,0.06)' }]}>
            <Feather name="volume-2" size={14} color={theme.textSecondary} />
          </View>
        )}

        {/* Center: current mode status chip */}
        <View style={[styles.focusBarChip, { backgroundColor: theme.background }]}>
          <Text style={[styles.focusBarChipText, { color: theme.textSecondary }]} numberOfLines={1}>
            {statusChipText}
          </Text>
        </View>

        {/* Right: expand controls */}
        <TouchableOpacity
          style={[styles.focusBarExpandBtn, { backgroundColor: theme.background }]}
          onPress={openSheet}
          activeOpacity={0.8}
        >
          <Feather name="sliders" size={15} color={activeHighlightColor} />
        </TouchableOpacity>
      </View>

      {/* ── Main Reading Canvas ── */}
      <KeyboardAvoidingView 
        style={styles.readingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        {(() => {
          if (activeReaderTab === 'flashcard') {
            const cardSource = activeLanguage === 'en' ? lessonData.flashcards : lessonData.flashcards_fil;
            const card = cardSource[currentCardIndex];
            if (!card) return (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary }}>No flashcards available.</Text>
              </View>
            );

            const termSyllables = card.term.split(' ').map(w => [w]);
            const defSyllables = card.definition.split(' ').map(w => [w]);

            const cardKey = `${selectedMaterialId}_${activeLanguage}_${currentCardIndex}`;
            const diffLevel = cardDifficulty[cardKey] || 'easy';

            const startListening = () => {
              startRecording(card.term);
            };

            const checkTyping = () => {
              validateTypedAnswer(typedAnswer, card.term, card.definition, cardKey);
            };

            const checkMcq = (selected: string) => {
              const isCorrect = selected === card.term;
              setAnswerFeedback(isCorrect ? 'correct' : 'incorrect');
              setFeedbackMessage(isCorrect ? 'Correct!' : `Incorrect. The answer is ${card.term}.`);
              recordAnswer(isCorrect);
              updateCardDifficulty(cardKey, isCorrect);
              setIsFlipped(true);
            };

            const renderDifficultyIndicator = () => {
              const colors = { easy: '#4299E1', medium: '#ECC94B', hard: '#ED8936', mastered: '#48BB78' };
              const labels = { easy: 'Level: Easy (MCQ)', medium: 'Level: Medium (Typing)', hard: 'Level: Hard (Strict)', mastered: 'Mastered' };
              return (
                <View style={{ alignSelf: 'center', marginBottom: 16, backgroundColor: colors[diffLevel] + '22', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: colors[diffLevel], fontWeight: '800', fontSize: 11, letterSpacing: 0.5 }}>{labels[diffLevel].toUpperCase()}</Text>
                </View>
              );
            };

            const renderFeedbackCard = () => {
              const isCorrect = answerFeedback === 'correct';
              return (
                <View style={[styles.selfGradeBox, { backgroundColor: isCorrect ? '#2E8B5711' : '#E53E3E11', borderColor: isCorrect ? '#2E8B57' : '#E53E3E', marginTop: 4 }]}>
                  <Text style={{ color: isCorrect ? '#2E8B57' : '#E53E3E', fontWeight: '800', fontSize: 16, marginBottom: 8 }}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </Text>
                  <Text style={{ color: theme.textPrimary, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
                    Term: <Text style={{ color: theme.accent }}>{card.term}</Text>
                  </Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 12, fontStyle: 'italic', textAlign: 'center', lineHeight: 18 }}>
                    {feedbackMessage || card.definition}
                  </Text>
                  
                  {studyMode === 'adaptive' || currentCardIndex < cardSource.length - 1 ? (
                    <TouchableOpacity
                      style={[styles.actionBtnNext, { backgroundColor: isCorrect ? '#2E8B57' : theme.accent, width: '100%' }]}
                      onPress={handleNextCard}
                    >
                      <Text style={styles.actionBtnNextText}>Continue ➔</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.feedbackSub, { color: theme.textSecondary, textAlign: 'center' }]}>You've completed the quiz.</Text>
                  )}
                </View>
              );
            };

            return (
              <ScrollView 
                contentContainerStyle={styles.flashcardContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Study Mode Selector */}
                <View style={{ flexDirection: 'row', backgroundColor: theme.cardBackground, borderRadius: 12, padding: 4, marginBottom: 16 }}>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: studyMode === 'sequential' ? activeHighlightColor : 'transparent', alignItems: 'center' }}
                    onPress={() => setStudyMode('sequential')}
                  >
                    <Text style={{ color: studyMode === 'sequential' ? '#fff' : theme.textSecondary, fontWeight: 'bold', fontSize: 12 }}>Sequential</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: studyMode === 'adaptive' ? activeHighlightColor : 'transparent', alignItems: 'center' }}
                    onPress={() => setStudyMode('adaptive')}
                  >
                    <Text style={{ color: studyMode === 'adaptive' ? '#fff' : theme.textSecondary, fontWeight: 'bold', fontSize: 12 }}>Adaptive Drill</Text>
                  </TouchableOpacity>
                </View>

                {/* Adaptive Progress Bar */}
                {studyMode === 'adaptive' && (
                  <View style={{ width: '100%', flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 16, backgroundColor: 'rgba(0,0,0,0.05)' }}>
                    {cardSource.map((_, i) => {
                      const k = `${selectedMaterialId}_${activeLanguage}_${i}`;
                      const d = cardDifficulty[k] || 'easy';
                      const c = { easy: '#4299E1', medium: '#ECC94B', hard: '#ED8936', mastered: '#48BB78' }[d];
                      return <View key={i} style={{ flex: 1, backgroundColor: c, marginHorizontal: 1 }} />
                    })}
                  </View>
                )}

                {/* Interactive Card */}
                <TouchableOpacity
                  style={[
                    styles.flashcard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.accent,
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
                      {isFlipped ? '🔄 ANSWER (BACK)' : '🔄 MEANING (FRONT)'}
                    </Text>
                  </View>

                  <View style={styles.cardContentBox}>
                    {isFlipped ? (
                      <ColorChopText
                        syllabified_words={termSyllables}
                        activeWordIndex={activeWordIndex}
                      />
                    ) : (
                      <ColorChopText
                        syllabified_words={defSyllables}
                        activeWordIndex={activeWordIndex}
                      />
                    )}
                  </View>

                  <Text style={[styles.flipPrompt, { color: theme.accent }]}>
                    Tap card to flip
                  </Text>
                </TouchableOpacity>

                {/* Adaptive Drill Input Area */}
                <View style={{ width: '100%', marginBottom: 12, alignItems: 'center' }}>
                  {renderDifficultyIndicator()}
                  
                  {isValidating ? (
                    <View style={styles.feedbackContainer}>
                      <Text style={{ color: theme.accent, fontWeight: '800', fontSize: 16 }}>Checking answer...</Text>
                    </View>
                  ) : answerFeedback !== null ? (
                    renderFeedbackCard()
                  ) : diffLevel === 'easy' ? (
                    <View style={{ width: '100%', gap: 12 }}>
                      {mcqOptions.map(opt => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.checkBtn, { backgroundColor: theme.cardBackground, borderWidth: 1.5, borderColor: theme.accent }]}
                          onPress={() => checkMcq(opt)}
                        >
                          <Text style={[styles.checkBtnText, { color: theme.textPrimary }]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : activeRecallEnabled && diffLevel === 'hard' ? (
                    isListening ? (
                      <View style={[styles.listeningContainer, { backgroundColor: activeHighlightColor }]}>
                        <Text style={styles.listeningText}>🔴 LISTENING... SAY ANSWER</Text>
                        <Text style={styles.listeningSubtext}>Tap anywhere to stop recording</Text>
                        <TouchableOpacity style={{ marginTop: 12, padding: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12 }} onPress={() => stopRecordingAndValidate(card.term, card.definition, cardKey)}>
                           <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Stop & Check</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.micBtn, { backgroundColor: activeHighlightColor }]}
                        onPress={startListening}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.micBtnText}>🎤 Tap to Speak Answer</Text>
                      </TouchableOpacity>
                    )
                  ) : (
                    // Typing mode (Medium or Hard fallback)
                    <View style={{ width: '100%' }}>
                      <View style={{ width: '100%', gap: 12 }}>
                        {hintLevel > 0 && diffLevel === 'medium' && (
                          <Text style={{ color: theme.accent, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: 2 }}>
                            Hint: {hintLevel === 1 ? card.term.replace(/[a-zA-Z0-9]/g, '_ ') : card.term.substring(0, 1) + card.term.substring(1, card.term.length - 1).replace(/[a-zA-Z0-9]/g, '_ ') + card.term.substring(card.term.length - 1)}
                          </Text>
                        )}
                        <TextInput
                          style={[
                            styles.typingInput,
                            {
                              borderColor: themeType === 'dark' ? '#444' : '#E0DCD0',
                              color: theme.textPrimary,
                              backgroundColor: theme.cardBackground,
                            }
                          ]}
                          placeholder="Type the answer concept here..."
                          placeholderTextColor={theme.textSecondary}
                          value={typedAnswer}
                          onChangeText={setTypedAnswer}
                          onSubmitEditing={checkTyping}
                        />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                          {diffLevel === 'medium' && hintLevel < 2 && (
                            <TouchableOpacity
                              style={[styles.inlineBtn, { backgroundColor: theme.cardBackground, borderWidth: 1.5, borderColor: theme.accent, flex: 1 }]}
                              onPress={() => setHintLevel(hintLevel + 1)}
                            >
                              <Text style={[styles.checkBtnText, { color: theme.textPrimary }]}>💡 Hint</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[styles.checkBtn, { backgroundColor: activeHighlightColor, flex: 2 }]}
                            onPress={checkTyping}
                          >
                            <Text style={styles.checkBtnText}>Check Answer</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* Navigation Controls */}
                <View style={styles.cardControlsRow}>
                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: currentCardIndex === 0 ? 'rgba(0,0,0,0.03)' : theme.accent,
                      },
                    ]}
                    onPress={handlePrevCard}
                    disabled={currentCardIndex === 0}
                  >
                    <Text style={[styles.navBtnText, { color: theme.accent }]}>← Back</Text>
                  </TouchableOpacity>

                  <Text style={[styles.cardProgressText, { color: theme.textPrimary }]}>
                    Card {currentCardIndex + 1} of {cardSource.length}
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.navBtn,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: currentCardIndex === cardSource.length - 1 ? 'rgba(0,0,0,0.03)' : theme.accent,
                      },
                    ]}
                    onPress={handleNextCard}
                    disabled={currentCardIndex === cardSource.length - 1}
                  >
                    <Text style={[styles.navBtnText, { color: theme.accent }]}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            );
          }

          if (activeReaderTab === 'review') {
            const reviewPoints = activeLanguage === 'en' ? lessonData.review_points : lessonData.review_points_fil;
            if (selectedTopicIndex === null) {
              return (
                <ScrollView
                  contentContainerStyle={styles.topicMenuContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={[styles.alertBanner, { backgroundColor: activeHighlightColor + '15', borderColor: activeHighlightColor }]}>
                    <Text style={[styles.alertBannerText, { color: activeHighlightColor }]}>
                      📖 Study Alert: Please read through these review materials before advancing to the study session!
                    </Text>
                  </View>

                  <View style={styles.topicMenuList}>
                    {reviewPoints.map((point, index) => {
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
                            <Text style={[styles.topicCardTitle, { color: theme.accent }]}>
                              {title.toUpperCase()}
                            </Text>
                          </View>
                          {preview ? (
                            <Text style={[styles.topicCardPreview, { color: theme.textSecondary }]} numberOfLines={2}>
                              {preview}
                            </Text>
                          ) : null}
                          <View style={styles.readMoreRow}>
                            <Text style={[styles.readMoreText, { color: theme.accent }]}>
                              Read Topic →
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[styles.nextPhaseBtn, { backgroundColor: activeHighlightColor }]}
                    onPress={() => setActiveReaderTab('flashcard')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.nextPhaseBtnText}>Start Study Session ➔</Text>
                  </TouchableOpacity>
                </ScrollView>
              );
            }

            const activeTopic = reviewPoints[selectedTopicIndex];
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
                  style={[styles.backToTopicsBtn, { backgroundColor: theme.cardBackground, borderColor: theme.accent }]}
                  onPress={() => setSelectedTopicIndex(null)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.backToTopicsBtnText, { color: theme.accent }]}>
                    ← Back to Topics
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.focusedTopicCard,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.accent,
                    },
                  ]}
                >
                  <Text style={[styles.topicHeading, { color: theme.accent }]}>
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

          // default 'import' Mode: raw text
          return (
            <ScrollView
              contentContainerStyle={styles.topicMenuContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.rawTextContainer, { backgroundColor: theme.cardBackground }]}>
                <Text style={[
                  styles.rawText,
                  {
                    color: theme.textPrimary,
                    fontSize: fontSize,
                    lineHeight: fontSize * lineSpacing,
                    letterSpacing: letterSpacing
                  }
                ]}>
                  {activeLanguage === 'en' ? lessonData.raw_text : lessonData.raw_text_fil}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.nextPhaseBtn, { backgroundColor: activeHighlightColor }]}
                onPress={() => setActiveReaderTab('review')}
                activeOpacity={0.8}
              >
                <Text style={styles.nextPhaseBtnText}>Turn Into A Review Material ➔</Text>
              </TouchableOpacity>
            </ScrollView>
          );
        })()}
      </KeyboardAvoidingView>
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
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

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabText: {
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Focus Bar ──
  focusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 10,
    width: '100%',
    maxWidth: 650,
    alignSelf: 'center',
  },
  focusBarPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  focusBarChip: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: 'center',
  },
  focusBarChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  focusBarExpandBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Quick Controls Sheet ──
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheetPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetSection: {
    marginBottom: 20,
  },
  sheetSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sheetToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetToggleBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetToggleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sheetSpeedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.07)',
  },
  sheetSpeedText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  sheetSpeedAdjust: {
    fontSize: 12,
    fontWeight: '800',
  },
  sheetDoneBtn: {
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetDoneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Reading Area ──
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

  // ── Flashcard ──
  flashcardContainer: {
    flexGrow: 1,
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
    marginBottom: 16,
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

  // ── Review / Topics ──
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

  // ── Alert Banner ──
  alertBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertBannerText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  nextPhaseBtn: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nextPhaseBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // ── Raw Text ──
  rawTextContainer: {
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  rawText: {
    textAlign: 'left',
  },

  // ── Active Recall & Typing ──
  micBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    width: '80%',
    alignItems: 'center',
  },
  micBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  typingInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontWeight: '600',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  listeningContainer: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listeningSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  selfGradeBox: {
    width: '100%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  selfGradePrompt: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  expectedAnswer: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  selfGradeBtnsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  selfGradeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfGradeBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  feedbackContainer: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  feedbackSub: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnNext: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnNextText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  checkBtn: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  checkBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  inlineBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
