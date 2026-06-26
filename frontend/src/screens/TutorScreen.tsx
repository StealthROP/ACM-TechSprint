import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  NativeModules,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../components/A11yText';
import { useA11yStore } from '../store/useA11yStore';
import { THEMES } from '../theme/themes';
import { TabBar } from '../components/TabBar';
import { Feather } from '@expo/vector-icons';

export const TutorScreen: React.FC = () => {
  const { themeType, apiUrl } = useA11yStore();
  const theme = THEMES[themeType];
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Hi Alex! Ready to review your biology cards? Ask me to explain any concept, quiz you, or clarify cell cycles.',
    }
  ]);

  const getBackendUrl = () => {
    return apiUrl;
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userPrompt = inputText.trim();
    setInputText('');

    const newUserMsg = { id: Date.now(), sender: 'user', text: userPrompt };
    const updatedMessages = [...chatMessages, newUserMsg];
    setChatMessages(updatedMessages);
    setIsLoading(true);

    let url = '';
    try {
      url = `${getBackendUrl()}/api/v1/chat`;
      const history = updatedMessages.map((msg) => ({
        role: msg.sender === 'ai' ? 'model' : 'user',
        text: msg.text,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ history }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`API returned status ${response.status}`);

      const data = await response.json();
      const newAiMsg = { id: Date.now() + 1, sender: 'ai', text: data?.reply || "Error." };
      setChatMessages((prev) => [...prev, newAiMsg]);
    } catch (error) {
      console.error(`Gemini API Error:`, error);
      const fallbackAiMsg = { id: Date.now() + 1, sender: 'ai', text: "Oops! I'm having trouble connecting to my brain right now. Please check that the backend server is running and try again!" };
      setChatMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerSubtitle, { color: theme.accent }]}>BelongED AI TUTOR</Text>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Tutor Mode</Text>
          </View>

          {/* Conversation Bubble List */}
          <View style={styles.chatContainer}>
            {chatMessages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    isAi
                      ? [styles.aiBubble, { backgroundColor: theme.cardBackground }]
                      : [styles.userBubble, { backgroundColor: '#435B4E' }], // Match dark green button
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Feather 
                      name={isAi ? "cpu" : "user"} 
                      size={12} 
                      color={isAi ? theme.accent : '#D4ECE0'} 
                      style={{ marginRight: 4 }} 
                    />
                    <Text
                      style={[
                        styles.senderLabel,
                        { color: isAi ? theme.accent : '#D4ECE0' },
                      ]}
                    >
                      {isAi ? 'AI Tutor' : 'Alex'}
                    </Text>
                  </View>
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
          </View>

          {/* Mock Input Form */}
          <View style={[styles.inputRow, { backgroundColor: theme.cardBackground }]}>
            <TextInput
              style={[styles.textInput, { color: theme.textPrimary }]}
              placeholder="Ask the AI Tutor a question..."
              placeholderTextColor={themeType === 'dark' ? '#666' : '#999'}
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.accent }]} onPress={handleSend} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="send" size={14} color="#fff" />}
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Tab Bar */}
        <TabBar />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  header: {
    marginBottom: 20,
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
  chatContainer: {
    flex: 1,
    gap: 14,
    marginBottom: 24,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
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
    fontSize: 10,
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
    marginBottom: 8,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
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
