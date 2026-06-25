import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  NativeModules,
} from 'react-native';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';

export const TutorChatModal: React.FC = () => {
  const { isTutorChatVisible, setTutorChatVisible, themeType, highlightColor } = useA11yStore();
  const theme = THEMES[themeType];
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();

  const modalMaxHeight = windowHeight * 0.85;
  const modalWidth = Math.min(550, windowWidth * 0.9);

  // Map user-selected highlight color to hex codes
  const highlightColors: Record<string, string> = {
    theme: theme.accent,
    orange: '#F27A1A',
    teal: '#139A8C',
    purple: '#8A2BE2',
    green: '#2E8B57',
  };
  const activeHighlightColor = highlightColors[highlightColor] || theme.accent;

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hi Alex! I'm your AI Study Partner. Ask me to explain any word, summarize concepts, or quiz you on study cards!",
    },
    {
      id: 2,
      sender: 'user',
      text: 'Can you explain the light-dependent reactions of photosynthesis simply?',
    },
    {
      id: 3,
      sender: 'ai',
      text: 'Think of chloroplasts like solar-powered battery chargers! They absorb sunlight (using solar panels) to charge up energy carriers (batteries), which are then sent to make sugar in the Calvin cycle.',
    },
  ]);

  const getBackendUrl = () => {
    try {
      const scriptURL = NativeModules?.SourceCode?.scriptURL;
      if (scriptURL) {
        let address = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
        if (address) {
          // Fallback for Android Emulators routing to host machine
          if ((address === 'localhost' || address === '127.0.0.1') && Platform.OS === 'android') {
            address = '10.0.2.2';
          }
          return `http://${address}:8000`;
        }
      }
    } catch (error) {
      console.warn('Could not detect scriptURL, falling back to localhost', error);
    }
    return 'http://localhost:8000';
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
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

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: history,
        }),
      });

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
    } catch (error) {
      console.error(`Gemini API Error calling URL (${url}):`, error);
      // Friendly fallback message if API call fails
      const fallbackAiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Oops! I'm having trouble connecting to my brain right now. Please check that the backend server is running and try again!",
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
      onRequestClose={() => setTutorChatVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.background,
                borderColor: themeType === 'dark' ? '#333' : '#E6E2D8',
                maxHeight: modalMaxHeight,
                width: modalWidth,
              },
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.cardBackground }]}>
              <View>
                <Text style={[styles.headerSubtitle, { color: activeHighlightColor }]}>
                  AI LEARNING COMPANION
                </Text>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                  Tutor Mode
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setTutorChatVisible(false)}
                style={[styles.closeBtn, { backgroundColor: activeHighlightColor }]}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Conversational Bubbles */}
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chatScroll}
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
                    <Text
                      style={[
                        styles.senderLabel,
                        { color: isAi ? activeHighlightColor : '#D4ECE0' },
                      ]}
                    >
                      {isAi ? '🤖 AI Tutor' : '👦 Alex'}
                    </Text>
                    <Text
                      style={[
                        styles.messageText,
                        { color: isAi ? theme.textPrimary : '#ffffff' },
                      ]}
                    >
                      {msg.text}
                    </Text>
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
                  <Text style={[styles.senderLabel, { color: activeHighlightColor }]}>
                    🤖 AI Tutor
                  </Text>
                  <Text style={[styles.messageText, { color: theme.textPrimary, fontStyle: 'italic' }]}>
                    Thinking...
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Input Row */}
            <View style={[styles.inputRow, { backgroundColor: theme.cardBackground }]}>
              <TextInput
                style={[styles.textInput, { color: theme.textPrimary }]}
                placeholder="Ask the AI Tutor a question..."
                placeholderTextColor={themeType === 'dark' ? '#666' : '#999'}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: activeHighlightColor }]}
                onPress={handleSend}
              >
                <Text style={styles.sendBtnText}>➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginHorizontal: 20,
    marginTop: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: 40,
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
});
