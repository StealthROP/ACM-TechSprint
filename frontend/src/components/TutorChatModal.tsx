import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  NativeModules,
  Alert,
  ActivityIndicator,
  Keyboard,
  Pressable,
  StatusBar,
} from 'react-native';
import * as Speech from 'expo-speech';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Text } from './A11yText';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { Feather } from '@expo/vector-icons';
import { MOCK_LESSONS_BY_ID } from '../services/mockApi';

export const TutorChatModal: React.FC = () => {
  const {
    isTutorChatVisible,
    setTutorChatVisible,
    themeType,
    apiUrl,
    profileName,
    ttsSpeed,
    ttsPitch,
    highlightColor,
    fontFamily,
    getAvailableMaterialsBrief,
    dynamicLessons,
    selectedMaterialId,
  } = useA11yStore();
  const theme = THEMES[themeType];
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const modalMaxHeight = windowHeight * 0.85;
  const modalWidth = Math.min(550, windowWidth * 0.9);

  // Speech & Recording States
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<number | null>(null);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  // Cleanup speech on modal hide or component unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (!isTutorChatVisible) {
      Speech.stop();
      setCurrentlyPlayingId(null);
      setActiveWordIndex(null);
    }
  }, [isTutorChatVisible]);

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text:
        "Kumusta! I'm BelongED — your inclusive AI learning companion. 🇵🇭📚\n\n" +
        "BelongED is a mobile learning app built for every Filipino learner, especially those who learn differently. " +
        "Our goal is to make education truly inclusive by turning any textbook page or document into personalized, accessible study materials.\n\n" +
        "🌟 Right now, BelongED actively supports:\n" +
        "• Dyslexia — color-coded syllable splitting, OpenDyslexic & Atkinson Hyperlegible fonts, letter spacing, and TTS with word highlighting\n" +
        "• ADHD — Immersive Focus Mode reading ruler, bite-sized flashcards, daily streaks, and gamified active recall\n" +
        "• Autism Spectrum — structured layouts, calm color themes (Cream, Dark, Pastel), and a clear Import → Review → Flashcards flow\n" +
        "• Low Vision — large font scaling up to 32px, high-contrast dark mode, and full audio playback of all content\n\n" +
        "🌍 Language Support:\n" +
        "• Study content is available in both 🇺🇸 English and 🇵🇭 Filipino (Tagalog) — every review card and flashcard is fully bilingual\n" +
        "• I can also speak with you in your local dialect! Whether that’s Bisaya/Cebuano, Ilocano, Waray, Kapampangan, Hiligaynon, or Taglish — just talk to me naturally and I’ll match your language\n\n" +
        "Ano ang matutulungan ko sa iyo ngayon? 😊",
    },
  ]);

  const getBackendUrl = () => {
    return apiUrl;
  };

  const handlePlaySpeech = async (msgId: number, text: string) => {
    if (currentlyPlayingId === msgId) {
      Speech.stop();
      setCurrentlyPlayingId(null);
      setActiveWordIndex(null);
    } else {
      Speech.stop();
      setCurrentlyPlayingId(msgId);
      setActiveWordIndex(0);
      
      const cleanText = text
        .replace(/[🇺🇸🇧🇵📚🌟•🤖👦😊🌍]/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      const wordTokens = cleanText.split(/\s+/).filter((w: string) => w.length > 0);
      let currentPos = 0;
      const wordRanges = wordTokens.map((word: string) => {
        const start = cleanText.indexOf(word, currentPos);
        const end = start + word.length;
        currentPos = end;
        return { start, end };
      });

      Speech.speak(cleanText, {
        rate: ttsSpeed,
        pitch: ttsPitch,
        onBoundary: (event: any) => {
          const charIndex = event.charIndex;
          const currentIdx = wordRanges.findIndex(
            (r: { start: number; end: number }) => charIndex >= r.start && charIndex < r.end
          );
          if (currentIdx !== -1) {
            setActiveWordIndex(currentIdx);
          }
        },
        onDone: () => {
          setCurrentlyPlayingId(null);
          setActiveWordIndex(null);
        },
        onError: () => {
          setCurrentlyPlayingId(null);
          setActiveWordIndex(null);
        },
      });
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      setIsTranscribing(true);
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
        
        if (transcript.trim()) {
          setInputText(transcript.trim());
        } else {
          Alert.alert('Speech Input', 'No speech detected. Please try again.');
        }
      } catch (error) {
        console.error('Speech transcription error:', error);
        Alert.alert('Speech Input Error', 'Could not transcribe your voice. Please try again.');
      } finally {
        setIsTranscribing(false);
      }
    } else {
      if (!micPermission) {
        const res = await AudioModule.requestRecordingPermissionsAsync();
        if (!res.granted) {
          Alert.alert('Microphone Permission', 'Please allow microphone access to use speech input.');
          return;
        }
        setMicPermission(true);
      }

      try {
        Speech.stop();
        setCurrentlyPlayingId(null);

        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsRecording(true);
      } catch (e) {
        console.error('Recording start error:', e);
        Alert.alert('Error', 'Could not start recording. Please try again.');
      }
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    // Stop any active speech when user interacts
    Speech.stop();
    setCurrentlyPlayingId(null);

    const userPrompt = inputText.trim();
    setInputText('');

    // Add user message
    const newUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: userPrompt,
    };
    
    const updatedMessages = [...chatMessages, newUserMsg];
    setChatMessages(updatedMessages);
    setIsLoading(true);

    let url = '';
    try {
      const backendUrl = getBackendUrl();
      url = `${backendUrl}/api/v1/chat`;

      // Map chat messages to the format the backend expects
      const history = updatedMessages.map((msg) => ({
        role: msg.sender === 'ai' ? 'model' : 'user',
        text: msg.text,
      }));

      const briefList = getAvailableMaterialsBrief();
      const currentLesson = dynamicLessons[selectedMaterialId] || MOCK_LESSONS_BY_ID[selectedMaterialId] || null;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          history: history,
          available_materials: briefList,
          current_material: currentLesson,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      const replyText = data?.reply || "I'm sorry, I couldn't generate a response. Please try again.";

      const newAiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: replyText,
      };

      setChatMessages((prev) => [...prev, newAiMsg]);

      // Auto play TTS for the new AI message using current settings
      Speech.stop();
      setCurrentlyPlayingId(newAiMsg.id);
      setActiveWordIndex(0);
      
      const cleanText = replyText
        .replace(/[🇺🇸🇧🇵📚🌟•🤖👦😊🌍]/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      const wordTokens = cleanText.split(/\s+/).filter((w: string) => w.length > 0);
      let currentPos = 0;
      const wordRanges = wordTokens.map((word: string) => {
        const start = cleanText.indexOf(word, currentPos);
        const end = start + word.length;
        currentPos = end;
        return { start, end };
      });

      Speech.speak(cleanText, {
        rate: ttsSpeed,
        pitch: ttsPitch,
        onBoundary: (event: any) => {
          const charIndex = event.charIndex;
          const currentIdx = wordRanges.findIndex(
            (r: { start: number; end: number }) => charIndex >= r.start && charIndex < r.end
          );
          if (currentIdx !== -1) {
            setActiveWordIndex(currentIdx);
          }
        },
        onDone: () => {
          setCurrentlyPlayingId(null);
          setActiveWordIndex(null);
        },
        onError: () => {
          setCurrentlyPlayingId(null);
          setActiveWordIndex(null);
        },
      });

    } catch (error) {
      console.error(`Gemini API Error calling URL (${url}):`, error);
      // Friendly fallback message if API call fails
      const fallbackAiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Oops! I'm having trouble connecting right now. 😔 Please check your internet connection and make sure the backend server is running, then try again!",
      };
      setChatMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isTutorChatVisible}
      statusBarTranslucent
      onRequestClose={() => {
        Speech.stop();
        setTutorChatVisible(false);
      }}
    >
      {/* Full-screen backdrop — tapping it dismisses keyboard */}
      <Pressable style={styles.modalOverlay} onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0}
        >
          {/* Inner Pressable stops the backdrop press from propagating */}
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.background,
                borderColor: themeType === 'dark' ? '#333' : '#E6E2D8',
                maxHeight: modalMaxHeight,
                width: modalWidth,
              },
            ]}
            onPress={() => {}} // swallow press so backdrop dismiss doesn't trigger inside modal
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.cardBackground }]}>
              <View>
                <Text style={[styles.headerSubtitle, { color: theme.accent }]}>
                  YOUR INCLUSIVE LEARNING COMPANION
                </Text>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                  BelongED
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Speech.stop();
                  setTutorChatVisible(false);
                }}
                style={[styles.closeBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Conversational Bubbles */}
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatScroll}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {chatMessages.map((msg) => {
                const isAi = msg.sender === 'ai';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      isAi
                        ? [styles.aiBubble, { backgroundColor: theme.cardBackground }]
                        : [styles.userBubble, { backgroundColor: '#435B4E' }], // Study green
                    ]}
                  >
                    <View style={styles.bubbleHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather 
                          name={isAi ? "cpu" : "user"} 
                          size={13} 
                          color={isAi ? theme.accent : '#D4ECE0'} 
                          style={{ marginRight: 5 }} 
                        />
                        <Text
                          style={[
                            styles.senderLabel,
                            { color: isAi ? theme.accent : '#D4ECE0' },
                          ]}
                        >
                          {isAi ? 'BelongED' : profileName}
                        </Text>
                      </View>
                      {isAi && (
                        <TouchableOpacity
                          onPress={() => handlePlaySpeech(msg.id, msg.text)}
                          style={styles.speakerBtn}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Feather 
                              name={currentlyPlayingId === msg.id ? "square" : "volume-2"} 
                              size={12} 
                              color={theme.accent} 
                              style={{ marginRight: 4 }} 
                            />
                            <Text style={[styles.speakerEmoji, { color: theme.accent }]}>
                              {currentlyPlayingId === msg.id ? 'Stop' : 'Speak'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                    {(() => {
                      const isCurrentlyPlaying = currentlyPlayingId === msg.id;
                      if (!isAi || !isCurrentlyPlaying || activeWordIndex === null) {
                        return (
                          <Text
                            style={[
                              styles.messageText,
                              { 
                                color: isAi ? theme.textPrimary : '#ffffff',
                                fontFamily: fontFamily === 'System' ? undefined : fontFamily 
                              },
                            ]}
                          >
                            {msg.text}
                          </Text>
                        );
                      }

                      const tokens = msg.text.split(/(\s+)/);
                      let cleanWordCounter = 0;

                      const highlightBgs: Record<string, string> = {
                        theme: themeType === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                        orange: '#FFE8D6',
                        teal: '#D0F0EC',
                        purple: '#E8DFFF',
                        green: '#D5F3E5',
                      };
                      const activeHighlightBg = highlightBgs[highlightColor] || 'rgba(0, 0, 0, 0.08)';

                      return (
                        <Text 
                          style={[
                            styles.messageText, 
                            { 
                              color: theme.textPrimary,
                              fontFamily: fontFamily === 'System' ? undefined : fontFamily 
                            }
                          ]}
                        >
                          {tokens.map((token, index) => {
                            const isWhitespace = /\s+/.test(token);
                            if (isWhitespace) {
                              return <Text key={index}>{token}</Text>;
                            }

                            const currentWordIdx = cleanWordCounter;
                            cleanWordCounter++;

                            const isHighlighted = currentWordIdx === activeWordIndex;

                            return (
                              <Text
                                key={index}
                                style={
                                  isHighlighted
                                    ? {
                                        backgroundColor: activeHighlightBg,
                                        fontWeight: 'bold',
                                        borderRadius: 4,
                                      }
                                    : undefined
                                }
                              >
                                {token}
                              </Text>
                            );
                          })}
                        </Text>
                      );
                    })()}
                  </View>
                );
              })}

              {isLoading && (
                <View
                  style={[
                    styles.messageBubble,
                    styles.aiBubble,
                    { backgroundColor: theme.cardBackground },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Feather name="cpu" size={13} color={theme.accent} style={{ marginRight: 5 }} />
                    <Text style={[styles.senderLabel, { color: theme.accent }]}>
                      BelongED
                    </Text>
                  </View>
                  <Text style={[styles.messageText, { color: theme.textPrimary, fontStyle: 'italic' }]}>
                    Thinking...
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Input Row */}
            <View style={[styles.inputRow, { backgroundColor: theme.cardBackground }]}>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.textPrimary,
                    backgroundColor: 'transparent',
                  },
                ]}
                placeholder={isRecording ? 'Listening...' : 'Ask BelongED anything...'}
                placeholderTextColor={themeType === 'dark' ? '#888' : '#AAAAAA'}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                editable={!isTranscribing && !isRecording}
                returnKeyType="send"
                autoCorrect
                selectionColor={theme.accent}
              />
              <TouchableOpacity
                style={[
                  styles.micBtn,
                  { backgroundColor: isRecording ? '#E74C3C' : theme.accent },
                ]}
                onPress={handleMicPress}
                disabled={isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : isRecording ? (
                  <Feather name="square" size={16} color="#fff" />
                ) : (
                  <Feather name="mic" size={16} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: theme.accent }]}
                onPress={handleSend}
                disabled={isRecording || isTranscribing}
              >
                <Feather name="send" size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatScroll: {
    padding: 20,
    gap: 12,
    flexGrow: 1,
  },
  messageBubble: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  senderLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: 44,
    paddingVertical: 8,
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  micBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    alignSelf: 'stretch',
    gap: 16,
  },
  speakerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  speakerEmoji: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
